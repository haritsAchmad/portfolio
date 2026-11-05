# Statistik Pengunjung (Custom Analytics)

Panduan ini menjelaskan cara membaca data kunjungan yang dicatat oleh analytics buatan sendiri di portfolio ini: browser mengirim page view ke Vercel Function `/api/analytics`, lalu function menyimpannya di tabel `public.analytics_events` pada database Neon (PostgreSQL).

> Vercel Web Analytics (dashboard di Vercel) adalah fitur terpisah dengan cara hitung sendiri. Angkanya tidak akan sama persis dengan hasil query di sini.

Untuk menyimpan salinan harian event ke komputer sendiri, lihat [ANALYTICS-BACKUP.md](ANALYTICS-BACKUP.md).

Semua query di bawah hanya `SELECT` (membaca). Jangan menjalankan `UPDATE`, `DELETE`, `ALTER`, atau `DROP` dari panduan ini.

---

## 1. Apa yang dicatat

Skema `public.analytics_events` (diperiksa langsung di Neon, project `harits-portfolio`, branch `production`, database `neondb`):

| Kolom | Tipe | Nullable | Default | Isi |
|---|---|---|---|---|
| `id` | `bigint` | tidak | `nextval('analytics_events_id_seq')` | Nomor urut baris. |
| `event_name` | `character varying` | tidak | — | Selalu `page_view` untuk data baru. |
| `path` | `character varying` | tidak | — | Path halaman tanpa query string dan fragment, misalnya `/`. |
| `visitor_id` | `character varying` | ya | — | Selalu `NULL` untuk data baru. Baris lama (sebelum November 2026) bisa berisi ID permanen dari versi lama; panduan ini sengaja tidak memakainya. |
| `session_id` | `character varying` | ya | — | ID acak per **tab browser** (disimpan di `sessionStorage`), atau `NULL`. |
| `referrer` | `text` | ya | — | Origin situs asal, misalnya `https://www.google.com`, atau `NULL`. Baris lama bisa berisi URL lengkap. |
| `metadata` | `jsonb` | ya | `'{}'::jsonb` | `{"device": "mobile" atau "desktop", "language": "id"}`. |
| `created_at` | `timestamp with time zone` | ya | `now()` | Waktu baris disimpan. Kode tidak mengisinya; nilainya berasal dari default `now()`. |

Kode (`api/analytics.js`) hanya mengisi `event_name`, `path`, `visitor_id`, `session_id`, `referrer`, dan `metadata`. Karena `created_at` boleh `NULL`, query berbasis waktu di bawah tidak menghitung baris tanpa waktu secara diam-diam: query 3 dan bagian filter periode mengabaikannya, sedangkan query 6 menampilkan jumlahnya secara terpisah.

Kapan page view dikirim:

- Hanya dari domain produksi `portfolio-pied-ten-84.vercel.app` (bukan localhost atau preview deployment).
- Tidak dikirim oleh browser otomatis (`navigator.webdriver`), misalnya saat tes Playwright.
- Satu tab hanya mengirim satu page view per path setiap 30 menit. Reload berkali-kali dalam 30 menit tidak menambah hitungan.
- Jika browser memblokir `sessionStorage`, page view tidak dikirim.

---

## 2. Membuka Neon SQL Editor

Nama menu di Neon bisa berubah sewaktu-waktu; langkah di bawah menggambarkan alurnya.

1. Buka <https://console.neon.tech> dan login dengan akun yang dipakai untuk database portfolio.
2. Pilih project **`harits-portfolio`**.
3. Buka **SQL Editor** dari menu samping.
4. Pada pilihan di atas editor, pilih branch **`production`** dan database **`neondb`**.
5. Tempel satu query, lalu klik **Run**. Hasil muncul di bawah editor.

Jika suatu saat database dipindahkan, cocokkan project dengan nilai `DATABASE_URL` di Vercel → project portfolio → **Settings → Environment Variables**: lihat **hanya** bagian host (diawali `ep-…`) dan nama database (bagian setelah `/` terakhir, sebelum `?`). Jangan menyalin, memotret, atau menempelkan nilai `DATABASE_URL` ke mana pun karena berisi password.

Catatan:

- Menjalankan query akan menyalakan compute Neon sebentar. Untuk database sekecil ini biayanya kecil, tetapi tetap terhitung dalam kuota pemakaian.
- SQL Editor biasanya berjalan dengan role pemilik database yang bisa mengubah data. Karena itu jalankan hanya query `SELECT` dari panduan ini.

Tanggal pada hasil memakai zona waktu `Asia/Jakarta` (WIB). Karena `created_at` bertipe `timestamp with time zone`, konversi ke WIB benar apa pun zona waktu sesi SQL Editor.

---

## 3. Query statistik

### Query 1 — Total page views

```sql
-- Query 1: total page views sepanjang waktu
SELECT count(*) AS total_page_views
FROM analytics_events
WHERE event_name = 'page_view';
```

### Query 2 — Perkiraan sesi unik

Tidak ada identifier yang mengenali orang yang sama antar-tab, antar-hari, atau antar-perangkat. Yang tersedia hanya `session_id`, yang berlaku per tab browser. Karena itu hasil ini adalah **perkiraan jumlah sesi (tab) unik**, bukan jumlah orang.

```sql
-- Query 2: perkiraan sesi unik (BUKAN jumlah orang)
SELECT
  count(*) AS total_page_views,
  count(DISTINCT session_id) AS perkiraan_sesi_unik,
  count(*) FILTER (WHERE session_id IS NULL) AS page_views_tanpa_session_id
FROM analytics_events
WHERE event_name = 'page_view';
```

### Query 3 — Kunjungan per hari (WIB), 30 hari terakhir

Menampilkan 30 baris, termasuk hari tanpa kunjungan (nilai 0), dari hari ini mundur ke belakang. Baris dengan `created_at` kosong tidak punya tanggal sehingga tidak masuk ke hari mana pun; jumlahnya bisa dilihat di query 6.

```sql
-- Query 3: page views dan perkiraan sesi unik per hari (WIB), 30 hari terakhir
WITH events AS (
  SELECT
    session_id,
    (created_at AT TIME ZONE 'Asia/Jakarta')::date AS tanggal
  FROM analytics_events
  WHERE event_name = 'page_view'
    AND created_at IS NOT NULL
    AND created_at >= now() - interval '31 days'
),
hari AS (
  SELECT generate_series(
    (now() AT TIME ZONE 'Asia/Jakarta')::date - 29,
    (now() AT TIME ZONE 'Asia/Jakarta')::date,
    interval '1 day'
  )::date AS tanggal
)
SELECT
  hari.tanggal,
  count(events.tanggal) AS page_views,
  count(DISTINCT events.session_id) AS perkiraan_sesi_unik
FROM hari
LEFT JOIN events ON events.tanggal = hari.tanggal
GROUP BY hari.tanggal
ORDER BY hari.tanggal DESC;
```

### Query 4 — Halaman paling sering dikunjungi

```sql
-- Query 4: halaman terpopuler sepanjang waktu
SELECT
  path,
  count(*) AS page_views,
  count(DISTINCT session_id) AS perkiraan_sesi_unik
FROM analytics_events
WHERE event_name = 'page_view'
GROUP BY path
ORDER BY page_views DESC, path
LIMIT 20;
```

Portfolio ini adalah satu halaman (bagian seperti `#projects` adalah anchor, bukan halaman), jadi hampir semua baris akan berada di path `/`.

### Query 5 — Sumber pengunjung (referrer)

Referrer dinormalisasi menjadi origin (`https://domain`) sehingga baris lama yang masih menyimpan URL lengkap ikut dikelompokkan, dan path atau query string dari baris lama tidak ditampilkan.

```sql
-- Query 5: referrer teratas sepanjang waktu
SELECT
  CASE
    WHEN referrer IS NULL OR referrer = '' THEN '(langsung / tidak diketahui)'
    ELSE coalesce(substring(lower(referrer) FROM '^(https?://[^/?#]+)'), '(format lain)')
  END AS sumber,
  count(*) AS page_views,
  count(DISTINCT session_id) AS perkiraan_sesi_unik
FROM analytics_events
WHERE event_name = 'page_view'
GROUP BY 1
ORDER BY page_views DESC, sumber
LIMIT 20;
```

### Query 6 — Apakah analytics sedang menerima data?

```sql
-- Query 6: event terakhir (WIB) dan aktivitas terbaru
SELECT
  max(created_at) AT TIME ZONE 'Asia/Jakarta' AS event_terakhir_wib,
  count(*) FILTER (WHERE created_at >= now() - interval '24 hours') AS page_views_24_jam,
  count(*) FILTER (WHERE created_at >= now() - interval '7 days') AS page_views_7_hari,
  count(*) FILTER (WHERE created_at IS NULL) AS page_views_tanpa_waktu
FROM analytics_events
WHERE event_name = 'page_view';
```

`max()` dan perbandingan waktu otomatis mengabaikan `created_at` yang kosong. Jika `page_views_tanpa_waktu` lebih dari 0, baris itu tetap terhitung di query 1, 2, 4, dan 5, tetapi tidak muncul di statistik per hari.

### Membatasi query 1, 2, 4, 5 ke periode tertentu (opsional)

Query 1, 2, 4, dan 5 menghitung sepanjang waktu. Untuk 30 hari terakhir, tambahkan baris berikut tepat di bawah `WHERE event_name = 'page_view'`:

```sql
  AND created_at >= now() - interval '30 days'
```

Baris dengan `created_at` kosong otomatis tidak ikut dihitung saat filter ini dipakai.

---

## 4. Memahami hasil

| Angka | Arti | Perlu diingat |
|---|---|---|
| `page_views` / `total_page_views` | Jumlah page view yang tercatat. | Sudah dideduplikasi per tab dan path selama 30 menit, jadi reload beruntun tidak dihitung ulang. |
| `perkiraan_sesi_unik` | Jumlah `session_id` berbeda. | Satu orang bisa terhitung beberapa kali (membuka tab baru, datang lagi besok, pindah perangkat). Baris dengan `session_id` kosong tidak ikut dihitung. Jangan dibaca sebagai "jumlah orang". |
| `page_views_tanpa_session_id` | Page view tanpa `session_id`. | Wajar jika ada sedikit, terutama dari data lama. |
| `page_views_tanpa_waktu` | Page view dengan `created_at` kosong. | Normalnya 0 karena kolom ini terisi otomatis oleh `now()`. |
| `sumber` | Situs asal pengunjung. | `(format lain)` berarti referrer lama yang bukan alamat `http`/`https`. `(langsung / tidak diketahui)` berarti URL diketik langsung, dibuka dari aplikasi (WhatsApp, PDF CV, dsb.), dari bookmark, atau browser tidak mengirim referrer. Domain portfolio sendiri bisa muncul jika halaman dibuka dari dalam situs. |
| Angka per hari | Dikelompokkan berdasarkan tanggal WIB. | Hari ini masih berjalan, jadi angkanya belum final. |

Batasan umum:

- **Bukan angka yang terverifikasi.** Endpoint `/api/analytics` bersifat publik dan belum punya rate limiting, sehingga siapa pun bisa mengirim page view palsu. Lonjakan tiba-tiba dari `session_id` atau `sumber` yang aneh perlu dicurigai.
- Pengunjung yang memblokir JavaScript, `sessionStorage`, atau request ke `/api/analytics` tidak tercatat.
- Data lama (sebelum perubahan privasi November 2026) bisa punya format berbeda; query di atas sudah dibuat agar tetap bisa dibaca bersama data baru.

---

## 5. Memeriksa apakah analytics berjalan

1. **Lewat database:** jalankan [Query 6](#query-6--apakah-analytics-sedang-menerima-data). Jika `event_terakhir_wib` sudah lama padahal situs dikunjungi, ada yang tidak berjalan.
2. **Lewat browser (tanpa database):**
   1. Buka situs produksi di tab **baru** pada browser biasa (bukan mode otomatisasi).
   2. Buka DevTools → **Network**, filter `analytics`, lalu reload.
   3. Cari request `POST /api/analytics`:

      | Status | Arti |
      |---|---|
      | `204` | Tersimpan. |
      | Tidak ada request | Tab ini sudah mengirim page view untuk path yang sama dalam 30 menit terakhir; buka tab baru. Bisa juga karena `sessionStorage` diblokir atau bukan domain produksi. |
      | `400` | Payload ditolak oleh validasi. |
      | `413` | Payload terlalu besar. |
      | `503` | `DATABASE_URL` belum diset di Vercel. |
      | `500` | Gagal menyimpan ke database; periksa log function di Vercel (pesan diawali `Failed to store analytics event:`). |

   Pemeriksaan ini ikut menambah satu page view ke statistik. Itu wajar; ingat saja saat membaca angka yang kecil.
