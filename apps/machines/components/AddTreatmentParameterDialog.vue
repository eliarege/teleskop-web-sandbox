<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import type { TreatmentMachineGroup, TreatmentParameter } from '~/types'
import { addTreatmentMachineGroup, addTreatmentParameter, deleteTreatmentMachineGroup, deleteTreatmentParameter, editTreatmentMachineGroup, editTreatmentParameter, updateMachineGroupMachines } from '~/utils'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])

const selected = ref<Partial<TreatmentParameter>>({
  id: -1,
  treatmentParameter: '',
})

const selectedGroupId = ref(-1)

const { data: params, refresh: refreshParams } = useLazyFetch('/api/treatment-parameters/treatment-parameters', {
  default: () => [],
})

async function handleAdd() {
  await addTreatmentParameter(selected.value)
  await refreshParams()
}
async function handleEdit() {
  await editTreatmentParameter(selected.value)
  await refreshParams()
}
async function handleDelete() {
  await deleteTreatmentParameter(selected.value)
  await refreshParams()
  selected.value = {
    id: -1,
    treatmentParameter: '',
  }
}
async function handleGroupClick(obj: TreatmentMachineGroup) {
  selected.value = obj
  selectedGroupId.value = obj.id
}
</script>

<template>
  <q-dialog
    :model-value="show"
    full-width
    @hide="$emit('close')"
  >
    <q-card>
      <q-card-section class="flex flex-col">
        <div>
          <q-input
            v-model="selected.treatmentParameter"
            filled
            placeholder="Parametre Adı"
          />
          <q-btn
            no-caps
            label="Ekle"
            @click="handleAdd"
          />
          <q-btn
            no-caps
            label="Düzenle"
            @click="handleEdit"
          />
          <q-btn
            no-caps
            label="Sil"
            @click="handleDelete"
          />
        </div>
        <div>
          <h3>Parametre Listesi</h3>
          <q-list bordered separator>
            <q-item
              v-for="param in params"
              :key="param.id"
              v-ripple
              clickable
              @click="handleGroupClick(param)"
            >
              <q-item-section>
                {{ param.treatmentParameter }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.input-field > * {
  margin-right: 2em;
}
</style>
