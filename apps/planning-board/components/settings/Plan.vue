<script setup lang="ts">
import { matDisplaySettings, matPreview } from '@quasar/extras/material-icons'

const emit = defineEmits(['updateScheduler', 'addColumn', 'removeColumn'])
const { t } = useI18n()
const splitterModel = ref('view')
</script>

<template>
  <div class="bg-white w-90vw e-border rounded-2xl" @click.stop.prevent>
    <q-tabs v-model="splitterModel" class="text-blue">
      <q-tab
        name="view"
        :icon="matDisplaySettings"
        :label="t('settings.main.view')"
      />
      <q-tab
        name="viewOptions"
        :icon="matPreview"
        :label="t('settings.main.options')"
      />
      <q-tab
        name="unplannedOptions"
        :icon="matPreview"
        :label="t('settings.main.unplanned')"
      />
    </q-tabs>
    <q-separator />
    <q-tab-panels v-model="splitterModel" animated>
      <q-tab-panel name="view">
        <SettingsView />
      </q-tab-panel>
      <q-tab-panel name="viewOptions">
        <SettingsViewOptions />
      </q-tab-panel>
      <q-tab-panel name="unplannedOptions">
        <SettingsUnplannedOptions
          @add-column="(ev) => emit('addColumn', ev)"
          @remove-column="(ev) => emit('removeColumn', ev)"
        />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<style scoped lang="postcss">
.settings-border {
  border: 1px solid rgba(0, 0, 0, 0.125);
  border-radius: 0.25rem;
}

.view-options {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  @apply grid gap-2;

  .machine-list {
    grid-area: 1 / 1 / 3 / 2;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.25rem;
    @apply max-h-80vh overflow-auto;
  }

  .erp-parameters {
    grid-area: 1 / 2 / 3 / 3;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.25rem;
    @apply max-h-80vh overflow-auto;
  }

  .planned-batch {
    grid-area: 1 / 3 / 2 / 4;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.25rem;
    @apply max-h-80vh overflow-auto;
  }

  .unplanned-batch {
    grid-area: 2 / 3 / 3 / 4;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.25rem;
    @apply max-h-80vh overflow-auto;
  }
}
</style>

<i18n lang="json">
  {
  "en": {
    "settings": {
      "main": {
        "view": "View",
        "options": "View Options",
        "unplanned": "Unplanned Job Orders"
      }
    }
  },
  "tr": {
    "settings": {
      "main": {
        "view": "Görünüm",
        "options": "Görünüm Seçenekleri",
        "unplanned": "Bekleyen İş Emirleri"
      }
    }
  }
}
</i18n>
