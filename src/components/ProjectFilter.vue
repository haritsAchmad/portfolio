<script setup>
defineProps({
  activeFilter: {
    type: String,
    required: true
  }
});

defineEmits(["change-filter"]);

const filters = [
  { value: "all", label: "Semua Proyek" },
  { value: "internal-tools", label: "Internal Tools" },
  { value: "ai-experimentation", label: "AI Experimentation" },
  { value: "business-systems", label: "Business Systems" },
  { value: "legacy-modernization", label: "Legacy Modernization" },
  { value: "gis-public", label: "GIS & Public Web" }
];
</script>

<template>
  <div class="filter-container">
    <button
      v-for="filter in filters"
      :key="filter.value"
      class="filter-btn"
      :class="{ active: activeFilter === filter.value }"
      @click="$emit('change-filter', filter.value)"
    >
      {{ filter.label }}
    </button>
  </div>
</template>

<style scoped>
.filter-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 3rem;
  padding: 0.35rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-glass);
  border-radius: 12px;
  max-width: fit-content;
  margin-left: auto;
  margin-right: auto;
}

.filter-btn {
  background: transparent;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  color: var(--text-secondary);
  font-family: var(--font-main);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.filter-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.03);
}

.filter-btn.active {
  color: #fff;
  background: var(--bg-secondary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid var(--border-glass);
}
</style>