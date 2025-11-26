<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import { StartingParameters, getUnitById, setParameterColor } from '~/shared/enums'
import type { PlanParameters } from '~/shared/types'

interface PlanParameterProps {
  planKey: number
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
const kc = useKeycloak()
const { t } = useI18n()
const { mt } = useProjectTranslations()

const columns = computed(() => {
  return [
    { name: 'paramString', label: t('plan-parameters.param-string'), align: 'center', field: 'paramString' },
    { name: 'value', label: t('plan-parameters.value'), align: 'center', field: 'value' },
  ] as QTableColumn[]
})

const modifiedParameters = ref<Map<string, { value: number, parameter: PlanParameters }>>(new Map())

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

function saveParameterLocally(value: number, parameter: PlanParameters) {
  modifiedParameters.value.set(parameter.paramString, { value, parameter })
  validateError.value = false
  validateErrorMessage.value = ''
}

const isLoading = ref(false)
const $q = useQuasar()

async function saveAllParameters() {
  const parametersToUpdate = Array.from(modifiedParameters.value.values())

  if (parametersToUpdate.length === 0) {
    return
  }

  isLoading.value = true

  try {
    await kc.fetch('/api/planParameters/bulk', {
      method: 'POST',
      body: {
        planKey: props.planKey,
        machineId: props.machineId,
        parameters: parametersToUpdate,
      },
    })

    modifiedParameters.value.clear()

    $q.notify({
      type: 'positive',
      message: t('plan-parameters.save-success'),
      position: 'top',
    })

    emit('uploadMachine', props.parameterData[0].planKey)
  } catch (error) {
    console.error('Error saving parameters:', error)
    $q.notify({
      type: 'negative',
      message: t('plan-parameters.save-error'),
      position: 'top',
    })
  } finally {
    isLoading.value = false
  }
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
              {{ mt(prop.row.paramString, machineId) }}
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
                @save="(value) => saveParameterLocally(value, prop.row)"
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
            color="primary"
            :label="isSendMachine ? t('plan-parameters.resend') : t('plan-parameters.confirm')"
            :loading="isLoading"
            :disable="!isSendMachine && (!parameterData
              .filter(e => e.paramStatus !== StartingParameters.NonStartingParameter)
              .every(e => e.value >= e.paramLowLimit && e.value <= e.paramHighLimit) || modifiedParameters.size === 0)"
            @click="saveAllParameters()"
          >
            <template #loading>
              <q-spinner-dots />
            </template>
          </q-btn>
        </template>
      </QTable>
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
