<script setup lang="ts">
import { FormKitSchema } from '@formkit/vue'
import { changeLocale } from '@formkit/i18n'
import { klona } from 'klona'

const props = defineProps<{
  rows: object[]
  columns: object
  formClass: string
}>()

const emit = defineEmits<{
  add: [data: object]
  edit: [data: object, oldData: object]
  delete: [data: object[]]
  select: [data: object[]]
  close: []
}>()

const { t, locale } = useI18n()
const { notifyError } = useNotify()
const showModal = ref(false)
const selected = ref<object[]>([])
const formData = ref({})
const action = ref<'add' | 'edit'>()
const tableColumns = ref([])
const schema = ref([])
const visibleColumns = ref([])
const rowKey = ref()

const cols = computed(() => props.columns)

watch(cols, (_newValue, _oldValue) => {
  tableColumns.value = []
  schema.value = []
  visibleColumns.value = []

  for (const [key, column] of Object.entries(props.columns)) {
    tableColumns.value.push({ ...column, name: key })

    if (column.editable && column.schema) {
      const deepClonedSchema = klona(column.schema)
      const schemaItem = {
        ...deepClonedSchema,
        name: key,
        id: key,
        label: column.label,
        $formkit: column.type,
      }
      schema.value.push(schemaItem)
    }

    if (column.visible)
      visibleColumns.value.push(key)

    if (column.unique)
      rowKey.value = key
  }
}, { immediate: true })

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
}

function handleSubmit(formData: object) {
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
  </div>
  <!-- Table -->
  <q-table
    v-model:selected="selected"
    :rows="rows"
    :hide-bottom="true"
    :columns="tableColumns"
    selection="single"
    :row-key="rowKey"
    :visible-columns="visibleColumns"
    class="overflow-y-auto	h-160"
    :rows-per-page-options="[0]"
    @update:selected="emit('select', selected)"
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
