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
  singleSelection?: boolean
}>()

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide } = useDialogPluginComponent()

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

const selectedMachines = computed(() =>
  props.allMachines.filter(machine => ticked.value.includes(getTicked(machine))),
)

// // Initialize ticked values from props.selectedMachines if provided
// onMounted(() => {
//   if (props.selectedMachines && props.selectedMachines.length > 0) {
//     ticked.value = props.selectedMachines.map(machine => `${machine.groupId}-${machine.id}`)
//   }
// })

// const selectedMachines = computed(() => {
//   return props.allMachines.filter(machine => ticked.value.includes(`${machine.groupId}-${machine.id}`))
// })

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

const selectAll = computed(() => {
  if (props.singleSelection)
    return false

  const allAvailable = nodes.value.flatMap(group =>
    group.children.filter(m => !m.disabled).map(m => m.id),
  )

  return allAvailable.length > 0 && allAvailable.every(id => ticked.value.includes(id))
})

function selectAllMachines() {
  if (props.singleSelection)
    return

  if (!selectAll.value) {
    const allAvailable = nodes.value.flatMap(group =>
      group.children.filter(m => !m.disabled).map(m => m.id),
    )
    ticked.value = [...new Set([...initialTickeds.value, ...allAvailable])]
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
  if (isSelectable || isDisabled)
    return

  const index = ticked.value.indexOf(nodeId)

  if (props.singleSelection) {
    if (index > -1) {
      ticked.value = []
    } else {
      ticked.value = [nodeId]
    }
  } else {
    if (index > -1)
      ticked.value.splice(index, 1)
    else
      ticked.value.push(nodeId)
  }
}

watch(ticked, (newVal, oldVal) => {
  if (props.singleSelection && newVal.length > 1) {
    const newlyAdded = newVal.find(item => !oldVal.includes(item))
    if (newlyAdded) {
      ticked.value = [newlyAdded]
    }
  }
})
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <q-card class="w-100">
      <q-card-section>
        <div class="text-h6 flex">
          {{ t(`contextMenu.${props.type}.title`) }}
          <q-space />
          <q-btn
            icon="close"
            class="text-gray-4 dark:text-gray-6"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
      </q-card-section>

      <q-card-section class="pt-0 text-gray-8 dark:text-gray-3">
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
          <q-btn
            v-if="!props.singleSelection"
            class="w-40 bg-gray-1 dark:bg-dark-4"
            :label="selectAll ? t('dropAll') : t('selectAll')"
            dense
            flat
            @click="selectAllMachines"
          />

          <q-btn
            class="w-40 bg-gray-1 dark:bg-dark-4"
            :label="expanded.length ? t('collapseAll') : t('expandAll')"
            dense
            flat
            @click="expandToggle"
          />
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          :label="t('cancel')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          class="q-mr-sm text-gray-1 dark:text-gray-2"
          :class="props.type === 'deleteFromMultiMachine' ? 'bg-red-6' : 'bg-primary'"
          :label="t(`contextMenu.${props.type}.operate`)"
          flat
          @click="onDialogOK(selectedMachines)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
