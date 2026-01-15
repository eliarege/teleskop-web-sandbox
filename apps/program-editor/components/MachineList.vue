<script lang="ts" setup>
import type { QList } from 'quasar'
import { withBase } from 'ufo'
import type { MachineGroup } from '~/shared/types'
import { useMachineStatusStore } from '~/composables/machine'

const props = defineProps<{
  machineGroups: MachineGroup[]
}>()

const { t } = useI18n()
const route = useRoute()
const editor = useEditorStore()
const machine = useMachineStore()
const machineStatusStore = useMachineStatusStore()

async function onUpdateSelected(selection: string) {
  if (selection) {
    const id = Number.parseInt(selection.split('-')[1])
    await machine.changeMachine(id)
    editor.resetProgram()
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

function isRetrying(machineId: number): boolean {
  return machineStatusStore.isChecking(machineId)
}

async function retryMachineConnection(machineId: number, machineName: string, event: Event) {
  if (isRetrying(machineId))
    return

  event.stopPropagation()
  await machineStatusStore.checkMachineStatus(machineId, machineName, { notifyOnSuccess: true })
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
          v-for="group in props.machineGroups"
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
              v-for="machineItem in group.machines"
              :key="machineItem.id"
              v-ripple
              :active="route.params.machine_id === `${machineItem.id}`"
              active-class="e-selected"
              class="text-gray-8 dark:text-gray-3"
              borderless
              clickable
              dense
              :disable="machineItem.disabled"
              @click="onUpdateSelected(`${machineItem.groupId}-${machineItem.id}`)"
              @contextmenu.prevent="currentMachine = machineItem"
              @mousedown.middle="openMachineInNewTab(machineItem.id)"
            >
              <q-tooltip
                v-if="machineItem.disabled && machineItem.usability"
              >
                {{ t(`machine.unusableReason.${machineItem.usability}`) }}
              </q-tooltip>

              <QItemSection dense>
                {{ machineItem.name }}
              </QItemSection>
              <QItemSection
                v-if="machineStatusStore.isOffline(machineItem.id) || machineStatusStore.isChecking(machineItem.id)"
                side
              >
                <QIcon
                  :name="isRetrying(machineItem.id) ? 'sync' : 'cloud_off'"
                  :class="{ rotating: isRetrying(machineItem.id) }"
                  color="warning"
                  size="16px"
                  class="cursor-pointer mr-1"
                  @click="retryMachineConnection(machineItem.id, machineItem.name, $event)"
                >
                  <QTooltip>
                    {{ isRetrying(machineItem.id)
                      ? t('machine.connecting')
                      : `${t('machine.connectionFailed')} - ${t('clickToRetry')}` }}
                  </QTooltip>
                </QIcon>
              </QItemSection>
              <QMenu
                touch-position
                context-menu
              >
                <MachineListContextMenu
                  :machine="machineItem"
                />
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
