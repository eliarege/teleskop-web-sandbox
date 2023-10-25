<script setup lang="ts">
import type { QTableColumn } from 'quasar'

const manualReasons = ref(await $fetch('/api/machine/manual-reasons'))

const columns: QTableColumn[] = [
  {
    name: 'manualReason',
    label: 'Manuel Sebebi',
    field: (row: any) => row.manualReason,
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
const newReasonName = ref()
const oldReasonName = ref()
const checkReportToERP = ref(false)
function handleSelection(obj: object) {
  newReasonName.value = obj.rows[0].manualReason
  oldReasonName.value = obj.rows[0].manualReason
  checkReportToERP.value = obj.rows[0].reportToERP
}

async function editManualReason() {
  await $fetch('/api/machine/edit-manual-reason', { method: 'PUT',
body: {
    oldManualReason: oldReasonName.value,
    newManualReason: newReasonName.value,
    reportToERP: checkReportToERP.value,
  } })
  const index = manualReasons.value.findIndex(m => m.manualReason === oldReasonName.value)
  if (index !== -1) {
    manualReasons.value[index].manualReason = newReasonName.value
    manualReasons.value[index].reportToERP = checkReportToERP.value
  }
}

async function addManualReason() {
  await $fetch('/api/machine/add-manual-reason', { method: 'POST',body: {
      manualId: manualReasons.value[manualReasons.value.length - 1].manualId + 1,
      newManualReason: newReasonName.value,
      reportToERP: checkReportToERP.value,
    } })

  manualReasons.value.push({ manualReason: newReasonName.value, reportToErp: checkReportToERP.value })
}

async function deleteManualReasons() {
  await $fetch('/api/machine/delete-manual-reasons', { method: 'POST', body: {
    manualIds: [selectedReason.value[0].manualId],
  } })
  manualReasons.value = manualReasons.value.filter(m => m !== selectedReason.value[0])
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
        v-model="newReasonName"
        label="Manuel Sebebi"
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
          @click="addManualReason()"
        />
        <q-btn
          label="Düzenle"
          no-caps
          @click="editManualReason()"
        />
        <q-btn
          label="Sil"
          no-caps
          @click="deleteManualReasons()"
        />
      </div>

      <q-table
        v-model:selected="selectedReason"
        :rows="manualReasons"
        :columns="columns"
        hide-pagination
        :pagination="{ rowsPerPage: 0 }"
        row-key="manualReason"
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
:deep .table-header>th {
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
