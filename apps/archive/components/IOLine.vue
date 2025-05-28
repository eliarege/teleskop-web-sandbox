<script setup lang="ts">
import AxisSettingsButton from './AxisSettingsButton.vue'
import type { IOSetting } from '~/types/archive'

const props = defineProps<{
  command: any
  value: any
  setting: IOSetting
  ioType: 'Analog' | 'Digital'
  typeKey?: string
}>()
const emit = defineEmits(['update:setting', 'update:axis'])
function updateSettingsSelectedAttribute(selected: boolean) {
  emit('update:setting', { ...props.setting, selected })
  emit('update:axis', { ...props.setting, selected })
}
const { t } = useI18n()
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
    <AxisSettingsButton
      v-if="ioType === 'Analog'"
      :setting
      :command
      :type-key
      @update:setting="setting => emit('update:setting', { ...setting })"
    />
    <span class="ml-4">
      {{ typeKey === 'calculatedValues' ? t(`calculatedValues.${command.name}`) : command.name }}
    </span>
    <q-space />
    <span class="mr-4">
      {{ value }}
    </span>
  </div>
</template>
