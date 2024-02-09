<script setup lang="ts">
const selectedOption = ref()
const showAddMachineGroupDialog = ref(false)
const showAddTreatmentParameterDialog = ref(false)
const selectedMachineGroup = ref()
const selectedParameter = ref()
const options = []

const { data: machineGroups } = useLazyFetch('/api/treatment-parameters/machine-groups', {
  default: () => [],
})

const { data: treatmentParameters } = useLazyFetch('/api/treatment-parameters/treatment-parameters', {
  default: () => [],
})

const { data: commandParameters } = useLazyFetch('/api/treatment-parameters/command-parameters', {
  default: () => [],
  immediate: false,
  method: 'POST',
  body: selectedMachineGroup,
})

const { data: matchedTreatments, refresh } = useLazyFetch('/api/treatment-parameters/treatment-map', {
  default: () => [],
})

async function handleAdd() {
  await $fetch('/api/treatment-parameters/treatment-map', {
    method: 'POST',
    body: {
      paramId: selectedParameter.value.id,
      groupId: selectedMachineGroup.value.id,
      commandNo: selectedOption.value.COMMANDNO,
      parameterIndex: selectedOption.value.PARAMETERINDEX,
    },
  })
  await refresh()
}
</script>

<template>
  <q-card>
    <q-card-section class="flex flex-col justify-between">
      <div class="flex flex-row justify-around">
        <div>
          <h3>Makine Grupları</h3>
          <q-icon name="add" @click="showAddMachineGroupDialog = true" />
          <q-list separator bordered>
            <q-item
              v-for="machineGroup in machineGroups"
              :key="machineGroup.groupId"
              v-ripple
              clickable
              :focused="selectedMachineGroup === machineGroup"
              :active="selectedMachineGroup === machineGroup"
              @click="selectedMachineGroup = machineGroup"
            >
              <q-item-section>
                {{ machineGroup.groupName }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div>
          <h3>Parametre Listesi</h3>
          <q-icon name="add" @click="showAddTreatmentParameterDialog = true" />
          <q-list bordered separator>
            <q-item
              v-for="param in treatmentParameters"
              :key="param.id"
              v-ripple
              clickable
              :focused="selectedParameter === param"

              :active="selectedParameter === param"
              @click="selectedParameter = param"
            >
              <q-item-section>
                {{ param.treatmentParameter }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div>
          <q-select
            v-model="selectedOption"
            :options="commandParameters"
            label="ERP Eşleştirme Alanı"
            filled
            class="w-sm"
            :display-value="`${selectedOption ? `${selectedOption.NAME} - ${selectedOption.PARAMSTRING}` : ''}`"
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.NAME }} - {{ scope.opt.PARAMSTRING }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-btn label="Ekle" @click="handleAdd" />
        </div>
      </div>
      <div>
        <q-table
          :rows="matchedTreatments"
        />
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
