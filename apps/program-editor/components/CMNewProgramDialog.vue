<script setup lang="ts">
import { isDef } from '@teleskop/utils'
import type { ProgramHeader } from '~/shared/types'

const props = defineProps<{
  header: 'newProgram' | 'saveAs' | 'rename'
}>()

const { t } = useI18n()
const { dark } = useQuasar()
const editor = useEditorStore()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const isRename = props.header === 'rename'
const isSaveAs = props.header === 'saveAs'

const programNo = ref<number | null>(isRename ? editor.selectedPrograms[0]?.programNo : null)
const programName = ref<string>(
  isRename
    ? editor.selectedPrograms[0]?.name || ''
    : isSaveAs
      ? `${editor.program.name || ''} ${t('(copy)', { programNo: editor.program.programNo })}`
      : '',
)
const processType = ref<number>(editor.allProcessType[0]?.value || editor.program.typeId)
const operator = ref<boolean>(isRename ? editor.selectedPrograms[0]?.operator || false : false)

const newProgram = computed<ProgramHeader>(() => ({
  ...editor.program,
  machineId: editor.machine.id,
  programNo: programNo.value ?? 0,
  name: programName.value,
  typeId: processType.value,
  tbbProgramChangedEvent: operator.value ? 1 : 0,
  steps: props.header === 'newProgram' ? [] : editor.program.steps,
}))
</script>

<template>
  <div class="w-full h-full select-none">
    <q-dialog ref="dialogRef">
      <QCard>
        <QForm @submit="onDialogOK(newProgram)">
          <QCard style="width: 500px">
            <QCardSection>
              <div class="text-h6 text-center">
                {{ t(`menu.${props.header}`) }} - {{ editor.machine.name }}
              </div>
            </QCardSection>

            <QCardSection class="mx-4">
              <!-- Program No Input -->
              <InputNumber
                v-model="programNo"
                type="positive-integer"
                :label="t('program.programNo')"
                :maxlength="10"
                :rules="[
                  (val: string) => !!val || t('input.required', { field: t('program.programNo') }),
                  (val: number) => !editor.allPrograms.some(p => p.programNo === val) || t('input.unique', { field: t('program.programNo') }),
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
                v-model="processType"
                :options="editor.allProcessType"
                :label="t('program.programState')"
                options-dense
                :rules="[(val: number) => isDef(val) || t('input.required', { field: t('program.programState') })]"
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
              class="q-pa-md"
              :class="dark.isActive ? 'bg-dark-3' : 'bg-gray-1'"
            >
              <QBtn
                flat
                :label="t('cancel')"
                class="q-mr-sm"
                type="reset"
                @click="onDialogCancel"
              />
              <QBtn
                flat
                :label="isRename ? t('save') : t('create')"
                class=" bg-primary text-white"
                type="submit"
                :loading="editor.isLoading"
                :disable="editor.isLoading || !newProgram.programNo || !newProgram.name"
                @submit="onDialogOK(newProgram)"
              />
            </QCardActions>
          </QCard>
        </QForm>
      </QCard>
    </q-dialog>
  </div>
</template>
