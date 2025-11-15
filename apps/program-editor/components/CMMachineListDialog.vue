<script setup lang="ts">
import { QTree, useDialogPluginComponent } from 'quasar'
import type { MachineGroup, MachineInfo } from '~/shared/types'

const props = defineProps<{
  type: string
  currentMachineId: number
  allMachines: MachineInfo[]
  machineGroups: MachineGroup[]
  disabledMachineIds?: number[]
  selectedMachineIds?: number[]
}>()

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const getTicked = (machine: MachineInfo) => `${machine.groupId}-${machine.id}`

const disabledTickeds = computed(() =>
  props.allMachines
    .filter(machine => props.disabledMachineIds?.includes(machine.id))
    .map(getTicked),
)

const initialTickeds = computed(() =>
  props.allMachines
    .filter(machine => props.selectedMachineIds?.includes(machine.id))
    .map(getTicked),
)

const ticked = ref<string[]>(initialTickeds.value)
const selectAll = ref(false)

const selectedMachines = computed(() =>
  props.allMachines.filter(machine => ticked.value.includes(getTicked(machine))),
)

const nodes = computed(() => {
  if (!props.machineGroups?.length || !props.allMachines?.length)
    return []

  return props.machineGroups
    .filter(group => group.machines.length > 0)
    .map(group => ({
      id: group.groupId,
      label: group.name,
      selectable: false,
      children: group.machines.map(machine => ({
        id: getTicked(machine),
        label: machine.name,
        selectable: false,
        disabled: props.disabledMachineIds?.includes(machine.id),
      })),
    }))
})

const expanded = ref<number[]>(
  props.machineGroups.map(g => g.groupId) ?? [],
)

function selectAllMachines() {
  selectAll.value = !selectAll.value

  if (selectAll.value) {
    const allAvailable = nodes.value.flatMap(group =>
      group.children.filter(m => !m.disabled).map(m => m.id),
    )
    ticked.value = [...initialTickeds.value, ...allAvailable]
  } else {
    ticked.value = initialTickeds.value.filter(id => disabledTickeds.value.includes(id))
  }
}

function expandToggle() {
  if (expanded.value.length === 0) {
    expanded.value = nodes.value.map(node => node.id)
  } else {
    expanded.value = []
  }
}

function toggleTick(nodeId: string, isDisabled: boolean, isSelectable: boolean) {
  // Grup başlıkları veya disabled makineler tıklanamaz
  if (isSelectable || isDisabled)
    return

  const index = ticked.value.indexOf(nodeId)
  if (index > -1)
    ticked.value.splice(index, 1)
  else
    ticked.value.push(nodeId)
}
</script>

<template>
  <QDialog ref="dialogRef">
    <QCard>
      <QCardSection class="w-100">
        <div class="text-h6 flex">
          {{ t(`contextMenu.${props.type}.title`) }}
          <QSpace />
          <QBtn
            icon="close"
            class="text-gray-4 dark:text-gray-6"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
      </QCardSection>

      <QCardSection class="text-gray-8 dark:text-gray-3">
        <div class="text-sm mb-2">
          {{ t(`contextMenu.${props.type}.selectMachine`) }}
        </div>
        <div class="flex justify-center">
          <QTree
            v-model:ticked="ticked"
            v-model:expanded="expanded"
            :nodes="nodes"
            node-key="id"
            tick-strategy="leaf"
            default-expand-all
            dense
            class="w-full min-h-120 max-h-120 overflow-y-scroll"
          >
            <template #default-header="prop">
              <div
                class="flex items-center gap-2 cursor-pointer select-none w-full"
                :class="{ 'opacity-50': prop.node.disabled, 'cursor-not-allowed': prop.node.selectable || prop.node.disabled }"
                @click="toggleTick(prop.node.id, prop.node.disabled, prop.node.selectable)"
              >
                <span>{{ prop.node.label }}</span>
              </div>
            </template>
          </QTree>
        </div>

        <div class="flex gap-4 justify-start p-2">
          <QBtn
            class="w-40 bg-gray-1 dark:bg-dark-4"
            :label="selectAll ? t('dropAll') : t('selectAll')"
            dense
            flat
            @click="selectAllMachines"
          />

          <QBtn
            class="w-40 bg-gray-1 dark:bg-dark-4"
            :label="expanded.length ? t('collapseAll') : t('expandAll')"
            dense
            flat
            @click="expandToggle"
          />
        </div>
      </QCardSection>

      <QCardActions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <QBtn
          :label="t('cancel')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          flat
          @click="onDialogCancel"
        />
        <QBtn
          class="q-mr-sm text-gray-1 dark:text-gray-2"
          :class="props.type === 'deleteFromMultiMachine' ? 'bg-red-6' : 'bg-primary'"
          :disabled="selectedMachines.length === 0"
          :label="t(`contextMenu.${props.type}.operate`)"
          flat
          @click="onDialogOK(selectedMachines)"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
