<script setup lang="ts">
import type { MachineStatus } from '~/shared/types'

const { data: machines } = await useFetch('/api/machineList', {
  default: () => [],
})

const { data: erpParameters } = await useFetch('/api/settings/erpParameters', {
  default: () => [],
  query: { distinct: true },
})
const modifiedParameters = computed(() => erpParameters.value.toSorted((a, b) => a.paramId > b.paramId ? 1 : -1))
const selected = ref()

const validMachines = ref([] as MachineStatus[])

const groups = ref([] as string[])
const selectedMachines = ref([] as number[])

async function setValidMachines(paramString: string) {
  groups.value = []
  selectedMachines.value = []
  selected.value = paramString
  const machinesByErpParam = await $fetch('/api/settings/erpParameters/machinesByErpParam', {
    query: { paramString },
  })
  const selectedMachinesList = await $fetch('/api/settings/erpParameters/getSelectedMachines', {
    query: { paramString },
  })
  selectedMachines.value = selectedMachinesList
  validMachines.value = machinesByErpParam

  const groupMap = new Map<string, number[]>()

  validMachines.value.forEach((machine) => {
    if (!groupMap.has(machine.groupName)) {
      groupMap.set(machine.groupName, [])
    }
    groupMap.get(machine.groupName)!.push(machine.id)
  })

  groupMap.forEach((machineIds, groupName) => {
    const allSelected = machineIds.every(id => selectedMachines.value.includes(id))
    if (allSelected) {
      groups.value.push(groupName)
    }
  })
}

const groupedMachines = computed(() => {
  const groupsRecord: Record<string, MachineStatus[]> = {}
  validMachines.value.forEach((machine) => {
    const group = machine.groupName
    if (!groupsRecord[group]) {
      groupsRecord[group] = []
    }
    groupsRecord[group].push(machine)
  })
  return Object.values(groupsRecord).map(group => group)
})
function selectMachine(id: number) {
  if (!selectedMachines.value.includes(id)) {
    selectedMachines.value.push(id)
  }
}
function deselectMachine(id: number) {
  const idx = selectedMachines.value.indexOf(id)
  selectedMachines.value.splice(idx, 1)
}
async function customModelValue(group: string) {
  const idList = machines.value.filter(m => m.groupName === group).map(m => m.id)
  if (groups.value.includes(group)) {
    idList.forEach((machine) => {
      deselectMachine(machine)
    })
    const idx = groups.value.indexOf(group)
    groups.value.splice(idx, 1)
  } else {
    idList.forEach((machine) => {
      selectMachine(machine)
    })
    groups.value.push(group)
  }
}
async function saveParameters() {
  await $fetch('/api/settings/erpParameters/bulkAddErpParameters', {
    body: { paramString: selected.value, machines: selectedMachines.value },
    method: 'PUT',
  })
}
</script>

<template>
  <div class="wrapper">
    <div>
      <q-list
        dense
        bordered
        padding
        class="max-h-100 overflow-auto"
      >
        <q-item
          v-for="item in modifiedParameters"
          :key="item.paramId"
          v-ripple
          :active="selected === item.paramName"
          clickable
          @click="setValidMachines(item.paramName)"
        >
          <q-item-section>
            {{ item.paramName }}
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <q-space />
    <div class="max-h-100 overflow-auto">
      <div v-for="(group, idx) in groupedMachines" :key="idx">
        <SettingsGroupedMachineSelector
          v-model:selectedGroup="groups"
          v-model:selectedMachine="selectedMachines"
          :group="group[0].groupName"
          :machines="group"
          @selected-group="customModelValue(group[0].groupName)"
        />
      </div>
    </div>
  </div>
  <div class="w-full flex px-3">
    <q-space />
    <q-btn
      color="primary"
      label="Save"
      @click="saveParameters()"
    />
  </div>
</template>

<style scoped lang="postcss">
.wrapper {
  grid-template-columns: 1fr 0.1fr 1fr;
  @apply grid gap-2 p-3;
}
</style>
