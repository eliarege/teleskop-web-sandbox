<script setup lang="ts">
import FilterableTable from 'ui/components/FilterableTable.vue'
import type { Column } from 'ui/types/FilterableTable'
import { getMachineAccessFails } from '~/utils'

const accessFailOptions = ref([
  { label: 'Network erişimi yok', value: 0 },
  { label: 'Teleskop iletişimi yok', value: 1 },
  { label: 'Cihaz tarihi yanlış', value: 2 },
])

const columns: Column[] = [
  {
    name: 'machineName',
    label: 'Makine',
    field: 'machineName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'eventCode',
    label: 'Sebep',
    field: 'eventCode',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'eventStart',
    label: 'Başlangıç Tarihi',
    field: 'eventStart',
    align: 'left',
    filterable: true,
    filterType: 'date',
  },

  {
    name: 'eventEnd',
    label: 'Bitiş Tarihi',
    field: 'eventEnd',
    align: 'left',
    filterable: true,
    filterType: 'date',
  },
]

const machineGroups = ref([])
const accessFailGroups = ref([])
const fails = ref([])

const { data: machines } = useLazyFetch('/api/machines/machines')
const machineOptions = ref([])

watch(machines, (newValue, oldValue) => {
  machineOptions.value = machines.value.map((m) => {
    return { label: m.code, value: m.id }
  })
})

async function loadFails() {
  fails.value = await getMachineAccessFails(machineGroups.value, accessFailGroups.value)
}

async function handleFilterSlotsUpdate(updatedValue) {
  fails.value = await $fetch('/api/machine-access-fails/machine-access-fails', {
    method: 'POST',
    body: {
      machineIds: machineGroups.value,
      eventCodes: accessFailGroups.value,
      filters: updatedValue,
    },
  })
}
</script>

<template>
  <q-card class="flex flex-row">
    <q-card-section class="h-sm overflow-y-scroll">
      <h3>Makineler</h3>
      <q-option-group
        v-model="machineGroups"
        :options="machineOptions"
        type="checkbox"
      />
    </q-card-section>
    <q-card-section>
      <h3>Sebepler</h3>
      <q-option-group
        v-model="accessFailGroups"
        :options="accessFailOptions"
        type="checkbox"
      />
    </q-card-section>
    <q-btn @click="loadFails">
      Yükle
    </q-btn>
  </q-card>
  <div class="table-scroll">
    <FilterableTable
      :rows="fails"
      :columns="columns"
      @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
    >
      <template #custombody="fails">
        <q-tr>
          <q-td
            v-for="row in fails.cols"
            :key="row"
          >
            <span v-if="row.field === 'eventCode'">
              {{ accessFailOptions.find(o => o.value === row.value)?.label }}
            </span>
            <span v-else>
              {{ row.value }}
            </span>
          </q-td>
        </q-tr>
      </template>
    </filterabletable>
  </div>
</template>

<style scoped>

</style>
