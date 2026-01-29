<script lang="ts" setup>
import type { QList } from 'quasar'
import type { MachineGroup, MachineInfo, ProcessType } from '~/shared/types'
import { useMachineStatusStore } from '~/composables/machine'

const props = defineProps<{
  machineGroups: MachineGroup[]
}>()

const { t } = useI18n()
const route = useRoute()
const editor = useEditorStore()
const machine = useMachineStore()
const machineStatusStore = useMachineStatusStore()
const filter = useProgramFilterStore()

async function onMachineClick(machineInfo: MachineInfo, processType?: ProcessType) {
  if (machineInfo.disabled)
    return

  const machineId = machineInfo.id
  // Process type filtresini güncelle
  filter.existingFilter.processType = processType ?? undefined

  const currentMachineId = Number(route.params.machine_id)
  const machinePath = /^\/machine\/(\d+)$/

  // Makineler sayfasında değilse veya farklı makine seçildiyse makineyi değiştir
  if (!machinePath.test(route.path) || currentMachineId !== machineId) {
    await machine.changeMachine(machineId)
    editor.resetProgram()
  }
}

const thumbStyle = { opacity: '0' }
const currentMachine = ref<MachineInfo | null>(null)

function isRetrying(machineId: number): boolean {
  return machineStatusStore.isChecking(machineId)
}

async function retryMachineConnection(machineId: number, machineName: string, event: Event) {
  if (isRetrying(machineId))
    return

  event.stopPropagation()
  await machineStatusStore.checkMachineStatus(machineId, machineName, { notifyOnSuccess: true })
}

function isMachineSelected(machineId: number): boolean {
  return route.params.machine_id === `${machineId}`
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
        borderless
        dense
      >
        <template
          v-for="group in props.machineGroups"
          :key="group.groupId"
        >
          <QExpansionItem
            v-if="group.machines && group.machines.length > 0"
            :label="group.name"
            default-opened
            header-class="text-bold bg-light-9 dark:bg-dark-1 text-gray-8 dark:text-gray-3"
            borderless
            dense
          >
            <QExpansionItem
              v-for="machineItem in group.machines"
              :key="machineItem.id"
              :label="machineItem.name"
              :header-class="[
                'text-gray-8 dark:text-gray-3 pl-8',
                isMachineSelected(machineItem.id) ? 'e-selected' : '',
              ]"
              :disable="machineItem.disabled"
              expand-icon-toggle
              borderless
              dense
              @contextmenu.prevent="currentMachine = machineItem"
            >
              <template #header>
                <QItemSection
                  clickable
                  dense
                  class="cursor-pointer"
                  @click.stop="onMachineClick(machineItem)"
                >
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
                    @click.stop.prevent="retryMachineConnection(machineItem.id, machineItem.name, $event)"
                  >
                    <QTooltip>
                      {{ isRetrying(machineItem.id)
                        ? t('machine.connecting')
                        : `${t('machine.connectionFailed')} - ${t('clickToRetry')}` }}
                    </QTooltip>
                  </QIcon>
                </QItemSection>

                <QTooltip
                  v-if="machineItem.disabled && machineItem.usability"
                >
                  {{ t(`machine.unusableReason.${machineItem.usability}`) }}
                </QTooltip>

                <QMenu
                  touch-position
                  context-menu
                >
                  <MachineListContextMenu
                    :machine="machineItem"
                  />
                </QMenu>
              </template>

              <!-- Process Types -->
              <QItem
                v-for="processType in editor.allProcessTypes"
                :key="processType.value"
                v-ripple
                :active="isMachineSelected(machineItem.id) && filter.existingFilter.processType?.value === processType.value"
                active-class="e-selected"
                class="text-gray-8 dark:text-gray-3 pl-12"
                borderless
                clickable
                dense
                @click="onMachineClick(machineItem, processType)"
              >
                <QItemSection dense>
                  {{ processType.label }}
                </QItemSection>
              </QItem>
              <QMenu
                touch-position
                context-menu
              >
                <MachineListContextMenu
                  :machine="machineItem"
                />
              </QMenu>
            </QExpansionItem>
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
