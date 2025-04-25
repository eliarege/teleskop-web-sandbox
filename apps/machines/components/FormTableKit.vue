<script setup lang="ts" generic="T extends object">
import { FormKitSchema } from '@formkit/vue'
import { changeLocale } from '@formkit/i18n'
import { klona } from 'klona'
import { onKeyStroke } from '@vueuse/core'
import type { Columns } from '~/types'

const props = defineProps<{
  rows: T[]
  columns: Columns
  formClass: string
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
const tableColumns = ref<T[]>([])
const schema = ref([])
const visibleColumns = ref<string[]>([])
const rowKey = ref()

const cols = computed(() => props.columns)

onKeyStroke(['ArrowUp'], (event: KeyboardEvent) => {
  event.preventDefault()
  const currentIndex = props.rows.indexOf(selected.value[0])

  if (currentIndex > 0) {
    const newSelection = props.rows[currentIndex - 1]
    selected.value = [newSelection]
  }
})

onKeyStroke(['ArrowDown'], (event: KeyboardEvent) => {
  event.preventDefault()
  const currentIndex = props.rows.indexOf(selected.value[0])

  if (currentIndex < props.rows.length - 1) {
    const newSelection = props.rows[currentIndex + 1]
    selected.value = [newSelection]
  }
})

watch(cols, (_newValue, _oldValue) => {
  tableColumns.value = []
  visibleColumns.value = []

  for (const [key, column] of Object.entries(props.columns)) {
    tableColumns.value.push({ ...column, name: key })

    if (column.visible)
      visibleColumns.value.push(key)

    if (column.unique)
      rowKey.value = key
  }

  updateSchemaFields()
}, { immediate: true })

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

const ctrl = useKeyModifier('Control')
const shift = useKeyModifier('Shift')

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

  if (shift.value) {
    nextTick(() => {
      const tableRows = props.rows
      const firstIndex = Math.min(
        tableRows.indexOf(selected.value[0]),
        tableRows.indexOf(row),
      )
      const lastIndex = Math.max(
        tableRows.indexOf(selected.value[0]),
        tableRows.indexOf(row),
      )
      selected.value = tableRows.slice(firstIndex, lastIndex + 1)
    })
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
    :hide-bottom="true"
    :columns="tableColumns"
    selection="multiple"
    :row-key="rowKey"
    :visible-columns="visibleColumns"
    class="overflow-y-auto	h-160 select-none"
    :rows-per-page-options="[0]"
    table-header-style="position: sticky; top: 0; z-index: 1; height: 50px;"
    table-header-class="bg-gray-1 dark:bg-dark-4"
    @update:selected="emit('select', selected)"
    @row-click="onRowClick"
    @row-dblclick="onRowDoubleClick"
  >
    <template #body-cell="props">
      <q-td :props="props">
        <component :is="props.col.renderCell(props.row)" v-if="props.col.renderCell" />
        <span v-else>
          {{ props.value }}
        </span>
      </q-td>
    </template>
  </q-table>

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
          <FormKitSchema :schema="schema" />
          <slot name="form-content" :form-data="formData" />
          <q-card-actions align="right" class="col-span-full">
            <FormKit type="submit" :label="t('submit')" />
          </q-card-actions>
        </FormKit>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
