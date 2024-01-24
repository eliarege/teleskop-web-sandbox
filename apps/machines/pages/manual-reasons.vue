<script setup lang="ts">
import type { Column } from 'ui/types/FilterableTable'
import FilterableTable from 'ui/components/FilterableTable.vue'
import { editManualReason } from '~/utils'
import type { ManualReason } from '~/types'

const columns: Column[] = [
  {
    name: 'manualId',
    label: 'Manual Id',
    field: 'manualId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'manualReason',
    label: 'Manuel Sebebi',
    field: 'manualReason',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'reportToERP',
    label: 'ERP Arıza Bildirimi',
    field: 'reportToERP',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]

const { data: manualReasons, refresh } = useLazyFetch('/api/manual-reasons/manual-reasons', {
  default: () => [],
  method: 'POST',
  body: {},
})

const selected = ref<ManualReason>({
  manualId: -1,
  manualReason: '',
  reportToERP: false,
})

function handleSelection(obj: ManualReason) {
  selected.value = { ...obj }
}

async function handleEditManualReason() {
  await editManualReason(selected.value)
  await refresh()
}

async function handleAddManualReason() {
  await addManualReason(manualReasons.value, selected.value)
  await refresh()
}

async function handleDeleteManualReasons() {
  await deleteManualReasons(selected.value)
  await refresh()
  selected.value = {
    manualId: -1,
    manualReason: '',
    reportToERP: false,
  }
}
async function handleFilterSlotsUpdate(updatedValue) {
  manualReasons.value = await $fetch('/api/manual-reasons/manual-reasons', {
    method: 'POST',
    body: {
      filters: updatedValue,
    },
  })
}
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="flex flex-row justify-between">
        <h3>
          Cihaz versiyonu 3.6 veya daha eski ise ilk 20 manuele alma nedeni
          cihazda kullanılabilir.
        </h3>
      </div>

      <q-input
        v-model="selected.manualReason"
        label="Manuel Sebebi"
        filled
        class="w-xs"
      />

      <div class="flex flex-row input-field my-4">
        <q-checkbox
          v-model="selected.reportToERP"
          label="ERP Sistemine Arıza Olarak Bildir"
        />
        <q-btn
          label="Ekle"
          no-caps
          @click="handleAddManualReason()"
        />
        <q-btn
          label="Düzenle"
          no-caps
          @click="handleEditManualReason()"
        />
        <q-btn
          label="Sil"
          no-caps
          @click="handleDeleteManualReasons()"
        />
      </div>
      <FilterableTable
        v-model:selected="selected"
        :rows="manualReasons"
        :columns="columns"
        class="overflow-y-auto h-160"
        @selection="(e) => handleSelection(e)"
        @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
      >
        <template #custombody="manualReasons">
          <q-tr
            :class="{ 'selected-row': selected.manualId === manualReasons.row.manualId }"
            @click="handleSelection(manualReasons.row)"
          >
            <q-td
              v-for="row in manualReasons.cols"
              :key="row"
            >
              <span v-if="row.field === 'reportToERP'">
                {{ row.value ? "Evet" : "Hayır" }}
              </span>
              <span v-else>
                {{ row.value }}
              </span>
            </q-td>
          </q-tr>
        </template>
      </FilterableTable>
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
.selected-row {
  background-color: #cce8ff;
}
</style>
