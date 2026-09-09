<script setup>
import { computed } from "vue";
import { useI18n } from "../i18n";
const { locale } = useI18n();
const pdfUrl = encodeURI("/Sertifikat Kompetensi BNSP Software Engineer Harits Achmad Fauzan.pdf");
const copy = computed(() => locale.value === "en" ? {
  title: "Professional Certification", subtitle: "Formal recognition of my software engineering competencies.",
  badge: "BNSP · Certificate of Competence", qualification: "Software Engineer",
  issuer: "Issued by LSP Vokasi IPB on behalf of BNSP.",
  issued: "Issued", date: "29 September 2025", validity: "Validity", duration: "3 years from issue date",
  scope: "Competency areas", skills: ["Software requirements identification & analysis", "Requirements documentation & specifications", "Software structure & user interface design"],
  detail: "Covers 6 competency units, listed in the original certificate.",
  view: "View certificate (PDF)", download: "Download PDF", hint: "Opens in a new tab · 2 pages",
  alt: "BNSP Software Engineer certificate issued to Harits Achmad Fauzan"
} : {
  title: "Sertifikasi Profesional", subtitle: "Pengakuan kompetensi profesional dalam pengembangan perangkat lunak.",
  badge: "BNSP · Sertifikat Kompetensi", qualification: "Pengembang Perangkat Lunak",
  issuer: "Diterbitkan oleh LSP Vokasi IPB atas nama BNSP.",
  issued: "Diterbitkan", date: "29 September 2025", validity: "Masa berlaku", duration: "3 tahun sejak diterbitkan",
  scope: "Bidang kompetensi", skills: ["Identifikasi & analisis kebutuhan perangkat lunak", "Dokumentasi & spesifikasi kebutuhan", "Perancangan struktur perangkat lunak & UI"],
  detail: "Mencakup 6 unit kompetensi yang tercantum pada sertifikat asli.",
  view: "Lihat sertifikat (PDF)", download: "Unduh PDF", hint: "Dibuka di tab baru · 2 halaman",
  alt: "Sertifikat BNSP Software Engineer atas nama Harits Achmad Fauzan"
});
</script>

<template>
  <section id="certifications" class="section" aria-labelledby="certifications-title">
    <div class="container">
      <h2 id="certifications-title" class="section-title">{{ copy.title }}</h2>
      <p class="section-subtitle">{{ copy.subtitle }}</p>
      <article class="certificate-card glass">
        <a class="certificate-preview" :href="pdfUrl" target="_blank" rel="noopener noreferrer" :aria-label="`${copy.view} — ${copy.hint}`">
          <img src="/bnsp-software-engineer-preview.webp" :alt="copy.alt" width="760" height="1073" loading="lazy" decoding="async" />
        </a>
        <div class="certificate-content">
          <p class="certificate-badge">{{ copy.badge }}</p>
          <h3>Software Engineer</h3>
          <p v-if="locale === 'id'" class="certificate-qualification">{{ copy.qualification }}</p>
          <p class="certificate-issuer">{{ copy.issuer }}</p>
          <dl class="certificate-meta">
            <div><dt>{{ copy.issued }}</dt><dd>{{ copy.date }}</dd></div>
            <div><dt>{{ copy.validity }}</dt><dd>{{ copy.duration }}</dd></div>
          </dl>
          <h4>{{ copy.scope }}</h4>
          <ul class="certificate-skills"><li v-for="skill in copy.skills" :key="skill">{{ skill }}</li></ul>
          <p class="certificate-detail">{{ copy.detail }}</p>
          <div class="certificate-actions">
            <a class="certificate-button primary" :href="pdfUrl" target="_blank" rel="noopener noreferrer" aria-describedby="certificate-link-hint">{{ copy.view }} <span aria-hidden="true">↗</span></a>
            <a class="certificate-button" :href="pdfUrl" download>{{ copy.download }} <span aria-hidden="true">↓</span></a>
          </div>
          <p id="certificate-link-hint" class="certificate-detail">{{ copy.hint }}</p>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
#certifications { scroll-margin-top: 90px; }
.certificate-card { display: grid; grid-template-columns: minmax(220px, 320px) minmax(0, 1fr); gap: 3rem; padding: 2.5rem; border-radius: 20px; align-items: center; }
.certificate-preview { display: block; padding: 12px; background: rgba(255,255,255,.04); border: 1px solid var(--border-glass); border-radius: 12px; }
.certificate-preview img { display: block; width: 100%; height: auto; border-radius: 4px; }
.certificate-badge { color: #a5b4fc; font-size: .8rem; font-weight: 700; letter-spacing: .04em; margin-bottom: .75rem; }
.certificate-content h3 { font-size: clamp(1.65rem, 4vw, 2.2rem); line-height: 1.25; }
.certificate-qualification { color: var(--text-secondary); margin-top: .35rem; }
.certificate-issuer { color: var(--text-secondary); margin-top: 1rem; }
.certificate-meta { display: flex; flex-wrap: wrap; gap: 1rem 2rem; padding: 1.25rem 0; margin: 1.25rem 0; border-block: 1px solid var(--border-glass); }
.certificate-meta dt, .certificate-detail { color: var(--text-secondary); font-size: .8rem; }
.certificate-meta dd { margin-top: .3rem; font-size: .9rem; }
.certificate-content h4 { font-size: .9rem; margin-bottom: .6rem; }
.certificate-skills { padding-left: 1.2rem; color: var(--text-secondary); font-size: .9rem; }
.certificate-skills li { margin-bottom: .4rem; }
.certificate-skills li::marker { color: #a5b4fc; }
.certificate-detail { margin-top: .75rem; }
.certificate-actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 1.5rem; }
.certificate-button { display: inline-flex; align-items: center; justify-content: center; gap: .6rem; padding: .75rem 1rem; border: 1px solid var(--border-glass); border-radius: 8px; color: var(--text-primary); text-decoration: none; font-size: .85rem; font-weight: 600; }
.certificate-button.primary { background: var(--color-modern); }
.certificate-button:hover { background: #4338ca; }
.certificate-button:focus-visible, .certificate-preview:focus-visible { outline: 3px solid #a5b4fc; outline-offset: 5px; }
@media (max-width: 720px) {
  .certificate-card { grid-template-columns: 1fr; gap: 1.75rem; padding: 1.5rem; }
  .certificate-preview { max-width: 280px; width: 100%; margin: 0 auto; }
}
@media (max-width: 400px) { .certificate-button { width: 100%; } }
</style>
