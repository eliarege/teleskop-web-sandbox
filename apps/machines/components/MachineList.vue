<script setup lang="ts" generic="T extends object">
import { FormKitSchema } from '@formkit/vue'
import { changeLocale } from '@formkit/i18n'
import { klona } from 'klona'
import { onKeyStroke } from '@vueuse/core'
import type { IOOption, Machine, MachineGroup, MachineTableColumn } from '~/types'
import { steamUnitOptions, tbbModelOptions } from '~/server/utils/constants'

const props = defineProps<{
  formClass: string
  rows: Machine[]
  columns: MachineTableColumn[]
  machines: Machine[]
  machineGroups: MachineGroup[]
  mtTempIoOptions: IOOption[]
  steamValveDoOptions: IOOption[]
}>()

const emit = defineEmits<{
  add: [data: T]
  edit: [data: T, oldData: T]
  delete: [data: T[]]
  select: [data: T[]]
  close: []
}>()

const { t, locale } = useI18n()
const { notifyError } = useNotify()
const showModal = ref(false)
const selected = ref<T[]>([])
const formData = ref<T>({})
const action = ref<'add' | 'edit'>()
const schema = ref([])

const ctrl = useKeyModifier('Control')
const shift = useKeyModifier('Shift')

onKeyStroke(['ArrowUp'], (event: KeyboardEvent) => {
  event.preventDefault()
  if (!selected.value.length && props.rows.length > 0) {
    selected.value = [props.rows[0]]
    return
  }

  const currentIndex = props.rows.indexOf(selected.value[0])
  if (currentIndex > 0) {
    const newSelection = props.rows[currentIndex - 1]

    if (shift.value) {
      if (!selected.value.includes(newSelection)) {
        selected.value = [...selected.value, newSelection]
      } else {
        selected.value = selected.value.filter(row => row !== selected.value[selected.value.length - 1])
      }
    } else {
      selected.value = [newSelection]
    }
  }
})

onKeyStroke(['ArrowDown'], (event: KeyboardEvent) => {
  event.preventDefault()
  if (!selected.value.length && props.rows.length > 0) {
    selected.value = [props.rows[0]]
    return
  }

  const currentIndex = props.rows.indexOf(selected.value[0])
  if (currentIndex < props.rows.length - 1) {
    const newSelection = props.rows[currentIndex + 1]

    if (shift.value) {
      if (!selected.value.includes(newSelection)) {
        selected.value = [...selected.value, newSelection]
      } else {
        selected.value = selected.value.filter(row => row !== selected.value[selected.value.length - 1])
      }
    } else {
      selected.value = [newSelection]
    }
  }
})

watch(() => formData.value.theoreticalSteam, (newValue) => {
  updateSchemaFields()
}, { immediate: false })

function updateSchemaFields() {
  schema.value = []

  for (const [key, column] of Object.entries(props.columns)) {
    if (column.editable && column.schema) {
      const deepClonedSchema = klona(column.schema)
      const schemaItem = {
        ...deepClonedSchema,
        name: key,
        id: key,
        label: column.label,
        $formkit: column.type,
      }

      if ((key === 'steamKgPerHour' || key === 'steamValveDo')
        && formData.value.theoreticalSteam !== true) {
        schemaItem.disabled = true
      }

      schema.value.push(schemaItem)
    }
  }
}

function showForm(buttonAction: 'add' | 'edit') {
  action.value = buttonAction

  if (action.value === 'edit' && selected.value.length) {
    formData.value = { ...selected.value[0] }
    showModal.value = true
  } else {
    selected.value = []
    formData.value = {}
    showModal.value = true
  }

  for (const [key, column] of Object.entries(props.columns)) {
    if (column.editable && column.schema) {
      if (key === 'MTTempIo') {
        column.schema.disabled = buttonAction === 'add'

        const machine = props.machines.find((m) => {
          return m.machineId === formData.value.machineId
        })

        column.schema.disabled = machine?.theoreticalSteam !== true
      }
    }
  }

  nextTick(() => {
    updateSchemaFields()
  })
}

function handleSubmit(formData: T) {
  if (action.value === 'add')
    emit('add', formData)
  else if (action.value === 'edit')
    emit('edit', formData, selected.value[0])
  selected.value = []
  showModal.value = false
}

function handleDelete() {
  if (selected.value.length) {
    emit('delete', selected.value)
    selected.value = []
  } else
    notifyError(t('pleaseSelectaRowToDelete'))
}

function isRowSelected(row: T) {
  return selected.value.includes(row)
}

function removeSelection(row: T) {
  selected.value = selected.value.filter(r => r !== row)
}

function onRowClick(event: Event, row: T) {
  const pointer = event as PointerEvent

  if (pointer.button === 2) { // Right click
    if (!isRowSelected(row))
      selected.value = [row]
    return
  }

  if (ctrl.value) {
    isRowSelected(row) ? removeSelection(row) : selected.value.push(row)
    return
  }

  if (shift.value && selected.value.length > 0) {
    const tableRows = props.rows
    const lastSelectedRow = selected.value[selected.value.length - 1]
    const lastSelectedIndex = tableRows.indexOf(lastSelectedRow)
    const clickedIndex = tableRows.indexOf(row)

    const startIndex = Math.min(lastSelectedIndex, clickedIndex)
    const endIndex = Math.max(lastSelectedIndex, clickedIndex)

    const rowsToSelect = tableRows.slice(startIndex, endIndex + 1)

    selected.value = rowsToSelect
    return
  }

  // Default: Left or middle click
  selected.value = [row]
}

async function onRowDoubleClick(event: Event) {
  const target = event.target as HTMLElement

  if (target.closest('.q-checkbox'))
    return

  showForm('edit')
}

// TODO: fix locale change error
watch(showModal, async (newValue, _oldValue) => {
  await nextTick()
  if (newValue)
    changeLocale(locale.value)
})
</script>

<template>
  <!-- Actions -->
  <div class="flex gap-4 m-4">
    <q-btn
      push
      no-caps
      :label="t('add')"
      color="primary"
      @click="showForm('add')"
    />
    <q-btn
      push
      no-caps
      :label="t('edit')"
      color="primary"
      :disable="!selected.length"
      @click="showForm('edit')"
    />
    <q-btn
      push
      no-caps
      :label="t('delete')"
      color="primary"
      :disable="!selected.length"
      @click="handleDelete"
    />
    <slot name="actions" />
  </div>
  <!-- Table -->
  <q-table
    v-model:selected="selected"
    :rows="rows"
    :columns="columns"
    :hide-bottom="true"
    row-key="machineId"
    selection="multiple"
    binary-state-sort
    class="overflow-y-auto h-160 select-none"
    :rows-per-page-options="[0]"
    table-header-style="position: sticky; top: 0; z-index: 1; height: 50px;"
    table-header-class="bg-gray-1 dark:bg-dark-4"
    @update:selected="emit('select', selected)"
    @row-click="onRowClick"
    @row-dblclick="onRowDoubleClick"
  />

  <!-- Form Dialog -->
  <q-dialog v-model="showModal" @hide="emit('close')">
    <q-card class="min-w-fit">
      <q-card-actions align="right">
        <q-btn
          flat
          icon="close"
          @click="showModal = false;emit('close')"
        />
      </q-card-actions>

      <q-card-section>
        <FormKit
          v-model="formData"
          :actions="false"
          type="form"
          :form-class="`${formClass ?? 'grid items-baseline'} grid-items-baseline`"
          @submit="handleSubmit"
        >
          <FormKit
            type="text"
            name="machineId"
            label="ID"
          />
          <FormKit
            type="text"
            name="machineCode"
            :label="t('machineName')"
          />
          <FormKit
            type="select"
            name="groupName"
            :label="t('machineGroup')"
            :options="machineGroups"
          />
          <FormKit
            type="select"
            name="tbbModel"
            label="TBB Model"
            :options="tbbModelOptions"
          />
          <FormKit
            type="text"
            name="machineCapacity"
            :label="t('machineCapacity')"
          />
          <FormKit
            type="text"
            name="reelCount"
            :label="t('reelCount')"
          />
          <FormKit
            type="text"
            name="nozzleCount"
            :label="t('nozzleCount')"
          />
          <FormKit
            type="text"
            name="ip"
            label="IP"
          />
          <FormKit
            type="text"
            name="theoricalCharge"
            :label="t('theoricalCharge')"
          />
          <FormKit
            type="text"
            name="theoricalChargeDuration"
            :label="t('theoricalChargeDuration')"
          />
          <FormKit
            type="select"
            name="steamUnit"
            :label="t('steamUnit')"
            :options="steamUnitOptions"
          />
          <FormKit
            type="checkbox"
            name="inUse"
            :label="t('inUse')"
          />
          <FormKit
            type="checkbox"
            name="additionalTank1"
            :label="t('additionalTank1')"
          />
          <FormKit
            type="checkbox"
            name="additionalTank2"
            :label="t('additionalTank2')"
          />
          <FormKit
            type="checkbox"
            name="additionalTank3"
            :label="t('additionalTank3')"
          />
          <FormKit
            type="checkbox"
            name="additionalTank4"
            :label="t('additionalTank4')"
          />
          <FormKit
            type="checkbox"
            name="reserveTank"
            :label="t('reserveTank')"
          />

          <FormKit
            type="checkbox"
            name="storeElectricityAsInc"
            :label="t('storeElectricityAsInc')"
          />
          <FormKit
            type="checkbox"
            name="theoreticalWater"
            :label="t('theoreticalWaterCalculationActive')"
          />
          <FormKit
            type="select"
            name="MTTempIo"
            :label="t('MTTempIo')"
            :options="mtTempIoOptions
              .filter((opt: IOOption) => opt.machineId === formData.machineId)"
            :disabled="!formData.version"
          />
          <FormKit
            type="checkbox"
            name="theoreticalSteam"
            :label="t('theoreticalSteam')"
          />
          <FormKit
            type="text"
            name="steamKgPerHour"
            :label="t('steamKgPerHour')"
            :disabled="!formData.theoreticalSteam"
          />
          <FormKit
            type="select"
            name="steamValveDo"
            :label="t('steamValveDo')"
            :options="steamValveDoOptions
              .filter((opt: IOOption) => opt.machineId === formData.machineId)"
            :disabled="!formData.theoreticalSteam"
          />
          <slot name="form-content" :form-data="formData" />
          <q-card-actions align="right" class="col-span-full">
            <FormKit type="submit" :label="t('submit')" />
          </q-card-actions>
        </FormKit>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
