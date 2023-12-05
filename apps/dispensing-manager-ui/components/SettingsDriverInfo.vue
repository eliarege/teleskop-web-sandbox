<script setup lang="ts">
import { useI18n } from 'vue-i18n'

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
const requestFilteSystemPath = ref()
await fetchData()
const referenceType = ref(referenceOptions.value[driver.value.REFERENCEID])
const protocol = ref(protocolOptions.value[driver.value.PROTOCOL])
const radio = ref(driver.value.CONTROLTOTALBATCH ? 0 : 1)
console.log(driver.value)

async function updateDriverSettings() {
  await $fetch('/api/setting/update-file-system', {
    method: 'put',
    body: {
      path: requestFilteSystemPath.value,
    },
  })
  await $fetch('/api/setting/update-driver', {
    method: 'put',
    body: {
      DRIVERID: driver.value.DRIVERID,
      DRIVERNAME: driver.value.DRIVERNAME,
      PROTOCOL: protocol.value.value,
      REFERENCEID: referenceType.value.value,
      DRIVERFILENAME: driver.value.DRIVERFILENAME,
      CONTROLTOTALBATCH: radio.value === 0,
      CONTROLPROGRAMREQUEST: radio.value === 1,
      CONTROLTOTALREQ: driver.value.CONTROLTOTALREQ,
      CONTROLNV5DESC: driver.value.CONTROLNV5DESC,
    },
  })
}
async function fetchData() {
  requestFilteSystemPath.value = await $fetch('/api/setting/file-system')
  driver.value = await $fetch('/api/setting/driver')
}
</script>

<template>
  <div class="flex flex-col items-center justify-center h-200">
    <div class=" flex flex-col items-center justify-center gap-5 text-size-4 w-full ">
      <div class="w-full items-center justify-center flex">
        <div class="setting-section-header">
          {{ t('settings.driverInfo._') }}
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
        <div class="row-item">
          {{ t('settings.driverInfo.driverCode') }}
          <q-input
            v-model="driver.DRIVERID"
            class="input-class"
            filled
            dense
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
      <div class="flex gap-5">
        <q-btn
          color="black"
          :label="t('settings.submit')"
          outline
          class="btn-bottom"
          icon="done"
          @click="updateDriverSettings"
        />
        <q-btn
          color="black"
          :label="t('settings.cancel')"
          class="btn-bottom"
          icon="close"
          outline
          @click="fetchData"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.setting-section-header {
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
  margin: 1.25rem;
}
.row-item-bottom {
  display: flex;
  flex-direction: row;
  width: 50%;
  margin: 0.25rem;
}
.setting-section-header {
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
