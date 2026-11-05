<script setup>
import { computed } from "vue";
import { useI18n } from "../i18n";
import { mailtoUrl, whatsappUrl } from "../contactLinks";

// Rendered in more than one section, so hint IDs take a prefix.
const props = defineProps({
  idPrefix: { type: String, required: true }
});

const { t } = useI18n();
const whatsappHref = computed(() => whatsappUrl(t("contactOptions.whatsappMessage")));
const emailHref = computed(() => mailtoUrl(t("contactOptions.emailSubject"), t("contactOptions.emailBody")));
const hintId = (name) => `${props.idPrefix}-${name}-hint`;
</script>

<template>
  <div class="contact-options" role="group" :aria-label="t('contactOptions.label')">
    <div class="contact-option">
      <a
        :href="whatsappHref"
        class="option-btn option-primary"
        target="_blank"
        rel="noopener noreferrer"
        data-contact="whatsapp"
        :aria-describedby="hintId('whatsapp')"
      >
        {{ t("contactOptions.whatsapp") }}
        <span aria-hidden="true">↗</span>
      </a>
      <p :id="hintId('whatsapp')" class="option-hint">{{ t("contactOptions.whatsappHint") }}</p>
    </div>
    <div class="contact-option">
      <a :href="emailHref" class="option-btn option-secondary" data-contact="email" :aria-describedby="hintId('email')">
        {{ t("contactOptions.email") }}
      </a>
      <p :id="hintId('email')" class="option-hint">{{ t("contactOptions.emailHint") }}</p>
    </div>
  </div>
</template>

<style scoped>
.contact-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.contact-option {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 48px;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
  transition: var(--transition-smooth);
}

.option-primary {
  background-color: var(--color-modern);
  color: #fff;
  border: 1px solid var(--color-modern);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
}

.option-secondary {
  background-color: rgba(255, 255, 255, 0.03);
  color: var(--text-primary);
  border: 1px solid var(--border-glass);
}

.option-btn:hover {
  transform: translateY(-2px);
}

.option-secondary:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.option-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.5;
}
</style>
