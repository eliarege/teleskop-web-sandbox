<script setup lang="ts">
import {
  sharpDashboard,
  sharpFormatColorFill,
  sharpGrid3x3,
  sharpSlowMotionVideo,
} from '@quasar/extras/material-icons-sharp'
import Visual from './Visual.vue'
import ColorPicker from './ColorPicker.vue'
import MachineFilter from './MachineFilter.vue'
import Animation from './Animation.vue'
import { useDataStore } from '~/store/Datas'
import { useColorStore } from '~/store/Colors'

const emit = defineEmits(['close'])
const { t } = useI18n()
const store = useDataStore()
const colors = useColorStore()
const expansionItems = [
  {
    label: 'Görsel Ayarlar',
    icon: sharpGrid3x3,
    cls: 'text-black',
    component: () => h(Visual),
  },
  {
    label: 'Renk Seçici',
    icon: sharpFormatColorFill,
    cls: 'text-black',
    component: () => h(ColorPicker),
  },
  {
    label: 'Makine Filtreleme',
    icon: sharpDashboard,
    cls: 'text-black',
    component: () => h(MachineFilter),
  },
  {
    label: 'Animasyon',
    icon: sharpSlowMotionVideo,
    cls: 'text-black',
    component: () => h(Animation),
  },
]

function setDefaultSettings() {
  colors.cardActiveBg = '#4B5563'
  colors.cardIdleBg = '#D1D5DB'
  colors.cardItemBg = '#000000'
  colors.bgColor = '#FFFFFF'
  colors.textcolor = '#000000'
  store.mode = true
  store.electricity = true
  store.steam = true
  store.salt = true
  store.water = true
  store.scrollSpeed = 3
  store.zoomLevel = 1
}
</script>

<template>
  <div class="bg-white gap-5 w-125 h-auto max-h-90vh overflow-auto cursor-default p-2 rounded border-3 border-gray-400 rounded-2xl">
    <SettingsExpansionItem
      v-for="(item, idx) in expansionItems"
      :key="idx"
      :label="item.label"
      :cls="item.cls"
      :icon="item.icon"
    >
      <template #default>
        <component :is="item.component" />
      </template>
    </SettingsExpansionItem>
    <div class="w-full flex p-2">
      <q-space />
      <ElButton
        color="#0d94fc"
        plain
        @click="setDefaultSettings"
      >
        {{ t("settings.default") }}
      </ElButton>
      <ElButton
        color="#0d94fc"
        plain
        @click="emit('close')"
      >
        {{
          t("settings.close")
        }}
      </ElButton>
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
