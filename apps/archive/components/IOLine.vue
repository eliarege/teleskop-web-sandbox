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
  <q-item
    dense
    class="no-wrap items-center overflow-hidden"
  >
    <q-item-section side class="no-shrink">
      <q-checkbox
        :model-value="setting.selected"
        dense
        @update:model-value="val => updateSettingsSelectedAttribute(val)"
      />
    </q-item-section>

    <q-item-section class="col min-w-0">
      <div class="row items-center no-wrap full-width">
        <AxisSettingsButton
          v-if="ioType === 'Analog'"
          :setting="setting"
          :command="command"
          :type-key="typeKey"
          style="flex: 0 0 auto;"
          class="shrink-0"
          @update:setting="setting => emit('update:setting', { ...setting })"
        />

        <div
          class="ml-2 overflow-hidden text-ellipsis whitespace-nowrap min-w-0 cursor-pointer col"
        >
          {{
            typeKey === 'calculatedValues'
              ? t(`calculatedValues.${command.name}`)
              : command.name
          }}
          <q-tooltip>
            {{
              typeKey === 'calculatedValues'
                ? t(`calculatedValues.${command.name}`)
                : command.name
            }}
          </q-tooltip>
        </div>
      </div>
    </q-item-section>

    <q-item-section side class="no-shrink ml-2">
      <span class="whitespace-nowrap">
        {{ value }}
      </span>
    </q-item-section>
  </q-item>
</template>

<style scoped>
.no-shrink {
  flex-shrink: 0 !important;
}
.shrink-0 {
  flex-shrink: 0 !important;
}
.min-w-0 {
  min-width: 0 !important;
}
</style>
