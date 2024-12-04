<script lang="ts" setup>
import type { QList } from 'quasar'
import type { MachineGroup } from '~/shared/types'

const route = useRoute()
const editor = useEditorStore()
const $q = useQuasar()
const { dark } = useQuasar()
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
      $commandManager.executeCommand('discardChanges', { $q }, id)
    else
      await editor.changeMachine(id)
  } else {
    await navigateTo('/')
  }
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
              @contextmenu.prevent="currentMachine = machine"
            >
              <QItemSection dense>
                {{ machine.name }}
              </QItemSection>
              <q-menu
                touch-position
                context-menu
              >
                <MachineListContextMenu :machine-id="currentMachine?.id" />
              </q-menu>
            </QItem>
          </QExpansionItem>
        </template>
      </QList>
    </QScrollArea>
  </div>
</template>
