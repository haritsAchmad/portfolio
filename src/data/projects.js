const projectPriority = [
  "Local Agent Playground",
  "naskahCheck",
  "COSMO",
  "ORBIT",
  "SICAKEP",
  "Employee Self-Service & Cooperative Management Tools",
  "SI Inventaris SBRC IPB",
  "Fishee GIS Platform"
];

export const projects = [
  {
    id: 3,
    title: "COSMO",
    category: "internal-tools",
    categoryName: "Internal Tools",
    description: "Sistem Informasi Career Opportunity System and Modern Core untuk administrasi kandidat, wawancara, penilaian, dan keputusan rekrutmen berbasis peran.",
    role: "Development Team Member (Professional Project)",
    techStack: ["Golang", "Gin", "Nuxt", "PostgreSQL", "REST API", "SQL"],
    features: [
      "Berkontribusi pada pengembangan awal COSMO sebagai bagian dari tim.",
      "Membantu mengembangkan endpoint backend, pencarian, filter, dan pengelolaan status proses seleksi.",
      "Berkontribusi pada antarmuka rekrutmen dan penilaian wawancara bersama tim pengembangan."
    ],
    impact: "Ditujukan untuk mengurangi proses manual dan membantu pemantauan tahapan rekrutmen secara lebih terstruktur.",
    status: "Kontribusi selesai Agustus 2026 · Source code tidak dipublikasikan",
    primaryTech: "Go + Nuxt",
    colorClass: "glow-modern",
    badgeColor: "#0EA5E9"
    ,en: {
      description: "Career Opportunity System and Modern Core, an internal system that centralizes candidate administration, interviews, assessments, and hiring decisions in a role-based workflow.",
      role: "Development Team Member · Professional Project",
      features: ["Contributed to the initial development of COSMO as part of the team.", "Helped develop backend endpoints, search, filtering, and selection-status management.", "Contributed to recruitment and interview-assessment interfaces with the development team."],
      impact: "Designed to reduce manual administration and make recruitment stages easier to monitor consistently.",
      status: "Contribution completed August 2026 · Source code confidential"
    }
  },
  {
    id: 4,
    title: "SICAKEP",
    category: "legacy-modernization",
    categoryName: "Legacy Modernization",
    description: "Sistem Informasi Capaian Kinerja Pegawai untuk mendukung pengelolaan capaian kinerja dan digitalisasi workflow SDM.",
    role: "Development Team Member (Professional Project)",
    techStack: ["PHP", "Symfony", "PostgreSQL", "JavaScript"],
    features: [
      "Berkontribusi pada Iterasi 1 dan 2 sebagai bagian dari tim pengembangan.",
      "Mendukung pengelolaan capaian kinerja pegawai dan digitalisasi workflow yang sebelumnya dilakukan secara manual.",
      "Melakukan testing, debugging, dan penyempurnaan fitur secara iteratif berdasarkan kebutuhan serta umpan balik internal."
    ],
    impact: "Mendukung proses pengelolaan capaian kinerja pegawai melalui workflow sistem yang lebih terstruktur.",
    status: "Kontribusi selesai Agustus 2026 · Source code tidak dipublikasikan",
    primaryTech: "PHP + Symfony",
    colorClass: "glow-legacy",
    badgeColor: "#EF4444"
    ,en: {
      description: "Sistem Informasi Capaian Kinerja Pegawai, an HR information system supporting employee-performance achievement management and workflow digitalization.",
      role: "Development Team Member · Professional Project",
      features: ["Contributed to Iterations 1 and 2 as part of the development team.", "Supported employee-performance achievement management and the digitalization of previously manual workflows.", "Performed testing, debugging, and iterative feature improvements based on internal requirements and feedback."],
      impact: "Supports employee-performance achievement management through a more structured system workflow.",
      status: "Contribution completed August 2026 · Source code confidential"
    }
  },
  {
    id: 5,
    title: "ORBIT",
    category: "legacy-modernization",
    categoryName: "Legacy Modernization",
    description: "Sistem Informasi Organization, Role, Business Process and Talent Analytic untuk analisis jabatan, beban kerja, data pegawai, dan workflow organisasi.",
    role: "Developer (Professional Project)",
    techStack: ["PHP 5.3", "Symfony 1", "PostgreSQL 8.3", "JavaScript"],
    features: [
      "Menangani development Iterasi 1 dan 2, sementara kebutuhan, desain, dan pengujian melibatkan kolaborasi internal.",
      "Mengembangkan analisis jabatan dan beban kerja, pengelolaan data pegawai, monitoring, pelaporan, serta workflow organisasi.",
      "Memelihara aplikasi legacy dan menyelesaikan isu produksi terkait business rules, session, serta anomali data."
    ],
    impact: "Mendukung digitalisasi proses organisasi dan SDM sekaligus meningkatkan keterlacakan data serta workflow internal.",
    status: "Kontribusi selesai Agustus 2026 · Source code tidak dipublikasikan",
    primaryTech: "PHP 5.3",
    colorClass: "glow-legacy",
    badgeColor: "#F97316",
    en: {
      description: "Sistem Informasi Organization, Role, Business Process and Talent Analytic for job analysis, workload analysis, employee data, and organizational workflows.",
      role: "Developer · Professional Project",
      features: ["Handled development for Iterations 1 and 2, while requirements, design, and testing involved internal collaboration.", "Developed job and workload analysis, employee-data management, monitoring, reporting, and organizational workflows.", "Maintained the legacy application and resolved production issues involving business rules, sessions, and anomalous data."],
      impact: "Supports the digitalization of organizational and HR processes while improving internal data and workflow traceability.",
      status: "Contribution completed August 2026 · Source code confidential"
    }
  },
  {
    id: 6,
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
    id: 7,
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
    "id": 9,
    "title": "Local Agent Playground",
    "category": "ai-experimentation",
    "categoryName": "AI Experimentation",
    "description": "Coding agent lokal berbasis Go dan Ollama dengan chat streaming melalui CLI maupun web, session persisten, tool registry, dan kontrol approval di dalam workspace.",
    "role": "Software Engineer (Personal Project)",
    "techStack": [
      "Go",
      "Ollama",
      "SQLite",
      "Local LLM",
      "CLI",
      "Security"
    ],
    "features": [
      "Membangun antarmuka CLI dan web lokal dengan chat streaming, session SQLite yang dapat dilanjutkan, serta audit tool call dan keputusan approval.",
      "Membatasi akses ke workspace dan menerapkan preview diff, approval perubahan file, command allowlist tanpa shell, timeout, serta batas langkah dan output.",
      "Mengembangkan registry tool eksternal dan mode hybrid opsional untuk pencarian web serta pembacaan halaman HTTPS dengan approval akses jaringan."
    ],
    "impact": "Mengeksplorasi fondasi coding agent local-first yang berguna sekaligus menjaga kontrol pengguna, keterlacakan, dan batas keamanan yang eksplisit.",
    "status": "MVP · Active development · Private repository",
    "primaryTech": "Go + Ollama",
    "colorClass": "glow-ai",
    "badgeColor": "#A855F7",
    "en": {
      "description": "A Go and Ollama local coding agent with streaming CLI and web chat, persistent sessions, a tool registry, and approval controls within a configured workspace.",
      "role": "Software Engineer · Personal Project",
      "features": [
        "Built CLI and local web interfaces with streaming chat, resumable SQLite sessions, and auditable tool calls and approval decisions.",
        "Enforced workspace boundaries, diff previews, approval for file changes, shell-free command allowlisting, timeouts, and step and output limits.",
        "Developed an external tool registry and an optional hybrid mode for web search and HTTPS page reading with network-access approval."
      ],
      "impact": "Explores a useful local-first coding-agent foundation while preserving user control, traceability, and explicit safety boundaries.",
      "status": "MVP · Active development · Private repository"
    }
  },
  {
    "id": 12,
    "title": "naskahCheck",
    "category": "internal-tools",
    "categoryName": "Document Tools",
    "description": "Aplikasi web lokal untuk meninjau naskah akademik DOCX dan PDF melalui pemeriksaan bahasa, pola kutipan, dan aturan struktur yang dikonfigurasi pengguna.",
    "role": "Software Engineer (Personal Project)",
    "techStack": [
      "Python",
      "Django",
      "SQLite",
      "pdfminer.six",
      "pikepdf",
      "JavaScript"
    ],
    "features": [
      "Membangun upload tervalidasi dan worker antrean dengan ekstraksi DOCX/PDF terisolasi, pembatalan job, serta snapshot aturan dan istilah per pemeriksaan.",
      "Mengembangkan pemeriksaan bahasa mekanis, kandidat typo, pola kutipan APA/IEEE, dan struktur naskah dengan cakupan serta batas penilaian yang ditampilkan kepada pengguna.",
      "Menyediakan tinjauan istilah per kemunculan, pengecualian pengguna, laporan temuan, serta highlight dan komentar pada PDF yang memiliki temuan berlokasi."
    ],
    "impact": "Membantu penulis meninjau naskah dengan temuan yang dapat ditelusuri ke lokasi dan aturan pemeriksaan, sambil mempertahankan keputusan koreksi pada pengguna.",
    "status": "Aktif dikembangkan · Aplikasi lokal",
    "primaryTech": "Python + Django",
    "colorClass": "glow-modern",
    "badgeColor": "#06B6D4",
    "en": {
      "description": "A local web application for reviewing academic DOCX and PDF manuscripts through language checks, citation-pattern screening, and user-configured structural rules.",
      "role": "Software Engineer · Personal Project",
      "features": [
        "Built validated uploads and a queued worker with isolated DOCX/PDF extraction, job cancellation, and per-job snapshots of rules and terms.",
        "Developed mechanical language checks, typo candidates, APA/IEEE citation-pattern screening, and structural checks with visible coverage and assessment limits.",
        "Provided per-occurrence term review, user exclusions, findings reports, and PDF highlights and comments for findings with identifiable locations."
      ],
      "impact": "Helps authors review manuscripts with findings traceable to locations and checking rules while keeping correction decisions in the user's hands.",
      "status": "Actively developed · Local application"
    }
  },
  {
    id: 10,
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
].sort(
  (left, right) =>
    projectPriority.indexOf(left.title) - projectPriority.indexOf(right.title)
);
