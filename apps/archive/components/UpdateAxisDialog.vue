<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import type { AnalogInputOutputType, Axis } from '~/types/archive'

const props = defineProps({
  analogInputs: Array<AnalogInputOutputType>,
  analogOutputs: Array<AnalogInputOutputType>,
})
defineEmits([
  ...useDialogPluginComponent.emits,
])
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()
const settingsStore = userSettingsStore()
const ioValuesHasSameUnitWithSelected: Ref<Array<{ key: string, selected: boolean, name: string }>> = ref([])
const buttons = [
  {
    icon: 'check',
    tooltip: t('selectAll'),
    onClick: () => ioValuesHasSameUnitWithSelected.value.forEach(io => io.selected = true),
  },
  {
    icon: 'remove',
    tooltip: t('dropAll'),
    onClick: () => ioValuesHasSameUnitWithSelected.value.forEach(io => io.selected = false),
  },
  {
    icon: 'sync_alt',
    tooltip: t('selectReverse'),
    onClick: () => ioValuesHasSameUnitWithSelected.value.forEach(io => io.selected = !io.selected),
  },
]
const selectedAxis: Ref<Axis> = ref()
const axisesArray = ref(Array.from(settingsStore.axises).map(el => el[1]))

function updateSelectedAxis(newVal) {
  saveCurrentSettings()
  selectedAxis.value = newVal
  ioValuesHasSameUnitWithSelected.value = []
  props.analogInputs?.forEach((io) => {
    if (io.calibUnit && io.calibUnit === selectedAxis.value.unit) {
      const key = `analogInputs_${io.ioIndex}`
      ioValuesHasSameUnitWithSelected.value.push({
        key,
        selected: selectedAxis.value.ioKeys.includes(key),
        name: io.name,
      })
    }
  })
  props.analogOutputs?.forEach((io) => {
    if (io.calibUnit && io.calibUnit === selectedAxis.value.unit) {
      const key = `analogOutputs_${io.ioIndex}`
      ioValuesHasSameUnitWithSelected.value.push({
        key,
        selected: selectedAxis.value.ioKeys.includes(key),
        name: io.name,
      })
    }
  })
}
function saveCurrentSettings() {
  if (ioValuesHasSameUnitWithSelected.value.length) {
    const axis = settingsStore.axises.get(selectedAxis.value.unit || 'undef')
    if (axis) {
      ioValuesHasSameUnitWithSelected.value.forEach((io) => {
        if (io.selected) {
          settingsStore.updateSetting(io.key, { axis: selectedAxis.value.unit })
          if (!axis.ioKeys.includes(io.key)) {
            axis.ioKeys.push(io.key)
          }
        } else {
          settingsStore.updateSetting(io.key, { axis: '' })
          axis.ioKeys = axis.ioKeys.filter(k => k !== io.key)
        }
      })
      axisesArray.value = Array.from(settingsStore.axises).map(el => el[1])
    }
  }
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
  >
    <q-card>
      <q-card-section>
        <div>
          <div class="text-2xl">
            {{ t('axisSettings._') }}
          </div>
          <div class="text-lg whitespace-normal mt-5 w-140">
            {{ t('axisSettings.description') }}
          </div>
        </div>
      </q-card-section>
      <q-card-section>
        <div v-if="axisesArray.length">
          <q-select
            :model-value="selectedAxis"
            :options="axisesArray"
            :option-label="opt => opt.unit || t('undef')"
            :color="selectedAxis?.color"
            filled
            @update:model-value="newVal => updateSelectedAxis(newVal)"
          />
        </div>
      </q-card-section>
      <q-card-section v-if="selectedAxis">
        <div class="w-full m--5 flex">
          <q-space />
          <q-btn
            v-for="(button, index) in buttons"
            :key="index"
            dense
            flat
            @click="button.onClick()"
          >
            <q-icon :name="button.icon" size="xs" />
            <q-tooltip> {{ button.tooltip }}</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>

      <q-card-section v-if="selectedAxis">
        <div class="max-h-100 w-full overflow-y-scroll">
          <div
            v-for="io in ioValuesHasSameUnitWithSelected"
            :key="`io-axis-${io.key}`"
            class="mb-1 text-xl cursor-pointer"
            @click="io.selected = !io.selected"
          >
            <!-- {{ io.name }} -->
            <q-checkbox
              v-model="io.selected"
              :label="io.name"
              dense
              class="my-3 ml-5"
            />
            <q-separator />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          :label="t('close')"
          outline
          color="black"
          icon="close"
          @click="saveCurrentSettings()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
  .q-dialog__inner--minimized > div {
  max-width: none;
}
</style>
