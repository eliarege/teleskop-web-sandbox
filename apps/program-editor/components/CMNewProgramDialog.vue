<script setup lang="ts">
import { isDef } from '@teleskop/utils'
import type { ProcessType, Program, ProgramHeader } from '~/shared/types'

const props = defineProps<{
  type: 'newProgram' | 'saveAs' | 'rename'
  program: ProgramHeader
  machineId: number
  machineName: string
  allProgramNos: number[]
  allProcessTypes: ProcessType[]
  isTonello: boolean
}>()

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const isRename = props.type === 'rename'
const isSaveAs = props.type === 'saveAs'

const programNo = ref<number | undefined>(isRename ? props.program.programNo : undefined)
const programName = ref<string>(
  isRename
    ? props.program.name || ''
    : isSaveAs
      ? `${props.program.name || ''} ${t('(copy)', { programNo: props.program.programNo })}`
      : '',
)

const processType = ref<number>(props.program.typeId || props.allProcessTypes[0].value)
const operator = ref<boolean>(isRename ? props.program.tbbProgramChangedEvent === 1 : false)

const newProgram = computed<Program | ProgramHeader>(() => ({
  ...props.program,
  machineId: props.machineId,
  programNo: programNo.value ?? 0,
  name: programName.value,
  typeId: processType.value,
  tbbProgramChangedEvent: operator.value ? 1 : 0,
  steps: props.type === 'newProgram' ? [] : props.program.steps,
}))
</script>

<template>
  <div class="w-full h-full select-none">
    <QDialog ref="dialogRef">
      <QCard>
        <QForm @submit.prevent="onDialogOK(newProgram)">
          <QCard style="width: 500px">
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
                  (val: number) => !allProgramNos.includes(val) || t('input.unique', { field: t('program.programNo') }),
                ]"
                :disable="isRename"
                class="mb-3"
                dense
              />

              <QInput
                v-model="programName"
                :label="t('program.name')"
                :rules="[(val: string) => !!val || t('input.required', { field: t('program.name') })]"
                class="mb-3"
                dense
              />

              <QSelect
                v-if="!isTonello"
                v-model="processType"
                :options="allProcessTypes"
                :label="t('program.programState')"
                options-dense
                :rules="[(val: number) => isDef(val) || t('input.required', { field: t('program.programState') })]"
                :disable="isRename"
                map-options
                emit-value
                dense
              />

              <QCheckbox
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
          </QCard>
        </QForm>
      </QCard>
    </QDialog>
  </div>
</template>
