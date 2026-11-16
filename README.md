# Portfolio — Harits Achmad Fauzan

Source code untuk website portofolio pribadi Harits Achmad Fauzan yang dibangun dengan Vue 3 dan Vite.

## Kebutuhan sistem

Diukur 16 November 2026 di laptop pengembang (Windows 11 Home 64-bit, AMD
Ryzen 5 7535HS, RAM 16 GB, Node.js 24.22.1). Situsnya statis; pengunjung
hanya butuh browser.

| | Minimum | Rekomendasi | Terukur di laptop uji |
| --- | --- | --- | --- |
| Pengunjung | Browser yang mendukung ES module (target bawaan Vite 4: Chrome/Edge 87+, Firefox 78+, Safari 14+), layar HP sampai desktop | -- | halaman utama: JS 141 kB (51 kB gzip) + CSS 29 kB (6 kB gzip) |
| Sistem operasi (pengembangan) | Windows, Linux, atau macOS 64-bit yang menjalankan Node.js | -- | Windows 11 Home 64-bit |
| Prosesor / RAM (pengembangan) | Apa saja yang menjalankan Node.js | -- | `vite build` 1,8 detik (15 detik termasuk start `npx`) |
| Disk kosong | ~60 MB: `node_modules` 51 MB + `dist` 7,5 MB (6 MB di antaranya PDF CV/sertifikat) | -- | sama |
| Internet | Sekali untuk `npm install`; build berjalan offline. Formulir kontak (Web3Forms) dan statistik (Neon) butuh internet saat dipakai | -- | -- |
| Build | Node.js + npm (diuji 24.22.1 / 11.19.1), Vite 4, Vue 3 | -- | -- |
| Hosting | Vercel (situs statis + satu Vercel Function `api/analytics.js` dengan PostgreSQL Neon) | -- | -- |

## Environment variables

Salin [`.env.example`](.env.example) menjadi `.env.local` untuk development lokal, lalu isi variabel yang sama di **Vercel → Project Settings → Environment Variables** untuk deployment. File `.env.local` dan `.env.*` lain di-ignore Git; jangan commit nilai asli.

| Variabel | Dipakai oleh | Sifat | Jika tidak diisi |
|---|---|---|---|
| `VITE_WEB3FORMS_ACCESS_KEY` | Formulir kontak (`src/App.vue`), dibaca **saat build** | Publik. Semua variabel berawalan `VITE_` ikut masuk ke JavaScript yang diunduh pengunjung. Access key Web3Forms memang dirancang untuk dipakai dari browser, jadi jangan perlakukan sebagai secret server dan jangan pakai awalan `VITE_` untuk nilai rahasia apa pun. | Formulir kontak tetap tampil, tetapi setiap pengiriman berakhir dengan pesan gagal. Tombol WhatsApp dan email tetap berfungsi. |
| `DATABASE_URL` | Endpoint `/api/analytics` (`api/analytics.js`), dibaca **saat runtime** di Vercel Function | Secret server. Berisi kredensial database, hanya boleh ada di server dan tidak boleh diberi awalan `VITE_`. | `/api/analytics` membalas `503` dan kunjungan halaman tidak tercatat. Bagian lain website tidak terpengaruh. |

Setelah mengubah `VITE_WEB3FORMS_ACCESS_KEY`, build ulang (atau redeploy) karena nilainya ditanam saat build.

## Statistik pengunjung

Panduan membaca data kunjungan (total page view, perkiraan sesi unik, kunjungan per hari, halaman terpopuler, dan referrer) lewat Neon SQL Editor ada di [docs/ANALYTICS.md](docs/ANALYTICS.md). Panduan itu hanya memakai query `SELECT` dan tidak memerlukan dashboard admin.

Backup harian event analytics ke CSV lokal (Windows Task Scheduler, role database read-only) dijelaskan di [docs/ANALYTICS-BACKUP.md](docs/ANALYTICS-BACKUP.md).

## AI-assisted development

Project ini dirancang, diarahkan, diuji, dan direview oleh Harits Achmad Fauzan. ChatGPT dan Codex digunakan sebagai alat bantu untuk brainstorming, review kode, refactoring, dan implementasi. Keputusan akhir, validasi tampilan, dan persetujuan perubahan tetap dilakukan oleh pemilik project.

## License

Copyright (c) 2026 Harits Achmad Fauzan. Project ini dilisensikan menggunakan [MIT License](LICENSE).

Library, program, font, dan aset pihak lain beserta lisensinya dicatat di [CREDITS.md](CREDITS.md).
