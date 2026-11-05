<script setup>
import { computed } from "vue";
import { useI18n } from "../i18n";
import { processSteps } from "../data/services";

const { locale, t } = useI18n();
const steps = computed(() => processSteps.map((step) => step[locale.value]));
</script>

<template>
  <section id="process" class="section process-section" aria-labelledby="process-title">
    <div class="container">
      <h2 id="process-title" class="section-title">{{ t("process.title") }}</h2>
      <p class="section-subtitle">{{ t("process.subtitle") }}</p>
      <p class="process-consultation glass">{{ t("process.consultation") }}</p>
      <ol class="process-steps">
        <li v-for="(step, index) in steps" :key="index" class="process-step glass">
          <span class="step-number" aria-hidden="true">{{ index + 1 }}</span>
          <h3 class="step-title">{{ step.title }}</h3>
          <p class="step-text">{{ step.text }}</p>
        </li>
      </ol>
      <p class="process-note">{{ t("process.note") }}</p>
    </div>
  </section>
</template>

<style scoped>
.process-section {
  padding-top: 2rem;
}

.process-consultation {
  max-width: 760px;
  margin: -1.5rem auto 2rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  text-align: center;
  color: var(--text-primary);
  font-size: 0.95rem;
  line-height: 1.6;
}

.process-steps {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}

.process-step {
  padding: 1.75rem;
  border-radius: 18px;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-bottom: 1rem;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  font-weight: 800;
}

.step-title {
  font-size: 1.05rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.step-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.process-note {
  max-width: 760px;
  margin: 2rem auto 0;
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
}
</style>
