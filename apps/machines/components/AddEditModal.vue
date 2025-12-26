<script setup lang="ts">
import { klona } from 'klona'
import { changeLocale } from '@formkit/i18n'
import { computed, ref, watch } from 'vue'
import type { Machine } from '~/types'

const props = defineProps<{
  title: string
  isEdit: boolean
  initialData?: Machine
  formClass?: string
  steamUnitOptions: string[]
  machineGroups: { label: string, value: number | string }[]
  tbbModelOptions: string[]
  mtTempIoOptions: { machineId: number, label: string, value: number | string }[]
  steamValveDoOptions: { machineId: number, label: string, value: number | string }[]
  machines: Machine[]
}>()

defineEmits([...useDialogPluginComponent.emits])

const kc = useKeycloak()
const { dialogRef, onDialogOK, onDialogHide, onDialogCancel } = useDialogPluginComponent()
const formData = ref(klona(props.initialData ?? {}) as Machine)
const guardReady = ref(props.isEdit)

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

  const theo = (parent.value as Machine).theoricalCharge
  const theoDur = (parent.value as Machine).theoricalChargeDuration
  if (!theo || !theoDur)
    return true

  return (Number(theo) * Number(theoDur)) <= 1440
}

async function onSubmitForm() {
  onDialogOK(klona(formData.value))
}

function handleCancel() {
  requestClose(() => onDialogCancel())
}

const teleskopConnectionMessage = ref({
  message: '',
  color: '',
})

const networkConnectionMessage = ref({
  message: '',
  color: '',
})

async function checkNetworkConnection(formData: Machine) {
  try {
    networkConnectionMessage.value.message = t('tryingConnection')
    networkConnectionMessage.value.color = ''
    await kc.fetch('/api/sync/network-connection', {
      method: 'POST',
      retry: false,
      body: {
        ip: formData.ip,
        tbbModel: formData.tbbModel,
      },
    })
    networkConnectionMessage.value.message = (t('connection-successful'))
    networkConnectionMessage.value.color = 'text-green'
  } catch (error: any) {
    console.error(error)
    if (error.statusCode === 500) {
      networkConnectionMessage.value.message = (t('noConnectionToNetwork'))
      networkConnectionMessage.value.color = 'text-red'
    }
  }
}

async function checkTeleskopConnection(formData: Machine) {
  try {
    teleskopConnectionMessage.value.message = t('tryingConnection')
    teleskopConnectionMessage.value.color = ''
    await kc.fetch('/api/sync/teleskop-connection', {
      method: 'GET',
      retry: false,
      query: {
        ip: formData.ip,
        model: formData.tbbModel,
      },
    })
    teleskopConnectionMessage.value.message = t('connection-successful')
    teleskopConnectionMessage.value.color = 'text-green'
  } catch (error: any) {
    console.error(error)
    if (error.statusCode === 500) {
      teleskopConnectionMessage.value.message = (t('noConnectionToTeleskop'))
      teleskopConnectionMessage.value.color = 'text-red'
    }
  }
}

const versionInfoMessage = ref({
  message: '',
  color: '',
})

async function getVersionInfo(formData: Machine) {
  if (!formData.ip) {
    notifyError(t('ipRequired'))
    return
  }
  if (formData.tbbModel === 'Tonello') {
    return
  }

  try {
    versionInfoMessage.value.message = t('receivingVersionInfo')
    versionInfoMessage.value.color = ''

    const response = await kc.fetch<{ version: string }>('/api/sync/get-machine-version', {
      method: 'POST',
      retry: false,
      body: {
        ip: formData.ip,
      },
    })

    if (response.version) {
      formData.version = response.version
      versionInfoMessage.value.message = t('versionInfoReceived')
      versionInfoMessage.value.color = 'text-green'
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
    :persistent="hasChanges"
    @hide="onDialogHide"
  >
    <q-card class="max-w-[90vw] min-w-[90vw]">
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
      <q-card-section>
        <FormKit
          v-model="formData"
          :actions="false"
          type="form"
          form-class="flex flex-col gap-6"
          @submit="onSubmitForm"
        >
          <div class="grid grid-cols-5 gap-4 items-start">
            <FormKit
              :readonly="isEdit"
              blocked
              type="text"
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
              :options="machineGroups"
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
              type="text"
              name="machineCapacity"
              :label="t('machineCapacity')"
              validation="required|number"
              :validation-label="t('machineCapacity')"
            />
            <FormKit
              type="text"
              name="reelCount"
              :label="t('reelCount')"
              validation="required|number"
              :validation-label="t('reelCount')"
            />
            <FormKit
              type="text"
              name="nozzleCount"
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
              name="theoricalCharge"
              :label="t('theoricalCharge')"
              number="integer"
              :validation="[['required'], ['min', 1], ['max', 25], ['theoriticalChargeRule']]"
              :validation-label="t('theoricalCharge')"
              :validation-rules="{ theoriticalChargeRule }"
              :validation-messages="{
                theoriticalChargeRule: t('chargeExceeds1Day'),
              }"
            />
            <FormKit
              type="number"
              name="theoricalChargeDuration"
              :label="t('theoricalChargeDuration')"
              :validation="[['required'], ['min', 45], ['max', 1440], ['theoriticalChargeRule']]"
              :validation-label="t('theoricalChargeDuration')"
              :validation-rules="{ theoriticalChargeRule }"
              :validation-messages="{
                theoriticalChargeRule: t('chargeExceeds1Day'),
              }"
            />
            <FormKit
              type="select"
              name="steamUnit"
              :label="t('steamUnit')"
              :options="steamUnitOptions"
              validation="required"
              :validation-label="t('steamUnit')"
            />
            <FormKit
              type="select"
              name="MTTempIo"
              :label="t('MTTempIo')"
              :options="mtTempIoOptions"
              :disabled="!formData.version"
            />
            <div />
            <div />
            <div />
            <FormKit
              type="checkbox"
              name="inUse"
              :label="t('inUse')"
              :value="true"
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
          </div>
          <div class="grid grid-cols-2 gap-4 items-start">
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
              type="checkbox"
              name="reserveTank"
              :label="t('reserveTank')"
            />
          </div>
          <div class="grid grid-cols-5 gap-4 items-start">
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
          <div class="flex items-center justify-between">
            <div class="flex-center gap-2">
              <div flex-center flex-col>
                <FormKit
                  type="button"
                  :disabled="!formData.ip"
                  @click="checkTeleskopConnection(formData)"
                >
                  {{ t('checkTeleskopConnection') }}
                  <QTooltip v-if="!formData.ip">
                    {{ t('enterIpToCheckConnection') }}
                  </QTooltip>
                </FormKit>
                <span :class="teleskopConnectionMessage.color" class="row-start-7">
                  {{ teleskopConnectionMessage.message || '&nbsp;' }}
                </span>
              </div>
              <div flex-center flex-col>
                <FormKit
                  type="button"
                  :disabled="!formData.ip"
                  @click="checkNetworkConnection(formData)"
                >
                  {{ t('checkNetworkConnection') }}
                  <QTooltip v-if="!formData.ip">
                    {{ t('enterIpToCheckConnection') }}
                  </QTooltip>
                </FormKit>
                <span :class="networkConnectionMessage.color" class="row-start-7">
                  {{ networkConnectionMessage.message || '&nbsp;' }}
                </span>
              </div>
              <div flex-center flex-col>
                <FormKit
                  type="button"
                  :disabled="!formData.tbbModel || formData.tbbModel === 'Tonello' || !formData.ip"
                  @click="getVersionInfo(formData)"
                >
                  {{ t('receiveVersionInfo') }}
                  <QTooltip v-if="!formData.tbbModel || formData.tbbModel === 'Tonello' || !formData.ip">
                    <template v-if="!formData.ip">
                      {{ t('enterIpToReceiveVersionInfo') }}
                    </template>
                    <template v-else>
                      {{ t('versionInfoNotAvailableForTonello') }}
                    </template>
                  </QTooltip>
                </FormKit>
                <span :class="versionInfoMessage.color" class="row-start-7">
                  {{ versionInfoMessage.message || '&nbsp;' }}
                </span>
              </div>
            </div>
            <div class="flex flex-col items-end gap-2">
              <div class="flex gap-2">
                <q-btn
                  flat
                  :label="t('cancel')"
                  @click="handleCancel"
                />
                <FormKit
                  type="submit"
                  :label="t('submit')"
                  @submit="onSubmitForm"
                />
              </div>
            </div>
          </div>
        </FormKit>
      </q-card-section>
    </q-card>
    <ConfirmDialog
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
