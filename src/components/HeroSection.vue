<template>
  <header id="hero" class="hero-section section">
    <div class="container hero-container animate-fade-in">
      <div class="hero-badge glass">
        <span class="pulse-dot"></span>
        Kontrak / Web Programmer at Universitas Indonesia
      </div>
      
      <h1 class="hero-title">
        Building Resilient Systems,<br/>
        From <span class="text-glow legacy">Legacy</span> to <span class="text-glow modern">Modern SPA</span>
      </h1>
      
      <p class="hero-desc">
        Halo! Gw <strong>Harits Achmad Fauzan</strong>, lulusan <strong>Ilmu Komputer Terapan IPB University (IPK 3.54)</strong>. Saat ini gw aktif bekerja sebagai <strong>Web Programmer Kontrak di Universitas Indonesia</strong>. Gw terbiasa menangani spektrum web yang luas: mulai dari memelihara sistem kepegawaian berskala besar <strong>(Symfony 1, PHP 5.3, PostgreSQL 8.3)</strong> hingga merancang portal modern <strong>(Angular, TypeScript, PHP 7.4 API)</strong>.
      </p>

      <div class="hero-actions">
        <a href="#projects" class="btn btn-primary">Lihat Proyek</a>
        <a href="/Harits_Achmad_Fauzan_Resume.pdf" download class="btn btn-secondary btn-cv-mobile">Download CV (PDF)</a>
        <a href="#contact" class="btn btn-secondary">Hubungi Saya</a>
      </div>

      <div class="tech-strip glass">
        <div class="tech-item"><span class="dot legacy"></span> PHP 5.3 / 7.4</div>
        <div class="tech-item"><span class="dot modern"></span> Angular / Vue.js</div>
        <div class="tech-item"><span class="dot symfony"></span> Symfony 1 & Laravel</div>
        <div class="tech-item"><span class="dot pg"></span> PostgreSQL / MySQL</div>
        <div class="tech-item"><span class="dot gis"></span> Leaflet.js GIS</div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hero-section {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 90vh;
  padding-top: 8rem;
  position: relative;
}

.hero-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-public);
  box-shadow: 0 0 8px var(--color-public);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.9); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.6; }
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.04em;
  margin-bottom: 1.5rem;
}

.text-glow {
  position: relative;
  font-weight: 800;
}

.text-glow.legacy {
  color: var(--color-legacy);
  text-shadow: 0 0 30px rgba(239, 68, 68, 0.2);
}

.text-glow.modern {
  color: var(--color-modern);
  text-shadow: 0 0 30px rgba(99, 102, 241, 0.25);
}

.hero-desc {
  font-size: 1.15rem;
  color: var(--text-secondary);
  max-width: 800px;
  margin-bottom: 2.5rem;
  line-height: 1.75;
}

.hero-desc strong {
  color: var(--text-primary);
}

.hero-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 4rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition: var(--transition-smooth);
  cursor: pointer;
}

.btn-primary {
  background-color: var(--color-modern);
  color: #fff;
  border: 1px solid var(--color-modern);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(99, 102, 241, 0.4);
}

.btn-secondary {
  background-color: rgba(255, 255, 255, 0.03);
  color: var(--text-primary);
  border: 1px solid var(--border-glass);
}

.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.btn-cv-mobile {
  display: none; /* Desktop hides it, show on mobile */
}

.tech-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem 2rem;
  padding: 1rem 2rem;
  border-radius: 16px;
  max-width: 900px;
}

.tech-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot.legacy { background-color: var(--color-legacy); }
.dot.modern { background-color: var(--color-modern); }
.dot.symfony { background-color: #f7941e; }
.dot.pg { background-color: #336791; }
.dot.gis { background-color: var(--color-public); }

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.25rem;
  }
  
  .hero-desc {
    font-size: 1rem;
  }
  
  .hero-actions {
    flex-direction: column;
    width: 100%;
    max-width: 320px;
  }
  
  .btn-cv-mobile {
    display: inline-flex;
  }
  
  .tech-strip {
    padding: 1rem;
    gap: 1rem;
  }
}
</style>
