<script setup>
import { useI18n } from "../i18n";

const { locale, t } = useI18n();
</script>

<template>
  <header id="hero" class="hero-section section">
    <div class="container hero-wrapper animate-fade-in">
      <div class="hero-content">
        <div class="hero-badge glass">
          <span class="pulse-dot"></span>
          {{ t("hero.badge") }}
        </div>

        <h1 class="hero-title">
          {{ t("hero.titleBefore") }} <span class="text-glow modern">{{ t("hero.titleAccent") }}</span><br />
          {{ t("hero.titleAfter") }}
        </h1>

        <p class="hero-desc">
          {{ t("hero.introBefore") }} <strong>Harits Achmad Fauzan</strong>,
          {{ t("hero.introAfter") }}
          <strong>{{ locale === "en" ? "Go, PHP, Nuxt, Vue, and PostgreSQL" : "Go, PHP, Nuxt, Vue, dan PostgreSQL" }}</strong>.
        </p>

        <div class="hero-actions">
          <a href="#projects" class="btn btn-primary">{{ t("hero.projects") }}</a>
          <a
            href="/Harits_Achmad_Fauzan_Resume.pdf"
            download
            class="btn btn-secondary"
          >
            {{ t("hero.cv") }}
          </a>
          <a href="https://github.com/haritsAchmad" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">{{ t("hero.github") }}</a>
        </div>
      </div>

      <div class="hero-avatar-container">
        <div class="avatar-glow"></div>
        <div class="avatar-frame glass">
          <img
            src="../assets/harits_photo.jpeg"
            alt="Foto Harits Achmad Fauzan"
            class="avatar-img"
          />
        </div>
      </div>
    </div>

    <div class="container tech-strip-container">
      <div class="tech-strip glass animate-fade-in">
        <div class="tech-item"><span class="dot go"></span> Go / PHP</div>
        <div class="tech-item"><span class="dot modern"></span> Nuxt / Vue</div>
        <div class="tech-item"><span class="dot api"></span> REST API</div>
        <div class="tech-item"><span class="dot pg"></span> PostgreSQL / MySQL</div>
        <div class="tech-item"><span class="dot tools"></span> Git & AI-Assisted Development</div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding-top: 8rem;
  padding-bottom: 3rem;
  position: relative;
}

.hero-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4rem;
  margin-bottom: 4rem;
  width: 100%;
}

.hero-content {
  flex: 1.25;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.hero-avatar-container {
  flex: 0.75;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  max-width: 340px;
  width: 100%;
}

.avatar-glow {
  position: absolute;
  width: 120%;
  height: 120%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 60%);
  filter: blur(40px);
  pointer-events: none;
}

.avatar-frame {
  position: relative;
  z-index: 1;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  transition: var(--transition-smooth);
}

.avatar-frame:hover {
  transform: scale(1.03);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 24px 48px rgba(99, 102, 241, 0.2);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 15%;
  transition: var(--transition-smooth);
}

.avatar-frame:hover .avatar-img {
  transform: scale(1.05);
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
  color: var(--text-primary);
}

.text-glow.modern {
  color: var(--color-modern);
  text-shadow: 0 0 30px rgba(99, 102, 241, 0.25);
}

.hero-desc {
  font-size: 1.12rem;
  color: var(--text-secondary);
  margin-bottom: 2.5rem;
  line-height: 1.75;
}

.hero-desc strong {
  color: var(--text-primary);
}

.hero-actions {
  display: flex;
  gap: 1rem;
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

.tech-strip-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.tech-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem 2rem;
  padding: 1.1rem 2rem;
  border-radius: 16px;
  width: 100%;
  max-width: 980px;
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

.dot.go { background-color: #00add8; }
.dot.modern { background-color: var(--color-modern); }
.dot.api { background-color: #f7941e; }
.dot.pg { background-color: #336791; }
.dot.tools { background-color: var(--color-public); }

@media (max-width: 968px) {
  .hero-wrapper {
    flex-direction: column-reverse;
    text-align: center;
    gap: 2.5rem;
    margin-bottom: 3rem;
  }

  .hero-content {
    align-items: center;
    text-align: center;
  }

  .hero-avatar-container {
    max-width: 260px;
  }

  .avatar-frame {
    width: 240px;
    height: 240px;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-desc {
    font-size: 1rem;
  }

  .hero-actions {
    flex-direction: column;
    width: 100%;
    max-width: 320px;
  }

  .tech-strip {
    padding: 1rem;
    gap: 1rem;
  }
}
</style>
