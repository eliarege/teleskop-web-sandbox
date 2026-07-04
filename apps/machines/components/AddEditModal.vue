<script setup lang="ts">
import { klona } from 'klona'
import { changeLocale } from '@formkit/i18n'
import { computed, ref, watch } from 'vue'
import { FetchError } from 'ofetch'
import defu from 'defu'
import type { ZodIssue } from 'zod'
import type { Machine } from '~/types'
import { washingGroupTypes, steamUnitOptions, tbbModelOptions } from '~/shared/constants'
import type { MachineGroupType } from '@teleskop/core'

const props = defineProps<{
  title: string
  isEdit: boolean
  initialData?: Machine
  formClass?: string
  machineGroups: { label: string, value: number, groupType: MachineGroupType }[]
  mtTempIoOptions: { machineId: number, label: string, value: number | string }[]
  steamValveDoOptions: { machineId: number, label: string, value: number | string }[]
  machines: Machine[]
}>()

defineEmits([...useDialogPluginComponent.emits])

const kc = useKeycloak()
const initialMachineId = props.initialData?.machineId || null
const { dialogRef, onDialogOK, onDialogHide, onDialogCancel } = useDialogPluginComponent()
const formData = ref(defu(props.initialData ?? {}, {
  reelCount: 0,
  nozzleCount: 0,
  steamUnit: 'Kg',
  inUse: true,
  additionalTank1: true,
  reserveTank: true,
  storeElectricityAsInc: false,
  theoreticalWater: false,
  theoreticalSteam: false,
} satisfies Partial<Machine>))

const isDialogVisible = ref(false)
const guardReady = ref(props.isEdit)

const steamUnitOptionsWithEmpty = computed(() => {
  return [
    { label: '---', value: '' },
    ...steamUnitOptions.map(option => ({ label: option, value: option })),
  ]
})

// FormKit mutates machineGroup objects when used as options, so we create new objects to avoid mutating the original machineGroups
const formMachineGroups = computed(() => {
  return klona(props.machineGroups)
})

const isWashingGroup = computed(() => {
  const selectedGroup = props.machineGroups.find(g => g.value === formData.value.groupId)
  return selectedGroup && washingGroupTypes.includes(selectedGroup.groupType)
})

const {
  hasChanges,
  confirmVisible,
  requestClose,
  confirmDiscard,
  keepEditing,
} = useUnsavedDialogGuard({
  getState: () => formData.value,
  setState: (state) => {
    formData.value = klona((state ?? props.initialData ?? {}) as Machine)
  },
  isOpen: () => guardReady.value,
})

const requiredDefaultsReady = computed(() => {
  if (props.isEdit)
    return true
  const data = formData.value
  return typeof data.inUse !== 'undefined'
    && typeof data.steamUnit !== 'undefined'
    && typeof data.groupId !== 'undefined'
    && typeof data.tbbModel !== 'undefined'
})

watch(requiredDefaultsReady, (ready) => {
  if (ready)
    guardReady.value = true
}, { immediate: true })

const { t, locale } = useI18n()
const { notifyError } = useNotify()

const IPV4_RE = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/

watch(locale, (newLocale) => {
  changeLocale(newLocale)
})

/**
 * FormKit validation rule to check if IP is duplicate
 */
const uniqueIp = function (node: FormKitNode) {
  const ip = node.value
  if (!ip)
    return true
  if (props.isEdit) {
    const currentMachineIp = props.initialData?.ip
    if (ip === currentMachineIp)
      return true
  }
  return props.machines.every(m => m.ip !== ip)
}

/**
 * FormKit validation rule to check if machine ID is duplicate
 */
const uniqueMachineId = function (node: FormKitNode) {
  const machineId = Number(node.value)
  if (!machineId)
    return true
  if (props.isEdit) {
    const currentMachineId = props.initialData?.machineId
    if (machineId === currentMachineId)
      return true
  }
  return props.machines.every(m => m.machineId !== machineId)
}

/**
 * FormKit validation rule to check if Theoritical Charge * Theoritical Charge Duration <= 1440
 */
const theoriticalChargeRule = function (node: FormKitNode) {
  const parent = node.at('$parent')
  if (!parent)
    return true

  const theo = (parent.value as Machine).theoreticalCharge
  const theoDur = (parent.value as Machine).theoreticalChargeDuration
  if (!theo || !theoDur)
    return true

  return (Number(theo) * Number(theoDur)) <= 14401
}

async function onSubmitForm(data: any, node: FormKitNode) {
  if (isWashingGroup.value) {
    data.reelCount = 0
    data.nozzleCount = 0
    data.reserveTank = true
  }
  const id = initialMachineId || data.machineId
  try {
    if (props.isEdit) {
      await kc.fetch('/api/machines/machine', {
        method: 'PUT',
        body: { id, data },
      })
    } else {
      await kc.fetch('/api/machines/machine', {
        method: 'POST',
        body: data,
      })
    }
    onDialogOK()
  } catch (error) {
    if (error instanceof FetchError) {
      if (error.statusMessage === 'Validation Error') {
        node.setErrors([], Object.fromEntries(
          error.data?.data.issues.map((issue: ZodIssue) => [
            issue.path[props.isEdit ? 1 : 0], // skip the 'data' part of the path
            issue.message,
          ]) || [],
        ))
        notifyError(t('validationError'))
      } else if (error.status === 423) {
        notifyError(t('machineLockedError'))
      } else {
        notifyError(t('serverError'))
      }
      console.error(error.data || error)
    } else {
      console.error(error)
      notifyError(t('unexpectedError'))
    }
  }
}

function handleCancel() {
  requestClose(() => onDialogCancel())
}

const connectionTest = ref<{
  loading: boolean
  results: { id: string, result: boolean }[] | null
}>({ loading: false, results: null })

async function testConnection(machine: Machine) {
  try {
    connectionTest.value.loading = true
    connectionTest.value.results = null
    const response = await kc.fetch<{ results: { id: string, result: boolean }[] }>('/api/sync/test-connection', {
      method: 'POST',
      retry: false,
      body: {
        ip: machine.ip,
        tbbModel: machine.tbbModel,
      },
    })
    connectionTest.value.results = response.results
  }
  catch (error: any) {
    console.error(error)
  }
  finally {
    connectionTest.value.loading = false
  }
}

const versionInfoMessage = ref({
  message: '',
  color: '',
})

async function getVersionInfo(machine: Machine) {
  if (!machine.ip) {
    notifyError(t('ipRequired'))
    return
  }
  if (machine.tbbModel === 'Tonello') {
    return
  }

  try {
    versionInfoMessage.value.message = t('receivingVersionInfo')
    versionInfoMessage.value.color = ''

    const response = await kc.fetch<{ version: string }>('/api/sync/get-machine-version', {
      method: 'POST',
      retry: false,
      body: {
        ip: machine.ip,
      },
    })

    if (response.version) {
      machine.version = response.version
      versionInfoMessage.value.message = t('versionInfoReceived')
      versionInfoMessage.value.color = 'text-primary'
    }
  } catch (error: any) {
    console.error(error)
    versionInfoMessage.value.message = t('errorReceivingVersionInfo')
    versionInfoMessage.value.color = 'text-red'
  }
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    :persistent="hasChanges || !isDialogVisible"
    :no-shake="!isDialogVisible"
    @hide="onDialogHide"
    @show="isDialogVisible = true"
  >
    <q-card class="form-card">
      <q-card-section class="flex">
        <div class="flex-center font-extrabold text-h6">
          {{ title }}
        </div>
        <q-space />
        <q-btn
          flat
          icon="close"
          @click="handleCancel"
        />
      </q-card-section>
      <q-card-section class="pt-2">
        <FormKit
          v-model="formData"
          :actions="false"
          type="form"
          form-class="space-y-4"
          @submit="onSubmitForm"
        >
          <div class="form-card-section grid grid-cols-5 gap-4 items-start !pb-2">
            <FormKit
              type="number"
              number="integer"
              name="machineId"
              label="ID"
              validation="required|number|uniqueMachineId"
              :validation-rules="{ uniqueMachineId }"
              :validation-messages="{
                uniqueMachineId: t('duplicateIdError'),
              }"
              validation-label="ID"
            />
            <FormKit
              type="text"
              name="machineCode"
              :label="t('machineName')"
              validation="required"
              :validation-label="t('machineName')"
            />
            <FormKit
              type="select"
              name="groupId"
              :label="t('machineGroup')"
              :options="formMachineGroups"
              validation="required"
              :validation-label="t('machineGroup')"
            />
            <FormKit
              type="select"
              name="tbbModel"
              label="TBB Model"
              :options="tbbModelOptions"
              validation="required"
              validation-label="TBB Model"
            />
            <FormKit
              type="number"
              name="machineCapacity"
              number="integer"
              :label="t('machineCapacity')"
              validation="required|number"
              :validation-label="t('machineCapacity')"
            />
            <FormKit
              v-if="!isWashingGroup"
              type="number"
              name="reelCount"
              number="integer"
              :label="t('reelCount')"
              validation="required|number"
              :validation-label="t('reelCount')"
            />
            <FormKit
              v-if="!isWashingGroup"
              type="number"
              name="nozzleCount"
              number="integer"
              :label="t('nozzleCount')"
              validation="required|number"
              :validation-label="t('nozzleCount')"
            />
            <FormKit
              type="text"
              name="ip"
              label="IP"
              :validation="[['required'], ['matches', IPV4_RE], ['uniqueIp']]"
              :validation-rules="{ uniqueIp }"
              :validation-messages="{
                uniqueIp: t('duplicateIpError'),
              }"
              validation-label="IP"
            />
            <FormKit
              type="number"
              name="theoreticalCharge"
              :label="t('theoreticalCharge')"
              number="integer"
              :validation="[['required'], ['min', 1], ['max', 25], ['theoriticalChargeRule']]"
              :validation-label="t('theoreticalCharge')"
              :validation-rules="{ theoriticalChargeRule }"
              :validation-messages="{
                theoriticalChargeRule: t('chargeExceeds1Day'),
              }"
            />
            <FormKit
              type="number"
              number="integer"
              name="theoreticalChargeDuration"
              :label="t('theoreticalChargeDuration')"
              :validation="[['required'], ['min', 45], ['max', 1440], ['theoriticalChargeRule']]"
              :validation-label="t('theoreticalChargeDuration')"
              :validation-rules="{ theoriticalChargeRule }"
              :validation-messages="{
                theoriticalChargeRule: t('chargeExceeds1Day'),
              }"
            />
            <FormKit
              type="select"
              name="steamUnit"
              :label="t('steamUnit')"
              :options="steamUnitOptionsWithEmpty"
              :validation-label="t('steamUnit')"
            />
            <FormKit
              type="select"
              name="MTTempIo"
              :label="t('MTTempIo')"
              :options="mtTempIoOptions"
              :disabled="!formData.version"
            />
            <FormKit
              type="checkbox"
              name="inUse"
              :classes="{ outer: 'col-start-1' }"
              :label="t('inUse')"
            />
            <FormKit
              type="checkbox"
              name="storeElectricityAsInc"
              :label="t('storeElectricityAsInc')"
            />
            <FormKit
              type="checkbox"
              name="theoreticalWater"
              :label="t('theoreticalWaterCalculationActive')"
            />
            <!-- Buttons for connection checks and version info -->
            <div class="col-span-5 justify-start flex gap-2 mt-2">
              <div class="space-y-2">
                <q-btn
                  no-caps
                  :loading="connectionTest.loading"
                  :disabled="!formData.ip || !formData.tbbModel"
                  color="primary"
                  @click="testConnection(formData)"
                >
                  {{ t('testConnection') }}
                  <q-tooltip v-if="!formData.ip">
                    {{ t('enterIpToTestConnection') }}
                  </q-tooltip>
                </q-btn>
                <div
                  v-if="connectionTest.results"
                  class="space-y-0.5"
                >
                  <div
                    v-for="r in connectionTest.results"
                    :key="r.id"
                    class="flex items-center gap-1 text-sm"
                  >
                    <q-icon
                      :name="r.result ? 'check_circle' : 'cancel'"
                      :color="r.result ? 'positive' : 'negative'"
                      size="xs"
                    />
                    <span>{{ t(`connectionTest.${r.id}`) }}</span>
                  </div>
                </div>
              </div>
              <div class="space-y-1">
                <q-btn
                  no-caps
                  :disabled="!formData.tbbModel || formData.tbbModel === 'Tonello' || !formData.ip"
                  color="primary"
                  @click="getVersionInfo(formData)"
                >
                  {{ t('receiveVersionInfo') }}
                  <q-tooltip v-if="!formData.tbbModel || formData.tbbModel === 'Tonello' || !formData.ip">
                    <template v-if="!formData.ip">
                      {{ t('enterIpToReceiveVersionInfo') }}
                    </template>
                    <template v-else>
                      {{ t('versionInfoNotAvailableForTonello') }}
                    </template>
                  </q-tooltip>
                </q-btn>
                <div
                  :class="[versionInfoMessage.color]"
                  class="formkit-message"
                >
                  {{ versionInfoMessage.message || '&nbsp;' }}
                </div>
              </div>
            </div>
          </div>
          <div class="form-card-section">
            <div class="grid grid-cols-2 gap-4 w-1/3">
              <FormKit
                type="checkbox"
                name="additionalTank1"
                :label="t('additionalTank1')"
              />
              <FormKit
                type="checkbox"
                name="additionalTank2"
                :label="t('additionalTank2')"
              />
              <FormKit
                type="checkbox"
                name="additionalTank3"
                :label="t('additionalTank3')"
              />
              <FormKit
                type="checkbox"
                name="additionalTank4"
                :label="t('additionalTank4')"
              />
              <FormKit
                v-if="!isWashingGroup"
                type="checkbox"
                name="reserveTank"
                :label="t('reserveTank')"
              />
            </div>
          </div>
          <div class="form-card-section space-y-4">
            <FormKit
              type="checkbox"
              name="theoreticalSteam"
              :label="t('theoreticalSteam')"
            />
            <FormKit
              type="text"
              name="steamKgPerHour"
              :label="t('steamKgPerHour')"
              :disabled="!formData.theoreticalSteam"
              validation="number"
              :validation-label="t('steamKgPerHour')"
            />
            <FormKit
              type="select"
              name="steamValveDo"
              :label="t('steamValveDo')"
              :options="steamValveDoOptions"
              :disabled="!formData.theoreticalSteam"
            />
          </div>
          <div class="flex items-center gap-2">
            <FormKitMessages />
            <q-space />
            <q-btn
              flat
              :label="t('cancel')"
              @click="handleCancel"
            />
            <q-btn
              color="primary"
              type="submit"
              :label="t('submit')"
              @submit="onSubmitForm"
            />
          </div>
        </FormKit>
      </q-card-section>
    </q-card>
    <MaConfirmDialog
      v-model="confirmVisible"
      :title="t('unsavedChanges.title')"
      :message="t('unsavedChanges.message')"
      :cancel-label="t('unsavedChanges.continue')"
      :confirm-label="t('unsavedChanges.discard')"
      confirm-color="negative"
      @confirm="confirmDiscard"
      @cancel="keepEditing"
    />
  </q-dialog>
</template>

<style lang="postcss">
.form-card {
  max-width: min(max(70vw, 1100px), 100vw);
  min-width: min(max(70vw, 1100px), 100vw);
  user-select: none;
}
.form-card-section {
  @apply border-(1 gray-400) rounded-md p-4;
}

.formkit-outer {
  margin: 0;
}

.formkit-help {
  word-break: break-word;
  white-space: normal;
  max-width: 100%;
  overflow-wrap: break-word;
}

.formkit-messages {
  max-width: 100%;
  overflow: hidden;
}
</style>
