export const projects = [
  {
    id: 1,
    title: "Go POS Playground",
    category: "internal-tools",
    categoryName: "Internal Tools",
    description: "Playground sistem point of sale untuk mengeksplorasi alur operasional toko, pengelolaan produk, stok, dan transaksi melalui backend API dan antarmuka web.",
    role: "Full-stack Developer (Personal Project)",
    techStack: ["Golang", "Gin", "Nuxt", "PostgreSQL", "REST API", "Git"],
    features: [
      "Membangun fondasi backend API untuk data produk, stok, dan transaksi.",
      "Menerjemahkan proses operasional sederhana menjadi alur kerja aplikasi yang mudah dipahami.",
      "Mengembangkan proyek secara bertahap sambil melakukan pengujian dan penanganan edge case."
    ],
    impact: "Menjadi ruang eksperimen untuk merancang internal tool operasional yang terstruktur dan mudah dikembangkan lebih lanjut.",
    status: "Aktif dikembangkan",
    primaryTech: "Go + Nuxt",
    repositoryUrl: "https://github.com/haritsAchmad/go-pos-playground",
    colorClass: "glow-modern",
    badgeColor: "#6366F1"
  },
  {
    id: 2,
    title: "Go AI Playground",
    category: "ai-experimentation",
    categoryName: "AI Experimentation",
    description: "Eksperimen aplikasi AI lokal untuk mempelajari integrasi model melalui Ollama, pengelolaan percakapan, serta pengembangan workflow berbantuan AI.",
    role: "Full-stack Developer (Personal Project)",
    techStack: ["Golang", "Nuxt", "Ollama", "Local LLM", "REST API", "Git"],
    features: [
      "Mengintegrasikan aplikasi dengan model AI lokal melalui Ollama.",
      "Mengeksplorasi pengelolaan request, response, konteks percakapan, dan pengalaman pengguna.",
      "Menggunakan AI-assisted development untuk debugging, eksplorasi solusi, dan dokumentasi teknis."
    ],
    impact: "Memperdalam pemahaman mengenai integrasi AI ke aplikasi sekaligus menjaga eksperimen dapat dijalankan secara lokal.",
    status: "Aktif dikembangkan · Repository privat",
    primaryTech: "Go + Ollama",
    colorClass: "glow-ai",
    badgeColor: "#A855F7"
  },
  {
    id: 3,
    title: "Recruitment Management System",
    category: "internal-tools",
    categoryName: "Internal Tools",
    description: "Sistem internal yang sedang dikembangkan untuk mendukung alur administrasi rekrutmen, penilaian, wawancara, dan pengambilan keputusan secara terpusat.",
    role: "Full-stack Developer (Professional Project)",
    techStack: ["Golang", "Gin", "Nuxt", "PostgreSQL", "REST API", "SQL"],
    features: [
      "Menerjemahkan kebutuhan proses rekrutmen menjadi modul dan alur kerja berbasis peran.",
      "Mengembangkan endpoint backend, pencarian, filter, dan pengelolaan status proses seleksi.",
      "Menyusun antarmuka untuk membantu pengguna internal memantau dan mengelola tahapan rekrutmen."
    ],
    impact: "Ditujukan untuk mengurangi proses manual dan membantu pemantauan tahapan rekrutmen secara lebih terstruktur.",
    status: "Sedang dikerjakan · Source code tidak dipublikasikan",
    primaryTech: "Go + Nuxt",
    colorClass: "glow-modern",
    badgeColor: "#0EA5E9"
  },
  {
    id: 4,
    title: "SIPEG UI (Anjab & Sicakep Modules)",
    category: "legacy-modernization",
    categoryName: "Legacy Modernization",
    description: "Pengembangan dan pemeliharaan modul sistem informasi kepegawaian internal untuk mendukung analisis jabatan, pencatatan kinerja, dan pengelolaan struktur organisasi.",
    role: "Module Developer",
    techStack: ["PHP 5.3", "Symfony 1", "PostgreSQL 8.3", "SQL", "JavaScript"],
    features: [
      "Mengembangkan instrumen Analisis Jabatan untuk pemetaan jabatan dan beban kerja.",
      "Membangun serta memelihara fitur monitoring, pelaporan, dan pengelolaan data kepegawaian.",
      "Menyesuaikan fitur berdasarkan kebutuhan pengguna internal dan keterbatasan codebase legacy."
    ],
    impact: "Mendukung digitalisasi proses administrasi SDM melalui sistem internal yang lebih terpusat dan mudah ditelusuri.",
    status: "Professional project · Repository privat",
    primaryTech: "PHP 5.3",
    colorClass: "glow-legacy",
    badgeColor: "#EF4444"
  },
  {
    id: 5,
    title: "Employee Self-Service & Cooperative Management Tools",
    category: "business-systems",
    categoryName: "Business Systems",
    description: "Pengembangan beberapa tools internal untuk mendukung layanan mandiri karyawan, administrasi koperasi, pembaruan data, presensi, dan pembuatan dokumen PDF.",
    role: "IT Programmer Intern",
    techStack: ["Angular", "TypeScript", "PHP 7.4", "Lumen", "REST API", "MySQL"],
    features: [
      "Merancang dan mengembangkan Sistem Informasi Manajemen Koperasi menggunakan Angular dan PHP/Lumen API.",
      "Mengembangkan fitur pembaruan data dan sinkronisasi presensi mandiri pada modul kepegawaian.",
      "Mengimplementasikan generator PDF dinamis serta menyiapkan environment pengembangan lokal."
    ],
    impact: "Membantu mengurangi proses administrasi manual dan memusatkan beberapa kebutuhan layanan karyawan ke dalam aplikasi internal.",
    status: "Completed · Professional project",
    primaryTech: "Angular + PHP",
    colorClass: "glow-modern",
    badgeColor: "#6366F1"
  },
  {
    id: 6,
    title: "SI Inventaris SBRC IPB",
    category: "business-systems",
    categoryName: "Business Systems",
    description: "Sistem informasi inventarisasi alat dan bahan penelitian laboratorium untuk membantu pencatatan stok, peminjaman, serta ketersediaan aset.",
    role: "Web Developer Intern",
    techStack: ["PHP 8.2+", "Laravel", "MySQL", "Composer", "Git"],
    features: [
      "Membangun pengelolaan data alat, bahan, stok, dan peminjaman.",
      "Menyesuaikan alur aplikasi terhadap kebutuhan inventaris laboratorium.",
      "Menyusun pencatatan riwayat dan ketersediaan aset agar lebih mudah ditelusuri."
    ],
    impact: "Mendigitalkan pencatatan inventaris laboratorium dan membantu pencarian data aset.",
    status: "Completed · Professional project",
    primaryTech: "Laravel",
    colorClass: "glow-modern",
    badgeColor: "#6366F1"
  },
  {
    id: 7,
    title: "Fishee GIS Platform",
    category: "gis-public",
    categoryName: "GIS & Public Web",
    description: "Aplikasi direktori dan pemetaan interaktif UMKM perikanan serta produk olahan ikan lokal berbasis peta digital.",
    role: "Lead Developer (Academic Project)",
    techStack: ["Native PHP 7.4", "Leaflet.js", "Bootstrap", "jQuery", "MySQL"],
    features: [
      "Mengintegrasikan Leaflet.js dengan marker dinamis berdasarkan koordinat lokasi.",
      "Membangun fitur CRUD produk dan pengelolaan profil mitra.",
      "Mengembangkan pencarian, ulasan, rating, dan penyaringan data pada peta."
    ],
    impact: "Menyajikan informasi UMKM dan produk lokal melalui pengalaman pencarian berbasis peta.",
    status: "Completed · Academic project",
    primaryTech: "PHP + Leaflet",
    colorClass: "glow-public",
    badgeColor: "#10B981"
  }
];
