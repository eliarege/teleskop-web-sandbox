<script setup lang="ts">
import type { Column } from 'nuxt-ui-types'
import type { StopReason } from '~/types'

const columns: Column[] = [
  {
    name: 'stopCode',
    label: 'Duruş ID',
    field: 'stopCode',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'stopName',
    label: 'Duruş Nedeni',
    field: 'stopName',
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

const { data: stopReasons, refresh } = useLazyFetch('/api/stop-reasons/stop-reasons', {
  default: () => [],
  method: 'POST',
  body: {},
})

const selected = ref<StopReason>({
  stopCode: -1,
  stopName: '',
  reportToERP: false,
})

function handleSelection(obj: StopReason) {
  if (selected.value.stopCode === obj.stopCode) {
    selected.value = {
      stopCode: -1,
      stopName: '',
      reportToERP: false,
    }
  } else {
    selected.value.stopCode = obj.stopCode
    selected.value.stopName = obj.stopName
    selected.value.reportToERP = obj.reportToERP
  }
}

async function handleEditStopReason() {
  await editStopReason(selected.value)
  await refresh()
}

async function handleAddStopReason() {
  await addStopReason(stopReasons.value, selected.value)
  await refresh()
}

async function handleDeleteStopReasons() {
  await deleteStopReasons(selected.value)
  await refresh()
  selected.value = {
    stopCode: -1,
    stopName: '',
    reportToERP: false,
  }
}

async function handleFilterSlotsUpdate(updatedValue) {
  stopReasons.value = await $fetch('/api/stop-reasons/stop-reasons', {
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
        v-model="selected.stopName"
        label="Duruş Nedeni"
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

      <FilterableTable
        v-model:selected="selected"
        :rows="stopReasons"
        :columns="columns"
        class="overflow-y-auto h-160"
        @selection="(e) => handleSelection(e)"
        @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
      >
        <template #custombody="stopReasons">
          <q-tr
            :class="{ 'selected-row': selected.stopCode === stopReasons.row.stopCode }"
            @click="handleSelection(stopReasons.row)"
          >
            <q-td
              v-for="row in stopReasons.cols"
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
.input-field > * {
  margin-right: 2em;
}
.selected-row {
  background-color: #cce8ff;
}
</style>
