<script setup>
import { ref, computed } from 'vue';
import { projects } from './data/projects';
import Navbar from './components/Navbar.vue';
import HeroSection from './components/HeroSection.vue';
import ProjectFilter from './components/ProjectFilter.vue';
import ProjectCard from './components/ProjectCard.vue';

const activeFilter = ref('all');

const filteredProjects = computed(() => {
  if (activeFilter.value === 'all') {
    return projects;
  }
  return projects.filter(p => p.category === activeFilter.value);
});

const handleFilterChange = (newFilter) => {
  activeFilter.value = newFilter;
};

// GANTI KUNCI INI dengan Access Key gratis lu dari web3forms.com
const WEB3FORMS_ACCESS_KEY = "YOUR_WEB3FORMS_ACCESS_KEY"; 

// Form state
const contactForm = ref({
  name: '',
  email: '',
  message: ''
});

const formSubmitted = ref(false);
const isSending = ref(false);

const submitForm = async () => {
  if (!contactForm.value.name || !contactForm.value.email) return;
  
  // Jika masih menggunakan placeholder default, jalankan simulasi lokal
  if (WEB3FORMS_ACCESS_KEY === "YOUR_WEB3FORMS_ACCESS_KEY") {
    isSending.value = true;
    setTimeout(() => {
      isSending.value = false;
      formSubmitted.value = true;
      setTimeout(() => {
        formSubmitted.value = false;
        contactForm.value = { name: '', email: '', message: '' };
      }, 4000);
    }, 1000);
    return;
  }

  try {
    isSending.value = true;
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        name: contactForm.value.name,
        email: contactForm.value.email,
        message: contactForm.value.message,
        subject: "Pesan Baru dari Web Portofolio Harits.Dev"
      }),
    });
    
    if (response.ok) {
      formSubmitted.value = true;
      setTimeout(() => {
        formSubmitted.value = false;
        contactForm.value = { name: '', email: '', message: '' };
      }, 4000);
    } else {
      alert("Oops! Terjadi kesalahan saat mengirim pesan ke server.");
    }
  } catch (error) {
    alert("Oops! Terjadi gangguan jaringan saat mengirim pesan.");
  } finally {
    isSending.value = false;
  }
};
</script>

<template>
  <div class="app-wrapper">
    <!-- Background Glows -->
    <div class="glow-orb orb-left"></div>
    <div class="glow-orb orb-right"></div>

    <!-- Navigation -->
    <Navbar />

    <!-- Hero Section -->
    <HeroSection />

    <!-- About & Experience Section -->
    <section id="about" class="section about-section">
      <div class="container animate-fade-in">
        <h2 class="section-title">Tentang Gw & Pengalaman</h2>
        <p class="section-subtitle">
          Sekilas riwayat pendidikan, keahlian teknis, dan perjalanan karir profesional gw di industri pengembangan perangkat lunak.
        </p>

        <div class="about-grid">
          <!-- Left Column: Bio & Skills -->
          <div class="about-bio glass">
            <h3 class="about-card-title">Pendidikan & Profil</h3>
            <p class="bio-text">
              Gw adalah lulusan <strong>Ilmu Komputer Terapan IPB University (IPK 3.54/4.00)</strong> angkatan 2021 - 2025. Memiliki ketertarikan mendalam dalam rekayasa perangkat lunak, pemrograman framework modern, dan optimasi arsitektur modular.
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
                  <span class="skill-tag">PHP (5.3 / 7.4 / 8.2+)</span>
                  <span class="skill-tag">Laravel</span>
                  <span class="skill-tag">Symfony 1</span>
                  <span class="skill-tag">RESTful API</span>
                </div>
              </div>
              <div class="skill-group">
                <span class="skill-group-name">Frontend</span>
                <div class="skill-tags">
                  <span class="skill-tag">Angular (TypeScript)</span>
                  <span class="skill-tag">Vue.js</span>
                  <span class="skill-tag">JavaScript / ES6</span>
                  <span class="skill-tag">HTML5 / CSS3</span>
                </div>
              </div>
              <div class="skill-group">
                <span class="skill-group-name">DevOps & DB</span>
                <div class="skill-tags">
                  <span class="skill-tag">PostgreSQL 8.3</span>
                  <span class="skill-tag">MySQL / MariaDB</span>
                  <span class="skill-tag">Laragon Configuration</span>
                  <span class="skill-tag">Git / SVN</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Career Timeline -->
          <div class="about-experience glass">
            <h3 class="about-card-title">Pengalaman Kerja</h3>
            <div class="timeline">
              <!-- Job 1 -->
              <div class="timeline-item">
                <div class="timeline-marker ui-marker"></div>
                <div class="timeline-content">
                  <span class="job-date">Maret 2026 - Sekarang</span>
                  <h4 class="job-role">Kontrak / Web Programmer</h4>
                  <h5 class="job-company">Universitas Indonesia</h5>
                  <ul class="job-details">
                    <li>Mentransformasikan proses bisnis manual ke format digital terpusat khusus untuk analisis jabatan (Anjab) di UI.</li>
                    <li>Merancang dasbor visualisasi data kinerja pegawai (Sicakep) sebagai alat bantu pengambilan keputusan pimpinan.</li>
                    <li>Membimbing dan melatih staf pegawai UI dalam mengoperasikan proses bisnis digital yang baru.</li>
                  </ul>
                </div>
              </div>

              <!-- Job 2 -->
              <div class="timeline-item">
                <div class="timeline-marker ui-marker"></div>
                <div class="timeline-content">
                  <span class="job-date">September 2025 - Februari 2026</span>
                  <h4 class="job-role">Magang / Web Programmer</h4>
                  <h5 class="job-company">Universitas Indonesia</h5>
                  <ul class="job-details">
                    <li>Mengembangkan modul awal instrumen kuesioner beban kerja berbasis web Symfony 1 & database PostgreSQL 8.3.</li>
                    <li>Melakukan pemeliharaan berkala pada modul database kepegawaian berskala besar.</li>
                  </ul>
                </div>
              </div>

              <!-- Job 3 -->
              <div class="timeline-item">
                <div class="timeline-marker sig-marker"></div>
                <div class="timeline-content">
                  <span class="job-date">Juni 2024 - Februari 2025</span>
                  <h4 class="job-role">Magang / IT Programmer</h4>
                  <h5 class="job-company">PT Saraswanti Indo Genetech (SIG)</h5>
                  <ul class="job-details">
                    <li>Fokus pada pengembangan **modul SMS516** (membangun generator ekspor dokumen PDF dinamis `buat-export-pdf` dan fitur sinkronisasi `self-update-bio-attendance`).</li>
                    <li>Merancang & mengembangkan Sistem Informasi Koperasi Karyawan internal (**Koperasig**) berbasis Angular frontend & PHP API backend.</li>
                    <li>Melakukan konfigurasi server pengembangan lokal (Laragon) agar kompatibel berjalan lancar di PHP 7.4.</li>
                  </ul>
                </div>
              </div>

              <!-- Job 4 -->
              <div class="timeline-item">
                <div class="timeline-marker sbrc-marker"></div>
                <div class="timeline-content">
                  <span class="job-date">Februari 2024 - Mei 2024</span>
                  <h4 class="job-role">Magang / Web Developer</h4>
                  <h5 class="job-company">SBRC IPB University</h5>
                  <ul class="job-details">
                    <li>Merancang & membangun **SI Inventaris SBRC V.1.0.0** menggunakan framework **Laravel** pada environment **PHP 8.2+** & database MySQL.</li>
                    <li>Mendigitalkan pelacakan alat dan bahan laboratorium riset surfaktan guna meminimalkan ketidaksesuaian stok laboratorium.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Projects Section -->
    <section id="projects" class="section">
      <div class="container animate-fade-in">
        <h2 class="section-title">Portofolio Kerja</h2>
        <p class="section-subtitle">
          Pilihan proyek pengembangan perangkat lunak yang pernah gw kerjakan, dari optimasi arsitektur warisan (legacy) hingga aplikasi modern.
        </p>

        <!-- Saringan Proyek -->
        <ProjectFilter 
          :active-filter="activeFilter" 
          @change-filter="handleFilterChange" 
        />

        <!-- Grid Kartu Proyek -->
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

    <!-- Contact Section -->
    <section id="contact" class="section contact-section">
      <div class="container animate-fade-in">
        <h2 class="section-title">Kontak & Kolaborasi</h2>
        <p class="section-subtitle">
          Tertarik untuk berkolaborasi, mendiskusikan optimasi sistem lama, atau integrasi frontend modern? Hubungi gw sekarang!
        </p>

        <div class="contact-grid">
          <div class="contact-info glass">
            <h3 class="info-title">Let's Connect</h3>
            <p class="info-desc">Gw selalu terbuka untuk diskusi teknis seputar web development, optimasi database, atau sekadar bertukar pikiran.</p>
            
            <div class="info-details">
              <div class="info-item">
                <span class="info-icon">✉</span>
                <span class="info-text"><a href="mailto:harits.achmad2003@gmail.com" class="contact-link">harits.achmad2003@gmail.com</a></span>
              </div>
              <div class="info-item">
                <span class="info-icon">📞</span>
                <span class="info-text"><a href="tel:+6281310083944" class="contact-link">+62 813-1008-3944</a></span>
              </div>
              <div class="info-item">
                <span class="info-icon">📍</span>
                <span class="info-text">Bogor & Depok, Jawa Barat</span>
              </div>
            </div>
            
            <div class="social-links">
              <a href="https://github.com/haritsAchmad" target="_blank" rel="noopener noreferrer" class="social-link glass">GitHub</a>
              <a href="https://www.linkedin.com/in/harits-achmad-fauzan-815b5926b/" target="_blank" rel="noopener noreferrer" class="social-link glass">LinkedIn</a>
            </div>
          </div>

          <div class="contact-form-container glass">
            <form v-if="!formSubmitted" @submit.prevent="submitForm" class="contact-form">
              <div class="form-group">
                <label for="name">Nama</label>
                <input type="text" id="name" v-model="contactForm.name" required placeholder="Nama Anda" class="glass-input" />
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" v-model="contactForm.email" required placeholder="email@contoh.com" class="glass-input" />
              </div>
              <div class="form-group">
                <label for="message">Pesan</label>
                <textarea id="message" v-model="contactForm.message" rows="4" placeholder="Tulis pesan Anda di sini..." class="glass-input"></textarea>
              </div>
              <button type="submit" class="submit-btn" :disabled="isSending">
                {{ isSending ? 'Mengirim...' : 'Kirim Pesan' }}
              </button>
            </form>
            
            <div v-else class="success-message">
              <span class="success-icon">✓</span>
              <h3 class="success-title">Pesan Terkirim!</h3>
              <p class="success-desc">Terima kasih atas pesan Anda, gw akan segera membalas email Anda secepatnya.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container footer-content">
        <p class="copyright">&copy; 2026 Harits.Dev. All rights reserved.</p>
        <p class="made-with">Crafted with Vue 3 & Vite</p>
      </div>
    </footer>
  </div>
</template>

<style>
/* Layout Grid Proyek */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 2rem;
  align-items: stretch;
}

/* Transisi Grid Animasi Vue */
.project-grid-enter-active,
.project-grid-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.project-grid-enter-from,
.project-grid-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.97);
}

.project-grid-move {
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

/* About & Experience Section */
.about-grid {
  display: grid;
  grid-template-columns: 1fr 1.25fr;
  gap: 2.5rem;
  align-items: stretch;
  margin-top: 2rem;
}

.about-bio,
.about-experience {
  padding: 2.5rem;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
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

.bio-text strong {
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

.edu-icon {
  font-size: 2rem;
}

.edu-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.edu-uni {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-primary);
}

.edu-degree {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.edu-date {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.skills-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.skills-categories {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.skill-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skill-group-name {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skill-tag {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-glass);
  color: var(--text-secondary);
  border-radius: 6px;
}

/* Timeline Career */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  position: relative;
  border-left: 2px solid var(--border-glass);
  padding-left: 1.5rem;
  margin-left: 0.5rem;
}

.timeline-item {
  position: relative;
}

.timeline-marker {
  position: absolute;
  left: -29px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--bg-primary);
  border: 2px solid var(--text-muted);
}

.timeline-marker.ui-marker { border-color: var(--color-legacy); box-shadow: 0 0 8px var(--color-legacy); }
.timeline-marker.sig-marker { border-color: var(--color-modern); box-shadow: 0 0 8px var(--color-modern); }
.timeline-marker.sbrc-marker { border-color: var(--color-public); box-shadow: 0 0 8px var(--color-public); }

.timeline-content {
  display: flex;
  flex-direction: column;
}

.job-date {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
}

.job-role {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}

.job-company {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.job-details {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.job-details li {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.5;
  position: relative;
  padding-left: 0.85rem;
}

.job-details li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: var(--text-muted);
}

/* Contact Link Styles */
.contact-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: var(--transition-smooth);
}

.contact-link:hover {
  color: var(--color-modern);
}

/* Contact Section Styles */
.contact-section {
  position: relative;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1.25fr;
  gap: 2.5rem;
  max-width: 960px;
  margin: 0 auto;
}

.contact-info,
.contact-form-container {
  padding: 2.5rem;
  border-radius: 20px;
}

.info-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.info-desc {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.info-details {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 2.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.info-icon {
  font-size: 1.25rem;
}

.info-text {
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-link {
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  color: var(--text-secondary);
  transition: var(--transition-smooth);
}

.social-link:hover {
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.04);
}

/* Form Styles */
.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.glass-input {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-glass);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #fff;
  font-family: var(--font-main);
  font-size: 0.95rem;
  transition: var(--transition-smooth);
}

.glass-input:focus {
  outline: none;
  border-color: var(--color-modern);
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.15);
  background: rgba(255, 255, 255, 0.04);
}

.submit-btn {
  background: var(--color-modern);
  color: #fff;
  border: none;
  padding: 0.85rem;
  border-radius: 8px;
  font-weight: 700;
  font-family: var(--font-main);
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.2);
  transition: var(--transition-smooth);
  margin-top: 0.5rem;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
}

/* Success Message */
.success-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  padding: 2rem 0;
}

.success-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-public);
  border: 1px solid rgba(16, 185, 129, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.25rem;
}

.success-title {
  font-size: 1.35rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.success-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  max-width: 320px;
}

/* Footer Styles */
.footer {
  border-top: 1px solid var(--border-glass);
  padding: 2rem 0;
  background: rgba(11, 15, 25, 0.8);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: var(--text-muted);
}

@media (max-width: 868px) {
  .about-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .contact-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .projects-grid {
    grid-template-columns: 1fr;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }
}
</style>
