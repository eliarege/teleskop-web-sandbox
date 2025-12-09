<script lang="ts" setup>
import type { QList } from 'quasar'
import { withBase } from 'ufo'
import type { MachineGroup } from '~/shared/types'
import { useMachineStatusStore } from '~/composables/machine'

const { t } = useI18n()
const route = useRoute()
const editor = useEditorStore()
const { fetch } = useKeycloak()
const machineStatusStore = useMachineStatusStore()

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
    await editor.changeMachine(id)
  } else {
    await navigateTo('/')
  }
}

const baseURL = useRuntimeConfig().app.baseURL

function openMachineInNewTab(machineId: number) {
  const path = withBase(`/machine/${machineId}`, baseURL)
  window.open(path, '_blank')
}

const thumbStyle = { opacity: '0' }
const currentMachine = ref()
const retryingMachine = ref<number | null>(null)

function isRetrying(machineId: number): boolean {
  return retryingMachine.value === machineId
}

async function retryMachineConnection(machineId: number, event: Event) {
  if (isRetrying(machineId))
    return

  event.stopPropagation()
  retryingMachine.value = machineId
  await machineStatusStore.checkMachineStatus(machineId, { notifyOnSuccess: true })
  retryingMachine.value = null
}
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
              <QItemSection
                v-if="machineStatusStore.isOffline(machine.id)"
                side
              >
                <QIcon
                  :name="isRetrying(machine.id) ? 'sync' : 'cloud_off'"
                  :class="{ rotating: isRetrying(machine.id) }"
                  color="warning"
                  size="16px"
                  class="cursor-pointer mr-1"
                  @click="retryMachineConnection(machine.id, $event)"
                >
                  <QTooltip>
                    {{ isRetrying(machine.id)
                      ? t('machine.connecting')
                      : `${t('machine.connectionFailed')} - ${t('clickToRetry')}` }}
                  </QTooltip>
                </QIcon>
              </QItemSection>
              <QMenu
                touch-position
                context-menu
              >
                <MachineListContextMenu :machine-id="currentMachine?.id" :machine-name="currentMachine?.name" />
              </QMenu>
            </QItem>
          </QExpansionItem>
        </template>
      </QList>
    </QScrollArea>
  </div>
</template>

<style scoped>
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotating {
  animation: rotate 1s linear infinite;
}
</style>
