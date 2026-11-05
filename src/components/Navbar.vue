<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "../i18n";
import { useCv } from "../useCv";

const { locale, setLocale, t } = useI18n();
const { cvUrl, cvFilename } = useCv();

const links = [
  { href: "#hero", key: "nav.home" },
  { href: "#projects", key: "nav.projects" },
  { href: "#services", key: "nav.services" },
  { href: "#about", key: "nav.experience" },
  { href: "#certifications", key: "nav.certifications" },
  { href: "#contact", key: "nav.contact" }
];

// The mobile menu replaces the links hidden below 960px.
const menuOpen = ref(false);
const menuButton = ref(null);
const mobileQuery = typeof window !== "undefined" ? window.matchMedia("(max-width: 960px)") : null;

const closeMenu = ({ restoreFocus = false } = {}) => {
  if (!menuOpen.value) return;
  menuOpen.value = false;
  if (restoreFocus) nextTick(() => menuButton.value?.focus());
};

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

const onKeydown = (event) => {
  if (event.key === "Escape") closeMenu({ restoreFocus: true });
};

const onViewportChange = (event) => {
  if (!event.matches) closeMenu();
};

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
  mobileQuery?.addEventListener("change", onViewportChange);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
  mobileQuery?.removeEventListener("change", onViewportChange);
});
</script>

<template>
  <nav class="navbar glass" :aria-label="t('nav.main')">
    <div class="container nav-container">
      <div class="nav-brand">
        <span class="brand-dot" aria-hidden="true"></span>
        <span class="brand-text">Harits.Dev</span>
      </div>
      <div class="nav-links">
        <a v-for="link in links" :key="link.href" :href="link.href" class="nav-link">{{ t(link.key) }}</a>
        <div class="language-switch" role="group" :aria-label="t('nav.language')">
          <button type="button" :class="{ active: locale === 'en' }" :aria-pressed="locale === 'en'" @click="setLocale('en')">EN</button>
          <button type="button" :class="{ active: locale === 'id' }" :aria-pressed="locale === 'id'" @click="setLocale('id')">ID</button>
        </div>
        <a :href="cvUrl" :download="cvFilename" class="btn-cv glass">{{ t("nav.cv") }}</a>
        <button
          ref="menuButton"
          type="button"
          class="menu-toggle"
          aria-controls="mobile-menu"
          :aria-expanded="menuOpen"
          :aria-label="menuOpen ? t('nav.menuClose') : t('nav.menuOpen')"
          @click="toggleMenu"
        >
          <span class="menu-icon" :class="{ open: menuOpen }" aria-hidden="true"></span>
        </button>
      </div>
    </div>
    <div v-show="menuOpen" id="mobile-menu" class="mobile-menu">
      <ul class="container mobile-links">
        <li v-for="link in links" :key="link.href">
          <a :href="link.href" class="mobile-link" @click="closeMenu()">{{ t(link.key) }}</a>
        </li>
        <li>
          <a :href="cvUrl" :download="cvFilename" class="mobile-link mobile-cv" @click="closeMenu()">{{ t("nav.cv") }}</a>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--border-glass);
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.brand-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-modern);
  box-shadow: 0 0 12px var(--color-modern);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.nav-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: var(--transition-smooth);
}

.nav-link:hover {
  color: var(--text-primary);
}

.btn-cv {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 1rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: var(--transition-smooth);
}

.btn-cv:hover {
  background: var(--color-modern);
  border-color: var(--color-modern);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  transform: translateY(-1px);
}

.language-switch {
  display: flex;
  padding: 0.2rem;
  border: 1px solid var(--border-glass);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
}

.language-switch button {
  border: 0;
  border-radius: 5px;
  padding: 0.3rem 0.5rem;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: color 180ms ease, background-color 180ms ease, transform 180ms ease;
}

.language-switch button:hover {
  color: var(--text-primary);
  transform: translateY(-1px);
}

.language-switch button.active {
  color: #fff;
  background: var(--color-modern);
}

.menu-toggle {
  display: none;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-glass);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
}

.menu-icon,
.menu-icon::before,
.menu-icon::after {
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: var(--text-primary);
  transition: transform 180ms ease, background-color 180ms ease;
}

.menu-icon {
  position: relative;
}

.menu-icon::before,
.menu-icon::after {
  content: "";
  position: absolute;
  left: 0;
}

.menu-icon::before { top: -6px; }
.menu-icon::after { top: 6px; }
.menu-icon.open { background: transparent; }
.menu-icon.open::before { transform: translateY(6px) rotate(45deg); }
.menu-icon.open::after { transform: translateY(-6px) rotate(-45deg); }

.mobile-menu {
  border-top: 1px solid var(--border-glass);
  margin-top: 0.85rem;
}

.mobile-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  padding-top: 0.5rem;
  padding-bottom: 0.75rem;
}

.mobile-link {
  display: block;
  padding: 0.75rem 0;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 600;
  border-bottom: 1px solid var(--border-glass);
}

.mobile-link:hover {
  color: var(--text-primary);
}

.mobile-cv {
  border-bottom: 0;
  color: var(--text-primary);
}

@media (max-width: 960px) {
  .nav-links {
    gap: 0.75rem;
  }
  .btn-cv {
    display: none; /* Hide on mobile navbar, hero will show it */
  }
  .nav-link {
    display: none;
  }
  .menu-toggle {
    display: inline-flex;
  }
}

@media (min-width: 961px) {
  .mobile-menu {
    display: none !important;
  }
}
</style>
