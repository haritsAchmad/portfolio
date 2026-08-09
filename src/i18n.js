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
      bio: "I am a web developer with professional experience across frontend and backend development using Go, Gin, Nuxt, Vue, PHP, Symfony, PostgreSQL, and REST APIs. I maintain legacy codebases, build new applications, and translate business workflows into practical features for internal users.",
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
      bio: "Saya adalah Web Developer dengan pengalaman profesional mengembangkan frontend dan backend sistem internal menggunakan Go, Gin, Nuxt, Vue, PHP, Symfony, PostgreSQL, dan REST API. Saya terbiasa memelihara codebase legacy, mengembangkan aplikasi baru, serta menerjemahkan kebutuhan dan alur bisnis menjadi fitur yang dapat digunakan oleh pengguna internal.",
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
    locale.value = value === "id" ? "id" : "en";
    document.documentElement.lang = locale.value;
  };

  return { locale: computed(() => locale.value), setLocale, t };
};
