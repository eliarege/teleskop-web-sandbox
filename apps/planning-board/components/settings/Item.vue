<script setup lang="ts">
import type { PropType } from 'vue'
import type { QueueBasedEvent } from '~/shared/queueBased'
import { useSettingStore } from '~/store/settings'

interface SettingsItemProps {
  title: string
  dropdownOptions?: {
    id: number
    label: string
    value: keyof QueueBasedEvent
  }[]
  checkboxText?: string
  eventNameLabel?: string
  isDeviation?: boolean
}

interface Dropdown {
  id: number
  label: string
  value: keyof QueueBasedEvent
}
defineProps<SettingsItemProps>()
const dropdown = defineModel('dropdown', { type: Object as PropType<Dropdown> })
const fabricColor = defineModel('fabricColor', { type: Boolean })
const color = defineModel('color', { type: String })
</script>

<template>
  <div class="w-full h-full min-h-40px grid grid-rows-auto px-3">
    <div
      v-if="dropdown"
      class="grid grid-cols-2 min-h-40px gap-10 items-center"
    >
      {{ eventNameLabel }}
      <div class="w-full flex justify-end">
        <q-select
          v-model="dropdown"
          :options="dropdownOptions"
          dense
          options-dense
          flat
          outlined
          option-value="value"
          option-label="label"
          emit-value
          map-options
          class="test max-w-40"
        />
      </div>
    </div>
    <div class="grid grid-cols-2 gap-10 min-h-40px items-center  whitespace-nowrap">
      {{ checkboxText }}
      <div class="flex justify-end">
        <q-checkbox
          v-model="fabricColor"
          dense
          flat
          filled
          borderless
        />
      </div>
    </div>
    <SettingsColor
      v-model="color"
      :is-deviation
      :fabric-color="!fabricColor"
      class="w-full"
      :title
    />
  </div>
</template>

<style scoped lang="postcss">
:deep(.test.q-field--dense .q-field__marginal) {
  height: 30px;
}
</style>
