export const projects = [
  {
    id: 1,
    title: "SIPEG UI (Anjab & Sicakep Modules)",
    category: "enterprise-legacy",
    categoryName: "Enterprise Legacy",
    description: "Sistem Informasi Kepegawaian skala besar untuk Universitas Indonesia yang mengelola data administratif pegawai, dekanat, rektor, dan struktur organisasi kampus.",
    role: "Modul Developer (Anjab & Sicakep)",
    techStack: ["PHP 5.3", "Symfony 1", "PostgreSQL 8.3", "SQL Optimization", "Classic OOP"],
    features: [
      "Mengembangkan instrumen Analisis Jabatan (Anjab) terstruktur untuk pemetaan beban kerja.",
      "Membangun modul Catatan Kepegawaian (Sicakep) untuk memantau rekam jejak kerja pegawai.",
      "Melakukan optimasi kueri basis data pada tabel relasional kepegawaian berskala besar."
    ],
    impact: "Memfasilitasi pengelolaan data administrasi ribuan dosen dan tenaga pendidik secara terpusat dan aman.",
    phpVersion: "PHP 5.3",
    colorClass: "glow-legacy",
    badgeColor: "#EF4444" // Red for legacy
  },
  {
    id: 2,
    title: "SIG System (SMS516 & Koperasig)",
    category: "modern-spa",
    categoryName: "Modern Frameworks",
    description: "Sistem kepegawaian korporasi modern dengan arsitektur decoupled (Angular frontend + PHP API backend) untuk layanan mandiri karyawan dan administrasi.",
    role: "IT Programmer (Magang) - Fokus Modul SMS516 & Koperasig",
    techStack: ["Angular (TS)", "PHP 7.4 (API)", "Laragon Setup", "RESTful API", "MySQL"],
    features: [
      "Merancang & mengembangkan Sistem Informasi Koperasi internal perusahaan (Koperasig).",
      "Mengembangkan modul presensi mandiri (self-update-bio-attendance) pada modul SMS516.",
      "Mengimplementasikan generator ekspor PDF kustom (buat-export-pdf) dan konfigurasi environment lokal via Laragon."
    ],
    impact: "Memudahkan ribuan karyawan melakukan presensi mandiri, pelaporan koperasi, dan memotong birokrasi manual.",
    phpVersion: "PHP 7.4",
    colorClass: "glow-modern",
    badgeColor: "#6366F1" // Indigo for modern
  },
  {
    id: 3,
    title: "SI Inventaris SBRC IPB",
    category: "modern-spa",
    categoryName: "Modern Frameworks",
    description: "Sistem Informasi Inventarisasi Alat & Bahan Penelitian Laboratorium untuk Pusat Penelitian Surfaktan dan Bioenergi (SBRC) IPB University.",
    role: "Web Developer (Magang)",
    techStack: ["PHP 8.2+", "Laravel", "Composer", "MySQL", "Artisan CLI"],
    features: [
      "Membangun manajemen logistik inventaris riset kimia & surfaktan berbasis framework Laravel.",
      "Mengadaptasi arsitektur sistem perpustakaan menjadi tracker aset alat lab yang dinamis.",
      "Merancang pencatatan log peminjaman, ketersediaan stok fisik, dan dokumentasi perpus.sql."
    ],
    impact: "Mendigitalkan pelacakan stok alat riset guna menghindari selisih fisik laboratorium dan mempercepat pencarian data aset.",
    phpVersion: "PHP 8.2+",
    colorClass: "glow-modern",
    badgeColor: "#6366F1" // Indigo for frameworks
  },
  {
    id: 4,
    title: "Fishee GIS Platform",
    category: "gis-public",
    categoryName: "GIS & Public Web",
    description: "Aplikasi direktori dan pemetaan interaktif UMKM perikanan dan produk olahan ikan lokal berbasis peta digital geospasial.",
    role: "Lead Developer (Solo Project)",
    techStack: ["Native PHP 7.4", "Leaflet.js (GIS)", "Bootstrap", "jQuery", "MySQL"],
    features: [
      "Mengintegrasikan peta geospasial Leaflet.js dengan marker dinamis koordinat toko UMKM.",
      "Membangun sistem CRUD lengkap untuk produk olahan ikan dan manajemen profil partner.",
      "Mengembangkan fitur pencarian taksonomi produk, ulasan, rating, serta filtering peta."
    ],
    impact: "Menghubungkan nelayan dan UMKM lokal secara langsung dengan konsumen melalui peta sebaran interaktif.",
    phpVersion: "PHP 7.4",
    colorClass: "glow-public",
    badgeColor: "#10B981" // Emerald for GIS/public
  }
];
