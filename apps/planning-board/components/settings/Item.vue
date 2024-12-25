<script setup lang="ts">
import type { PropType } from 'vue'
import type { QueueBasedEvent } from '~/shared/queueBased'

interface SettingsItemProps {
  title: string
  dropdownOptions?: {
    id: number
    label: string
    value: string
  }[]
  checkboxText?: string
  eventNameLabel?: string
  isDeviation?: boolean
}

const _props = defineProps<SettingsItemProps>()
const { t } = useI18n()

const dropdown = defineModel('dropdown', { type: Array as PropType<string[]>, required: true })
const fabricColor = defineModel('fabricColor', { type: Boolean })
const color = defineModel('color', { type: String })

function removeChip(item: string) {
  const idx = dropdown.value?.indexOf(item)
  dropdown.value.splice(idx, 1)
}

function handleDropdownChange(value: string[]) {
  console.log(value)
  if (value.length > 4) {
    value.pop()
  }
  dropdown.value = value
}
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
          :model-value="dropdown"
          :options="dropdownOptions"
          dense
          multiple
          options-dense
          flat
          outlined
          option-value="value"
          option-label="label"
          map-options
          emit-value
          class="dropdown"
          @update:model-value="handleDropdownChange"
        >
          <template #selected>
            <q-chip
              v-for="(item, idx) in dropdown"
              :key="idx"
              removable
              dense
              square
              class="p-2"
              @remove="removeChip(item)"
            >
              {{ t(`settings.plan-area.dropDown.${item}`) }}
            </q-chip>
          </template>
        </q-select>
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
:deep(.dropdown.q-field--dense .q-field__marginal) {
  height: 30px;
}
</style>
