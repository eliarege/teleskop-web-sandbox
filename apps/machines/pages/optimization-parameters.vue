<script setup lang="ts">
const selectedOption = ref()
const showAddMachineGroupDialog = ref(false)
const showAddTreatmentParameterDialog = ref(false)
const selectedMachineGroup = ref(false)
const options = []

const { data: machineGroups } = useLazyFetch('/api/treatment-parameters/machine-groups', {
  default: () => [],
})

const { data: treatmentParameters } = useLazyFetch('/api/treatment-parameters/treatment-parameters', {
  default: () => [],
})
</script>

<template>
  <q-card>
    <q-card-section class="flex flex-col justify-between">
      <div class="flex flex-row justify-around">
        <div>
          <h3>Makine Grupları</h3>
          <q-icon name="add" @click="showAddMachineGroupDialog = true" />
          <q-list separator bordered>
            <q-item v-for="machineGroup in machineGroups" :key="machineGroup.groupId">
              <q-item-section>
                {{ machineGroup.groupName }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div>
          <h3>Parametre Listesi</h3>
          <q-icon name="add" @click="showAddTreatmentParameterDialog = true" />
          <q-list>
            <q-item v-for="param in treatmentParameters" :key="param.id">
              <q-item-section>
                {{ param.treatmentParameter }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div>
          <q-select
            v-model="selectedOption"
            :options="options"
            label="ERP Eşleştirme Alanı"
            filled
            class="w-xs"
          />
        </div>
      </div>
      <div>
        <q-table />
      </div>
    </q-card-section>
  </q-card>
  <AddMachineGroupDialog
    v-if="showAddMachineGroupDialog"
    :show="showAddMachineGroupDialog"
    :selected="selectedMachineGroup"
    @close="showAddMachineGroupDialog = false"
  />

  <AddTreatmentParameterDialog
    v-if="showAddTreatmentParameterDialog"
    :show="showAddTreatmentParameterDialog"
    @close="showAddTreatmentParameterDialog = false"
  />
</template>

<style scoped>

</style>
