# Backup Lokal Analytics

Panduan ini menjelaskan cara mengarsipkan tabel `public.analytics_events` dari Neon ke komputer Windows pribadi setiap hari, tanpa layanan cloud tambahan.

- **Script:** [`scripts/analytics-backup/analytics-backup.ps1`](../scripts/analytics-backup/analytics-backup.ps1). Berjalan di Windows PowerShell 5.1, yang sudah ada di Windows.
- **Koneksi database:** memakai `psql.exe` versi 14 atau lebih baru dari instalasi PostgreSQL. Tidak ada dependency npm atau Python tambahan.
- **Lokasi data lokal:** folder `.analytics-backup/` di root repository, yang di-ignore Git.

Cara membaca statistiknya langsung di Neon ada di [ANALYTICS.md](ANALYTICS.md).

> **Jangan mengaktifkan jadwal sebelum dua hal ini diputuskan:**
>
> 1. **Kebijakan retensi arsip lokal** (bagian 9).
> 2. **Pemberitahuan privasi di website** diperbarui agar menyebut bahwa catatan kunjungan juga disalin ke perangkat pribadi pemilik situs (bagian 9).

---

## 1. Cara kerja

**Arsip hanya bertambah.** Script tidak pernah menghapus atau mengganti baris arsip karena data di Neon berubah.

### Alur sinkronisasi

| Hal | Perilaku |
|---|---|
| Satuan arsip | Satu file CSV per **tanggal WIB** (`Asia/Jakarta`), berdasarkan `created_at`. |
| Kapan satu hari diarsipkan | Setelah hari itu selesai **dan** sudah lewat 15 menit (hari Senin baru diarsipkan mulai Selasa 00:15 WIB). |
| Pemeriksaan per tanggal | Setiap run menghitung *fingerprint* per tanggal WIB di Neon: MD5 isi semua baris, urut `id`. Hasilnya dibandingkan dengan fingerprint yang tercatat di checkpoint. Hanya tanggal yang berbeda yang diunduh. Ini mendeteksi baris terlambat, termasuk yang `id`-nya lebih kecil dari `id` terbesar yang sudah diarsipkan, serta baris yang diubah atau dihapus di Neon. |
| Komputer mati beberapa hari | Run berikutnya mengunduh semua hari yang terlewat. |
| Idempotent | Menjalankan ulang tidak menambah baris ganda. File yang tidak berubah tidak ditulis ulang. |
| Data di Neon | Hanya dibaca. Script tidak pernah menghapus atau mengubah data di Neon. |

### Saat data di Neon berbeda dari arsip

| Kondisi di Neon | Yang terjadi pada arsip |
|---|---|
| Ada baris baru untuk tanggal yang sudah diarsipkan | Baris baru **ditambahkan**. File lama disimpan sebagai `.bak`. |
| Baris dihapus | Arsip **tetap** menyimpannya. Log menampilkan peringatan "The database now returns N row(s) … but the archive holds M". Event `missing` dicatat di riwayat discrepancy. |
| Isi baris berubah (`id` sama, isi berbeda) | Versi arsip **tetap** dipakai. Event `conflict` berisi versi arsip dan versi Neon dicatat di riwayat discrepancy. |
| Data di Neon kembali sama dengan arsip | Event `resolved` dicatat. Event sebelumnya tidak dihapus. |

### Riwayat discrepancy

Setiap file arsip punya log sendiri: `data/discrepancies/<tanggal>.jsonl` (atau `null-created-at.jsonl`). Satu baris berisi satu event JSON dengan isian berikut:

| Isian | Isi |
|---|---|
| `detectedAtUtc` | Waktu event tercatat. |
| `file` | File arsip yang bersangkutan. |
| `id` | `id` baris. |
| `kind` | `missing`, `conflict`, `resolved`, atau `replaced` (versi lokal diganti versi Neon lewat `repair -PreferDatabase`). |
| `archived` | Baris CSV versi arsip. |
| `source` | Baris CSV versi Neon (untuk `conflict`). |

Aturan penulisan log:

- **Kumulatif dan append-only.** Baris lama tidak pernah diubah atau dihapus. Setiap penulisan memastikan isi lama tetap utuh di awal file baru, lalu dipasang secara atomik (versi sebelumnya disimpan sebagai `.jsonl.bak`).
- **Tanpa duplikat.** Event baru hanya ditulis saat status sebuah `id` berubah, misalnya perubahan kedua dengan isi berbeda tercatat sebagai `conflict` baru. Run ulang tanpa perubahan tidak menambah baris.
- **Log rusak tidak ditimpa.** Contoh: JSON tidak valid atau baris terakhir terpotong. Log seperti itu dipindahkan **tanpa diubah** ke `data/discrepancies/corrupt-<waktu>/`, lalu log baru dimulai berisi discrepancy yang masih terbuka. Run selesai dengan exit code `4`, dan `verify` juga melaporkan log yang rusak.

### Saat file arsip bermasalah

| Kondisi | Yang terjadi |
|---|---|
| File arsip berubah atau hilang (checksum tidak cocok) | **Tidak ditimpa.** Run melewati tanggal itu, menulis `ERROR` di log, dan selesai dengan exit code `4`. Perbaikan hanya lewat perintah `repair` (bagian 7). |
| Penggantian file selesai, tetapi proses berhenti sebelum checkpoint tersimpan | Diterima otomatis pada run berikutnya (peringatan di log), **hanya jika** checksum `.bak` sama dengan checkpoint dan file baru valid serta masih memuat setiap baris `.bak` tanpa perubahan. Selain kondisi itu, file dianggap berubah (exit code `4`). `verify` menampilkannya sebagai `NOTE`. |
| Checkpoint hilang, file arsip masih ada | `run` menolak berjalan. Pulihkan dengan `rebuild-checkpoint`, yang tidak membutuhkan Neon. |

### Kasus khusus

| Kondisi | Yang terjadi |
|---|---|
| `created_at IS NULL` | Disimpan di `data/null-created-at.csv` dengan aturan yang sama: hanya bertambah, perubahan dilaporkan. Baris yang kemudian mendapat tanggal di Neon muncul di file tanggalnya, dan versi NULL-nya tetap tersimpan. |
| Hari tanpa kunjungan | Tetap dibuat file berisi header saja. |

### Validasi dan penulisan file

Validasi setiap unduhan dilakukan sebelum digabung ke arsip:

- jumlah baris, jumlah `id`, dan fingerprint isi sama dengan perhitungan Neon dalam transaksi `READ ONLY` yang sama;
- tidak ada `id` ganda;
- setiap baris berada di tanggal WIB yang benar.

Setiap file baru ditulis ke `<file>.new` lalu divalidasi ulang. File baru juga ditolak jika ada `id` arsip lama yang hilang. Setelah itu file dipasang dengan `ReplaceFile` Windows: file lama menjadi `<file>.bak`, dan file valid tidak pernah dihapus sebelum penggantinya siap.

Jika proses berhenti sebelum penggantian, file lama tetap utuh. Pada run berikutnya, sisa `.new` diperiksa:

- jika semua barisnya sudah ada di arsip dengan isi yang sama, file itu dihapus;
- jika tidak, file itu **dipindahkan** (bukan dihapus) ke `data\repairs\unfinished-<waktu>\`, dan perintah `repair` ikut memakainya.

Ini juga menangani kegagalan `ReplaceFile` di tengah jalan, yaitu ketika file lama sudah menjadi `.bak` tetapi file baru masih berupa `.new`.

Parser CSV sengaja ketat. File yang tidak sesuai format `psql` ditolak dan dilaporkan, misalnya:

- tanda kutip di dalam field tanpa kutip;
- teks setelah kutip penutup;
- BOM;
- UTF-8 tidak valid;
- jumlah kolom yang salah.

Fingerprint menulis setiap field sebagai `<panjang byte UTF-8>:<isi>` (NULL sebagai `N`), sehingga karakter pemisah di dalam data tidak bisa membuat dua isi berbeda terlihat sama. Checkpoint yang dibuat versi sebelum perubahan ini akan memicu satu kali pemeriksaan ulang per tanggal. Arsip tidak berubah, karena data yang sama tidak menambah baris.

---

## 2. Struktur folder

```text
.analytics-backup/                (di-ignore Git)
├── config.json                   host, database, user (tanpa password)
├── credential.dpapi              password terenkripsi Windows DPAPI
├── checkpoint.json               progres, checksum file, fingerprint per tanggal
├── checkpoint.json.bak           versi checkpoint sebelumnya
├── data/
│   ├── events/2026/2026-11-04.csv
│   ├── events/2026/2026-11-04.csv.bak   versi sebelum penambahan terakhir
│   ├── null-created-at.csv
│   ├── discrepancies/2026-11-04.jsonl   riwayat baris yang hilang/berubah di Neon
│   ├── discrepancies/corrupt-<waktu>/   log discrepancy rusak yang disisihkan
│   └── repairs/20261105-010203/          salinan file sebelum repair
├── logs/backup-2026-11.log       satu file per bulan
└── tmp/                          file sementara psql
```

Format CSV: UTF-8 tanpa BOM, baris diakhiri LF, dipisah koma, kutip ganda bila perlu.

| Kolom | Isi |
|---|---|
| `id`, `event_name`, `path`, `visitor_id`, `session_id`, `referrer` | Sama seperti di database. Kolom kosong tanpa kutip berarti `NULL`, sedangkan `""` berarti teks kosong. |
| `metadata` | JSON sebagai teks. |
| `created_at_utc` | Waktu dalam UTC, contoh `2026-11-04T05:00:00.000000Z`. |
| `created_at_wib` | Waktu dalam WIB, contoh `2026-11-04 12:00:00.000000`. |

> **Peringatan:** menghapus folder `.analytics-backup/`, atau menjalankan `git clean -x`/`git clean -X`, akan menghapus seluruh arsip lokal. Simpan salinan di disk lain (bagian 8).

---

## 3. Keamanan

### Role database read-only

Sebelum mengunduh, script memeriksa role yang dipakai dan menolak berjalan (exit code `2`) jika role tersebut:

- superuser, atau punya `CREATEROLE`/`CREATEDB`/replication/bypass RLS;
- anggota `neon_superuser`, `pg_write_all_data`, atau pemilik database;
- punya `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE` pada tabel apa pun;
- punya hak `CREATE` di database atau schema `public`.

Selain itu, setiap query berjalan di transaksi `READ ONLY`, sehingga penulisan tetap diblokir database meskipun pemeriksaan di atas terlewat. Contohnya hak pada sequence, yang belum diperiksa script.

### Kredensial

- `config.json` tidak berisi password atau connection string. Nilai `host` yang berbentuk connection string ditolak.
- Password tidak muncul di log maupun output. Password hanya diteruskan ke proses `psql` lewat environment variable proses anak (bukan argument command line), dan pesan error disaring dari password serta connection string.
- `sslMode` default `require`. Nilai `disable` hanya diterima untuk host lokal (`localhost`/`127.0.0.1`), yaitu untuk pengujian.
- Script tidak mengirim data ke layanan lain.

### Mode PowerShell

Script membutuhkan PowerShell **FullLanguage** mode, karena parser CSV dikompilasi dengan `Add-Type`.

- Jika kebijakan AppLocker atau WDAC memaksa Constrained Language Mode, script langsung berhenti dengan pesan yang jelas (exit code `1`) tanpa menyentuh arsip.
- Jika sesi PowerShell yang sama sudah memuat versi parser yang berbeda (misalnya setelah script diperbarui), script juga berhenti dan meminta Anda membuka jendela PowerShell baru.

Setiap run terjadwal selalu memakai proses baru, jadi pengecekan kedua ini hanya relevan saat dijalankan manual.

### Batas perlindungan DPAPI

`set-credential` mengenkripsi password dengan Windows DPAPI (cakupan *CurrentUser*).

| DPAPI melindungi dari | DPAPI **tidak** melindungi dari |
|---|---|
| Akun Windows lain di komputer yang sama. | Program apa pun yang berjalan sebagai **akun Windows Anda**, termasuk malware. Program seperti itu bisa mendekripsi password, atau membacanya dari environment `psql` selama backup berjalan. |
| Orang yang hanya menyalin `credential.dpapi` ke komputer lain. | Administrator yang punya akses penuh ke profil Anda. |

File `credential.dpapi` tidak bisa dibuka lagi jika:

- profil Windows dihapus atau dibuat ulang;
- Windows diinstal ulang;
- folder dipindahkan ke akun atau komputer lain;
- password akun lokal di-*reset* oleh administrator (bukan diganti sendiri oleh pemiliknya).

Dalam semua kasus di atas, arsip CSV **tetap utuh dan terbaca** karena tidak dienkripsi. Cukup jalankan `set-credential` lagi. Jika password role sudah tidak diketahui, buat password baru untuk role di Neon terlebih dahulu.

Karena password role hanya bisa membaca satu tabel, dampak terburuk jika bocor adalah data analytics terbaca orang lain. Tetap ganti password role jika ada kecurigaan.

---

## 4. Konfigurasi awal (dilakukan manual)

### Langkah 1 — Siapkan password acak untuk role backup

```powershell
$bytes = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','A').Replace('/','B') | Set-Clipboard
```

**Risiko clipboard:**

- Jika **Clipboard history** Windows aktif (Win+V), password tersimpan di riwayat.
- Jika **sinkronisasi clipboard antarperangkat** aktif, password bisa ikut terkirim ke akun Microsoft.
- `Set-Clipboard -Value ' '` hanya mengganti isi terakhir dan **tidak** menghapus riwayat.

Setelah Langkah 5 selesai:

1. Buka **Settings → System → Clipboard**.
2. Klik **Clear** pada *Clear clipboard data*.
3. Bila perlu, matikan *Clipboard history* dan *Share across devices* sementara selama penyiapan.

Jangan menempelkan password di chat, catatan, atau file lain.

### Langkah 2 — Buat role read-only di Neon

Di Neon Console, buka project `harits-portfolio` → **SQL Editor**, pilih branch `production` dan database `neondb`, lalu jalankan:

```sql
CREATE ROLE analytics_backup WITH LOGIN;
GRANT CONNECT ON DATABASE neondb TO analytics_backup;
GRANT USAGE ON SCHEMA public TO analytics_backup;
GRANT SELECT ON TABLE public.analytics_events TO analytics_backup;
```

Lalu beri password dengan salah satu cara berikut.

- **A (disarankan; password tidak tersimpan di riwayat query Neon):**
  1. Sambungkan `psql` sebagai pemilik database:

     ```powershell
     & 'C:\Program Files\PostgreSQL\17\bin\psql.exe' "host=<HOST-NEON> dbname=neondb user=neondb_owner sslmode=require"
     ```

  2. Isi password pemilik database saat diminta.
  3. Jalankan `\password analytics_backup`, lalu tempel password dari Langkah 1 dua kali.
  4. Keluar dengan `\q`.
- **B:** di SQL Editor, jalankan `ALTER ROLE analytics_backup WITH PASSWORD '<tempel password>';`. Password akan tercatat di riwayat SQL Editor Neon, jadi hapus entri riwayat itu jika fitur tersebut tersedia.

Periksa hasilnya di SQL Editor:

```sql
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls FROM pg_roles WHERE rolname = 'analytics_backup';
SELECT r.rolname FROM pg_auth_members m JOIN pg_roles r ON r.oid = m.roleid JOIN pg_roles u ON u.oid = m.member WHERE u.rolname = 'analytics_backup';
SELECT table_schema, table_name, privilege_type FROM information_schema.role_table_grants
WHERE grantee IN ('analytics_backup', 'PUBLIC') AND table_schema NOT IN ('pg_catalog', 'information_schema');
```

Hasil yang diharapkan:

- semua kolom `rol…` bernilai `false`;
- query kedua tidak mengembalikan baris (role tidak menjadi anggota role lain);
- untuk `analytics_backup`, hanya ada `SELECT` pada `analytics_events`.

Jika `PUBLIC` punya `SELECT` pada tabel lain, role backup juga bisa membaca tabel itu.

**Perlu dicek di dokumentasi Neon terbaru** (belum diverifikasi di sini):

- Role yang dibuat dari halaman **Roles** di Neon Console biasanya menjadi anggota `neon_superuser`. Karena itu role backup dibuat lewat SQL. Script juga menolak role semacam itu.
- Neon mungkin mensyaratkan password yang kuat untuk role yang dibuat lewat SQL. Password dari Langkah 1 cukup panjang.
- Jika `check` melaporkan *"can create objects in the database or public schema"*, putuskan dulu sebelum mencabut hak tersebut (`REVOKE CREATE ON SCHEMA public FROM PUBLIC;`), karena itu mengubah konfigurasi database.

### Langkah 3 — Ambil host database

1. Di Neon Console, buka **Connect**.
2. Pilih branch `production`, database `neondb`, dan role `analytics_backup`.
3. Salin **hanya host-nya**, yaitu yang diawali `ep-…`. Pilih koneksi langsung, **tanpa** `-pooler`.

Jangan menyalin connection string lengkap ke file mana pun.

### Langkah 4 — Buat file konfigurasi

```powershell
cd "D:\HaritsAF\BUAT KERJA\projek lama\portfolio"
New-Item -ItemType Directory -Force .analytics-backup | Out-Null
Copy-Item scripts\analytics-backup\config.example.json .analytics-backup\config.json
notepad .analytics-backup\config.json
```

Ganti `"<ep-xxxxxxxx.region.aws.neon.tech>"` dengan host dari Langkah 3.

- `psqlPath` dibiarkan kosong agar script otomatis memakai `psql.exe` versi 14 ke atas di `C:\Program Files\PostgreSQL`. `psql` di PATH komputer ini versi 8.3 dan tidak dipakai.
- `sslMode` boleh diganti `verify-full` jika sertifikat CA tersedia untuk `psql`.

### Langkah 5 — Simpan password terenkripsi

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\analytics-backup\analytics-backup.ps1 set-credential
```

Setelah itu, bersihkan riwayat clipboard seperti di Langkah 1.

### Langkah 6 — Uji koneksi dan hak akses

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\analytics-backup\analytics-backup.ps1 check
```

| Exit code | Arti |
|---|---|
| `0` | Berhasil. Output diakhiri `Role is read-only. Ready to back up.` |
| `1` | Masalah koneksi, password, atau konfigurasi. |
| `2` | Role tidak read-only. Perbaiki role tersebut; jangan memakai role pemilik database. |

### Langkah 7 — Tentukan retensi dan perbarui pemberitahuan privasi

Lihat bagian 9 sebelum menjalankan backup pertama.

### Langkah 8 — Backup manual pertama

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\analytics-backup\analytics-backup.ps1 run
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\analytics-backup\analytics-backup.ps1 verify
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\analytics-backup\analytics-backup.ps1 status
```

### Langkah 9 — Pasang jadwal (setelah Langkah 7 dan 8)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\analytics-backup\analytics-backup.ps1 install
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\analytics-backup\analytics-backup.ps1 enable
```

`install` memasang task dalam keadaan **nonaktif**. Task baru berjalan setelah `enable`.

---

## 5. Perintah

Semua perintah dijalankan dari root repository dengan awalan:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\analytics-backup\analytics-backup.ps1 <perintah>
```

| Perintah | Fungsi | Mengakses Neon? |
|---|---|---|
| `status` | Konfigurasi, progres arsip, file rusak, jumlah *discrepancy*, status task, dan log terakhir. | Tidak |
| `check` | Uji koneksi dan pastikan role read-only. | Ya (baca) |
| `run` | Sinkronisasi sekarang. | Ya (baca) |
| `verify` | Cocokkan semua file dengan checkpoint (checksum, jumlah baris, `id`, tanggal, celah tanggal, file di luar checkpoint). | Tidak |
| `repair -Day <yyyy-MM-dd \| null \| all>` | Memperbaiki file arsip yang berubah atau hilang, secara eksplisit (bagian 7). Tambahkan `-PreferDatabase` untuk memakai versi Neon pada baris yang isinya berbeda. | Ya (baca) |
| `rebuild-checkpoint` | Membuat ulang `checkpoint.json` dari arsip lokal. Tambahkan `-Force` untuk mengganti checkpoint yang ada; salinannya tetap disimpan. | **Tidak** |
| `logs` | Log terakhir. Tambahkan `-Tail 100` untuk lebih banyak baris. | Tidak |
| `set-credential` | Simpan atau ganti password terenkripsi. | Tidak |
| `install` | Memasang task harian 01:00 WIB dalam keadaan nonaktif. Tambahkan `-Enable` untuk langsung aktif. | Tidak |
| `enable` / `disable` | Mengaktifkan atau menonaktifkan task. Arsip tidak disentuh. | Tidak |
| `uninstall` | Menghapus task. Arsip tidak disentuh. | Tidak |

| Exit code | Arti |
|---|---|
| `0` | Sukses, mungkin dengan peringatan. |
| `1` | Gagal. Run berikutnya melanjutkan. |
| `2` | Ditolak karena role tidak aman. |
| `3` | Operasi lain sedang berjalan. |
| `4` | Selesai, tetapi ada file arsip atau log discrepancy yang perlu ditangani. |

---

## 6. Jadwal Task Scheduler

| Pengaturan | Nilai |
|---|---|
| Trigger | Harian pukul 01:00 WIB. Disimpan sebagai waktu UTC, jadi tetap 01:00 WIB walaupun zona waktu Windows diubah. |
| Run tugas yang terlewat | Aktif. Jika komputer mati, tidur, atau Anda belum login pada 01:00, backup berjalan saat komputer kembali tersedia. Komputer tidak dibangunkan dari tidur. |
| Akun | Akun Windows Anda, hanya saat login, tanpa hak administrator. DPAPI membutuhkan sesi login. |
| Batas waktu | 1 jam. |
| Run ganda | Tidak boleh. Task baru diabaikan saat task lama masih berjalan, dan run atau repair manual yang bersamaan keluar dengan kode `3`. |
| Coba ulang | Hingga 3 kali dengan jeda 30 menit, jika Task Scheduler menganggap task gagal. Pengulangan ini mungkin hanya terjadi saat task gagal diluncurkan, bukan saat exit code ≠ 0. Run berikutnya tetap melanjutkan dari checkpoint. |

Jika folder repository dipindahkan, jalankan `uninstall`, lalu `install` lagi.

---

## 7. Pemulihan

| Kondisi | Tindakan |
|---|---|
| Run gagal (koneksi putus, komputer mati) | Tidak perlu apa-apa. Run berikutnya melanjutkan. |
| Exit code `4`: file arsip berubah atau hilang | 1. Jalankan `verify` untuk melihat file mana yang bermasalah.<br>2. Jika perubahan disengaja dan file aslinya masih ada di salinan cadangan, kembalikan dulu file itu.<br>3. Jika tidak, jalankan `repair -Day <tanggal>` (atau `repair -Day all`). |
| `checkpoint.json` rusak atau hilang | Jalankan `rebuild-checkpoint` (atau `rebuild-checkpoint -Force` jika file rusaknya masih ada), lalu `verify`. Neon tidak dibutuhkan. |
| `rebuild-checkpoint` berhenti karena file rusak atau tanggal bolong | Kembalikan file yang disebut dari salinan arsip, dengan struktur folder yang sama. Alternatifnya, pindahkan file rusak keluar dari `data\events` untuk ditinjau. Setelah itu ulangi `rebuild-checkpoint`. |
| Ada *discrepancy* (baris hilang atau berubah di Neon) | Tidak perlu tindakan. Arsip tetap utuh. Tinjau `data\discrepancies\*.jsonl` jika perubahan itu tidak Anda sengaja. |
| Exit code `4` karena log discrepancy rusak | Log lama sudah disisihkan tanpa diubah ke `data\discrepancies\corrupt-<waktu>\`, dan log baru sudah dimulai. Periksa log yang disisihkan, lalu simpan atau gabungkan secara manual bila perlu. |

### Cara kerja `repair`

1. Menyimpan salinan semua versi lokal ke `data\repairs\<waktu>\`, diberi nomor urut agar tidak saling menimpa. Versi lokal yang disalin: file saat ini, `.bak`-nya, dan file `.new` dari run yang terhenti yang sudah disisihkan di `data\repairs\unfinished-*`.
2. Menggabungkan baris yang masih valid dari semua versi lokal itu. Jika satu `id` punya isi berbeda, urutan prioritasnya adalah `.bak`, lalu file saat ini, lalu file yang disisihkan. Perbedaannya dicatat di log.
3. Membandingkan dengan Neon. Secara default, **versi lokal menang**: baris yang isinya berbeda dari Neon tetap versi lokal dan dicatat sebagai event `conflict`. Dengan `repair -Day <tanggal> -PreferDatabase`, baris yang isinya berbeda diganti versi Neon. Versi lokalnya tetap tersimpan di `data\repairs\<waktu>\` dan dicatat sebagai event `replaced` (berisi kedua versi) di riwayat discrepancy. Pakai opsi ini jika file arsip pernah diubah tangan dan Anda yakin versi Neon yang benar.
4. Menambahkan baris dari Neon yang belum ada.
5. Memasang file baru secara atomik.

Baris yang hanya tersimpan di file yang hilang dan sudah dihapus dari Neon tidak bisa dipulihkan, kecuali dari salinan cadangan Anda.

### Memulihkan arsip dari salinan lokal atau ke komputer lain

1. Salin seluruh folder `.analytics-backup\data` dari cadangan ke `.analytics-backup\data` di repository tujuan, dengan struktur folder yang sama.
2. Salin juga `checkpoint.json` jika ada. Jika tidak ada atau ragu, jangan disalin.
3. Jalankan `rebuild-checkpoint` (tambahkan `-Force` jika checkpoint sudah ada). Perintah ini memeriksa setiap CSV dan tidak membutuhkan Neon.
4. Jalankan `verify`. Hasilnya harus `problems: 0`.
5. Siapkan ulang `config.json` dan jalankan `set-credential`. Kredensial DPAPI tidak bisa dipindahkan antarakun atau antarkomputer.
6. Jalankan `check`, lalu `run`. Run pertama membandingkan arsip dengan Neon. Baris yang sudah tidak ada di Neon dilaporkan sebagai *discrepancy* tanpa mengubah arsip.

---

## 8. Salinan cadangan

Arsip ini hanya satu salinan di satu disk. Untuk ketahanan:

- Salin folder `.analytics-backup\data` secara berkala ke disk lain atau media eksternal yang terenkripsi, misalnya dengan BitLocker To Go.
- Hindari folder yang otomatis tersinkron ke cloud publik, kecuali Anda memang menyetujui data itu disimpan di sana.

---

## 9. Privasi dan retensi

### Isi arsip

| Data | Sifat |
|---|---|
| `session_id` | ID acak per tab browser. Pseudonymous. |
| `visitor_id` | Pada baris sebelum November 2026: **ID permanen per browser** dari versi lama. Pseudonymous, dan termasuk data pribadi. |
| `referrer` | Data baru: hanya origin situs. Baris lama: bisa berupa **URL lengkap** dengan path dan parameter. |
| `metadata` | Data baru: perangkat dan bahasa. Baris lama: bisa berisi zona waktu, ukuran layar, dan locale lengkap. |
| `path`, `created_at_*` | Halaman dan waktu kunjungan. Jika digabung dengan `session_id`, pola kunjungan per sesi bisa direkonstruksi. |

Arsip **tidak** berisi IP, nama, atau email. Pesan formulir kontak tidak disimpan di tabel ini.

### Penghapusan di Neon tidak menghapus arsip lokal

Script sengaja tidak pernah menghapus baris arsip. Akibatnya, retensi atau pembersihan data di Neon (termasuk pembersihan data lama yang disebut di `SECURITY_AUDIT.md`) **tidak** berlaku otomatis untuk arsip lokal. Baris yang dihapus di Neon tetap ada di arsip dan tercatat di `data\discrepancies`. Jika data harus dihapus karena permintaan atau kebijakan, hapus juga secara manual dari arsip lokal, termasuk dari file `.bak`, `data\repairs`, `data\discrepancies`, dan salinan cadangan.

### Rekomendasi retensi (putuskan sebelum mengaktifkan jadwal)

1. Simpan file harian mentah paling lama **12 bulan**, atau samakan dengan retensi Neon bila nanti ditetapkan.
2. Setelah itu, hapus file lama, atau ringkas terlebih dahulu menjadi angka harian tanpa `session_id`/`visitor_id`.
3. Hapus juga file `.bak`, `data\repairs`, dan `data\discrepancies` untuk tanggal yang sama.
4. Bersihkan `visitor_id` dan referrer lengkap dari arsip baris lama jika tidak dibutuhkan.

Script belum punya perintah retensi otomatis, jadi lakukan secara manual, misalnya sebulan sekali.

### Pemberitahuan privasi

Pemberitahuan privasi di website saat ini menyebut bahwa data disimpan di Neon. Sebelum mengaktifkan backup, tambahkan bahwa catatan kunjungan juga disalin ke perangkat pribadi pemilik situs, beserta lama penyimpanannya.

### Formula Excel di CSV mentah

Data lama tidak divalidasi server, sehingga bisa berisi teks yang diawali `=`, `+`, `-`, atau `@`. Jika file CSV dibuka dengan **klik ganda** di Excel, teks itu bisa dijalankan sebagai formula (*CSV injection*).

- Jangan membuka arsip dengan klik ganda.
- Gunakan **Data → From Text/CSV** (Power Query), yang memuat nilai sebagai data, lalu pilih encoding UTF-8.
- Atau buka di editor teks.
- Jangan menyimpan ulang file arsip dari Excel; simpan sebagai file lain. Mengubah file arsip akan membuatnya tercatat rusak (exit code `4`).

---

## 10. Pengujian

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\analytics-backup\tests\Test-AnalyticsBackup.ps1
```

- Membutuhkan binary server PostgreSQL 14+ lokal (`initdb`, `pg_ctl`, `psql`).
- Membuat cluster sementara di `%TEMP%` pada `127.0.0.1:55434` dengan skema yang sama seperti Neon, lalu menghapusnya setelah selesai.
- Tidak pernah menghubungi Neon.
- Perintah Task Scheduler diarahkan ke file JSON tiruan, sehingga tidak ada task sungguhan yang dibuat.

Skenario yang diuji:

| Kelompok | Skenario |
|---|---|
| Backup normal | Backup pertama; batas tanggal WIB; isi CSV (koma, kutip, baris baru, UTF-8, NULL vs teks kosong); backup ulang tanpa duplikasi; aturan 15 menit. |
| Penggantian file | Penggantian yang terhenti di tengah lalu dilanjutkan; sisa file `.new`; `.bak` setelah penggantian. |
| Data di Neon berubah | Komputer mati beberapa hari; arsip 10 baris sementara Neon 8; event terlambat dengan `id` lebih kecil dari `id` terbesar; baris NULL yang kemudian mendapat tanggal; `id` sama dengan isi berbeda. |
| Riwayat discrepancy | Perubahan berulang pada `id` yang sama, pemulihan, penghapusan lalu kemunculan kembali (baris lama tetap identik, tanpa duplikat); log rusak disisihkan tanpa diubah. |
| Arsip lokal bermasalah | File diubah manual lalu `repair`; file hilang lalu `repair` (dari Neon, dan dari `.bak` ketika baris sudah dihapus di Neon); penggantian selesai tetapi checkpoint belum tersimpan (diterima), dan kasus serupa dengan baris lama ikut diubah (ditolak). |
| Pengaturan server | `DateStyle` role atau server yang bukan ISO. |
| File sementara | `.new` yang sudah tercakup arsip dihapus; `.new` yang berisi baris lain disisihkan; kegagalan `ReplaceFile` di tengah jalan dipulihkan lewat `repair`. |
| Parser dan fingerprint | Tanda kutip di dalam field tanpa kutip ditolak; karakter kontrol dan emoji konsisten antara Neon dan lokal; isi yang dulu bisa bertabrakan kini berbeda. |
| `repair -PreferDatabase` | Default mempertahankan versi lokal (event `conflict`); dengan opsi ini versi Neon dipakai (event `replaced`), dan run berikutnya tidak menambah event. |
| Lingkungan PowerShell | Constrained Language Mode dan parser versi lain di sesi yang sama ditolak dengan pesan jelas. |
| Checkpoint | Checkpoint hilang lalu `rebuild-checkpoint` tanpa Neon; rebuild dengan arsip rusak atau tanggal bolong; pemulihan di folder lain; checkpoint rusak. |
| Keamanan | Penolakan role penulis dan superuser; password salah; koneksi tanpa TLS ke host remote; run bersamaan; tidak ada password di log. |
| Task Scheduler | `install`/`enable`/`disable`/`uninstall` tanpa mengubah arsip. |

Variabel `ANALYTICS_BACKUP_TEST_FAIL_BEFORE_COMMIT` dan `ANALYTICS_BACKUP_TEST_TASK_STORE` hanya untuk pengujian; jangan diset saat pemakaian normal.
