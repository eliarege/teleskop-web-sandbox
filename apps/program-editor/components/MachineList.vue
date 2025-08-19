<script lang="ts" setup>
import type { QList } from 'quasar'
import type { MachineGroup } from '~/shared/types'

const route = useRoute()
const editor = useEditorStore()
const $q = useQuasar()
const { fetch } = useKeycloak()
const { $commandManager } = useNuxtApp()

const machineGroups = await fetch<MachineGroup[]>('/api/machine-group')

// İlk makineyi otomatik olarak seçer
watch(() => [machineGroups.length, route.path], () => {
  if (route.path === '/') {
    const firstMachine = machineGroups.find(group => group.machines.length)?.machines[0]
    if (firstMachine)
      editor.changeMachine(firstMachine.id)
  }
}, { immediate: true })

async function onUpdateSelected(selection: string) {
  if (selection) {
    const id = Number.parseInt(selection.split('-')[1])
    const hasChanged = editor.hasProgramChanged()
    if (hasChanged)
      $commandManager.executeCommand('unsavedChanges', { $q }, id)
    else
      await editor.changeMachine(id)
  } else {
    await navigateTo('/')
  }
}

function openMachineInNewTab(machineId: number) {
  window.open(`/machine/${machineId}`, '_blank')
}

const thumbStyle = { opacity: '0' }
const currentMachine = ref()
</script>

<template>
  <div class="q-pa-md select-none">
    <QScrollArea
      :thumb-style="thumbStyle"
      style="height: calc(100vh - 80px); max-width: 400px;"
    >
      <QList
        id="machine-list"
        dense
        borderless
      >
        <template
          v-for="group in machineGroups"
          :key="group.groupId"
        >
          <QExpansionItem
            v-if="group.machines && group.machines.length > 0"
            :label="group.name"
            default-opened
            header-class="bg-light-9 dark:bg-dark-1 text-gray-8 dark:text-gray-3"
            borderless
            dense
          >
            <QItem
              v-for="machine in group.machines"
              :key="machine.id"
              v-ripple
              :active="route.params.machine_id === `${machine.id}`"
              active-class="e-selected"
              class="text-gray-8 dark:text-gray-3"
              borderless
              clickable
              dense
              @click="onUpdateSelected(`${machine.groupId}-${machine.id}`)"
              @contextmenu.prevent="currentMachine = machine"
              @mousedown.middle="openMachineInNewTab(machine.id)"
            >
              <QItemSection dense>
                {{ machine.name }}
              </QItemSection>
              <QMenu
                touch-position
                context-menu
              >
                <MachineListContextMenu :machine-id="currentMachine?.id" />
              </QMenu>
            </QItem>
          </QExpansionItem>
        </template>
      </QList>
    </QScrollArea>
  </div>
</template>
