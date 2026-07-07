<script setup lang="ts">
import CMMachineListDialog from './CMMachineListDialog.vue'
import type { MachineGroup, MachineInfo, MachineOption } from '~/shared/types'

const props = defineProps<{
  machineName: string
  machineId: number

  allMachines: MachineInfo[]
  machineGroups: MachineGroup[]

  disabledMachineIds?: number[]
  singleSelection?: boolean
  selectedMachines: MachineInfo[]
}>()

const emit = defineEmits<{
  'update:selectedMachines': [value: MachineInfo[]]
}>()

const $q = useQuasar()
const { t } = useI18n()

const isCurrentMachineDisabled = computed(() => props.disabledMachineIds?.includes(props.machineId) || false)

const machineOption = ref<MachineOption>(isCurrentMachineDisabled.value ? 'selected' : 'current')
const internalSelectedMachines = ref<MachineInfo[]>([])

watch(machineOption, (newOption) => {
  if (newOption === 'selected') {
    const value = props.singleSelection ? internalSelectedMachines.value.slice(0, 1) : internalSelectedMachines.value
    emit('update:selectedMachines', value)
  } else if (newOption === 'current') {
    const currentMachine = props.allMachines.find(m => m.id === props.machineId)
    if (!currentMachine)
      return

    emit('update:selectedMachines', [currentMachine])
  }
}, { immediate: true })

function selectMachineDialog() {
  $q.dialog({
    component: CMMachineListDialog,
    componentProps: {
      allMachines: props.allMachines,
      machineGroups: props.machineGroups,
      singleSelection: props.singleSelection,

      selectedMachineIds: internalSelectedMachines.value.map(m => m.id),
      disabledMachineIds: props.disabledMachineIds,
    },
  }).onOk((selectedMachines: MachineInfo[]) => {
    const result = props.singleSelection ? selectedMachines.slice(0, 1) : selectedMachines
    machineOption.value = 'selected'
    internalSelectedMachines.value = result
    emit('update:selectedMachines', result)
  })
}
</script>

<template>
  <div class="mx-2">
    <label class="text-subtitle2 text-grey-8 dark:text-grey-3 q-mb-xs block">
      {{ t('machineSelectorDialog.machineOptions') }}
    </label>
    <div class="q-gutter-sm">
      <q-radio
        v-model="machineOption"
        val="current"
        :disable="isCurrentMachineDisabled"
        :label="t('machineSelectorDialog.thisMachine', { machineName: props.machineName })"
        dense
      >
        <q-tooltip
          v-if="isCurrentMachineDisabled"
        >
          {{ t('machineSelectorDialog.thisMachineDisabledTooltip') }}
        </q-tooltip>
      </q-radio>
      <div class="flex flex-col">
        <div class="flex items-center gap-2">
          <q-radio
            v-model="machineOption"
            val="selected"
            :label="props.singleSelection || internalSelectedMachines.length === 1 ? t('machineSelectorDialog.selectedMachine') : t('machineSelectorDialog.selectedMachines')"
            dense
          />
          <q-btn
            :label="t('machineSelectorDialog.selectMachine')"
            :disable="machineOption !== 'selected'"
            color="primary"
            size="sm"
            outline
            dense
            @click="selectMachineDialog()"
          />
        </div>

        <div v-if="internalSelectedMachines.length > 0" class="pl-6 pt-1">
          <div class="text-xs text-grey-6 dark:text-grey-4 cursor-help">
            <span class="font-medium">
              {{ props.singleSelection
                ? internalSelectedMachines[0]?.name
                : t('machineSelectorDialog.machinesSelected', { count: internalSelectedMachines.length }) }}
            </span>
            <q-tooltip
              v-if="!props.singleSelection"
              class="bg-white text-dark shadow-4 text-body2"
              anchor="top middle"
              self="bottom middle"
            >
              <div class="q-pa-sm">
                <div class="text-weight-medium q-mb-xs">
                  {{ t('machineSelectorDialog.selectedMachinesList') }}:
                </div>
                <div
                  v-for="machine in internalSelectedMachines"
                  :key="machine.id"
                  class="q-mb-xs"
                >
                  • {{ machine.name }}
                </div>
              </div>
            </q-tooltip>
          </div>
        </div>
        <div v-else class="pl-6 pt-1">
          <div class="text-xs text-grey-6 dark:text-grey-4 italic">
            {{ t('machineSelectorDialog.noMachinesSelected') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
