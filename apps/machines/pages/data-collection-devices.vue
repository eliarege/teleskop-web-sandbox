<script setup lang="ts">
import { addOtherMachine, deleteOtherMachine } from '~/utils'

const columns = [
  {
    name: 'machineId',
    label: 'Makine No',
    field: row => row.machineId,
    align: 'left',
  },
  {
    name: 'machine',
    label: 'Makine',
    field: row => row.machineName,
    align: 'left',
  },
]

const { data: machines, pending, refresh } = await useFetch('/api/machines/other-machines')
const machineId = ref()
const machineName = ref('')
const inUse = ref(true)
const oldId = ref()

const otherMachine = ref([])

async function handleAddClick() {
  const selected = {
    machineId: machineId.value,
    machineName: machineName.value,
    inUse: inUse.value,
  }
  await addOtherMachine(selected)
  await refresh()
}

async function handleDeleteClick() {
  await deleteOtherMachine(otherMachine.value[0].machineId)
  await refresh()
  machineId.value = ''
  machineName.value = ''
  inUse.value = true
}

function handleSelection(e) {
  if (e.added) {
    const selected = e.rows[0]
    machineId.value = selected.machineId
    oldId.value = selected.machineId
    machineName.value = selected.machineName
    inUse.value = selected.inUse
  } else if (!e.added) {
    machineId.value = ''
    machineName.value = ''
    inUse.value = true
  }
}

async function handleEditClick() {
  const selected = {
    machineId: machineId.value,
    machineName: machineName.value,
    inUse: inUse.value,
  }
  await editOtherMachine(selected, oldId.value)
  await refresh()
}
</script>

<template>
  <q-card class="flex flex-row">
    <q-card-section>
      <div class="flex flex-row justify-around w-3xl">
        <q-input v-model="machineId" label="Makine No" />
        <q-input v-model="machineName" label="Makine Adı" />
        <q-checkbox v-model="inUse" label="Kullanımda" />
      </div>

      <div class="flex flex-row input-field my-8">
        <q-btn
          label="Ekle"
          no-caps
          @click="handleAddClick"
        />
        <q-btn
          label="Düzenle"
          no-caps
          @click="handleEditClick"
        />
        <q-btn
          label="Sil"
          no-caps
          @click="handleDeleteClick"
        />
      </div>
    </q-card-section>
  </q-card>
  <div class="table-scroll">
    <q-table
      v-model:selected="otherMachine"
      :loading="pending"
      :rows="machines"
      :columns="columns"
      :pagination="{ rowsPerPage: 0 }"
      selection="single"
      row-key="machineId"
      hide-pagination
      bordered
      separator="cell"
      table-header-class="table-header"
      @selection="(e) => handleSelection(e)"
    />
  </div>
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
