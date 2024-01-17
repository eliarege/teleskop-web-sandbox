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

/*
SELECT map.PARAMID ,map.GROUPID ,map.COMMANDNO ,map.PARAMETERINDEX, prm.TREATMENTPARAMETER, grp.GROUPNAME, mach.MACHINEID, cmd.NAME, cmdPrm.PARAMSTRING FROM BFTREATMENTPARAMGROUPMAP map
LEFT JOIN BFTREATMENTPARAMETERS prm ON map.PARAMID = prm.ID
LEFT JOIN BFTREATMENTPARAMETERGROUPS grp ON map.GROUPID = grp.ID
OUTER APPLY ( SELECT TOP 1 g.MACHINEID FROM BFTREATMENTPARAMETERGROUPMACHINES g WHERE g.GROUPID = map.GROUPID ) as mach
LEFT JOIN BFMASTERCOMMANDS cmd ON mach.MACHINEID = cmd.MACHINEID AND cmd.COMMANDNO = map.COMMANDNO
LEFT JOIN BFCOMMANDPARAMETERS cmdPrm ON mach.MACHINEID = cmdPrm.MACHINEID AND cmdPrm.COMMANDNO = map.COMMANDNO AND cmdPrm.PARAMETERINDEX = map.PARAMETERINDEX
ORDER BY map.GROUPID, map.PARAMID ,map.COMMANDNO ,map.PARAMETERINDEX ASC
*/
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
