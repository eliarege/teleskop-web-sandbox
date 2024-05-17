<script setup lang="ts">
import { notification, onDrop, onKeydownPreventNonNumerical, onPastePreventNonNumerical, removeAnyNonNumerical } from '~/shared/functions'

const { t } = useI18n()

const referenceOptions = ref([
  { value: 0, label: t('settings.driverInfo.prgNo') },
  { value: 1, label: t('settings.driverInfo.recipeIndex') },
  { value: 2, label: t('settings.driverInfo.refNoAllJoborders') },
  { value: 3, label: t('settings.driverInfo.refNoPrgNo') },
])
const protocolOptions = ref([
  { value: 0, label: t('settings.driverInfo.v1TankNoUse') },
  { value: 1, label: t('settings.driverInfo.v2TankUse') },

])

const driver = ref()
const drivers = ref()
const currentDriverName = ref()
const requestFilteSystemPath = ref()
const referenceType = ref()
const protocol = ref()
const radio = ref()
const deleteDialogVisible = ref(false)
const givenDriverIdExistsWarning = ref(false)
const driverIdErrorMessage = ref('')
const deleteExpiredJobOrdersActivated = ref()
const deleteExpiredJobOrdersTime = ref()
await fetchData()
function setVariables() {
  referenceType.value = driver.value?.REFERENCEID !== undefined ? referenceOptions.value[driver.value.REFERENCEID] : referenceOptions.value[0]
  protocol.value = driver.value?.PROTOCOL !== undefined ? protocolOptions.value[driver.value.PROTOCOL] : protocolOptions.value[0]
  radio.value = driver.value?.CONTROLTOTALBATCH ? 0 : 1
  currentDriverName.value = driver.value?.DRIVERNAME ? driver.value?.DRIVERNAME : ''
  givenDriverIdExistsWarning.value = false
}
async function updateDriverSettings(isPut: boolean) {
  let isSuccess
  let keyI18N
  await $fetch('/api/settings/file-system', {
    method: 'put',
    body: {
      path: requestFilteSystemPath.value,
    },
  })
  const body = {
    DRIVERID: driver.value.DRIVERID,
    DRIVERNAME: driver.value?.DRIVERNAME,
    PROTOCOL: protocol.value?.value,
    REFERENCEID: referenceType.value?.value,
    DRIVERFILENAME: driver.value.DRIVERFILENAME ? driver.value.DRIVERFILENAME : '',
    CONTROLTOTALBATCH: radio.value === 0,
    CONTROLPROGRAMREQUEST: radio.value === 1,
    CONTROLTOTALREQ: driver.value?.CONTROLTOTALREQ,
    CONTROLNV5DESC: driver.value?.CONTROLNV5DESC,
  }
  if (!isPut) {
    isSuccess = await $fetch(`/api/settings/driver/${driver.value.DRIVERID}`, {
      method: 'POST',
      body,
    })
    keyI18N = 'warnings.createResponse'
  } else {
    isSuccess = await $fetch(`/api/settings/driver/${driver.value.DRIVERID}`, {
      method: 'PUT',
      body,
    })
    keyI18N = 'warnings.changeResponse'
  }
  drivers.value = await $fetch('/api/settings/driver')
  if (isSuccess && isSuccess?.code !== 400) {
    currentDriverName.value = driver.value?.DRIVERNAME
    driver.value.newDriver = false
  }
  notification(
    isSuccess && isSuccess?.code !== 400,
    t(keyI18N!, {
      type: t('warnings.driver'),
      result: isSuccess
        ? isSuccess?.code === 400
          ? t('warnings.idAlreadyExists', { code: driver.value.DRIVERID, type: t('warnings.driver') })
          : t('warnings.success')
        : t('warnings.fail'),
    }),
  )
}
async function fetchData() {
  requestFilteSystemPath.value = await $fetch('/api/settings/file-system')
  drivers.value = await $fetch('/api/settings/driver')
  if (drivers.value.length) {
    driver.value = drivers.value[0]
    driver.value.newDriver = false
    setVariables()
  } else
    addNewDriver()
}

async function addNewDriver() {
  driver.value = { CONTROLNV5DESC: false, CONTROLTOTALREQ: false, newDriver: true }
  setVariables()
}

async function deleteDriver() {
  const isSuccess = await $fetch(`/api/settings/driver/${driver.value.DRIVERID}`, {
    method: 'DELETE',
  })
  notification(isSuccess, t('warnings.deleteResponse', { type: t('warnings.driver'), result: isSuccess ? t('warnings.success') : t('warnings.fail') }))
  fetchData()
}
async function checkDriverIdExist(driver: { DRIVERID: number | null }, value: InputEvent) {
  driver.DRIVERID = value
  if (value) {
    if (value.startsWith('0')) {
      givenDriverIdExistsWarning.value = true
      driverIdErrorMessage.value = t('warnings.cannotBeZero', { type: t('warnings.driver') })
    } else {
      if (driver.DRIVERID)
        givenDriverIdExistsWarning.value = drivers.value.some(drv => drv.DRIVERID === Number(driver.DRIVERID))
      if (givenDriverIdExistsWarning.value)
        driverIdErrorMessage.value = t('warnings.idAlreadyExistsOnBlue', { code: driver.DRIVERID, type: t('warnings.driver') })
    }
  } else {
    givenDriverIdExistsWarning.value = false
  }
}
</script>

<template>
  <div class=" flex items-center justify-center w-full h-200 overflow-y-auto text-size-4 ">
    <div class="items-center justify-center flex ">
      <div class="settings-section-header">
        {{ t('settings.appSettings') }}
      </div>
      <div class="row-item ">
        {{ t('settings.requestFileSystem') }}
        <q-input
          v-model="requestFilteSystemPath"
          class="input-class"
          filled
          dense
        />
      </div>
      <div class="row-item ">
        <q-checkbox v-model="deleteExpiredJobOrdersActivated" :label="t('settings.deleteExpiredJobOrders')" />
        <q-input
          v-model="deleteExpiredJobOrdersTime"
          class="input-class"
          :label="t('settings.deleteExpiredJobOrdersTime')"
          :suffix="t('settings.deleteExpiredJobOrdersTimeMetric')"
          filled
          dense
        />
      </div>
      <div class="settings-section-header">
        {{ t('settings.driverInfo._') }}
      </div>
      <div
        v-if="driver?.newDriver"
        class="row-item text-6 h-20"
      >
        {{ t('settings.driverInfo.createNewDriver') }}
      </div>
      <div
        v-if="!driver.newDriver"
        class="row-item h-20 flex"
      >
        <q-select
          v-model="driver"
          :options="drivers"
          :display-value="currentDriverName"
          option-label="DRIVERNAME"
          class="input-class text-size-xl"
          @update:model-value="setVariables()"
        />
        <q-btn
          color="black"
          :label="t('settings.new')"
          outline
          class="btn-bottom"
          icon="add"
          @click="addNewDriver()"
        />
      </div>
      <div class="row-item">
        {{ t('settings.driverInfo.driverCode') }}
        <q-input
          :model-value="driver.DRIVERID"
          :disable="!driver.newDriver"
          class="input-class"
          filled
          :error="givenDriverIdExistsWarning"
          :error-message="driverIdErrorMessage"
          dense
          @keydown="(e) => onKeydownPreventNonNumerical(e, driver.DRIVERID)"
          @paste="onPastePreventNonNumerical"
          @drop="onDrop"
          @update:model-value="checkDriverIdExist(driver, $event)"
        />
      </div>
      <div class="row-item">
        {{ t('settings.driverInfo.driverName') }}
        <q-input
          v-model="driver.DRIVERNAME"
          class="input-class"
          filled
          dense
        />
      </div>
      <div class="row-item">
        {{ t('settings.driverInfo.driverFileName') }}
        <q-input
          v-model="driver.DRIVERFILENAME"
          class="input-class"
          filled
          dense
        />
      </div>
      <div class="row-item">
        {{ t('settings.driverInfo.referenceType') }}
        <q-select
          v-model="referenceType"
          :options="referenceOptions"
          class="input-class"
          filled
          dense
        />
      </div>
      <div class="row-item">
        {{ t('settings.driverInfo.protocol') }}
        <q-select
          v-model="protocol"
          :options="protocolOptions"
          class="input-class"
          filled
          dense
        />
      </div>
      <div class="row-item-bottom">
        <q-checkbox v-model="driver.CONTROLNV5DESC" :label="t('settings.driverInfo.n-v5')" />
      </div>
      <div class="row-item-bottom">
        <q-checkbox v-model="driver.CONTROLTOTALREQ" :label="t('settings.driverInfo.control')" />
      </div>
      <div class="row-item-bottom">
        <q-radio
          v-model="radio"
          :val="0"
          :label="t('settings.driverInfo.allBatchRequests')"
        />
      </div>
      <div class="row-item-bottom">
        <q-radio
          v-model="radio"
          :val="1"
          :label="t('settings.driverInfo.totalRequest')"
        />
      </div>
    </div>
    <div class="flex gap-5 my-5">
      <q-btn
        color="black"
        :label="t('settings.submit')"
        outline
        :disable="!driver.DRIVERID || !driver.DRIVERNAME || givenDriverIdExistsWarning"
        class="btn-bottom"
        icon="done"
        @click="updateDriverSettings(!driver.newDriver)"
      />
      <q-btn
        color="black"
        :label="t('settings.cancel')"
        class="btn-bottom"
        icon="close"
        outline
        @click="fetchData"
      />
      <q-btn
        v-if="!driver.newDriver"
        color="red"
        :label="t('settings.delete')"
        outline
        class="btn-bottom"
        icon="delete"
        @click="deleteDialogVisible = true"
      />
    </div>
  </div>
  <q-dialog v-model="deleteDialogVisible" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar
          icon="delete"
          color="white"
          text-color="delete"
        />
        <span class="q-ml-sm"> {{ t('warnings.deleteRow') }}</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          :label="t('settings.cancel')"
          outline
          color="black"
          icon="close"
        />
        <q-btn
          v-close-popup
          outline
          :label="t('settings.delete')"
          color="red"
          icon="delete"
          @click="deleteDriver()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.settings-section-header {
  align-items: center;
  font-size: x-large;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 55%;
  margin: 1.25rem;
}
.input-class {
  width: 20rem;
}
.row-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  width: 50%;
  margin: 0.75rem;
}
.row-item-bottom {
  display: flex;
  flex-direction: row;
  width: 50%;
  margin: 0.25rem;
}
.settings-section-header {
  align-items: center;
  font-size: x-large;
}
@media (max-width: 600px) {
  .row-item {
    margin: 0.25rem;
    flex-direction: column;
    gap: 0.25rem;
    font-size: small;
  }
  .row-item-bottom{
    font-size: small;
  }
  .input-class {
    width: 10rem;
  }
}
</style>
