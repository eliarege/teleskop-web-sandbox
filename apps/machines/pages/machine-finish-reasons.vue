<script setup lang="ts">
import type { Column } from 'nuxt-ui-types'
import type { FinishReason } from '~/types'

const { data: finishReasons, refresh } = useLazyFetch('/api/finish-reasons/finish-reasons', {
  default: () => [],
  method: 'POST',
  body: {},
})

const columns: Column[] = [
  {
    name: 'reasonId',
    label: 'ID',
    field: 'reasonId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'typeId',
    label: 'Tip',
    field: 'typeId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'text',
    label: 'Açıklama',
    field: 'text',
    align: 'left',
    filterable: true,
    filterType: 'includes',
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
async function handleSelection(obj: FinishReason) {
  if (finishReason.value.reasonId === obj.reasonId) {
    finishReason.value = {
      reasonId: '',
      typeId: '',
      text: '',
      reportToERP: false,
    }
  } else {
    finishReason.value.reasonId = obj.reasonId
    finishReason.value.text = obj.text
    finishReason.value.typeId = obj.typeId
  }
}

async function handleAddFinishReason() {
  await addFinishReason(finishReasons.value, finishReason.value.typeId.value, finishReason.value.text)
  await refresh()
}
async function handleDeleteFinishReasons() {
  await deleteFinishReasons(selectedReason.value)
  await refresh()
  selectedReason.value = []
}

async function handleEditFinishReason() {
  await editFinishReason(finishReason.value)
  await refresh()
}
async function handleFilterSlotsUpdate(updatedValue) {
  finishReasons.value = await $fetch('/api/finish-reasons/finish-reasons', {
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
      <FilterableTable
        v-model:selected="selectedReason"
        :rows="finishReasons"
        :columns="columns"
        class="overflow-y-auto h-160"
        @selection="(e) => handleSelection(e)"
        @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
      >
        <template #custombody="finishReasons">
          <q-tr
            :class="{ 'selected-row': finishReason.reasonId === finishReasons.row.reasonId }"
            @click="handleSelection(finishReasons.row)"
          >
            <q-td
              v-for="row in finishReasons.cols"
              :key="row"
            >
              <span v-if="row.field === 'typeId'">
                {{ typeIdMap[row.value] }}
              </span>
              <span v-else-if="row.field === 'reportToERP'">
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
.input-field > * {
  margin-right: 2em;
}
.selected-row {
  background-color: #cce8ff;
}
</style>
