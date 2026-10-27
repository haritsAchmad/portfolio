# Credits

Portfolio ini dibangun di atas karya orang lain. File ini mencatat library,
font, dan layanan pihak lain yang dipakai, beserta pembuat dan lisensinya.
Kode proyek ini sendiri berlisensi MIT (lihat [LICENSE](LICENSE)). CV,
resume, sertifikat, dan foto di `public/` adalah milik Harits Achmad Fauzan
dan tidak termasuk lisensi MIT.

Setiap kali menambah library, font, ikon, atau gambar dari pihak lain,
tambahkan juga ke file ini di PR yang sama.

Terakhir diperiksa: 27 Oktober 2026.

## Library (ikut di hasil build)

| Paket | Lisensi | Dipakai untuk |
| --- | --- | --- |
| [Vue](https://vuejs.org/) 3 | MIT (Evan You) | UI |
| [@vercel/analytics](https://github.com/vercel/analytics) | MIT | Statistik kunjungan di Vercel |
| [@neondatabase/serverless](https://github.com/neondatabase/serverless) | MIT | Akses database di fungsi `api/` |

Total 25 paket produksi (`npm ls --omit=dev`): MIT 22, BSD-3-Clause 1,
BSD-2-Clause 1, ISC 1. Alat pengembangan ([Vite](https://vitejs.dev/),
[Playwright](https://playwright.dev/) Apache-2.0, PostCSS) tidak ikut di
hasil build.

`generate_pdf.py` (membuat panduan PDF) memakai
[fpdf2](https://github.com/py-pdf/fpdf2) (LGPL-3.0), dipasang terpisah,
tidak ikut di situs.

## Font

- **[Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)**
  oleh Tokotype -- [SIL Open Font License 1.1](https://openfontlicense.org/),
  dimuat dari Google Fonts.

## Layanan

- **[Vercel](https://vercel.com/)** -- hosting dan analytics.
- **[Neon](https://neon.tech/)** -- PostgreSQL serverless.

Ada yang kurang atau salah? Buka issue atau PR.
