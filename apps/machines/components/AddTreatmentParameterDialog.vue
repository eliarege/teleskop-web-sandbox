<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import type { TreatmentMachineGroup, TreatmentParameter } from '~/types'
import { addTreatmentMachineGroup, addTreatmentParameter, deleteTreatmentMachineGroup, deleteTreatmentParameter, editTreatmentMachineGroup, editTreatmentParameter, updateMachineGroupMachines } from '~/utils'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])

const { t } = useI18n()

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
    @hide="$emit('close')"
  >
    <q-card class="w-2xl">
      <q-card-section class="flex flex-col">
        <div class="flex flex-col gap-4">
          <q-input
            v-model="selected.treatmentParameter"
            filled
            placeholder="Parametre Adı"
          />
          <div class="flex gap-4">
            <q-btn
              no-caps
              :label="t('add')"
              @click="handleAdd"
            />
            <q-btn
              no-caps
              :label="t('edit')"
              @click="handleEdit"
            />
            <q-btn
              no-caps
              :label="t('delete')"
              @click="handleDelete"
            />
          </div>
        </div>
        <div class="my-4">
          <h3>{{ t('parameterList') }}</h3>
          <q-list bordered separator>
            <q-item
              v-for="param in params"
              :key="param.id"
              v-ripple
              clickable
              :active="selected === param"
              :focused="selected === param"
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
