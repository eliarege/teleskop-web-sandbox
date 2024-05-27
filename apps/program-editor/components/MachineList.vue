<script lang="ts" setup>
import type { QList } from 'quasar'
import type { MachineGroup, MachineInfo } from '~/shared/types'

const route = useRoute()

const { data: machineGroup } = useFetch<MachineGroup[]>('/api/machine-group')
const { data: allMachine } = useFetch<MachineInfo[]>('/api/machine')

const MACHINE_PATH_RE = /^\/machine\/\d+$/

const machineGroups = computed(() => {
  if (!machineGroup.value || !allMachine.value)
    return []

  return machineGroup.value.map(group => ({
    ...group,
    machines: allMachine.value?.filter(machine => machine.groupId === group.groupId),
  }))
})

async function onUpdateSelected(selection: string) {
  const editor = useEditorStore()
  editor.machineCommands.clear()
  if (selection) {
    const id = Number.parseInt(selection.split('-')[1])
    // Replace only if navigating from /machine/:id
    const replace = MACHINE_PATH_RE.test(route.path)
    await navigateTo({
      path: `/machine/${id}`,
      replace,
    })
  } else {
    await navigateTo('/')
  }
}

const thumbStyle = { opacity: 0 }
</script>

<template>
  <div class="q-pa-md">
    <QScrollArea
      horizontal
      :thumb-style="thumbStyle"
      style="height: calc(100vh - 80px); max-width: 400px;"
    >
      <QList
        dense
        borderless
      >
        <template v-for="group in machineGroups" :key="group.groupId">
          <QExpansionItem
            v-if="group.machines && group.machines.length > 0"
            :label="group.name"
            default-opened
            header-class="bg-gray-2 text-black"
            borderless
            dense
          >
            <QItem
              v-for="machine in group.machines"
              :key="machine.id"
              v-ripple
              :active="route.params.machine_id === `${machine.id}`"
              active-class="bg-blue-3 text-black"
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
