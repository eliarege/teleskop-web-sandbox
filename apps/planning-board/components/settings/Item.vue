<script setup lang="ts">
import type { ModelRef, PropType } from 'vue'
import type { QueueBasedAnyEvent } from '~/shared/queueBased'
import { useSettingStore } from '~/store/settings'

interface SettingsItemProps {
  title: string
  dropdownOptions?: {
    id: number
    label: string
    value: keyof QueueBasedAnyEvent
  }[]
  checkboxText?: string
  isDeviation?: boolean
}

interface Dropdown {
  id: number
  label: string
  value: keyof QueueBasedAnyEvent
}
defineProps<SettingsItemProps>()
const store = useSettingStore()

const dropdown = defineModel('dropdown', { type: Object as PropType<Dropdown> })
const fabricColor = defineModel('fabricColor', { type: Boolean })
const color = defineModel('color', { type: String })
</script>

<template>
  <div class="w-full h-full p-3">
    <span class="font-extrabold text-l whitespace-nowrap">{{ title }}</span>
    <q-separator spaced />
    <q-select
      v-if="dropdown"
      v-model="dropdown"
      :options="dropdownOptions"
      dense
      option-value="value"
      option-label="label"
      emit-value
      map-options
    />
    <div>
      <q-checkbox
        v-model="fabricColor"
        :label="checkboxText"
      />
      <q-color
        v-model="color"
        :readonly="isDeviation ? !fabricColor : fabricColor"
      />
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
