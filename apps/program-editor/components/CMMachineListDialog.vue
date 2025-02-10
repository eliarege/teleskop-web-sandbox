<script setup lang="ts">
import { QTree, useDialogPluginComponent } from 'quasar'
import type { MachineGroup, MachineInfo } from '~/shared/types'

const props = defineProps<{
  type: string
  allMachines: MachineInfo[]
  machineGroups: MachineGroup[]
}>()

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const ticked = ref<string[]>([])
const selectAll = ref(false)
const expanded = ref<string[]>([])

const selectedMachines = computed(() => {
  return props.allMachines.filter(machine => ticked.value.includes(`${machine.groupId}-${machine.id}`))
})

const nodes = computed(() => {
  if (!props.machineGroups || !props.allMachines)
    return []

  return props.machineGroups.filter(group => group.machines.length > 0).map(group => ({
    id: group.groupId,
    label: group.name,
    selectable: false,
    children: group.machines.map(machine => ({
      id: `${group.groupId}-${machine.id}`,
      label: machine.name,
      selectable: false,
    })),
  }))
})

function selectAllMachines() {
  if (!selectAll.value)
    ticked.value = nodes.value.flatMap(group => group.children.map(machine => machine.id))
  else
    ticked.value = []

  selectAll.value = !selectAll.value
}

function expandToggle() {
  if (expanded.value.length === 0)
    expanded.value = nodes.value.flatMap(getAllNodeIds)
  else
    expanded.value = []
}

function getAllNodeIds(node: any) {
  const ids = [node.id]
  if (node.children) {
    ids.push(...node.children.flatMap(getAllNodeIds))
  }
  return ids
}
</script>

<template>
  <QDialog ref="dialogRef">
    <QCard>
      <QCardSection class="w-100">
        <div class="text-h6 flex">
          {{ t('contextMenu.copyToMachinesAndSend') }}
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
          />
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
          :label="t(`contextMenu.${props.type}.operate`)"
          flat
          @click="onDialogOK(selectedMachines)"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
