<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import CreateAxisDialog from './CreateAxisDialog.vue'
import type { AnalogInputOutputType, Axis } from '~/types/archive'

const props = defineProps({
  analogInputs: Array<AnalogInputOutputType>,
  analogOutputs: Array<AnalogInputOutputType>,
})

defineEmits([
  ...useDialogPluginComponent.emits,
])

const $q = useQuasar()
const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide } = useDialogPluginComponent()

const settingsStore = userSettingsStore()
const ioValuesHasSameUnitWithSelected: Ref<Array<{ key: string, selected: boolean, isTaken: boolean, name: string }>> = ref([])
const buttons = [
  {
    icon: 'check',
    tooltip: t('selectAll'),
    onClick: () => ioValuesHasSameUnitWithSelected.value.forEach(io => !io.isTaken ? io.selected = true : ''),
  },
  {
    icon: 'remove',
    tooltip: t('dropAll'),
    onClick: () => ioValuesHasSameUnitWithSelected.value.forEach(io => !io.isTaken ? io.selected = false : ''),
  },
  {
    icon: 'sync_alt',
    tooltip: t('selectReverse'),
    onClick: () => ioValuesHasSameUnitWithSelected.value.forEach(io => !io.isTaken ? io.selected = !io.selected : ''),
  },
]

const selectedAxis = ref<Axis>()
const axisesArray = ref(Array.from(settingsStore.axises).map(el => el[1]))

function getIOIsTaken(key: string, axis: Axis) {
  let isTaken = false
  for (const ax of axisesArray.value) {
    if (axis.name !== ax.name && axis.unit === ax.unit) {
      if (ax.ioKeys.includes(key)) {
        isTaken = true
        break
      }
    }
  }
  return isTaken
}
function getIOValuesOfSelectedAxis(axis: Axis) {
  const ios: { key: string, selected: boolean, isTaken: boolean, name: string }[] = []
  props.analogInputs?.forEach((io) => {
    if (io.calibUnit && io.calibUnit === axis.unit) {
      const key = `analogInputs_${io.ioIndex}`
      ios.push({
        key,
        selected: selectedAxis.value.ioKeys.includes(key),
        isTaken: getIOIsTaken(key, axis),
        name: io.name,
      })
    }
  })
  if (axis.unit === 'undef') {
    props.analogOutputs?.forEach((io) => {
      const key = `analogOutputs_${io.ioIndex}`
      ios.push({
        key,
        selected: selectedAxis.value.ioKeys.includes(key),
        isTaken: getIOIsTaken(key, axis),
        name: io.name,
      })
    })
  }
  return ios
}

function updateSelectedAxis(newVal: Axis) {
  saveCurrentSettings()
  selectedAxis.value = newVal
  ioValuesHasSameUnitWithSelected.value = getIOValuesOfSelectedAxis(selectedAxis.value)
}

function saveCurrentSettings() {
  if (ioValuesHasSameUnitWithSelected.value.length) {
    const axis = settingsStore.axises.get(selectedAxis.value.name || 'undef')
    if (axis) {
      ioValuesHasSameUnitWithSelected.value.forEach((io) => {
        if (io.selected) {
          settingsStore.updateSetting(io.key, { axis: selectedAxis.value.name })
          if (!axis.ioKeys.includes(io.key)) {
            axis.ioKeys.push(io.key)
          }
        } else {
          // FIXME: 'C den çıakrtılan bir io varken tekrardan close dismiss or save atılırsa
          // işaretli olmayan ioları da tekrardan default eksen olan 'C ye atıyor
          // Ancak boş metrik başka bir axiste işaretli mi (isTaken) diye bakmak gerekebilir
          // SettingsStore da güncelliyorum her değişimde dolayısıyla diğer aksiste mevcut olmayacak
          // isTaken düzenli güncellenmeli

          // const ioSetting = settingsStore.getSetting(io.key)
          // if(ioSetting.axis && axisesArray.value.some(ax => ax.ioKeys))
          settingsStore.updateSetting(io.key, { axis: '' })
          axis.ioKeys = axis.ioKeys.filter(k => k !== io.key)
        }
      })
      axisesArray.value = Array.from(settingsStore.axises).map(el => el[1])
    }
  }
}

function triggerCreateAxisDialog() {
  saveCurrentSettings()
  $q.dialog({
    component: CreateAxisDialog,
    componentProps: {
      analogInputs: props.analogInputs,
      analogOutputs: props.analogOutputs,
    },
  }).onOk((axis: {
    name: string
    unit: string
    ioValues: {
      key: string
      selected: boolean
      isTaken: boolean
      name: string
    }[]
  }) => {
    settingsStore.createAxis(axis.name, axis.unit, axis.ioValues.filter(val => val.selected && !val.isTaken).map(val => val.key))
    saveCurrentSettings()
  })
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="w-120">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ t('axisSettings._') }}
        </div>
        <q-space />
        <q-btn
          v-close-popup
          icon="close"
          class="color-gray-6"
          flat
          round
          dense
        />
      </q-card-section>

      <q-card-section class="pt-0">
        <div class="text-h8 w-100 color-gray-6">
          {{ t('axisSettings.description') }}
        </div>
      </q-card-section>

      <q-card-section class="pt-0">
        <div v-if="axisesArray.length">
          <q-select
            :model-value="selectedAxis"
            :options="axisesArray"
            :option-label="opt => opt.unit === 'undef' ? t('undef') : opt.name === opt.unit ? opt.name : `${opt.name} - ${opt.unit}`"
            :color="selectedAxis?.color"
            outlined
            options-dense
            dense
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

      <q-card-section v-if="selectedAxis" class="pt-0">
        <div class="h-60 w-full overflow-y-scroll">
          <div
            v-for="io in ioValuesHasSameUnitWithSelected"
            :key="`io-axis-${io.key}`"
            class="text-sm cursor-pointer border rounded mb-2 p-2 flex items-center"
            :class="!io.isTaken ? 'cursor-pointer' : ''"
            @click="!io.isTaken ? io.selected = !io.selected : ''"
          >
            <!-- {{ io.name }} -->
            <q-checkbox
              v-model="io.selected"
              :label="io.name"
              :disable="io.isTaken"
              dense
              size="sm"
            />
            <q-separator />
          </div>
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          :label="t('close')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('save')"
          class="bg-primary text-white"
          flat
          @click="() => { saveCurrentSettings(); onDialogOK() }"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
