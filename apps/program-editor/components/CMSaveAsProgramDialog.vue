<script setup lang="ts">
import type { Program } from '~/shared/types'

const editor = useEditorStore()
const router = useRouter()
const { t } = useI18n()
const allProcessTypes: any = ref([])
const machineName = ref<string>()

const machineId = Number(useRoute().params.machine_id)
allProcessTypes.value = await editor.fetchAllProcessTypes()
machineName.value = await editor.fetchAllMachine().then(machines => machines.find(machine => machine.id === machineId)?.name)

const programNo = ref<number>(editor.program.programNo)
const programName = ref<string>(editor.program.name)
const processType = ref<number>(editor.program.typeId)
const operator = ref<boolean>(editor.program.tbbProgramChangedEvent === 1)
const { dark } = useQuasar()

const newProgram = computed<Program>(() => {
  return {
    ...editor.program,
    programNo: programNo.value,
    name: programName.value,
    typeId: processType.value,
    tbbProgramChangedEvent: operator.value ? 1 : 0,
  }
})

editor.isLoading = true
await editor.fetchMachineCommands(editor.machine.id)
await editor.fetchAllProcessTypes().then(() => {
  editor.isLoading = false
})

function onCancel() {
  router.push(`/machine/${editor.machine.id}/`)
}
</script>

<template>
  <div class="w-full h-full">
    <QCard>
      <QForm @submit="editor.onSubmit(newProgram)" @reset="onCancel">
        <QCard style="width: 500px">
          <QCardSection>
            <div class="text-h6 text-center">
              {{ t('menu.saveAs') }} - {{ editor.machine.name }}
            </div>
          </QCardSection>

          <QCardSection class="q-pa-lg">
            <InputNumber
              v-model="programNo"
              type="positive-integer"
              :label="t('program.programNo')"
              :maxlength="10"
              :rules="[(val: string) => !!val || t('input.required', { field: t('program.programNo') })]"
            />
            <QInput
              v-model="programName"
              :label="t('program.name')"
              :rules="[(val: string) => !!val || t('input.required', { field: t('program.name') })]"
            />
            <QSelect
              v-model="processType"
              :options="editor.allProcessType"
              :label="t('program.programState')"
              options-dense
              :rules="[(val: number) => val !== undefined || t('input.required', { field: t('program.programState') })]"
              map-options
              emit-value
            />
            <QCheckbox
              v-model="operator"
              :label="t('operator')"
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
              @click="editor.popupSaveAsProgramVisible = false"
            />
            <QBtn
              flat
              :label="t('create')"
              class=" bg-primary text-white"
              type="submit"
              :loading="editor.isLoading"
              :disable="editor.isLoading"
              @click="editor.onSubmit(newProgram)"
            />
          </QCardActions>
        </QCard>
      </QForm>
    </QCard>
  </div>
</template>
