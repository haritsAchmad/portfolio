import { computed, ref } from "vue";

const locale = ref("en");

const messages = {
  en: {
    meta: {
      title: "Harits Achmad Fauzan | Software Developer",
      description: "Harits Achmad Fauzan is a software developer who builds and maintains internal web applications, REST APIs, and database workflows with Go, PHP, and PostgreSQL. Open to full-time roles and independent IT projects."
    },
    nav: {
      home: "Home", projects: "Projects", services: "Services", experience: "Experience", certifications: "Certifications", contact: "Contact", cv: "Download CV",
      main: "Main navigation", menuOpen: "Open navigation menu", menuClose: "Close navigation menu", language: "Language", skip: "Skip to main content"
    },
    hero: {
      badge: "Open to full-time roles & freelance projects",
      titleBefore: "Building",
      titleAccent: "internal systems",
      titleAfter: "that are clear, secure, and reliable.",
      introBefore: "I'm",
      introAfter: "a software developer with professional experience building and maintaining internal tools, REST APIs, and database-driven workflows. My main focus is backend and web development using",
      projects: "View My Work",
      services: "Explore IT Services",
      photoAlt: "Photo of Harits Achmad Fauzan",
      cv: "Download CV (PDF)",
      github: "GitHub"
    },
    projects: {
      title: "Selected Projects",
      subtitle: "A selection of internal tools, backend APIs, business systems, AI experiments, and web applications I have built or contributed to.",
      contribution: "Key contributions",
      result: "Outcome:",
      repository: "View repository",
      kind: { professional: "Professional project", personal: "Personal project", academic: "Academic project" },
      filters: { all: "All Projects", internal: "Internal Tools", ai: "AI Experiments", business: "Business Systems", legacy: "Legacy Modernization", gis: "GIS & Public Web" }
    },
    services: {
      title: "IT Services",
      subtitle: "Independent IT services that I offer and work on personally: building internal applications, maintaining existing ones, and connecting and reporting data.",
      includes: "What this covers",
      evidence: "Related experience",
      limits: "Good to know",
      evidenceHint: "Opens the project card on this page",
      honesty: "I offer these services directly and work on each project independently, on terms we agree on. I do not have a team or a company; if a project needs other specialists, any collaboration is discussed and agreed with you first. The services build on my professional roles and personal projects, not on previous freelance contracts. Professional projects are confidential: I can describe my role, but I do not share their source code, screenshots, or data.",
      ctaTitle: "Have a project in mind?",
      ctaText: "Describe what you need, and I will reply with questions or a proposed scope."
    },
    process: {
      title: "How We Work Together",
      subtitle: "A simple process that keeps scope and progress visible.",
      consultation: "Every project starts with an initial discussion to understand the requirements, technical constraints, and expected outcomes before any commitment is made.",
      note: "Scope, pricing, timelines, and support terms are agreed individually for each project. There are no fixed packages, and support covers only what is agreed: no round-the-clock support or service-level agreement."
    },
    contactOptions: {
      label: "Project inquiry options",
      whatsapp: "Discuss via WhatsApp",
      whatsappHint: "Opens WhatsApp in a new tab with a prefilled message.",
      whatsappMessage: "Hello Harits, I found your portfolio and would like to discuss an IT project. My requirements are: ",
      email: "Contact via Email",
      emailHint: "Opens your email app with a prefilled subject and message.",
      emailSubject: "IT Project Inquiry - Portfolio",
      emailBody: "Hello Harits,\n\nI found your portfolio and would like to discuss an IT project.\n\nWhat I need: \nCurrent situation (existing application, spreadsheets, etc.): \nPreferred timeline: \n\nThank you."
    },
    about: {
      title: "Profile & Experience",
      subtitle: "A summary of my professional experience, education, and technical capabilities in internal systems, APIs, and web development.",
      profile: "Education & Profile",
      bio: "I am a software engineer and backend web developer with professional experience building and maintaining business applications using Go, PHP, Symfony, PostgreSQL, JavaScript, and modern web frameworks. I digitalize business workflows, develop HR information systems, debug production issues, and build maintainable backend solutions.",
      skills: "Core Technical Skills",
      experience: "Professional Experience",
      present: "Present",
      degree: "Bachelor of Applied Computer Science",
      learning: "Learning"
    },
    contact: {
      title: "Contact & Collaboration",
      subtitle: "Open to opportunities and conversations about internal systems, backend APIs, databases, and workflow digitalization.",
      heading: "Let's Connect",
      description: "Reach me by email, phone, or through the professional profiles below.",
      formName: "Name", formEmail: "Email", formMessage: "Message",
      namePlaceholder: "Your name", emailPlaceholder: "email@example.com", messagePlaceholder: "Write your message here...",
      send: "Send Message", sending: "Sending...", success: "Message sent!", successDescription: "Thank you. I will reply to your email as soon as possible.",
      errors: {
        required: "Please fill in all fields.",
        tooLong: "Your message exceeds the allowed length.",
        markup: "HTML, scripts, and JavaScript URLs are not allowed.",
        cooldown: "Please wait 30 seconds before sending another message.",
        failed: "Sorry, something went wrong while sending your message. Please try again or email me directly."
      }
    },
    footer: { rights: "All rights reserved.", built: "Crafted with Vue 3 & Vite" },
    privacy: {
      title: "Privacy",
      analytics: "To understand how this site is used, it records page views: the page path, the domain of the site that linked here (not the full address), your browser's primary language, and whether you are on a phone or a computer. A random ID is kept in your browser only for the current visit, so one visit is not counted twice. This analytics uses no permanent visitor ID, no cookies, and no name or email address.",
      form: "Messages sent through the contact form are delivered to my email by Web3Forms.",
      providers: "The site is hosted on Vercel, which also provides Vercel Web Analytics. Page-view records are stored in a Neon database, and fonts are loaded from Google Fonts. These services receive your IP address as part of normal web requests.",
      retention: "Page-view records are not yet deleted automatically."
    }
  },
  id: {
    meta: {
      title: "Harits Achmad Fauzan | Pengembang Perangkat Lunak",
      description: "Harits Achmad Fauzan adalah pengembang perangkat lunak yang membangun dan memelihara aplikasi web internal, REST API, dan alur kerja database dengan Go, PHP, dan PostgreSQL. Terbuka untuk posisi full-time dan proyek IT independen."
    },
    nav: {
      home: "Beranda", projects: "Proyek", services: "Layanan", experience: "Pengalaman", certifications: "Sertifikasi", contact: "Kontak", cv: "Unduh CV",
      main: "Navigasi utama", menuOpen: "Buka menu navigasi", menuClose: "Tutup menu navigasi", language: "Bahasa", skip: "Lewati ke konten utama"
    },
    hero: {
      badge: "Terbuka untuk posisi full-time & proyek freelance",
      titleBefore: "Membangun",
      titleAccent: "sistem internal",
      titleAfter: "yang jelas, aman, dan dapat diandalkan.",
      introBefore: "Saya",
      introAfter: "software developer dengan pengalaman profesional membangun dan memelihara internal tools, REST API, serta workflow berbasis database. Fokus utama saya adalah backend dan web development menggunakan",
      projects: "Lihat Karya Saya", services: "Jelajahi Layanan IT", photoAlt: "Foto Harits Achmad Fauzan", cv: "Unduh CV (PDF)", github: "GitHub"
    },
    projects: {
      title: "Proyek Pilihan",
      subtitle: "Pilihan internal tools, backend API, sistem bisnis, eksperimen AI, dan aplikasi web yang pernah atau sedang saya kembangkan.",
      contribution: "Kontribusi utama", result: "Hasil:", repository: "Lihat repository",
      kind: { professional: "Proyek profesional", personal: "Proyek pribadi", academic: "Proyek akademik" },
      filters: { all: "Semua Proyek", internal: "Internal Tools", ai: "Eksperimen AI", business: "Sistem Bisnis", legacy: "Modernisasi Legacy", gis: "GIS & Web Publik" }
    },
    services: {
      title: "Layanan IT",
      subtitle: "Layanan IT independen yang saya tawarkan dan kerjakan sendiri: membangun aplikasi internal, memelihara aplikasi yang sudah ada, serta menghubungkan dan melaporkan data.",
      includes: "Cakupan",
      evidence: "Pengalaman terkait",
      limits: "Perlu diketahui",
      evidenceHint: "Membuka kartu proyek di halaman ini",
      honesty: "Saya menawarkan layanan ini secara langsung dan mengerjakan setiap proyek secara independen sesuai kesepakatan. Saya tidak memiliki tim atau perusahaan; bila sebuah proyek membutuhkan keahlian lain, kolaborasi dengan pihak lain dibahas dan disepakati bersama Anda terlebih dahulu. Layanan ini berdasar pada pekerjaan di peran profesional dan proyek pribadi saya, bukan dari kontrak freelance sebelumnya. Proyek profesional bersifat rahasia: saya bisa menjelaskan peran saya, tetapi tidak membagikan source code, tangkapan layar, atau datanya.",
      ctaTitle: "Punya rencana proyek?",
      ctaText: "Ceritakan kebutuhan Anda, dan saya akan membalas dengan pertanyaan atau usulan ruang lingkup."
    },
    process: {
      title: "Cara Kerja Sama",
      subtitle: "Proses sederhana agar ruang lingkup dan progres selalu jelas.",
      consultation: "Setiap proyek dimulai dengan diskusi awal untuk memahami kebutuhan, kendala teknis, dan hasil yang diharapkan sebelum ada komitmen pengerjaan.",
      note: "Ruang lingkup, harga, jadwal, dan ketentuan dukungan disepakati per proyek. Tidak ada paket harga tetap, dan dukungan hanya mencakup yang disepakati: tidak ada dukungan 24 jam atau SLA."
    },
    contactOptions: {
      label: "Pilihan kontak untuk proyek",
      whatsapp: "Diskusi via WhatsApp",
      whatsappHint: "Membuka WhatsApp di tab baru dengan pesan yang sudah terisi.",
      whatsappMessage: "Halo Harits, saya menemukan portofolio Anda dan ingin mendiskusikan proyek IT. Kebutuhan saya adalah: ",
      email: "Hubungi via Email",
      emailHint: "Membuka aplikasi email Anda dengan subjek dan pesan yang sudah terisi.",
      emailSubject: "Diskusi Proyek IT - Portofolio",
      emailBody: "Halo Harits,\n\nSaya menemukan portofolio Anda dan ingin mendiskusikan proyek IT.\n\nKebutuhan saya: \nKondisi saat ini (aplikasi yang sudah ada, spreadsheet, dll.): \nTarget waktu: \n\nTerima kasih."
    },
    about: {
      title: "Profil & Pengalaman",
      subtitle: "Ringkasan pengalaman profesional, pendidikan, dan kemampuan teknis dalam pengembangan sistem internal, API, dan aplikasi web.",
      profile: "Pendidikan & Profil",
      bio: "Saya adalah Software Engineer dan Backend Web Developer dengan pengalaman profesional mengembangkan serta memelihara aplikasi bisnis menggunakan Go, PHP, Symfony, PostgreSQL, JavaScript, dan framework web modern. Saya terbiasa mendigitalisasi alur bisnis, mengembangkan sistem informasi SDM, menangani isu produksi, dan membangun solusi backend yang mudah dipelihara.",
      skills: "Keahlian Teknis Utama", experience: "Pengalaman Kerja", present: "Sekarang", degree: "Sarjana Terapan Ilmu Komputer", learning: "sedang dipelajari"
    },
    contact: {
      title: "Kontak & Kolaborasi",
      subtitle: "Terbuka untuk peluang dan diskusi mengenai sistem internal, backend API, database, dan digitalisasi proses kerja.",
      heading: "Mari Terhubung",
      description: "Hubungi saya melalui email, telepon, atau akun profesional berikut.",
      formName: "Nama", formEmail: "Email", formMessage: "Pesan",
      namePlaceholder: "Nama Anda", emailPlaceholder: "email@contoh.com", messagePlaceholder: "Tulis pesan Anda di sini...",
      send: "Kirim Pesan", sending: "Mengirim...", success: "Pesan Terkirim!", successDescription: "Terima kasih. Saya akan membalas email Anda secepatnya.",
      errors: {
        required: "Semua field wajib diisi.",
        tooLong: "Pesan melebihi batas panjang yang diizinkan.",
        markup: "HTML, script, dan URL JavaScript tidak diizinkan.",
        cooldown: "Mohon tunggu 30 detik sebelum mengirim pesan berikutnya.",
        failed: "Oops! Terjadi gangguan saat mengirim pesan. Coba lagi atau kirim email langsung."
      }
    },
    footer: { rights: "Hak cipta dilindungi.", built: "Dibuat dengan Vue 3 & Vite" },
    privacy: {
      title: "Privasi",
      analytics: "Untuk memahami cara situs ini digunakan, situs mencatat kunjungan halaman: path halaman, domain situs yang menautkan ke sini (bukan alamat lengkapnya), bahasa utama browser Anda, dan apakah Anda memakai ponsel atau komputer. Sebuah ID acak disimpan di browser Anda hanya selama kunjungan ini, agar satu kunjungan tidak terhitung dua kali. Analytics ini tidak memakai ID pengunjung permanen, cookie, maupun nama atau alamat email.",
      form: "Pesan yang dikirim lewat formulir kontak diteruskan ke email saya oleh Web3Forms.",
      providers: "Situs ini di-hosting di Vercel, yang juga menyediakan Vercel Web Analytics. Catatan kunjungan disimpan di database Neon, dan font dimuat dari Google Fonts. Layanan-layanan ini menerima alamat IP Anda sebagai bagian dari permintaan web biasa.",
      retention: "Catatan kunjungan belum dihapus otomatis."
    }
  }
};

// Keeps <html lang>, <title>, and the meta description (all in index.html,
// which holds the English values for crawlers) in step with the active
// language. Only existing elements are updated; nothing is added.
const applyDocumentMeta = (value) => {
  const meta = messages[value].meta;
  document.documentElement.lang = value;
  document.title = meta.title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
};

export const useI18n = () => {
  const t = (path) => path.split(".").reduce((value, key) => value?.[key], messages[locale.value]) ?? path;
  const setLocale = (value) => {
    const nextLocale = value === "id" ? "id" : "en";
    if (nextLocale === locale.value) return;

    const updateLocale = () => {
      locale.value = nextLocale;
      applyDocumentMeta(nextLocale);
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion && document.startViewTransition) {
      document.startViewTransition(updateLocale);
      return;
    }

    if (!reduceMotion) {
      document.documentElement.classList.add("language-changing");
      window.setTimeout(() => document.documentElement.classList.remove("language-changing"), 380);
    }
    updateLocale();
  };

  return { locale: computed(() => locale.value), setLocale, t };
};
