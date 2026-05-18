<script setup lang="ts">
import { isDef } from '@teleskop/utils'
import { ADDITIONAL_PROCESS_CODE_ILAVE } from '~/shared/constants'
import type { ProcessType, Program, ProgramHeader } from '~/shared/types'

const props = defineProps<{
  type: 'newProgram' | 'saveAs' | 'rename'
  program: Program
  machineId: number
  machineName: string
  allProgramNos: number[]
  allProcessTypes: ProcessType[]
  isTonello: boolean
}>()

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide } = useDialogPluginComponent()

const teleskopSettings = useTeleskopSettingsStore()

function getFirstAvailableProgramNo(allProgramNos: number[]): number {
  const usedProgramNos = new Set(allProgramNos)
  for (let i = 1; i <= 9999999999; i++) {
    if (!usedProgramNos.has(i)) {
      return i
    }
  }
  return 1
}

const isRename = props.type === 'rename'
const isSaveAs = props.type === 'saveAs'

const programNo = ref<number | undefined>(
  isRename
    ? props.program.programNo
    : (teleskopSettings.programCreationSettings.autoSuggestProgramNo)
        ? getFirstAvailableProgramNo(props.allProgramNos)
        : undefined,
)

const programName = ref<string>(
  isRename
    ? props.program.name || ''
    : isSaveAs
      ? `${props.program.name || ''}`
      : '',
)

const processType = ref<number>(props.program.typeId || props.allProcessTypes[0].value)
const additionalProcessType = ref<number>(props.program.additionalTypeId || props.allProcessTypes.filter(type => type.value !== ADDITIONAL_PROCESS_CODE_ILAVE)[0]?.value || 0)
const operator = ref<boolean>(isRename ? props.program.tbbProgramChangedEvent === 1 : false)

const isIlaveSelected = computed(() => processType.value === ADDITIONAL_PROCESS_CODE_ILAVE)
const additionalProcessTypeOptions = computed(() =>
  props.allProcessTypes.filter(type => type.value !== ADDITIONAL_PROCESS_CODE_ILAVE),
)

const newProgram = computed<Program | ProgramHeader>(() => ({
  ...props.program,
  machineId: props.machineId,
  programNo: programNo.value ?? 0,
  name: programName.value,
  typeId: processType.value,
  additionalTypeId: isIlaveSelected.value ? additionalProcessType.value : 0,
  tbbProgramChangedEvent: operator.value ? 1 : 0,
  steps: props.type === 'newProgram' ? [] : props.program.steps,
}))
</script>

<template>
  <div class="w-full h-full select-none">
    <QDialog
      ref="dialogRef"
      class="select-none"
      @hide="onDialogHide"
    >
      <QCard style="width: 450px">
        <QForm @submit.prevent="onDialogOK(newProgram)">
          <QCardSection>
            <div class="text-h6 text-center">
              {{ t(`menu.${props.type}`) }} - {{ machineName }}
            </div>
          </QCardSection>

          <QCardSection class="mx-4">
            <InputNumber
              v-model="programNo"
              type="positive-integer"
              :label="t('program.programNo')"
              :maxlength="10"
              :rules="[
                (val: string) => !!val || t('input.required', { field: t('program.programNo') }),
                (val: number) => val === props.program.programNo || !allProgramNos.includes(val) || t('input.unique', { field: t('program.programNo') }),
              ]"
              :disable="isRename"
              :autofocus="!isRename && !teleskopSettings.programCreationSettings.autoSuggestProgramNo"
              class="mb-3"
              dense
            />

            <QInput
              v-model="programName"
              :label="t('program.name')"
              :rules="[(val: string) => !!val || t('input.required', { field: t('program.name') })]"
              class="mb-3"
              :autofocus="isRename || teleskopSettings.programCreationSettings.autoSuggestProgramNo"
              dense
            />

            <QSelect
              v-model="processType"
              :options="allProcessTypes"
              :label="t('program.processType')"
              options-dense
              :rules="[(val: number) => isDef(val) || t('input.required', { field: t('program.processType') })]"
              :disable="isRename"
              map-options
              emit-value
              dense
            />

            <QSelect
              v-if="!isTonello && isIlaveSelected"
              v-model="additionalProcessType"
              :options="additionalProcessTypeOptions"
              :label="t('program.additionalProcessType')"
              options-dense
              :rules="[(val: number) => isDef(val) || t('input.required', { field: t('program.additionalProcessType') })]"
              :disable="isRename"
              map-options
              emit-value
              dense
              class="mt-3"
            />

            <QCheckbox
              v-if="!isTonello"
              v-model="operator"
              :label="t('operator')"
              dense
            />
          </QCardSection>

          <QCardActions
            align="right"
            class="q-pa-md bg-gray-1 dark:bg-dark-4"
          >
            <QBtn
              flat
              :label="t('cancel')"
              class="q-mr-sm bg-gray-2  dark:bg-dark-3 text-dark-4 dark:text-gray-2"
              type="reset"
              @click="onDialogCancel"
            />
            <QBtn
              flat
              :label="isRename ? t('save') : t('create')"
              class="q-mr-sm bg-primary text-gray-1 dark:text-gray-2"
              type="submit"
              :disable="!newProgram.programNo || !newProgram.name"
            />
          </QCardActions>
        </QForm>
      </QCard>
    </QDialog>
  </div>
</template>
