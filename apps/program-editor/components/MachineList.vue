<script lang="ts" setup>
import type { QList } from 'quasar'
import type { MachineGroup, MachineInfo } from '~/shared/types'

const route = useRoute()
const editor = useEditorStore()
const { dark } = useQuasar()

const { data: machineGroups } = useFetch<MachineGroup[]>('/api/machine-group')
const { data: machines } = useFetch<MachineInfo[]>('/api/machine')

const machineGroupsWithMachines = computed(() => {
  if (!machineGroups.value || !machines.value)
    return []

  return machineGroups.value.map(group => ({
    ...group,
    machines: machines.value!.filter(machine => machine.groupId === group.groupId),
  }))
})

watch(() => [machineGroupsWithMachines.value.length, route.path], () => {
  if (route.path === '/') {
    const firstMachine = machineGroupsWithMachines.value.find(group => group.machines.length)?.machines[0]
    if (firstMachine)
      editor.changeMachine(firstMachine.id)
  }
}, { immediate: true })

async function onUpdateSelected(selection: string) {
  editor.program = editor.createProgram()

  if (selection) {
    const id = Number.parseInt(selection.split('-')[1])
    editor.changeMachine(id)
  } else {
    await navigateTo('/')
  }
}

const thumbStyle = { opacity: '0' }
</script>

<template>
  <div class="q-pa-md select-none">
    <QScrollArea
      :thumb-style="thumbStyle"
      style="height: calc(100vh - 80px); max-width: 400px;"
    >
      <QList
        dense
        borderless
      >
        <template v-for="group in machineGroupsWithMachines" :key="group.groupId">
          <QExpansionItem
            v-if="group.machines && group.machines.length > 0"
            :label="group.name"
            default-opened
            :header-class="dark.isActive ? 'bg-grey-9 text-white' : 'bg-gray-2 text-black'"
            borderless
            dense
          >
            <QItem
              v-for="machine in group.machines"
              :key="machine.id"
              v-ripple
              :active="route.params.machine_id === `${machine.id}`"
              active-class="e-selected"
              :class="dark.isActive ? ' text-gray-3' : 'text-gray-8'"
              borderless
              clickable
              dense
              @click="onUpdateSelected(`${machine.groupId}-${machine.id}`)"
            >
              <QItemSection dense>
                {{ machine.name }}
              </QItemSection>
            </QItem>
          </QExpansionItem>
        </template>
      </QList>
    </QScrollArea>
  </div>
</template>
