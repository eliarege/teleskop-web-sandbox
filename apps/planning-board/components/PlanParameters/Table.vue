<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import { getUnitById, setParameterColor } from '~/shared/enums'
import type { PlanParameters } from '~/shared/types'

const kc = useKeycloak()
interface PlanParameterProps {
  parameterData: any[]
  editable: boolean
  machineId: number
  isSendMachine: boolean
  machineUploadData?: {
    program: string
    machineId: number
    planKey: number
    jobOrder: string
    machineIp: string
  }
}
const props = defineProps<PlanParameterProps>()
const emit = defineEmits(['uploadMachine'])
const { t } = useI18n()
const columns = computed(() => {
  return [
    { name: 'paramString', label: t('plan-parameters.param-string'), align: 'center', field: 'paramString' },
    { name: 'value', label: t('plan-parameters.value'), align: 'center', field: 'value' },
  ] as QTableColumn[]
})

const validateError = ref(false)
const validateErrorMessage = ref('')
function editValidation(parameterData: PlanParameters, value: number): boolean {
  if ((value >= parameterData.paramLowLimit) && (value <= parameterData.paramHighLimit)) {
    validateError.value = false
    return true
  }
  validateErrorMessage.value = t('plan-parameters.validation-error', { paramLowLimit: parameterData.paramLowLimit, paramHighLimit: parameterData.paramHighLimit })
  validateError.value = true
  return false
}
async function saveParameter(value: number, parameter: PlanParameters, machineId: number) {
  if (parameter.paramStatus === 2) {
    await kc.fetch('/api/planParameters', {
      method: 'POST',
      body: { parameter, value, machineId },
    })
  }
  await kc.fetch('/api/planParameters', {
    method: 'PUT',
    query: { planKey: parameter.planKey, value, paramString: parameter.paramString },
  })

  validateError.value = false
  validateErrorMessage.value = ''
}
</script>

<template>
  <div class="w-full h-full bg-white overflow-auto">
    <div class="p-3">
      <QTable
        class="border-solid border-1px border-gray-500/50"
        flat
        :rows="parameterData"
        :columns="columns"
        hide-pagination
        dense
        :rows-per-page-options="[0]"
        :no-data-label="t('plan-parameters.empty-text')"
      >
        <template #top>
          <div class="flex-center font-extrabold w-full">
            <span>
              {{ t('plan-parameters.title') }}
            </span>
          </div>
          <div>
            <PlanParametersLegend />
          </div>
        </template>
        <template #header="prop">
          <q-tr :props="prop">
            <q-th
              v-for="col in prop.cols"
              :key="col.name"
              :props="prop"
              class="!font-extrabold"
            >
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>
        <template #body="prop">
          <q-tr
            :props="prop"
            :class="setParameterColor(prop.row.paramStatus)"
          >
            <q-td key="id" :props="prop">
              {{ prop.row.id }}
            </q-td>
            <q-td key="paramString" :props="prop">
              {{ prop.row.paramString }}
            </q-td>
            <q-td
              key="value"
              :props="prop"
            >
              {{ prop.row.value }} {{ getUnitById(prop.row.unitCode) }}
              <q-popup-edit
                v-if="editable && prop.row.paramStatus !== 3"
                v-slot="scope"
                v-model="prop.row.value"
                :validate="(val) => editValidation(prop.row, val)"
                persistent
                buttons
                @save="(value) => saveParameter(value, prop.row, machineId)"
                @hide="() => { validateErrorMessage = ''; validateError = false }"
                @before-show="() => { validateErrorMessage = ''; validateError = false }"
              >
                {{ t('plan-parameters.param-low-limit') }} - {{ prop.row.paramLowLimit }} / {{ t('plan-parameters.param-high-limit') }} - {{ prop.row.paramHighLimit }}
                <q-input
                  v-model="scope.value"
                  dense
                  autofocus
                  :error="validateError"
                  :error-message="validateErrorMessage"
                />
              </q-popup-edit>
            </q-td>
          </q-tr>
        </template>
        <template #bottom>
          <q-space />
          <q-btn
            v-if="isSendMachine"
            color="primary"
            :label="t('plan-parameters.resend')"
            :disable="parameterData.some(e => e.value === null)"
            @click="emit('uploadMachine', parameterData[0].planKey)"
          />
        </template>
      </QTable>
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
