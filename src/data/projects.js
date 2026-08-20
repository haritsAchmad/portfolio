export const projects = [
  {
    id: 1,
    title: "Go POS Playground",
    category: "internal-tools",
    categoryName: "Internal Tools",
    description: "Sistem point of sale dan operasional koperasi end-to-end untuk mengelola penjualan, pembelian, stok, piutang, dan master data melalui satu workflow terintegrasi.",
    role: "Full-stack Developer (Personal Project)",
    techStack: ["Go", "net/http", "Nuxt", "PostgreSQL", "Docker", "Playwright"],
    features: [
      "Mengembangkan transaksi atomik, satuan kemasan/eceran, piutang, serta simulator pembayaran QRIS dengan reservasi stok dan idempotency key.",
      "Membangun autentikasi JWT, refresh-token rotation, session revocation, RBAC, audit log, dan soft delete.",
      "Menambahkan pencarian, filter, sorting, pagination, laporan Excel/PDF, Docker Compose, integration test, dan benchmark PostgreSQL."
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
      features: ["Developed atomic transactions, package and retail units, receivables, and a simulated QRIS payment lifecycle with stock reservation and idempotency keys.", "Built JWT authentication, refresh-token rotation, session revocation, RBAC, audit logs, and soft deletion.", "Added search, filtering, sorting, pagination, Excel/PDF reports, Docker Compose, integration tests, and PostgreSQL benchmarks."],
      impact: "An end-to-end engineering playground for layered architecture, database transactions, payment workflows, security, and automated testing.",
      status: "Actively developed"
    }
  },
  {
    id: 2,
    title: "Go AI Playground",
    category: "ai-experimentation",
    categoryName: "AI Experimentation",
    description: "Playground chat AI lokal berbasis character card dengan backend Go, antarmuka Nuxt, model Ollama, dan penyimpanan percakapan di SQLite.",
    role: "Full-stack Developer (Personal Project)",
    techStack: ["Go", "Nuxt", "Ollama", "SQLite", "NDJSON", "Docker"],
    features: [
      "Mengimplementasikan chat streaming NDJSON, pemilihan model, generation preset, kontrol stop, dan statistik token serta kecepatan.",
      "Membangun character card dan library karakter dengan import/export, tag, pencarian, serta beberapa percakapan per karakter.",
      "Menyimpan state dan history di SQLite dengan cache browser sebagai fallback offline serta menyediakan Docker Compose dan quality checks."
    ],
    impact: "Menjadi laboratorium local-first untuk memahami prompt karakter, streaming model, persistensi percakapan, dan integrasi Ollama end-to-end.",
    status: "Aktif dikembangkan · Repository privat",
    primaryTech: "Go + Ollama",
    colorClass: "glow-ai",
    badgeColor: "#A855F7"
    ,en: {
      description: "A local character-card AI chat playground with a Go backend, Nuxt interface, Ollama models, and SQLite conversation storage.",
      role: "Full-stack Developer · Personal Project",
      features: ["Implemented NDJSON chat streaming, model selection, generation presets, stop controls, and token and speed statistics.", "Built character cards and a character library with import/export, tags, search, and multiple conversations per character.", "Persisted state and history in SQLite with a browser-cache offline fallback, plus Docker Compose and automated quality checks."],
      impact: "A local-first lab for understanding character prompting, model streaming, conversation persistence, and end-to-end Ollama integration.",
      status: "Actively developed · Private repository"
    }
  },
  {
    id: 3,
    title: "COSMO",
    category: "internal-tools",
    categoryName: "Internal Tools",
    description: "Sistem Informasi Career Opportunity System and Modern Core untuk memusatkan administrasi kandidat, wawancara, penilaian, dan keputusan rekrutmen berbasis peran.",
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
      description: "Career Opportunity System and Modern Core, an internal system that centralizes candidate administration, interviews, assessments, and hiring decisions in a role-based workflow.",
      role: "Full-stack Developer · Professional Project",
      features: ["Translated recruitment requirements into role-based modules and application workflows.", "Developed backend endpoints, search, filtering, and selection-status management.", "Built interfaces that help internal users monitor and manage recruitment stages."],
      impact: "Designed to reduce manual administration and make recruitment stages easier to monitor consistently.",
      status: "In development · Source code confidential"
    }
  },
  {
    id: 4,
    title: "SICAKEP & ORBIT",
    category: "legacy-modernization",
    categoryName: "Legacy Modernization",
    description: "Pengembangan dua sistem informasi SDM: SICAKEP untuk capaian kinerja pegawai dan ORBIT untuk organisasi, jabatan, proses bisnis, serta talent analytic.",
    role: "Module Developer",
    techStack: ["PHP 5.3", "Symfony 1", "PostgreSQL 8.3", "SQL", "JavaScript"],
    features: [
      "Berkontribusi pada Iterasi 1 dan 2 SICAKEP untuk pengelolaan capaian kinerja pegawai.",
      "Mengembangkan Iterasi 1 dan 2 ORBIT, mencakup analisis jabatan dan beban kerja, monitoring, pelaporan, serta workflow organisasi.",
      "Memelihara aplikasi legacy dan menangani isu produksi terkait business rules, session, serta data."
    ],
    impact: "Mendukung digitalisasi proses administrasi SDM melalui sistem internal yang lebih terpusat dan mudah ditelusuri.",
    status: "Professional project · Repository privat",
    primaryTech: "PHP 5.3",
    colorClass: "glow-legacy",
    badgeColor: "#EF4444"
    ,en: {
      description: "Development of two HR information systems: SICAKEP for employee-performance achievements and ORBIT for organization, roles, business processes, and talent analytics.",
      role: "Module Developer · Professional Project",
      features: ["Contributed to SICAKEP Iterations 1 and 2 for employee-performance achievement management.", "Developed ORBIT Iterations 1 and 2, covering job and workload analysis, monitoring, reporting, and organizational workflows.", "Maintained the legacy application and resolved production issues involving business rules, sessions, and data."],
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
    title: "DevKit Playground",
    category: "internal-tools",
    categoryName: "Developer Tools",
    description: "Toolbox developer offline-first berbasis Go yang menyediakan utilitas deterministik untuk pekerjaan backend dan inspeksi repository sehari-hari.",
    role: "Software Engineer (Personal Project)",
    techStack: ["Go", "CLI", "JSON", "CI", "Go Test", "GitHub Actions"],
    features: [
      "Membangun utilitas UUID, secret, hashing, inspeksi JWT/JSON, perbandingan env, inspeksi file/repository/text/port, timestamp, dan Base64.",
      "Memisahkan reusable command logic dari presentasi CLI serta menyediakan output manusia dan JSON terstruktur untuk program dan AI agent.",
      "Mendefinisikan command contracts, exit code, pengujian otomatis, CI, dokumentasi arsitektur, dan alur release berversi."
    ],
    impact: "Menyatukan pekerjaan developer yang berulang ke dalam binary Go yang ringan, dapat diaudit, dan tetap berfungsi tanpa jaringan atau runtime tambahan.",
    status: "Early development · Public repository",
    primaryTech: "Go CLI",
    repositoryUrl: "https://github.com/haritsAchmad/devkit-playground",
    colorClass: "glow-modern",
    badgeColor: "#14B8A6",
    en: {
      description: "An offline-first Go developer toolbox offering deterministic utilities for recurring backend and repository-inspection tasks.",
      role: "Software Engineer · Personal Project",
      features: ["Built utilities for UUIDs, secrets, hashing, JWT/JSON inspection, env comparison, file/repository/text/port inspection, timestamps, and Base64.", "Separated reusable command logic from CLI presentation and exposed both human-readable and structured JSON output for programs and AI agents.", "Defined command contracts, exit codes, automated tests, CI, architecture documentation, and a versioned release workflow."],
      impact: "Consolidates recurring developer tasks into a lightweight, auditable Go binary that works without a network or additional runtime dependencies.",
      status: "Early development · Public repository"
    }
  },
  {
    id: 8,
    title: "Local Agent Playground",
    category: "ai-experimentation",
    categoryName: "AI Experimentation",
    description: "Coding agent lokal offline-first berbasis Go dan Ollama dengan tool terdaftar, batas workspace, approval eksplisit, session persisten, dan audit trail.",
    role: "Software Engineer (Personal Project)",
    techStack: ["Go", "Ollama", "SQLite", "Local LLM", "CLI", "Security"],
    features: [
      "Mengembangkan chat streaming dengan session SQLite yang dapat dilanjutkan serta audit tool call dan keputusan approval.",
      "Membatasi filesystem ke satu workspace dan mewajibkan preview diff serta approval sebelum perubahan file dilakukan.",
      "Menerapkan allowlist command tanpa shell, path validation, offline Go module mode, timeout, batas langkah, dan batas output."
    ],
    impact: "Mengeksplorasi fondasi coding agent local-first yang berguna sekaligus menjaga kontrol pengguna, keterlacakan, dan batas keamanan yang eksplisit.",
    status: "MVP · Active development · Private repository",
    primaryTech: "Go + Ollama",
    colorClass: "glow-ai",
    badgeColor: "#A855F7",
    en: {
      description: "An offline-first local coding agent built with Go and Ollama, featuring registered tools, workspace boundaries, explicit approval, persistent sessions, and an audit trail.",
      role: "Software Engineer · Personal Project",
      features: ["Developed streaming chat with resumable SQLite sessions and auditable tool calls and approval decisions.", "Restricted filesystem access to one workspace and required diff previews and explicit approval before modifying files.", "Implemented shell-free command allowlisting, path validation, offline Go module mode, timeouts, step limits, and output limits."],
      impact: "Explores a useful local-first coding-agent foundation while preserving user control, traceability, and explicit safety boundaries.",
      status: "MVP · Active development · Private repository"
    }
  },
  {
    id: 9,
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
