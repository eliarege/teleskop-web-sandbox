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
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const { data: machineGroup } = useAuthFetch<MachineGroup[]>('/api/machine-group')
const { data: allMachine } = useAuthFetch<MachineInfo[]>('/api/machine')

const ticked = ref<string[]>([])
const selectAll = ref(false)

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
</script>

<template>
  <q-dialog ref="dialogRef" persistent>
    <q-card>
      <q-card-section class="bg-gray-1">
        <div>
          {{ t(`contextMenu.${props.type}.selectMachine`) }}
        </div>
      </q-card-section>
      <q-card-section>
        <div class="pb-3">
          <QCheckbox
            v-model="selectAll"
            :label="selectAll ? t('dropAll') : t('selectAll')"
            dense
            @update:model-value="selectAllMachines"
          />
        </div>
        <div class="flex justify-center ">
          <QTree
            v-model:ticked="ticked"
            :nodes="nodes"
            node-key="id"
            tick-strategy="leaf"
            default-expand-all
            dense
          />
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="bg-gray-1"
      >
        <q-btn
          v-close-popup
          :label="t('cancel')"
          outline
          color="black"
          icon="close"
          @click="onDialogCancel"
        />
        <q-btn
          v-close-popup
          outline
          :color="props.type === 'deleteFromMultiMachine' ? 'red' : ''"
          :icon="props.type === 'deleteFromMultiMachine' ? 'delete' : 'send'"
          :label="t(`contextMenu.${props.type}.operate`)"
          @click="onDialogOK(ticked)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
