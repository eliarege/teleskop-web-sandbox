<script setup lang="ts">
import { QCheckbox, QTree, useDialogPluginComponent } from 'quasar'
import type { MachineGroup, MachineInfo } from '~/shared/types'

const props = defineProps({
  type: String,
})

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { t } = useI18n()
const { dark } = useQuasar()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const { data: machineGroup } = useAuthFetch<MachineGroup[]>('/api/machine-group')
const { data: allMachine } = useAuthFetch<MachineInfo[]>('/api/machine')

const ticked = ref<string[]>([])
const selectAll = ref(false)
const expanded = ref<string[]>([])

const nodes = computed(() => {
  if (!machineGroup.value || !allMachine.value)
    return []

  return machineGroup.value.filter(group => group.machines.length > 0).map(group => ({
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
  if (selectAll.value)
    ticked.value = nodes.value.flatMap(group => group.children.map(machine => machine.id))
  else
    ticked.value = []
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
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
      </QCardSection>
      <QCardSection>
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
      </QCardSection>
      <div class="q-pa-md">
        <QCheckbox
          v-model="selectAll"
          class="w-34"
          :label="selectAll ? t('dropAll') : t('selectAll')"
          dense
          @update:model-value="selectAllMachines"
        />
        <QBtn
          :label="expanded.length ? t('collapseAll') : t('expandAll')"
          :icon="expanded.length ? 'expand_less' : 'expand_more'"
          class="q-ml-sm bg-gray-1"
          dense
          flat
          @click="expandToggle"
        />
      </div>

      <QCardActions
        align="right"
        class="q-pa-md"
        :class="dark.isActive ? 'bg-dark-4' : 'bg-gray-1'"
      >
        <QBtn
          :label="t('cancel')"
          class="q-mr-sm"
          flat
          @click="onDialogCancel"
        />
        <QBtn
          class="q-mr-sm text-white"
          :class="props.type === 'deleteFromMultiMachine' ? 'bg-red-6' : 'bg-primary'"
          :icon="props.type === 'deleteFromMultiMachine' ? 'delete' : 'send'"
          :label="t(`contextMenu.${props.type}.operate`)"
          flat
          @click="onDialogOK(ticked)"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
