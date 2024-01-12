<script setup lang="ts">
import type { TreatmentMachineGroup } from '~/types'
import { addTreatmentMachineGroup, deleteTreatmentMachineGroup, editTreatmentMachineGroup } from '~/utils'

const props = defineProps<{
  show: boolean
  selected: object
}>()

const emit = defineEmits(['close'])

const selected = ref<Partial<TreatmentMachineGroup>>({
  id: -1,
  groupName: '',
})

const { data: machineGroups, refresh: refreshGroups } = useLazyFetch('/api/treatment-parameters/machine-groups', {
  default: () => [],
})

async function handleAdd() {
  await addTreatmentMachineGroup(selected.value)
  await refreshGroups()
}
async function handleEdit() {
  await editTreatmentMachineGroup(selected.value)
  await refreshGroups()
}
async function handleDelete() {
  await deleteTreatmentMachineGroup(selected.value)
  await refreshGroups()
  selected.value = {
    id: -1,
    groupName: '',
  }
}
async function handleGroupClick(obj: TreatmentMachineGroup) {
  selected.value = obj
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
            v-model="selected.groupName"
            filled
            placeholder="Makine Grup Adı"
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
          <h3>Makine Grupları</h3>
          <q-list bordered separator>
            <q-item
              v-for="machineGroup in machineGroups"
              :key="machineGroup.id"
              v-ripple
              clickable
              @click="handleGroupClick(machineGroup)"
            >
              <q-item-section>
                {{ machineGroup.groupName }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div class="flex flex-row">
          <div>
            <h3>Seçilmiş Grubun Makineleri</h3>
            <q-list>
              <q-list-item>
                yil rf 400-1
              </q-list-item>
            </q-list>
          </div>
          <div>
            <h3>Seçilebilir Makineler</h3>
            <q-list>
              <q-list-item>
                batch download
              </q-list-item>
            </q-list>
          </div>
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
