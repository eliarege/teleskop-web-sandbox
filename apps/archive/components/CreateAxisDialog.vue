<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import type { AnalogInputOutputType } from '~/types/archive'

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
const uniqueUnits: Array<string> = []
settingsStore.axises.forEach((axis) => {
  if (!uniqueUnits.includes(axis.unit))
    uniqueUnits.push(axis.unit)
})
const selectedUnit = ref()
const axisName = ref()
const ioValuesToSelect = ref([] as { key: string, selected: boolean, isTaken: boolean, name: string }[])
function getIOStatus(key: string) {
  let isIOTaken = false
  settingsStore.axises.forEach((axis) => {
    if (axis.ioKeys.includes(key))
      isIOTaken = true
  })
  return isIOTaken
}
function updateSelectedUnit(newVal: string) {
  selectedUnit.value = newVal
  ioValuesToSelect.value = []
  props.analogInputs?.forEach((io) => {
    if (io.calibUnit && io.calibUnit === selectedUnit.value) {
      const key = `analogInputs_${io.ioIndex}`
      ioValuesToSelect.value.push({
        key,
        selected: false,
        isTaken: getIOStatus(key),
        name: io.name,
      })
    }
  })
  if (selectedUnit.value === 'undef') {
    props.analogOutputs?.forEach((io) => {
      const key = `analogOutputs_${io.ioIndex}`
      ioValuesToSelect.value.push({
        key,
        selected: false,
        isTaken: getIOStatus(key),
        name: io.name,
      })
    })
  }
}
const isAxisExist = computed(() => !!settingsStore.axises.get(axisName.value))
const canUserSave = computed(() => !isAxisExist.value && axisName.value && selectedUnit.value)
</script>

<template>
  <q-dialog
    ref="dialogRef"
  >
    <q-card>
      <q-card-section>
        <div class="text-2xl w-150">
          {{ t('axisSettings.add') }}
        </div>
      </q-card-section>
      <q-card-section>
        <div class="max-h-100 w-full overflow-y-scroll">
          <q-select
            :model-value="selectedUnit"
            :options="uniqueUnits"
            :label="t('axisSettings.selectUnit')"
            @update:model-value="updateSelectedUnit"
          />
          <q-input
            v-model="axisName"
            :label="t('axisSettings.enterName')"
            :error="isAxisExist"
            :error-message="t('axisSettings.axisNameAlreadyExists')"
          />
        </div>
      </q-card-section>
      <q-card-section v-if="selectedUnit">
        <div class="max-h-100 w-full overflow-y-scroll">
          <div
            v-for="io in ioValuesToSelect"
            :key="`io-axis-${io.key}-create`"
            class="mb-1 text-xl cursor-pointer"
            @click="!io.isTaken ? io.selected = !io.selected : {}"
          >
            <q-checkbox
              v-if="!io.isTaken"
              v-model="io.selected"
              dense
              :label="io.name"
              class="my-3 ml-5"
            />
            <span
              v-else
              class="ml-5"
              disabled
            >
              {{ io.name }}
            </span>
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
        />
        <q-btn
          v-close-popup
          :label="t('create')"
          :disable="!canUserSave"
          outline
          color="primary"
          icon="create"
          @click="onDialogOK({ name: axisName, unit: selectedUnit, ioValues: ioValuesToSelect.filter(io => io.selected && !io.isTaken) })"
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
