// IT services offered alongside full-time work. Every evidence entry points to
// an existing project card (projects.js id) and only restates what that card
// already says; the project's own "kind" decides whether it is labeled as
// professional, personal, or academic work, so employment projects are never
// presented as client contracts. Data import/export is not listed because no
// project on this site demonstrates it yet.
// "limits" states what each service needs or excludes, so expectations are
// set before the first discussion.
export const services = [
  {
    key: "web-development",
    en: {
      title: "Web Application Development",
      summary: "Internal web applications that turn manual records and spreadsheets into structured workflows.",
      items: ["Internal business applications", "Inventory and administrative systems", "Web dashboards", "Backend development and REST APIs"],
      limits: "Features are built to the scope agreed at the start. New requests are discussed as changes to that scope."
    },
    id: {
      title: "Pengembangan Aplikasi Web",
      summary: "Aplikasi web internal yang mengubah pencatatan manual dan spreadsheet menjadi alur kerja yang terstruktur.",
      items: ["Aplikasi bisnis internal", "Sistem inventaris dan administrasi", "Dashboard web", "Pengembangan backend dan REST API"],
      limits: "Fitur dikerjakan sesuai ruang lingkup yang disepakati di awal. Permintaan baru dibahas sebagai perubahan ruang lingkup."
    },
    evidence: [
      { project: 7, en: "Laboratory inventory: stock, borrowing, and asset history", id: "Inventaris laboratorium: stok, peminjaman, dan riwayat aset" },
      { project: 6, en: "Cooperative management system with Angular and a PHP/Lumen API", id: "Sistem manajemen koperasi dengan Angular dan API PHP/Lumen" },
      { project: 3, en: "Recruitment system backend and interfaces, as part of a team", id: "Backend dan antarmuka sistem rekrutmen, bersama tim" }
    ]
  },
  {
    key: "maintenance",
    en: {
      title: "Application Maintenance & Troubleshooting",
      summary: "Careful changes to applications that are already in use, including older codebases.",
      items: ["PHP application maintenance", "Legacy application support", "Bug investigation and fixing", "Improvements to existing applications"],
      limits: "Requires access to the source code, any available documentation, and permission from the system owner."
    },
    id: {
      title: "Pemeliharaan & Troubleshooting Aplikasi",
      summary: "Perubahan yang hati-hati pada aplikasi yang sudah dipakai, termasuk codebase lama.",
      items: ["Pemeliharaan aplikasi PHP", "Dukungan aplikasi legacy", "Investigasi dan perbaikan bug", "Penyempurnaan aplikasi yang sudah ada"],
      limits: "Memerlukan akses ke source code, dokumentasi yang tersedia, dan izin dari pemilik sistem."
    },
    evidence: [
      { project: 5, en: "Development and production-issue fixes on a legacy PHP application", id: "Development dan penanganan isu produksi pada aplikasi PHP legacy" },
      { project: 4, en: "Testing, debugging, and iterative improvements as part of a team", id: "Testing, debugging, dan penyempurnaan bertahap bersama tim" }
    ]
  },
  {
    key: "database-api",
    en: {
      title: "Database & API Integration",
      summary: "Databases and APIs that keep application data consistent and connected.",
      items: ["PostgreSQL and MySQL", "REST API development and integration", "SQL queries and database schema improvements", "Support for schema and data migrations, planned and tested step by step"],
      limits: "Migrations start with a review of the database structure and dependencies and a verified backup. API integration depends on available documentation, credentials, and access permission."
    },
    id: {
      title: "Integrasi Database & API",
      summary: "Database dan API yang menjaga data aplikasi tetap konsisten dan terhubung.",
      items: ["PostgreSQL dan MySQL", "Pengembangan dan integrasi REST API", "Query SQL dan perbaikan skema database", "Dukungan migrasi skema dan data, direncanakan dan diuji bertahap"],
      limits: "Migrasi diawali pemeriksaan struktur dan dependensi database serta backup yang sudah diverifikasi. Integrasi API bergantung pada dokumentasi, kredensial, dan izin akses yang tersedia."
    },
    evidence: [
      { project: 3, en: "Backend endpoints, search, and filtering with Go, Gin, and PostgreSQL", id: "Endpoint backend, pencarian, dan filter dengan Go, Gin, dan PostgreSQL" },
      { project: 6, en: "REST API with PHP/Lumen and MySQL", id: "REST API dengan PHP/Lumen dan MySQL" }
    ]
  },
  {
    key: "reporting",
    en: {
      title: "Reporting & Data Processing",
      summary: "Turning application data into reports and documents people can use.",
      items: ["Business reporting", "SQL-based data processing", "Report and PDF document generation"],
      limits: "Covers the report formats and data sources agreed in the scope, using the tools I already work with."
    },
    id: {
      title: "Pelaporan & Pengolahan Data",
      summary: "Mengolah data aplikasi menjadi laporan dan dokumen yang bisa langsung dipakai.",
      items: ["Pelaporan bisnis", "Pengolahan data berbasis SQL", "Pembuatan laporan dan dokumen PDF"],
      limits: "Mencakup format laporan dan sumber data yang disepakati dalam ruang lingkup, menggunakan tools yang sudah saya kuasai."
    },
    evidence: [
      { project: 5, en: "Monitoring and reporting for organizational and HR data", id: "Monitoring dan pelaporan data organisasi dan SDM" },
      { project: 6, en: "Dynamic PDF document generation", id: "Pembuatan dokumen PDF dinamis" }
    ]
  }
];

export const processSteps = [
  {
    en: { title: "Discuss Requirements", text: "We talk through the problem, who will use the application, and what already exists." },
    id: { title: "Diskusi Kebutuhan", text: "Kita membahas masalahnya, siapa yang akan memakai aplikasi, dan apa yang sudah ada." }
  },
  {
    en: { title: "Define Scope & Estimate", text: "I propose a written scope with an estimate, and we agree on pricing and timeline before work starts." },
    id: { title: "Ruang Lingkup & Estimasi", text: "Saya mengusulkan ruang lingkup tertulis beserta estimasi, lalu harga dan jadwal disepakati sebelum pekerjaan dimulai." }
  },
  {
    en: { title: "Development & Progress Review", text: "Work is delivered in stages, with demos so you can review progress and adjust priorities." },
    id: { title: "Pengembangan & Review Progres", text: "Pekerjaan dikirim bertahap, dengan demo agar Anda bisa meninjau progres dan menyesuaikan prioritas." }
  },
  {
    en: { title: "Delivery & Support", text: "The application and its documentation are handed over. Any support period is agreed separately." },
    id: { title: "Serah Terima & Dukungan", text: "Aplikasi dan dokumentasinya diserahterimakan. Masa dukungan, bila ada, disepakati terpisah." }
  }
];
