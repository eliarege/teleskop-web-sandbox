<script setup lang="ts">
import type { QTableColumn } from 'quasar'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])

const manualReasons = ref(await $fetch('/api/machine/manual-reasons'))
console.log('manualReasons = ', manualReasons)

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
const selectedReason = ref()
const newReasonName = ref()
const oldReasonName = ref()
const checkReportToERP = ref(false)
function handleSelection(obj: object) {
  newReasonName.value = obj.rows[0].manualReason
  oldReasonName.value = obj.rows[0].manualReason
  checkReportToERP.value = obj.rows[0].reportToERP
}

async function editManualReason() {
  await $fetch('/api/machine/edit-manual-reason', { method: 'PUT',body: {
      oldManualReason: oldReasonName.value,
      newManualReason: newReasonName.value,
      reportToERP: checkReportToERP.value,
    } })
}
</script>

<template>
  <q-dialog
    v-close-popup
    :model-value="show"
    full-width
    @hide="$emit('close')"
  >
    <q-card>
      <q-card-section>
        <div class="flex flex-row justify-between">
          <h3>
            Cihaz versiyonu 3.6 veya daha eski ise ilk 20 manuele alma nedeni
            cihazda kullanılabilir.
          </h3>
          <q-btn
            v-close-popup
            icon="close"
            flat
            round
            dense
          />
        </div>

        <q-input
          v-model="newReasonName"
          label="Manuel Sebebi"
          filled
        />

        <div>
          <q-checkbox
            v-model="checkReportToERP"
            label="ERP Sistemine Arıza Olarak Bildir"
          />
          <q-btn
            label="Ekle"
            no-caps
          />
          <q-btn
            label="Düzenle"
            no-caps
            @click="editManualReason()"
          />
          <q-btn
            label="Kaydet"
            no-caps
          />
          <q-btn
            label="Sil"
            no-caps
          />
          <q-btn
            label="İptal"
            no-caps
          />
        </div>

        <q-table
          v-model:selected="selectedReason"
          :rows="manualReasons"
          :columns="columns"
          hide-pagination
          row-key="manualReason"
          separator="cell"
          bordered
          selection="single"
          table-header-class="table-header"
          @selection="(e) => handleSelection(e)"
        />
        <q-btn
          @click="$emit('close')"
        >
          close
        </q-btn>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
:deep .table-header>th {
  font-weight: bold;
}
.table-scroll {
  max-height: 45em;
  overflow-y: auto;
}
</style>
