<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import InputNumber from '~/components/InputNumber.vue'
import { useEditorStore } from '~/composables/editor'
import { useNotify } from '~/composables/notify'
import type { ProgramInfo } from '~/shared/types'

const { t } = useI18n()
const editor = useEditorStore()
const { notifySuccess, notifyError } = useNotify()
const { $router } = useNuxtApp()
const allProcessTypes: any = ref([])
const machineName = ref<string>()
const allProgram = ref<ProgramInfo[]>([])

const machineId = Number(useRoute().params.machine_id)
allProgram.value = await $fetch(`/api/machine/${machineId}/program`)
allProcessTypes.value = await editor.fetchAllProcessTypes()
machineName.value = await editor.fetchAllMachine().then(machines => machines.find(machine => machine.id === machineId)?.name)

const programNo = ref<number>()
const programName = ref<string>()
const processType = ref<number>()
const operator = ref<boolean>(false)
const { dark } = useQuasar()

async function onSubmit() {
  editor.program = {
    icon: '',
    programNo: programNo.value || 0,
    typeName: '',
    machineId,
    machineName: machineName.value || '',
    name: programName.value || '',
    author: '', // keycloak.userInfo?
    comment: '',
    typeId: processType.value || 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    steps: [],
    updatedAtTBB: '',
    programState: 0,
    isChanged: false,
    tbbProgramChangedEvent: false,
  }

  if (!programNo.value) {
    notifyError(t('input.required', { field: t('program.programNo') }))
  } else if (!programName.value) {
    notifyError(t('input.required', { field: t('program.name') }))
  } else if (processType.value === null || processType.value === undefined) {
    notifyError(t('input.required', { field: t('program.processType') }))
  } else {
    if (await editor.insertProgram()) {
      notifySuccess(t('saveProgram.success'))
      $router.push(`/machine/${machineId}/program/${programNo.value}`)
    } else {
      notifyError(t('saveProgram.fail'))
    }
  }
}

function onCancel() {
  $router.push(`/machine/${machineId}/`)
}

const rules = [
  (val: string) => !!val || t('input.required', { field: t('program.programNo') }),
  (val: string) => allProgram.value.findIndex(prg => prg.programNo === Number(val)) === -1 || t('input.unique', { field: t('program.programNo') }),
]
</script>

<template>
  <div class="pt-10 flex justify-center">
    <QForm @submit="onSubmit" @reset="onCancel">
      <QCard class="rounded-2xl" style="width: 500px">
        <QCardSection>
          <div class="text-h6 text-center">
            {{ t('menu.newProgram') }} - {{ machineName }}
          </div>
        </QCardSection>

        <QCardSection class="q-pa-lg ">
          <InputNumber
            v-model="programNo"
            type="positive-integer"
            :label="t('program.programNo')"
            :maxlength="10"
            :rules="rules"
          />
          <QInput
            v-model="programName"
            :label="t('program.name')"
            :rules="[val => !!val || t('input.required', { field: t('program.name') })]"
          />
          <QSelect
            v-model="processType"
            :options="allProcessTypes"
            :label="t('program.programState')"
            options-dense
            :rules="[val => !!val || t('input.required', { field: t('program.programState') })]"
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
          />
          <QBtn
            flat
            :label="t('create')"
            class=" bg-primary text-white"
            type="submit"
            :loading="editor.isloading"
            :disable="editor.isloading"
          />
        </QCardActions>
      </QCard>
    </QForm>
  </div>
</template>

<style lang="postcss" scoped>
body {
  user-select: none;
  overflow: hidden;
}
</style>
