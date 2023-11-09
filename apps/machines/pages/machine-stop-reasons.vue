<script setup lang="ts">
import type { QTableColumn } from 'quasar'

const { data: stopReasons, pending, refresh } = useLazyFetch('/api/stop-reasons/stop-reasons', { default: () => [] })

const columns: QTableColumn[] = [
  {
    name: 'stopName',
    label: 'Duruş Nedeni',
    field: (row: any) => row.stopName,
    align: 'left',
  },
  {
    name: 'reportToERP',
    label: 'ERP Arıza Bildirimi',
    field: (row: any) => row.reportToERP,
    align: 'left',
  },
]
const selectedReason = ref([])
const newStopName = ref()
const oldStopName = ref()
const checkReportToERP = ref(false)

function handleSelection(obj: object) {
  newStopName.value = obj.rows[0].stopName
  oldStopName.value = obj.rows[0].stopName
  checkReportToERP.value = obj.rows[0].reportToERP
}

async function handleEditStopReason() {
  await editStopReason(oldStopName.value, newStopName.value, checkReportToERP.value)
  await refresh()
}

async function handleAddStopReason() {
  await addStopReason(stopReasons.value, newStopName.value, checkReportToERP.value)
  await refresh()
}

async function handleDeleteStopReasons() {
  await deleteStopReasons(selectedReason.value)
  await refresh()
  selectedReason.value = []
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
        v-model="newStopName"
        label="Duruş Nedeni"
        filled
        class="w-xs"
      />

      <div class="flex flex-row input-field my-4">
        <q-checkbox
          v-model="checkReportToERP"
          label="ERP Sistemine Arıza Olarak Bildir"
        />
        <q-btn
          label="Ekle"
          no-caps
          @click="handleAddStopReason()"
        />
        <q-btn
          label="Düzenle"
          no-caps
          @click="handleEditStopReason()"
        />
        <q-btn
          label="Sil"
          no-caps
          @click="handleDeleteStopReasons()"
        />
      </div>

      <q-table
        v-model:selected="selectedReason"
        :rows="stopReasons"
        :loading="pending"
        :columns="columns"
        hide-pagination
        :pagination="{ rowsPerPage: 0 }"
        row-key="stopCode"
        separator="cell"
        bordered
        selection="single"
        table-header-class="table-header"
        @selection="(e) => handleSelection(e)"
      >
        <template #body-cell-reportToERP="props">
          <q-td :props="props">
            <span v-if="props.row.reportToERP">
              Evet
            </span>
            <span v-else>
              Hayır
            </span>
          </q-td>
        </template>
      </q-table>
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
