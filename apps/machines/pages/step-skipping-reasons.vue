<script setup lang="ts">
import { addStepSkippingReason, deleteStepSkippingReason, editStepSkippingReason, getWaterTypes } from '~/utils'

const columns = [
  {
    name: 'id',
    label: 'ID',
    field: row => row.id,
    align: 'left',
  },
  {
    name: 'reasonText',
    label: 'Atlatma Nedeni',
    field: row => row.reasonText,
    align: 'left',
  },
]

const { data: stepSkippingReasons, pending, refresh } = useFetch('/api/step-skipping-reasons/step-skipping-reasons', { default: () => [] })

const selectedReason = ref()

const reasonId = ref()
const reasonText = ref()
const oldId = ref()

async function handleReasonAdd() {
  await addStepSkippingReason(reasonId.value, reasonText.value)
  await refresh()
}

function handleSelection(obj: object) {
  if (obj.added) {
    reasonId.value = obj.rows[0].id
    oldId.value = obj.rows[0].id
    reasonText.value = obj.rows[0].reasonText
  } else {
    reasonId.value = ''
    reasonText.value = ''
  }
}

async function handleReasonEdit() {
  await editStepSkippingReason(reasonId.value, reasonText.value, oldId.value)
  await refresh()
}

async function handleReasonDelete() {
  await deleteStepSkippingReason(reasonId.value)
  await refresh()
  reasonId.value = ''
  reasonText.value = ''
}
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="input-field flex flex-row">
        <q-input v-model="reasonId" label="Numara" />
        <q-input v-model="reasonText" label="Atlatma Nedeni" />
      </div>
      <div class="flex flex-row input-field my-4">
        <q-btn
          label="Ekle"
          no-caps
          @click="handleReasonAdd()"
        />
        <q-btn
          label="Düzenle"
          no-caps
          @click="handleReasonEdit()"
        />
        <q-btn
          label="Sil"
          no-caps
          @click="handleReasonDelete()"
        />
      </div>

      <q-table
        v-model:selected="selectedReason"
        :rows="stepSkippingReasons"
        :columns="columns"
        :loading="pending"
        hide-pagination
        :pagination="{ rowsPerPage: 0 }"
        row-key="id"
        separator="cell"
        bordered
        selection="single"
        table-header-class="table-header"
        @selection="(e) => handleSelection(e)"
      />
    </q-card-section>
  </q-card>
</template>

<style scoped>
:deep(.table-header > th) {
  font-weight: bold;
}
.table-scroll {
  max-height: 45em;
  overflow-y: auto;
}

.input-field > * {
  margin-right: 2em;
}
</style>
