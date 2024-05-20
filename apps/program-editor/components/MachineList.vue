<script lang="ts" setup>
import type { QTreeNode } from 'quasar'

const props = defineProps({
  isTicked: {
    required: false,
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['update:ticked'])

const route = useRoute()

const { data: machineGroup } = useFetch('/api/machine-group', { key: 'Machine Groups', transform: markRaw })
const { data: allMachine } = useFetch('/api/machine', { key: 'Machines', transform: markRaw })

const ticked = ref([])

const MACHINE_PATH_RE = /^\/machine\/\d+$/

const nodes = computed(() =>
  machineGroup.value
    ?.filter(group => group.machines.length > 0)
    .map<QTreeNode>(group => ({
      id: group.groupId,
      label: group.name,
      selectable: false,
      children: group.machines
        .map<QTreeNode>(machine => ({
          id: `${group.groupId}-${machine.id}`,
          label: machine.name,
          selectable: true,
          machineId: machine.id,
          children: [],
        })),
    })) || [],
)

const expanded = ref([] as (number | string)[])

watchOnce(nodes, () => {
  expanded.value = nodes.value.map(node => node.id)
})

const selected = computed(() => {
  if (route.path.startsWith('/machine') && typeof route.params.machine_id === 'string') {
    const id = Number.parseInt(route.params.machine_id)
    const machine = allMachine.value?.find(m => m.id === id)
    if (machine) {
      return `${machine.groupId}-${machine.id}`
    }
  }
  return null
})
async function onUpdateSelected(selection: string) {
  const editor = useEditorStore()
  editor.machineCommands.clear()
  if (selection) {
    const id = Number.parseInt(selection.split('-')[1])
    // Replace only if navigating from /machine/:id
    const replace = MACHINE_PATH_RE.test(route.path)
    await navigateTo({
      path: `/machine/${id}`,
      replace,
    })
  } else {
    await navigateTo('/')
  }
}
</script>

<template>
  <QTree
    v-model:expanded="expanded"
    v-model:ticked="ticked"
    :tick-strategy="props.isTicked ? 'leaf' : 'none'"
    class="q-pa-lg"
    :selected="selected"
    :nodes="nodes"
    node-key="id"
    dense
    no-selection-unset
    selected-color="primary"
    no-nodes-label="No machines available"
    @update:ticked="e => emit('update:ticked', e)"
    @update:selected="e => props.isTicked ? '' : onUpdateSelected(e)"
  />
</template>
