<script setup>
import { computed } from "vue";
import { useI18n } from "../i18n";
import { services } from "../data/services";
import { projects } from "../data/projects";
import ContactOptions from "./ContactOptions.vue";

const emit = defineEmits(["show-project"]);
const { locale, t } = useI18n();

const projectById = new Map(projects.map((project) => [project.id, project]));

const localizedServices = computed(() =>
  services.map((service) => ({
    key: service.key,
    ...service[locale.value],
    evidence: service.evidence.map((item) => {
      const project = projectById.get(item.project);
      return {
        id: item.project,
        title: project.title,
        kind: t(`projects.kind.${project.kind}`),
        note: item[locale.value]
      };
    })
  }))
);
</script>

<template>
  <section id="services" class="section" aria-labelledby="services-title">
    <div class="container">
      <h2 id="services-title" class="section-title">{{ t("services.title") }}</h2>
      <p class="section-subtitle">{{ t("services.subtitle") }}</p>
      <p id="service-evidence-hint" class="visually-hidden">{{ t("services.evidenceHint") }}</p>

      <div class="services-grid">
        <article
          v-for="service in localizedServices"
          :key="service.key"
          class="service-card glass"
          :data-service="service.key"
          :aria-labelledby="`service-${service.key}`"
        >
          <h3 :id="`service-${service.key}`" class="service-title">{{ service.title }}</h3>
          <p class="service-summary">{{ service.summary }}</p>

          <h4 class="service-heading">{{ t("services.includes") }}</h4>
          <ul class="service-items">
            <li v-for="item in service.items" :key="item">{{ item }}</li>
          </ul>
          <p class="service-limits">
            <strong>{{ t("services.limits") }}:</strong> {{ service.limits }}
          </p>

          <h4 class="service-heading">{{ t("services.evidence") }}</h4>
          <ul class="service-evidence">
            <li v-for="item in service.evidence" :key="item.id">
              <a
                :href="`#project-${item.id}`"
                class="evidence-link"
                aria-describedby="service-evidence-hint"
                @click.prevent="emit('show-project', item.id)"
              >{{ item.title }}</a>
              <span class="evidence-kind">{{ item.kind }}</span>
              <span class="evidence-note">{{ item.note }}</span>
            </li>
          </ul>
        </article>
      </div>

      <p class="services-honesty">{{ t("services.honesty") }}</p>

      <div class="services-cta glass">
        <h3 class="cta-title">{{ t("services.ctaTitle") }}</h3>
        <p class="cta-text">{{ t("services.ctaText") }}</p>
        <ContactOptions id-prefix="services" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.service-card {
  display: flex;
  flex-direction: column;
  padding: 2rem;
  border-radius: 20px;
}

.service-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.6rem;
}

.service-summary {
  font-size: 0.92rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1.25rem;
}

.service-heading {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 0.6rem;
}

.service-items,
.service-evidence {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-bottom: 1.25rem;
}

.service-items li {
  position: relative;
  padding-left: 1.1rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.service-items li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: var(--color-public);
}

.service-evidence {
  margin-top: auto;
  margin-bottom: 0;
}

.service-limits {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.55;
  padding: 0.65rem 0.8rem;
  margin-bottom: 1.25rem;
  border-left: 2px solid rgba(165, 180, 252, 0.5);
  background: rgba(99, 102, 241, 0.06);
  border-radius: 0 8px 8px 0;
}

.service-limits strong {
  color: var(--text-primary);
}

.service-evidence li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.6rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border-glass);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
}

.evidence-link {
  font-weight: 700;
  color: #a5b4fc;
  text-decoration: none;
}

.evidence-link:hover {
  text-decoration: underline;
}

.evidence-kind {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
}

.evidence-note {
  flex-basis: 100%;
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.services-honesty {
  max-width: 760px;
  margin: 2rem auto 0;
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.services-cta {
  max-width: 760px;
  margin: 2.5rem auto 0;
  padding: 2rem;
  border-radius: 20px;
  text-align: center;
}

.cta-title {
  font-size: 1.35rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.cta-text {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 520px) {
  .service-card,
  .services-cta {
    padding: 1.5rem;
  }
}
</style>
