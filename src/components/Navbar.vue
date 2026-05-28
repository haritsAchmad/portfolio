<template>
  <nav class="navbar glass">
    <div class="container nav-container">
      <div class="nav-brand">
        <span class="brand-dot"></span>
        <span class="brand-text">Harits.Dev</span>
      </div>
      <div class="nav-links">
        <a href="#hero" class="nav-link">Home</a>
        <a href="#about" class="nav-link">About</a>
        <a href="#projects" class="nav-link">Projects</a>
        <a href="#contact" class="nav-link">Contact</a>
        <a href="/Harits_Achmad_Fauzan_Resume.pdf" download class="btn-cv glass">Download CV</a>
      </div>
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
  gap: 2rem;
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

@media (max-width: 768px) {
  .nav-links {
    gap: 1rem;
  }
  .btn-cv {
    display: none; /* Hide on mobile navbar, hero will show it */
  }
}
</style>
