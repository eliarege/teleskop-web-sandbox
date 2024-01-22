<script setup lang="ts">
import FilterableTable from 'ui/components/FilterableTable.vue'
import type { Column } from 'ui/types/FilterableTable'
import type { WaterType } from '~/types'

const columns: Column[] = [
  {
    name: 'waterTypeId',
    label: 'Su Tipi No',
    field: 'waterTypeId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'waterTypeName',
    label: 'Su Tipi İsmi',
    field: 'waterTypeName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]

const { data: waterTypes, refresh } = useLazyFetch('/api/water-types/water-types', {
  default: () => [],
  method: 'POST',
  body: {},
})

const selected = ref<WaterType>({
  waterTypeId: -1,
  waterTypeName: '',
})

async function handleAddWaterType() {
  await addWaterType(selected.value.waterTypeName)
  await refresh()
}

async function handleSelection(obj: WaterType) {
  if (selected.value.waterTypeId === obj.waterTypeId) {
    selected.value = {
      waterTypeId: -1,
      waterTypeName: '',
    }
  } else {
    selected.value = obj
  }
}

async function handleDeleteWaterTypes() {
  await deleteWaterTypes(selected.value)
  await refresh()
  selected.value = {
    waterTypeId: -1,
    waterTypeName: '',
  }
}

async function handleFilterSlotsUpdate(updatedValue) {
  waterTypes.value = await $fetch('/api/water-types/water-types', {
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
      <q-input v-model="selected.waterTypeName" label="Su Tipi İsmi" />
      <div class="flex flex-row input-field my-4">
        <q-btn
          label="Ekle"
          no-caps
          @click="handleAddWaterType()"
        />
        <q-btn
          label="Sil"
          no-caps
          @click="handleDeleteWaterTypes()"
        />
      </div>

      <FilterableTable
        v-model:selected="selected"
        :rows="waterTypes"
        :columns="columns"
        class="overflow-y-auto h-160"
        @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
      >
        <template #custombody="waterTypes">
          <q-tr
            :class="{ 'selected-row': selected.waterTypeId === waterTypes.row.waterTypeId }"
            @click="handleSelection(waterTypes.row)"
          >
            <q-td
              v-for="row in waterTypes.cols"
              :key="row"
            >
              <span>
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
.selected-row {
  background-color: #cce8ff;
}
.input-field > * {
  margin-right: 2em;
}
</style>
