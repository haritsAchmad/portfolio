# 📘 Panduan Belajar: Memahami Struktur & Logika Portofolio Vue 3 + Vite

Halo Harits! File ini dirancang khusus sebagai panduan belajar agar lu paham **100% cara kerja aplikasi ini**, tidak cuma sekadar terima jadi. 

Yuk, kita bahas langkah demi langkah, mulai dari cara menjalankan hingga ke dalam logika kodenya!

---

## 🚀 1. Cara Menjalankan Proyek di Komputer Lu

Proyek ini menggunakan **Vite** sebagai server pengembangannya. Karena kita sudah menginstal modulnya (`npm install`), lu bisa menjalankan server lokal dengan sangat cepat:

1. **Buka Terminal** (PowerShell / Command Prompt) di dalam folder `C:\Users\HaritsAF\Videos\portfolio`.
2. **Jalankan Perintah**:
   ```bash
   npm run dev
   ```
3. **Buka Browser**: Buka alamat URL yang tertera di terminal, biasanya `http://localhost:5173`.
4. **Hentikan Server**: Tekan tombol `Ctrl + C` pada terminal untuk mematikan server.

---

## 📂 2. Memahami Struktur Folder Proyek

Vite mengemas folder dengan struktur yang sangat ringkas:

```text
portfolio/
├── node_modules/         # Folder berisi semua library (Vue, Vite, dll.) - diabaikan saat git upload.
├── public/               # File statis (CV PDF lu, logo, icon) yang langsung disajikan tanpa diproses Vite.
│   └── Harits_Achmad_Fauzan_Resume.pdf  # Berkas CV asli lu yang otomatis terintegrasi untuk diunduh!
├── src/                  # TEMPAT KODE UTAMA KITA!
│   ├── assets/           # Gambar, logo, atau aset media lokal.
│   ├── components/       # Komponen-komponen UI modular (Navbar, Hero, dll.).
│   │   ├── Navbar.vue
│   │   ├── HeroSection.vue
│   │   ├── ProjectFilter.vue
│   │   └── ProjectCard.vue
│   ├── data/
│   │   └── projects.js   # Tempat kita menaruh metadata (database 4 proyek lu).
│   ├── App.vue           # Komponen utama yang membungkus semua halaman, riwayat karir, & form.
│   ├── main.js           # Entry point JS yang me-mount aplikasi Vue ke file index.html.
│   └── style.css         # Desain global (Vanilla CSS) premium glassmorphism.
├── index.html            # File HTML utama yang diakses pertama kali oleh browser (sudah SEO-optimized).
├── package.json          # Berkas konfigurasi proyek & daftar library yang diinstal.
└── vite.config.js        # Konfigurasi internal server Vite.
```

---

## 💡 3. Cara Kerja Vue 3 di Portofolio Ini

Proyek ini dibangun menggunakan **Vue 3 Composition API** dengan sintaks `<script setup>`. Ini adalah standar paling modern dan efisien di Vue.

Ada **3 Konsep Utama** yang kita gunakan di sini:

### A. State Reaktif dengan `ref()`
Di `src/App.vue`, kita mendefinisikan state bernama `activeFilter` untuk menyimpan kategori proyek yang sedang dipilih user:
```javascript
import { ref } from 'vue';
const activeFilter = ref('all'); // Secara default, bernilai 'all'
```
*   **Kenapa pakai `ref`?** Di Vue, jika variabel biasa diubah nilainya, browser tidak akan otomatis menggambar ulang (*render*) halaman web. Dengan membungkusnya menggunakan `ref()`, Vue akan mendeteksi setiap perubahan nilai variabel tersebut dan **otomatis memperbarui tampilan UI seketika** (reaktif).

### B. Properti Komputasi dengan `computed()`
Kita menggunakan properti komputasi untuk menyaring daftar proyek yang akan ditampilkan berdasarkan saringan yang aktif:
```javascript
const filteredProjects = computed(() => {
  if (activeFilter.value === 'all') {
    return projects; // Tampilkan semua jika filternya 'all'
  }
  return projects.filter(p => p.category === activeFilter.value); // Saring array
});
```
*   **Kenapa tidak pakai fungsi biasa?** Nilai dari `computed()` akan disimpan di memori (*cached*). Vue hanya akan menghitung ulang nilainya jika `activeFilter` berubah. Ini membuat performa web menjadi **sangat ringan dan cepat**!

### C. Komunikasi Antar Komponen (Props & Emits)
Aplikasi Vue yang baik dibagi menjadi komponen-komponen kecil agar rapi. Komponen tersebut berkomunikasi dengan cara:
1.  **Props (Data Masuk)**: Mengirimkan data dari komponen induk (`App.vue`) ke komponen anak (`ProjectCard.vue`).
    *   *Contoh di ProjectCard.vue*: `defineProps({ project: Object })` digunakan agar kartu tahu detail proyek mana yang harus digambar.
2.  **Emits (Sinyal Keluar)**: Mengirimkan sinyal kejadian dari komponen anak (`ProjectFilter.vue`) ke komponen induk (`App.vue`).
    *   *Contoh di ProjectFilter.vue*: Saat tombol diklik, dia mengirimkan event `@click="$emit('change-filter', filter.value)"` untuk memberitahu komponen induk agar mengganti nilai `activeFilter`.

---

## 🎨 4. Desain Premium dengan Vanilla CSS

Untuk menjaga performa tetap super ringan (tidak ada beban library CSS tambahan), kita memakai **Vanilla CSS** di [src/style.css](file:///C:/Users/HaritsAF/Videos/portfolio/src/style.css).

Beberapa keunggulan desain di file CSS ini:
*   **Variabel CSS (`:root`)**: Kita menyimpan variabel warna (`--color-legacy`, `--color-modern`, dll.) di satu tempat agar mudah dikelola dan konsisten.
*   **Glassmorphism**: Desain kaca tembus pandang premium menggunakan efek blur:
    ```css
    .glass {
      background: rgba(19, 27, 46, 0.6);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    ```
*   **Efek Cahaya (Glow Hover)**: Di dalam kartu proyek [ProjectCard.vue](file:///C:/Users/HaritsAF/Videos/portfolio/src/components/ProjectCard.vue), kita menyematkan elemen gradasi radial yang berubah pancaran cahayanya sesuai dengan kategori proyek (misalnya merah menyala untuk Legacy, biru indigo untuk SPA modern & Frameworks, hijau emerald untuk GIS).

---

## 🛠️ 5. Cara Mengubah atau Menambah Proyek Baru

Jika di masa depan lu ingin menambahkan proyek baru ke portofolio:
1.  Buka berkas [src/data/projects.js](file:///C:/Users/HaritsAF/Videos/portfolio/src/data/projects.js).
2.  Tambahkan satu objek baru di dalam array `projects` dengan format yang sama:
    ```javascript
    {
      id: 5,
      title: "Nama Proyek Baru Lu",
      category: "enterprise-legacy / modern-spa / gis-public",
      categoryName: "Label Kategori",
      description: "Deskripsi singkat...",
      role: "Peran lu...",
      techStack: ["Teknologi 1", "Teknologi 2"],
      features: [
        "Fitur 1...",
        "Fitur 2..."
      ],
      impact: "Dampak proyek ini...",
      phpVersion: "PHP X.Y",
      colorClass: "glow-legacy / glow-modern / glow-public",
      badgeColor: "#WarnaHex"
    }
    ```
3.  Simpan file tersebut. Vue akan otomatis memuat proyek baru Anda tanpa perlu mengubah struktur HTML atau komponen lainnya!
