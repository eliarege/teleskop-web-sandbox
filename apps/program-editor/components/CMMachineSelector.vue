<script setup lang="ts">
import type { MachineOption } from '~/shared/types'

const props = defineProps<{
  machineName: string
  singleSelection?: boolean
}>()

const model = defineModel<MachineOption>({ required: true })

const $q = useQuasar()
const { t } = useI18n()
const editor = useEditorStore()
const { $commandManager } = useNuxtApp()

function selectMachineDialog() {
  return $commandManager.executeCommand('selectMachine', { $q }, {
    singleSelection: props.singleSelection,
  })
}
</script>

<template>
  <div class="m-2">
    <label class="text-subtitle2 text-grey-8 dark:text-grey-3 q-mb-xs block">
      {{ t('machineSelectorDialog.machineOptions') }}
    </label>
    <div class="q-gutter-sm">
      <q-radio
        v-model="model"
        val="current"
        :label="t('machineSelectorDialog.thisMachine', { machineName: props.machineName })"
        dense
      />
      <div class="flex flex-col">
        <div class="flex items-center gap-2">
          <q-radio
            v-model="model"
            val="selected"
            :label="props.singleSelection ? t('machineSelectorDialog.selectedMachine') : t('machineSelectorDialog.selectedMachines')"
            dense
          />
          <q-btn
            :label="t('machineSelectorDialog.selectMachine')"
            :disable="model !== 'selected'"
            color="primary"
            size="sm"
            outline
            dense
            @click="selectMachineDialog()"
          />
        </div>

        <div v-if="editor.selectedMachines.length > 0" class="pl-6 pt-1">
          <div class="text-xs text-grey-6 dark:text-grey-4 cursor-help">
            <span class="font-medium">
              {{ t('machineSelectorDialog.machinesSelected', { count: editor.selectedMachines.length }) }}
            </span>
            <q-tooltip
              class="bg-white text-dark shadow-4 text-body2"
              anchor="top middle"
              self="bottom middle"
            >
              <div class="q-pa-sm">
                <div class="text-weight-medium q-mb-xs">
                  {{ t('machineSelectorDialog.selectedMachinesList') }}:
                </div>
                <div
                  v-for="machine in editor.selectedMachines"
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
