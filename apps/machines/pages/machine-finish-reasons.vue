<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { FinishReason } from '~/types'
import { getFinishReasons } from '~/utils'

const finishReasons = ref(await getFinishReasons())

const columns: QTableColumn<FinishReason>[] = [
  {
    name: 'reasonID',
    label: 'ID',
    field: row => row.reasonId,
    align: 'left',
  },
  {
    name: 'type',
    label: 'Tip',
    field: row => row.typeId,
    align: 'left',
  },
  {
    name: 'text',
    label: 'Açıklama',
    field: row => row.text,
    align: 'left',
  },
]

const selectedReason = ref([])
const finishReason = ref<FinishReason>({
  reasonId: '',
  typeId: '',
  text: '',
  reportToERP: false,
})

const finishOptions = [{ label: 'Bitir', value: 3 }, { label: 'Atla', value: 4 }, { label: 'Makine Duraklatma', value: 5 }]
const typeIdMap = {
  3: 'Bitir',
  4: 'Atla',
  5: 'Makine Duraklatma',
}
async function handleSelection(obj: object) {
  if (obj.added) {
    finishReason.value.reasonId = obj.rows[0].reasonId
    finishReason.value.text = obj.rows[0].text
    finishReason.value.typeId = obj.rows[0].typeId
  } else {
    finishReason.value = {
      reasonId: '',
      typeId: '',
      text: '',
      reportToERP: false,
    }
  }
  console.log('finishReason.value = ', finishReason.value)
}

async function handleAddFinishReason() {
  await addFinishReason(finishReasons.value, finishReason.value.typeId.value, finishReason.value.text)
}
async function handleDeleteFinishReasons() {
  await deleteFinishReasons(selectedReason.value)
}

async function handleEditFinishReason() {
  await editFinishReason(finishReason.value)
}
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="flex flex-row justify-start input-field">
        <q-input
          v-model="finishReason.text"
          label="Açıklama"
          filled
          class="w-xs"
        />
        <q-select
          v-model="finishReason.typeId"
          :options="finishOptions"
          label="Kullanıcı Tipi"
          filled
          class="w-xs"
          :display-value="typeIdMap[finishReason.typeId]"
        />
      </div>

      <div class="flex flex-row input-field my-4">
        <q-btn
          label="Ekle"
          no-caps
          @click="handleAddFinishReason()"
        />
        <q-btn
          label="Düzenle"
          no-caps
          @click="handleEditFinishReason()"
        />
        <q-btn
          label="Sil"
          no-caps
          @click="handleDeleteFinishReasons()"
        />
      </div>

      <q-table
        v-model:selected="selectedReason"
        :rows="finishReasons"
        :columns="columns"
        hide-pagination
        :pagination="{ rowsPerPage: 0 }"
        row-key="reasonId"
        separator="cell"
        bordered
        selection="single"
        table-header-class="table-header"
        @selection="(e) => handleSelection(e)"
      >
        <template #body-cell-type="props">
          <q-td :props="props">
            {{ typeIdMap[props.row.typeId] }}
          </q-td>
        </template>
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
