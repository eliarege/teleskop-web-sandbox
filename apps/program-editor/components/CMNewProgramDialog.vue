<script setup lang="ts">
import type { Program } from '~/shared/types'

const props = defineProps<{
  header: 'newProgram' | 'saveAs'
  programNo?: number
}>()

const editor = useEditorStore()
const { t } = useI18n()

const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const programNo = ref(props.programNo)
const programName = ref<string>(`${editor.program.name} ${props.header === 'saveAs' ? t('(copy)') : ''}`)
const processType = ref<number>(editor.program.typeId)
const operator = ref<boolean>(editor.program.tbbProgramChangedEvent === 1)
const { dark } = useQuasar()

const newProgram = computed<Program>(() => {
  return {
    ...editor.program,
    machineId: editor.machine.id,
    programNo: programNo.value!,
    name: programName.value,
    typeId: processType.value,
    tbbProgramChangedEvent: operator.value ? 1 : 0,
  }
})
</script>

<template>
  <div class="w-full h-full">
    <q-dialog ref="dialogRef" persistent>
      <QCard>
        <QForm @submit="onDialogOK(newProgram)">
          <QCard style="width: 500px">
            <QCardSection>
              <div class="text-h6 text-center">
                {{ t(`menu.${props.header}`) }} - {{ editor.machine.name }}
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
                  (val: number) => !editor.allPrograms.some(p => p.programNo === val) || t('input.unique', { field: t('program.programNo') }),
                ]"
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
                :rules="[(val: number) => val !== undefined || t('input.required', { field: t('program.programState') })]"
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
                :label="t('create')"
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
