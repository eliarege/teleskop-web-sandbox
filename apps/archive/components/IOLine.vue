<script setup lang="ts">
import type { IOSetting } from '~/types/archive'

const props = defineProps<{
  command: any
  value: any
  setting: IOSetting
  ioType: 'Analog' | 'Digital'
}>()
const emit = defineEmits(['update:setting', 'update:axis'])
function updateSettingsSelectedAttribute(selected: boolean) {
  emit('update:setting', { ...props.setting, selected })
  emit('update:axis', { ...props.setting, selected })
}
</script>

<template>
  <div
    class="flex items-center flex-nowrap"
  >
    <q-checkbox
      :model-value="setting.selected"
      class="mx-2"
      dense
      @update:model-value="val => updateSettingsSelectedAttribute(val)"
    />
    <q-btn
      v-if="ioType === 'Analog'"
      class="w-5 h-5"
      padding="none"
      :style="{ backgroundColor: setting.color }"
    >
      <q-popup-proxy
        :transition-duration="0"
      >
        <q-color
          :model-value="setting.color"
          @change="emit('update:setting', { ...setting, color: $event })"
        />
      </q-popup-proxy>
    </q-btn>

    <span class="ml-4">
      {{ command.name }}
    </span>
    <q-space />
    <span class="mr-4">
      {{ value }}
    </span>
  </div>
</template>
