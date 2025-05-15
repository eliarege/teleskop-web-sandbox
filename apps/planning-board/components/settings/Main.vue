<script setup lang="ts">
import { matDisplaySettings, matPreview, matSync } from '@quasar/extras/material-icons'
import View from './View.vue'
import ViewOptions from './ViewOptions.vue'
import UnplannedOptions from './UnplannedOptions.vue'
import DataCleanup from './DataCleanup.vue'

const emits = defineEmits(['addColumn', 'removeColumn', 'updateScheduler'])
const { t } = useI18n()

const settingItems = reactive([
  { name: 'planningArea', caption: () => t('settings.plan-area._'), component: View, icon: matDisplaySettings },
  { name: 'viewOptions', caption: () => t('settings.view-options'), component: ViewOptions, icon: matPreview },
  { name: 'unplannedOptions', caption: () => t('settings.unplanned-options'), component: UnplannedOptions, icon: matPreview },
  { name: 'dataCleanUp', caption: () => t('settings.data-cleanup._'), component: DataCleanup, icon: matSync },
])
</script>

<template>
  <div class="bg-white w-full !w-40vw max-h-90vh rounded-2xl overflow-auto cursor-auto" @click.stop.prevent>
    <q-list>
      <q-expansion-item
        v-for="item in settingItems"
        :key="item.name"
        group="accordion"
        expand-seperator
        :icon="item.icon"
        :caption="toValue(item.caption)"
        class="overflow-auto"
      >
        <component
          :is="item.component"
          @add-column="(ev) => emits('addColumn', ev)"
          @remove-column="(ev) => emits('removeColumn', ev)"
          @update-scheduler="emits('updateScheduler')"
        />
      </q-expansion-item>
    </q-list>
  </div>
</template>

<style scoped lang="postcss">
.menu-list .q-item {
  border-radius: 0 32px 32px 0;
}
</style>
