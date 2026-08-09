export const projects = [
  {
    id: 1,
    title: "Go POS Playground",
    category: "internal-tools",
    categoryName: "Internal Tools",
    description: "Sistem point of sale dan operasional koperasi end-to-end untuk mengelola penjualan, pembelian, stok, piutang, dan master data melalui satu workflow terintegrasi.",
    role: "Full-stack Developer (Personal Project)",
    techStack: ["Go", "net/http", "Nuxt", "PostgreSQL", "JWT", "Playwright"],
    features: [
      "Mengimplementasikan transaksi penjualan dan pembelian dengan perubahan stok atomik, histori, pembatalan, serta pembayaran piutang.",
      "Membangun autentikasi JWT, refresh-token rotation, pencabutan session, dan RBAC untuk admin, cashier, serta viewer.",
      "Menambahkan import/export Excel, laporan PDF, audit log, soft delete, dan automated authorization regression tests."
    ],
    impact: "Menjadi playground operasional end-to-end untuk mempraktikkan layered architecture, transaksi database, keamanan session, dan pengujian otorisasi.",
    status: "Aktif dikembangkan",
    primaryTech: "Go + Nuxt",
    repositoryUrl: "https://github.com/haritsAchmad/go-pos-playground",
    colorClass: "glow-modern",
    badgeColor: "#6366F1"
    ,en: {
      description: "An end-to-end point-of-sale and cooperative operations system that connects sales, purchasing, inventory, receivables, and master data in one workflow.",
      role: "Full-stack Developer · Personal Project",
      features: ["Implemented sales and purchasing transactions with atomic stock updates, history, cancellation, and receivable payments.", "Built JWT authentication, refresh-token rotation, session revocation, and RBAC for admin, cashier, and viewer roles.", "Added Excel import/export, PDF reports, audit logs, soft deletion, and automated authorization regression tests."],
      impact: "An end-to-end engineering playground for layered architecture, database transactions, session security, and authorization testing.",
      status: "Actively developed"
    }
  },
  {
    id: 2,
    title: "Go AI Playground",
    category: "ai-experimentation",
    categoryName: "AI Experimentation",
    description: "Aplikasi eksperimen AI lokal untuk mengeksplorasi integrasi model, pengelolaan konteks percakapan, dan workflow berbantuan AI melalui Ollama.",
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
    ,en: {
      description: "A local AI application for exploring model integration, conversation context, and AI-assisted workflows through Ollama.",
      role: "Full-stack Developer · Personal Project",
      features: ["Integrated the application with locally hosted AI models through Ollama.", "Explored request handling, response streaming, conversation context, and user experience.", "Used AI-assisted development for debugging, solution exploration, and technical documentation."],
      impact: "Deepened my understanding of application-level AI integration while keeping the experiments private and locally runnable.",
      status: "Actively developed · Private repository"
    }
  },
  {
    id: 3,
    title: "Recruitment Management System",
    category: "internal-tools",
    categoryName: "Internal Tools",
    description: "Sistem rekrutmen internal yang memusatkan administrasi kandidat, penilaian, wawancara, dan pengambilan keputusan dalam alur kerja berbasis peran.",
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
    ,en: {
      description: "An internal recruitment system that centralizes candidate administration, assessments, interviews, and hiring decisions in a role-based workflow.",
      role: "Full-stack Developer · Professional Project",
      features: ["Translated recruitment requirements into role-based modules and application workflows.", "Developed backend endpoints, search, filtering, and selection-status management.", "Built interfaces that help internal users monitor and manage recruitment stages."],
      impact: "Designed to reduce manual administration and make recruitment stages easier to monitor consistently.",
      status: "In development · Source code confidential"
    }
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
    ,en: {
      description: "Development and maintenance of internal HR information-system modules supporting job analysis, performance records, and organizational structures.",
      role: "Module Developer · Professional Project",
      features: ["Developed a job-analysis instrument for position mapping and workload analysis.", "Built and maintained monitoring, reporting, and employee-data management features.", "Adapted features to internal-user requirements and the constraints of a legacy codebase."],
      impact: "Supports the digitalization of HR administration through centralized and traceable internal workflows.",
      status: "Professional project · Source code confidential"
    }
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
    ,en: {
      description: "A collection of internal tools supporting employee self-service, cooperative administration, attendance synchronization, data updates, and PDF generation.",
      role: "IT Programmer Intern · Professional Project",
      features: ["Designed and developed a cooperative management system using Angular and a PHP/Lumen API.", "Developed employee-data updates and attendance synchronization for a self-service module.", "Implemented dynamic PDF generation and prepared a compatible local development environment."],
      impact: "Helped reduce manual administration and consolidate several employee-service workflows into internal applications.",
      status: "Completed · Professional project"
    }
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
    ,en: {
      description: "A laboratory equipment and materials inventory system for tracking stock, borrowing activity, history, and asset availability.",
      role: "Web Developer Intern · Professional Project",
      features: ["Built equipment, materials, stock, and borrowing management features.", "Adapted application workflows to laboratory inventory requirements.", "Added history and availability records to make assets easier to trace."],
      impact: "Digitalized laboratory inventory records and improved access to asset information.",
      status: "Completed · Professional project"
    }
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
    ,en: {
      description: "An interactive directory and mapping platform for fisheries SMEs and locally processed fish products.",
      role: "Lead Developer · Academic Project",
      features: ["Integrated Leaflet.js with dynamic markers based on location coordinates.", "Built product CRUD features and partner-profile management.", "Developed search, reviews, ratings, and map-based data filtering."],
      impact: "Presented local SME and product information through a map-based discovery experience.",
      status: "Completed · Academic project"
    }
  }
];
