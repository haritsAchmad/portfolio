<script setup>
import { ref, computed } from "vue";
import { projects } from "./data/projects";
import Navbar from "./components/Navbar.vue";
import HeroSection from "./components/HeroSection.vue";
import ProjectFilter from "./components/ProjectFilter.vue";
import ProjectCard from "./components/ProjectCard.vue";

const activeFilter = ref("all");

const filteredProjects = computed(() => {
  if (activeFilter.value === "all") return projects;
  return projects.filter((project) => project.category === activeFilter.value);
});

const handleFilterChange = (newFilter) => {
  activeFilter.value = newFilter;
};

const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

const contactForm = ref({ name: "", email: "", message: "" });
const formSubmitted = ref(false);
const isSending = ref(false);

const submitForm = async () => {
  if (!contactForm.value.name || !contactForm.value.email) return;

  try {
    if (!WEB3FORMS_ACCESS_KEY) {
      throw new Error("VITE_WEB3FORMS_ACCESS_KEY belum dikonfigurasi");
    }

    isSending.value = true;
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        name: contactForm.value.name,
        email: contactForm.value.email,
        message: contactForm.value.message,
        subject: "Pesan Baru dari Web Portofolio Harits.Dev"
      })
    });

    if (!response.ok) throw new Error("Gagal mengirim pesan");

    formSubmitted.value = true;
    contactForm.value = { name: "", email: "", message: "" };
    setTimeout(() => {
      formSubmitted.value = false;
    }, 4000);
  } catch (error) {
    alert("Oops! Terjadi gangguan saat mengirim pesan.");
  } finally {
    isSending.value = false;
  }
};
</script>

<template>
  <div class="app-wrapper">
    <div class="glow-orb orb-left"></div>
    <div class="glow-orb orb-right"></div>

    <Navbar />
    <HeroSection />

    <section id="about" class="section about-section">
      <div class="container animate-fade-in">
        <h2 class="section-title">Profil & Pengalaman</h2>
        <p class="section-subtitle">
          Ringkasan pendidikan, keahlian teknis, dan pengalaman profesional dalam
          pengembangan sistem internal, API, dan aplikasi web.
        </p>

        <div class="about-grid">
          <div class="about-bio glass">
            <h3 class="about-card-title">Pendidikan & Profil</h3>
            <p class="bio-text">
              Saya adalah Web Developer dengan pengalaman profesional mengembangkan frontend dan backend sistem internal menggunakan Go, Gin, Nuxt, Vue, PHP, Symfony, PostgreSQL, dan REST API. Saya terbiasa memelihara codebase legacy, mengembangkan aplikasi baru, serta menerjemahkan kebutuhan dan alur bisnis menjadi fitur yang dapat digunakan oleh pengguna internal.
            </p>

            <div class="edu-badge glass">
              <span class="edu-icon">🎓</span>
              <div class="edu-info">
                <span class="edu-uni">IPB University</span>
                <span class="edu-degree">Bachelor of Applied Computer Science</span>
                <span class="edu-date">Agustus 2021 - Oktober 2025 (IPK 3.54)</span>
              </div>
            </div>

            <h4 class="skills-title">Keahlian Teknis Utama:</h4>
            <div class="skills-categories">
              <div class="skill-group">
                <span class="skill-group-name">Backend</span>
                <div class="skill-tags">
                  <span class="skill-tag">Go</span>
                  <span class="skill-tag">Gin</span>
                  <span class="skill-tag">PHP</span>
                  <span class="skill-tag">Symfony 1</span>
                  <span class="skill-tag">Laravel / Lumen</span>
                  <span class="skill-tag">REST API</span>
                  <span class="skill-tag">SQL</span>
                </div>
              </div>

              <div class="skill-group">
                <span class="skill-group-name">Frontend</span>
                <div class="skill-tags">
                  <span class="skill-tag">Nuxt</span>
                  <span class="skill-tag">Vue.js</span>
                  <span class="skill-tag">Angular</span>
                  <span class="skill-tag">JavaScript</span>
                  <span class="skill-tag">TypeScript</span>
                  <span class="skill-tag">Tailwind CSS</span>
                  <span class="skill-tag">HTML / CSS</span>
                </div>
              </div>

              <div class="skill-group">
                <span class="skill-group-name">Database & Tools</span>
                <div class="skill-tags">
                  <span class="skill-tag">PostgreSQL</span>
                  <span class="skill-tag">MySQL / MariaDB</span>
                  <span class="skill-tag">Git</span>
                  <span class="skill-tag">Postman</span>
                  <span class="skill-tag">Docker (Learning)</span>
                  <span class="skill-tag">Ollama</span>
                </div>
              </div>

              <div class="skill-group">
                <span class="skill-group-name">Engineering Concepts</span>
                <div class="skill-tags">
                  <span class="skill-tag">MVC</span>
                  <span class="skill-tag">RBAC</span>
                  <span class="skill-tag">Repository Pattern</span>
                  <span class="skill-tag">Clean Architecture</span>
                  <span class="skill-tag">AI-assisted Development</span>
                </div>
              </div>
            </div>
          </div>

          <div class="about-experience glass">
            <h3 class="about-card-title">Pengalaman Kerja</h3>
            <div class="timeline">
              <div class="timeline-item">
                <div class="timeline-marker ui-marker"></div>
                <div class="timeline-content">
                  <span class="job-date">Maret 2026 - Sekarang</span>
                  <h4 class="job-role">Web Programmer (Contract)</h4>
                  <h5 class="job-company">Universitas Indonesia</h5>
                  <ul class="job-details">
                    <li>Mengembangkan dan memelihara frontend serta backend sistem internal menggunakan Go, Gin, Nuxt, Vue, PHP, Symfony 1, PostgreSQL, dan JavaScript.</li>
                    <li>Mengimplementasikan fitur monitoring, pelaporan, pengelolaan data, dan penyesuaian alur kerja berdasarkan kebutuhan pengguna internal.</li>
                    <li>Mengembangkan sistem baru menggunakan Go, Gin, Nuxt, Vue, PostgreSQL, dan REST API.</li>
                  </ul>
                </div>
              </div>

              <div class="timeline-item">
                <div class="timeline-marker ui-marker"></div>
                <div class="timeline-content">
                  <span class="job-date">September 2025 - Februari 2026</span>
                  <h4 class="job-role">Web Programmer Intern</h4>
                  <h5 class="job-company">Universitas Indonesia</h5>
                  <ul class="job-details">
                    <li>Mengembangkan modul awal instrumen kuesioner beban kerja berbasis Symfony 1 dan PostgreSQL 8.3.</li>
                    <li>Membantu pemeliharaan modul database kepegawaian dan penyesuaian fitur berdasarkan proses bisnis internal.</li>
                  </ul>
                </div>
              </div>

              <div class="timeline-item">
                <div class="timeline-marker sig-marker"></div>
                <div class="timeline-content">
                  <span class="job-date">Juni 2024 - Februari 2025</span>
                  <h4 class="job-role">IT Programmer Intern</h4>
                  <h5 class="job-company">PT Saraswanti Indo Genetech</h5>
                  <ul class="job-details">
                    <li>Mengembangkan generator PDF dinamis serta fitur pembaruan data dan sinkronisasi presensi mandiri.</li>
                    <li>Merancang dan mengembangkan Sistem Informasi Manajemen Koperasi menggunakan Angular, TypeScript, PHP/Lumen, REST API, dan MySQL.</li>
                    <li>Menyiapkan environment pengembangan lokal agar kompatibel dengan PHP 7.4.</li>
                  </ul>
                </div>
              </div>

              <div class="timeline-item">
                <div class="timeline-marker sbrc-marker"></div>
                <div class="timeline-content">
                  <span class="job-date">Februari 2024 - Juni 2024</span>
                  <h4 class="job-role">Web Developer Intern</h4>
                  <h5 class="job-company">SBRC IPB University</h5>
                  <ul class="job-details">
                    <li>Membangun sistem inventaris alat dan bahan laboratorium menggunakan Laravel, PHP 8.2+, dan MySQL.</li>
                    <li>Mendigitalkan pencatatan stok, peminjaman, riwayat, dan ketersediaan aset.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="projects" class="section">
      <div class="container animate-fade-in">
        <h2 class="section-title">Portofolio Kerja</h2>
        <p class="section-subtitle">
          Pilihan internal tools, backend API, sistem bisnis, eksperimen AI, dan
          aplikasi web yang pernah atau sedang saya kembangkan.
        </p>

        <ProjectFilter
          :active-filter="activeFilter"
          @change-filter="handleFilterChange"
        />

        <transition-group name="project-grid" tag="div" class="projects-grid">
          <div
            v-for="project in filteredProjects"
            :key="project.id"
            class="grid-item"
          >
            <ProjectCard :project="project" />
          </div>
        </transition-group>
      </div>
    </section>

    <section id="contact" class="section contact-section">
      <div class="container animate-fade-in">
        <h2 class="section-title">Kontak & Kolaborasi</h2>
        <p class="section-subtitle">
          Terbuka untuk diskusi mengenai pengembangan sistem internal, backend API,
          database, dan digitalisasi proses kerja.
        </p>

        <div class="contact-grid">
          <div class="contact-info glass">
            <h3 class="info-title">Let's Connect</h3>
            <p class="info-desc">
              Hubungi saya melalui email, telepon, atau akun profesional berikut.
            </p>

            <div class="info-details">
              <div class="info-item">
                <span class="info-icon">✉</span>
                <a href="mailto:harits.achmad2003@gmail.com" class="contact-link">harits.achmad2003@gmail.com</a>
              </div>
              <div class="info-item">
                <span class="info-icon">📞</span>
                <a href="tel:+6281310083944" class="contact-link">+62 813-1008-3944</a>
              </div>
              <div class="info-item">
                <span class="info-icon">📍</span>
                <span class="info-text">Bogor & Depok, Jawa Barat</span>
              </div>
            </div>

            <div class="social-links">
              <a href="https://github.com/haritsAchmad" target="_blank" rel="noopener noreferrer" class="social-link glass">GitHub</a>
              <a href="https://www.linkedin.com/in/harits-achmad-fauzan-815b5926b/" target="_blank" rel="noopener noreferrer" class="social-link glass">LinkedIn</a>
              <a href="https://www.instagram.com/haritsachmad" target="_blank" rel="noopener noreferrer" class="social-link glass">Instagram · @haritsachmad</a>
            </div>
          </div>

          <div class="contact-form-container glass">
            <form v-if="!formSubmitted" @submit.prevent="submitForm" class="contact-form">
              <div class="form-group">
                <label for="name">Nama</label>
                <input id="name" v-model="contactForm.name" required placeholder="Nama Anda" class="glass-input" />
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input id="email" v-model="contactForm.email" type="email" required placeholder="email@contoh.com" class="glass-input" />
              </div>
              <div class="form-group">
                <label for="message">Pesan</label>
                <textarea id="message" v-model="contactForm.message" rows="4" placeholder="Tulis pesan Anda di sini..." class="glass-input"></textarea>
              </div>
              <button type="submit" class="submit-btn" :disabled="isSending">
                {{ isSending ? "Mengirim..." : "Kirim Pesan" }}
              </button>
            </form>

            <div v-else class="success-message">
              <span class="success-icon">✓</span>
              <h3 class="success-title">Pesan Terkirim!</h3>
              <p class="success-desc">Terima kasih. Saya akan membalas email Anda secepatnya.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="container footer-content">
        <p>&copy; 2026 Harits.Dev. All rights reserved.</p>
        <p>Crafted with Vue 3 & Vite</p>
      </div>
    </footer>
  </div>
</template>

<style>
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  align-items: stretch;
}

.project-grid-enter-active,
.project-grid-leave-active,
.project-grid-move {
  transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.project-grid-enter-from,
.project-grid-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.97);
}

.about-grid {
  display: grid;
  grid-template-columns: 1fr 1.25fr;
  gap: 2.5rem;
  align-items: stretch;
  margin-top: 2rem;
}

.about-bio,
.about-experience,
.contact-info,
.contact-form-container {
  padding: 2.5rem;
  border-radius: 24px;
}

.about-card-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-glass);
  padding-bottom: 0.75rem;
  color: var(--text-primary);
}

.bio-text {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

.bio-text strong,
.edu-uni,
.job-role,
.info-title,
.success-title {
  color: var(--text-primary);
}

.edu-badge {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  align-items: center;
}

.edu-icon { font-size: 2rem; }
.edu-info { display: flex; flex-direction: column; gap: 0.25rem; }
.edu-uni { font-weight: 700; }
.edu-degree { font-size: 0.85rem; color: var(--text-secondary); }
.edu-date { font-size: 0.78rem; color: var(--text-muted); }
.skills-title { font-size: 1.1rem; margin-bottom: 1rem; }
.skills-categories { display: flex; flex-direction: column; gap: 1.25rem; }
.skill-group { display: flex; flex-direction: column; gap: 0.55rem; }
.skill-group-name {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}
.skill-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.skill-tag {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 0.65rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-glass);
  color: var(--text-secondary);
  border-radius: 6px;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  border-left: 2px solid var(--border-glass);
  padding-left: 1.5rem;
  margin-left: 0.5rem;
}
.timeline-item { position: relative; }
.timeline-marker {
  position: absolute;
  left: -29px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--bg-primary);
  border: 2px solid var(--text-muted);
}
.timeline-marker.ui-marker { border-color: var(--color-legacy); box-shadow: 0 0 8px var(--color-legacy); }
.timeline-marker.sig-marker { border-color: var(--color-modern); box-shadow: 0 0 8px var(--color-modern); }
.timeline-marker.sbrc-marker { border-color: var(--color-public); box-shadow: 0 0 8px var(--color-public); }
.timeline-content { display: flex; flex-direction: column; }
.job-date { font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem; }
.job-role { font-size: 1.15rem; font-weight: 700; }
.job-company { font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.75rem; }
.job-details { list-style: none; display: flex; flex-direction: column; gap: 0.45rem; }
.job-details li { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.55; position: relative; padding-left: 0.85rem; }
.job-details li::before { content: "•"; position: absolute; left: 0; color: var(--text-muted); }

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1.25fr;
  gap: 2.5rem;
  max-width: 960px;
  margin: 0 auto;
}
.info-title { font-size: 1.5rem; margin-bottom: 1rem; }
.info-desc { font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 2rem; }
.info-details { display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 2rem; }
.info-item { display: flex; align-items: center; gap: 0.75rem; }
.info-icon { font-size: 1.15rem; }
.info-text,
.contact-link { font-size: 0.95rem; color: var(--text-secondary); text-decoration: none; }
.contact-link:hover { color: var(--color-modern); }
.social-links { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.social-link {
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  color: var(--text-secondary);
}
.social-link:hover { color: var(--text-primary); background: rgba(255, 255, 255, 0.04); }

.contact-form { display: flex; flex-direction: column; gap: 1.25rem; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
.glass-input {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-glass);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #fff;
  font-family: var(--font-main);
  font-size: 0.95rem;
}
.glass-input:focus { outline: none; border-color: var(--color-modern); box-shadow: 0 0 12px rgba(99, 102, 241, 0.15); }
.submit-btn {
  background: var(--color-modern);
  color: #fff;
  border: none;
  padding: 0.85rem;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 0.5rem;
}
.submit-btn:hover { transform: translateY(-1px); }
.submit-btn:disabled { opacity: 0.65; cursor: wait; }
.success-message { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; height: 100%; padding: 2rem 0; }
.success-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(16, 185, 129, 0.1); color: var(--color-public); font-size: 1.5rem; margin-bottom: 1.25rem; }
.success-desc { font-size: 0.9rem; color: var(--text-secondary); }
.footer { border-top: 1px solid var(--border-glass); padding: 2rem 0; background: rgba(11, 15, 25, 0.8); }
.footer-content { display: flex; justify-content: space-between; color: var(--text-muted); font-size: 0.85rem; }

@media (max-width: 868px) {
  .about-grid,
  .contact-grid { grid-template-columns: 1fr; gap: 1.5rem; }
  .projects-grid { grid-template-columns: 1fr; }
  .footer-content { flex-direction: column; gap: 0.75rem; text-align: center; }
}

@media (max-width: 520px) {
  .about-bio,
  .about-experience,
  .contact-info,
  .contact-form-container { padding: 1.5rem; }
}
</style>
