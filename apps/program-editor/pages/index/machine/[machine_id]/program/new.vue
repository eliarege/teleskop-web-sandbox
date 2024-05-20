<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '~/composables/editor'
import { useNotify } from '~/composables/notify'

const keycloak = useKeycloak()
console.log(keycloak)

const { t } = useI18n()
const editor = useEditorStore()
const { notifySuccess, notifyError } = useNotify()
const { $router } = useNuxtApp()
const machineId = Number(useRoute().params.machine_id)
const allProcessTypes: any = ref([])
allProcessTypes.value = await editor.fetchAllProcessTypes()
const machineName = ref<string>()
machineName.value = await editor.fetchAllMachine().then(machines => machines.find(machine => machine.id === machineId)?.name)

const programNo = ref<number>()
const programName = ref<string>()
const processType = ref<number>()
const operator = ref<boolean>(false)

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
  console.log(processType.value)
  if (!programNo.value) {
    notifyError(t('required', { field: t('program.programNo') }))
  } else if (!programName.value) {
    notifyError(t('required', { field: t('program.name') }))
  } else if (processType.value === null || processType.value === undefined) {
    notifyError(t('required', { field: t('program.processType') }))
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
</script>

<template>
  <div class="pt-10 row justify-center content-center">
    <QCard class="q-pa-md" style="width: 500px">
      <QCardSection>
        <div class="text-h6">
          {{ t('menu.newProgram') }}
        </div>
      </QCardSection>

      <QCardSection class="q-pt-none">
        <QInput
          v-model="programNo"
          type="number"
          :label="t('program.programNo')"
          :rules="[val => !!val || t('required', { field: t('program.programNo') })]"
        />
        <QInput
          v-model="programName"
          :label="t('program.name')"
          :rules="[val => !!val || t('required', { field: t('program.name') })]"
        />
        <QSelect
          v-model="processType"
          :options="allProcessTypes"
          :label="t('program.programState')"
          options-dense
          map-options
          emit-value
        />
        <QCheckbox
          v-model="operator"
          style="padding-top: 10px;"
          :label="t('operator')"
        />
      </QCardSection>

      <QCardActions align="right">
        <QBtn
          flat
          :label="t('cancel')"
          @click="onCancel"
        />
        <QBtn
          flat
          :label="t('create')"
          color="primary"
          @click="onSubmit"
        />
      </QCardActions>
    </QCard>
  </div>
</template>

<style lang="postcss" scoped>
body {
  user-select: none;
  overflow: hidden;
}
</style>
