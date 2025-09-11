<script setup lang="ts">
import { changeLocale } from '@formkit/i18n'
import type { Machine, MachineGroup } from '~/types'

defineProps<{
  title: string
  formClass?: string
  steamUnitOptions: string[]
  machineGroups: { label: string, value: number | string }[]
  tbbModelOptions: string[]
  mtTempIoOptions: { machineId: number, label: string, value: number | string }[]
  steamValveDoOptions: { machineId: number, label: string, value: number | string }[]
}>()
const emit = defineEmits([...useDialogPluginComponent.emits, 'submit'])
const kc = useKeycloak()
const { dialogRef, onDialogHide } = useDialogPluginComponent()
const formData = defineModel({
  type: Object,
  required: true,
})

const { t, locale } = useI18n()

watch(locale, (newLocale) => {
  changeLocale(newLocale)
})

function onSubmitForm() {
  emit('submit', formData.value)
  onDialogHide()
}
const teleskopConnectionMessage = ref({
  message: '',
  color: '',
})

const networkConnectionMessage = ref({
  message: '',
  color: '',
})

async function checkTeleskopConnection(formData: Machine) {
  try {
    teleskopConnectionMessage.value.message = t('tryingConnection')
    teleskopConnectionMessage.value.color = ''
    await kc.fetch('/api/sync/teleskop-connection', {
      method: 'GET',
      retry: false,
      query: {
        ip: formData.ip,
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

async function checkNetworkConnection(formData: Machine) {
  try {
    networkConnectionMessage.value.message = t('tryingConnection')
    networkConnectionMessage.value.color = ''
    await kc.fetch('/api/sync/network-connection', {
      method: 'POST',
      retry: false,
      body: {
        ip: formData.ip,
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
</script>

<template>
  <q-dialog ref="dialogRef">
    <q-card class="min-w-fit">
      <q-card-section class="flex">
        <div class="flex-center font-extrabold text-h6">
          {{ title }}
        </div>
        <q-space />
        <q-btn
          flat
          icon="close"
          @click="onDialogHide"
        />
      </q-card-section>
      <q-card-section>
        <FormKit
          v-model="formData"
          :actions="false"
          type="form"
          form-class="grid grid-cols-1 grid-rows-[1fr_0.3fr_0.3fr_0.1fr] gap-9"
          @submit="onSubmitForm"
        >
          <div class="grid grid-cols-5 gap-4 grid-items-baseline items-center">
            <FormKit
              type="text"
              name="machineId"
              label="ID"
              validation="required|number"
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
              :validation="[['required'], ['matches', /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/]]"
              validation-label="IP"
            />
            <FormKit
              type="text"
              name="theoricalCharge"
              :label="t('theoricalCharge')"
              validation="number"
              :validation-label="t('theoricalCharge')"
            />
            <FormKit
              type="text"
              name="theoricalChargeDuration"
              :label="t('theoricalChargeDuration')"
              validation="number"
              :validation-label="t('theoricalChargeDuration')"
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
          <div class="grid grid-cols-2 gap-4 grid-items-baseline items-center">
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
          <div class="grid grid-cols-5 gap-4 grid-items-baseline items-center">
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
                  :label="t('checkTeleskopConnection')"
                  @click="checkTeleskopConnection(formData)"
                />
                <span :class="teleskopConnectionMessage.color" class="row-start-7">
                  {{ teleskopConnectionMessage.message }}
                </span>
              </div>
              <div flex-center flex-col>
                <FormKit
                  type="button"
                  :label="t('checkNetworkConnection')"
                  @click="checkNetworkConnection(formData)"
                />
                <span :class="networkConnectionMessage.color" class="row-start-7">
                  {{ networkConnectionMessage.message }}
                </span>
              </div>
            </div>
            <FormKit
              type="submit"
              :label="t('submit')"
              @submit="onSubmitForm"
            />
          </div>
        </FormKit>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style lang="postcss">
.formkit-outer {
  margin: 0;
}
</style>
