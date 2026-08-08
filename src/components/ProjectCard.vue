<script setup>
defineProps({
  project: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <div class="project-card glass" :class="project.colorClass">
    <div
      class="card-glow"
      :style="{
        background: `radial-gradient(circle at 100% 0%, ${project.badgeColor}15 0%, transparent 60%)`
      }"
    ></div>

    <div class="card-header">
      <div class="header-top">
        <span
          class="badge category-badge"
          :style="{
            color: project.badgeColor,
            border: `1px solid ${project.badgeColor}30`,
            background: `${project.badgeColor}0d`
          }"
        >
          {{ project.categoryName }}
        </span>
        <span class="badge tech-badge">
          {{ project.primaryTech }}
        </span>
      </div>
      <h3 class="project-title">{{ project.title }}</h3>
      <p class="project-role"><strong>{{ project.role }}</strong></p>
      <p v-if="project.status" class="project-status">{{ project.status }}</p>
    </div>

    <div class="card-body">
      <p class="project-desc">{{ project.description }}</p>

      <div class="features-section">
        <h4 class="section-heading">Kontribusi utama</h4>
        <ul class="features-list">
          <li
            v-for="(feature, idx) in project.features"
            :key="idx"
            class="feature-item"
          >
            <span class="check-icon" :style="{ color: project.badgeColor }">✓</span>
            {{ feature }}
          </li>
        </ul>
      </div>

      <div
        class="impact-section"
        :style="{ borderLeft: `2px solid ${project.badgeColor}80` }"
      >
        <p class="impact-text"><strong>Hasil:</strong> {{ project.impact }}</p>
      </div>
    </div>

    <div class="card-footer">
      <div class="tech-tags">
        <span v-for="tech in project.techStack" :key="tech" class="tech-tag">
          {{ tech }}
        </span>
      </div>

      <a
        v-if="project.repositoryUrl"
        class="project-link"
        :href="project.repositoryUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        Lihat repository
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.project-card {
  position: relative;
  border-radius: 20px;
  padding: 2.25rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  transition: var(--transition-smooth);
}

.card-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.project-card:hover {
  transform: translateY(-6px);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
}

.project-card.glow-legacy:hover {
  box-shadow: 0 10px 30px -10px rgba(239, 68, 68, 0.15), 0 12px 30px rgba(0, 0, 0, 0.4);
}

.project-card.glow-modern:hover {
  box-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.2), 0 12px 30px rgba(0, 0, 0, 0.4);
}

.project-card.glow-ai:hover {
  box-shadow: 0 10px 30px -10px rgba(168, 85, 247, 0.2), 0 12px 30px rgba(0, 0, 0, 0.4);
}

.project-card.glow-public:hover {
  box-shadow: 0 10px 30px -10px rgba(16, 185, 129, 0.15), 0 12px 30px rgba(0, 0, 0, 0.4);
}

.card-header {
  position: relative;
  z-index: 1;
  margin-bottom: 1.5rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.tech-badge {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  border: 1px solid var(--border-glass);
  text-align: right;
}

.project-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
  overflow-wrap: anywhere;
}

.project-role,
.project-status {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.project-role strong {
  color: var(--text-primary);
}

.project-status {
  margin-top: 0.45rem;
  color: var(--text-muted);
}

.card-body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex-grow: 1;
  margin-bottom: 2rem;
}

.project-desc {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.features-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-heading {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.features-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.feature-item {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.check-icon {
  font-weight: 900;
  font-size: 0.95rem;
}

.impact-section {
  padding-left: 1rem;
  background: rgba(255, 255, 255, 0.01);
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}

.impact-text {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.card-footer {
  position: relative;
  z-index: 1;
  margin-top: auto;
  border-top: 1px solid var(--border-glass);
  padding-top: 1.5rem;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tech-tag {
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-secondary);
  border: 1px solid var(--border-glass);
}

.project-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  width: fit-content;
  margin-top: 1.25rem;
  color: var(--text-primary);
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  transition: var(--transition-smooth);
}

.project-link:hover {
  opacity: 0.75;
  transform: translateX(2px);
}

@media (max-width: 520px) {
  .project-card {
    padding: 1.5rem;
  }

  .header-top {
    align-items: flex-start;
    flex-direction: column;
  }

  .tech-badge {
    text-align: left;
  }
}
</style>
