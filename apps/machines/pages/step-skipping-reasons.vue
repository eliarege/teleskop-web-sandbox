<script setup lang="ts">
import type { Column } from 'ui/types/FilterableTable'
import FilterableTable from 'ui/components/FilterableTable.vue'
import { addStepSkippingReason, deleteStepSkippingReason, editStepSkippingReason, getWaterTypes } from '~/utils'
import type { StepReason } from '~/types'

const columns: Column[] = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'reasonText',
    label: 'Atlatma Nedeni',
    field: 'reasonText',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]

const { data: stepSkippingReasons, refresh } = useLazyFetch('/api/step-skipping-reasons/step-skipping-reasons', {
  default: () => [],
  method: 'POST',
  body: {},
})

const selected = ref<StepReason>({
  id: undefined,
  reasonText: '',
})

const oldId = ref()

async function handleReasonAdd() {
  await addStepSkippingReason(selected.value)
  await refresh()
}

function handleSelection(obj: StepReason) {
  selected.value = obj
  oldId.value = obj.id
}

async function handleReasonEdit() {
  await editStepSkippingReason(selected.value, oldId.value)
  await refresh()
}

async function handleReasonDelete() {
  await deleteStepSkippingReason(selected.value)
  await refresh()
  selected.value = {
    id: undefined,
    reasonText: '',
  }
}
async function handleFilterSlotsUpdate(updatedValue) {
  stepSkippingReasons.value = await $fetch('/api/step-skipping-reasons/step-skipping-reasons', {
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
      <div class="input-field flex flex-row">
        <q-input v-model="selected.id" label="Numara" />
        <q-input v-model="selected.reasonText" label="Atlatma Nedeni" />
      </div>
      <div class="flex flex-row input-field my-4">
        <q-btn
          label="Ekle"
          no-caps
          @click="handleReasonAdd"
        />
        <q-btn
          label="Düzenle"
          no-caps
          @click="handleReasonEdit"
        />
        <q-btn
          label="Sil"
          no-caps
          @click="handleReasonDelete"
        />
      </div>

      <FilterableTable
        v-model:selected="selected"
        :rows="stepSkippingReasons"
        :columns="columns"
        class="overflow-y-auto h-160"
        @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
      >
        <template #custombody="stepSkippingReasons">
          <q-tr
            :class="{ 'selected-row': selected.id === stepSkippingReasons.row.id }"
            @click="handleSelection(stepSkippingReasons.row)"
          >
            <q-td
              v-for="row in stepSkippingReasons.cols"
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
.input-field > * {
  margin-right: 2em;
}
.selected-row {
  background-color: #cce8ff;
}
</style>
