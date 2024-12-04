<script setup lang="ts">
import type { MachineGroup, MachineInfo } from '~/shared/types'

const props = defineProps<{
  machineGroups: MachineGroup[]
}>()

const emit = defineEmits<{
  (e: 'update:selected', machines: MachineInfo[]): void
}>()

const selectedMachineIds = ref<string[]>([])
const expandedGroups = ref<string[]>([])

const selectedMachines = computed(() =>
  props.machineGroups
    ?.flatMap(group => group.machines)
    ?.filter(machine => selectedMachineIds.value.includes(`${machine.groupId}-${machine.id}`)) || [],
)

const nodes = computed(() => {
  if (!props.machineGroups)
    return []
  return props.machineGroups
    .filter(group => group.machines.length > 0)
    .map(group => ({
      id: group.groupId.toString(),
      label: group.name,
      selectable: false,
      children: group.machines.map(machine => ({
        id: `${group.groupId}-${machine.id}`,
        label: machine.name,
        selectable: true,
      })),
    }))
})

watch(selectedMachines, () => {
  emit('update:selected', selectedMachines.value)
})
</script>

<template>
  <div class="machine-group-selector">
    <QTree
      v-model:ticked="selectedMachineIds"
      v-model:expanded="expandedGroups"
      :nodes="nodes"
      node-key="id"
      tick-strategy="leaf"
      default-expand-all
      dense
      class="w-full min-h-120 max-h-120 overflow-y-scroll"
    />
  </div>
</template>
