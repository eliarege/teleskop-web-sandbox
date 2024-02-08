<script setup lang="ts">
const { t } = useI18n()
const q = useQuasar()
const tab = ref()
const machines = ref([])
const materials = ref([])
watch((tab), async (tab) => {
  if (tab === 'machines') {
    machines.value = await $fetch('/api/dispensers/connections/machines/1')
  } else if (tab === 'materials') {
    materials.value = await $fetch('/api/dispensers/connections/materials/1')
  }
})
</script>

<template>
  <div class="q-pa-md">
    <div class="q-gutter-y-md">
      <QTabs
        v-model="tab"
        class="tabs-border"
        dense
        align="justify"
        :breakpoint="0"
      >
        <QTab
          name="machines" icon="video_label" :label="t('Machines')" no-caps
          :class="tab === 'machines' ? (q.dark.isActive ? 'tabs-dark-active' : 'tabs-light-active') : (q.dark.isActive ? 'tabs-dark' : 'tabs-light')"
        />
        <QSeparator vertical />
        <QTab
          name="materials" icon="science" :label="t('Materials')" no-caps
          :class="tab === 'materials' ? (q.dark.isActive ? 'tabs-dark-active' : 'tabs-light-active') : (q.dark.isActive ? 'tabs-dark' : 'tabs-light')"
        />
      </QTabs>
    </div>
  </div>
</template>

<style lang="postcss">
/* Light Theme */
.tabs-light {
  background-color: white;
  white-space: normal;
  color: black
}

.tabs-light-active {
  background-color: black;
  white-space: normal;
  color: white
}
/* Dark Theme */
.tabs-dark {
  background-color: black;
  white-space: normal;
  color: white
}

.tabs-dark-active {
  background-color: white;
  white-space: normal;
  color: black
}
.tabs-border {
  border: 1px;
  border-style: solid;
  border-color: rgba(128,128,128,0.5);
}
.q-tab .q-tab__label {
  font-weight: bold;
  font-size: 1.1rem;
}
</style>
