import { computed, ref } from "vue";

const locale = ref("en");

const messages = {
  en: {
    nav: { home: "Home", projects: "Projects", experience: "Experience", contact: "Contact", cv: "Download CV" },
    hero: {
      badge: "Web Programmer · Backend & Web Development",
      titleBefore: "Building",
      titleAccent: "internal systems",
      titleAfter: "that are clear, secure, and reliable.",
      introBefore: "I'm",
      introAfter: "a software developer with professional experience building and maintaining internal tools, REST APIs, and database-driven workflows. My main focus is backend and web development using",
      projects: "View Selected Projects",
      cv: "Download CV (PDF)",
      github: "GitHub"
    },
    projects: {
      title: "Selected Projects",
      subtitle: "A selection of internal tools, backend APIs, business systems, AI experiments, and web applications I have built or contributed to.",
      contribution: "Key contributions",
      result: "Outcome:",
      repository: "View repository",
      filters: { all: "All Projects", internal: "Internal Tools", ai: "AI Experiments", business: "Business Systems", legacy: "Legacy Modernization", gis: "GIS & Public Web" }
    },
    about: {
      title: "Profile & Experience",
      subtitle: "A summary of my professional experience, education, and technical capabilities in internal systems, APIs, and web development.",
      profile: "Education & Profile",
      bio: "I am a software engineer and backend web developer with professional experience building and maintaining business applications using Go, PHP, Symfony, PostgreSQL, JavaScript, and modern web frameworks. I digitalize business workflows, develop HR information systems, debug production issues, and build maintainable backend solutions.",
      skills: "Core Technical Skills",
      experience: "Professional Experience",
      present: "Present"
    },
    contact: {
      title: "Contact & Collaboration",
      subtitle: "Open to opportunities and conversations about internal systems, backend APIs, databases, and workflow digitalization.",
      heading: "Let's Connect",
      description: "Reach me by email, phone, or through the professional profiles below.",
      formName: "Name", formEmail: "Email", formMessage: "Message",
      namePlaceholder: "Your name", messagePlaceholder: "Write your message here...",
      send: "Send Message", sending: "Sending...", success: "Message sent!", successDescription: "Thank you. I will reply to your email as soon as possible."
    }
  },
  id: {
    nav: { home: "Beranda", projects: "Proyek", experience: "Pengalaman", contact: "Kontak", cv: "Unduh CV" },
    hero: {
      badge: "Web Programmer · Backend & Web Development",
      titleBefore: "Membangun",
      titleAccent: "sistem internal",
      titleAfter: "yang jelas, aman, dan dapat diandalkan.",
      introBefore: "Saya",
      introAfter: "software developer dengan pengalaman profesional membangun dan memelihara internal tools, REST API, serta workflow berbasis database. Fokus utama saya adalah backend dan web development menggunakan",
      projects: "Lihat Proyek Pilihan", cv: "Unduh CV (PDF)", github: "GitHub"
    },
    projects: {
      title: "Proyek Pilihan",
      subtitle: "Pilihan internal tools, backend API, sistem bisnis, eksperimen AI, dan aplikasi web yang pernah atau sedang saya kembangkan.",
      contribution: "Kontribusi utama", result: "Hasil:", repository: "Lihat repository",
      filters: { all: "Semua Proyek", internal: "Internal Tools", ai: "Eksperimen AI", business: "Sistem Bisnis", legacy: "Modernisasi Legacy", gis: "GIS & Web Publik" }
    },
    about: {
      title: "Profil & Pengalaman",
      subtitle: "Ringkasan pengalaman profesional, pendidikan, dan kemampuan teknis dalam pengembangan sistem internal, API, dan aplikasi web.",
      profile: "Pendidikan & Profil",
      bio: "Saya adalah Software Engineer dan Backend Web Developer dengan pengalaman profesional mengembangkan serta memelihara aplikasi bisnis menggunakan Go, PHP, Symfony, PostgreSQL, JavaScript, dan framework web modern. Saya terbiasa mendigitalisasi alur bisnis, mengembangkan sistem informasi SDM, menangani isu produksi, dan membangun solusi backend yang mudah dipelihara.",
      skills: "Keahlian Teknis Utama", experience: "Pengalaman Kerja", present: "Sekarang"
    },
    contact: {
      title: "Kontak & Kolaborasi",
      subtitle: "Terbuka untuk peluang dan diskusi mengenai sistem internal, backend API, database, dan digitalisasi proses kerja.",
      heading: "Mari Terhubung",
      description: "Hubungi saya melalui email, telepon, atau akun profesional berikut.",
      formName: "Nama", formEmail: "Email", formMessage: "Pesan",
      namePlaceholder: "Nama Anda", messagePlaceholder: "Tulis pesan Anda di sini...",
      send: "Kirim Pesan", sending: "Mengirim...", success: "Pesan terkirim!", successDescription: "Terima kasih. Saya akan membalas email Anda secepatnya."
    }
  }
};

export const useI18n = () => {
  const t = (path) => path.split(".").reduce((value, key) => value?.[key], messages[locale.value]) ?? path;
  const setLocale = (value) => {
    const nextLocale = value === "id" ? "id" : "en";
    if (nextLocale === locale.value) return;

    const updateLocale = () => {
      locale.value = nextLocale;
      document.documentElement.lang = nextLocale;
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
