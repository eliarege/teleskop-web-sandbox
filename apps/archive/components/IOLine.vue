<script setup lang="ts">
import type { IOSetting } from '~/types/archive'

defineProps<{
  command: any
  value: any
  setting: IOSetting
  ioType: 'Analog' | 'Digital'
}>()
const emit = defineEmits(['update:setting'])
</script>

<template>
  <div
    class="flex items-center flex-nowrap bg-gray-300 mb-1 "
  >
    <q-checkbox
      :model-value="setting.selected"
      class="mr-4 w-5 h-5"
      @update:model-value="emit('update:setting', { ...setting, selected: $event })"
    />
    <!-- @change="triggerAxisSelection()" -->

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
