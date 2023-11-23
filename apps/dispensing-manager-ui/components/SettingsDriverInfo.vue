<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const requestFilteSystemPath = ref('C:/Teleskop/System/Request')
const driverCode = ref(1)
const driverName = ref('TeleskopBasic')
const fileName = ref(6500)
const referenceOptions = ref(['Program Numarası'])
const referenceType = ref(referenceOptions.value[0])
const protocolOptions = ref(['V2-Tank No Kullanır'])
const protocol = ref(protocolOptions.value[0])
const nv5 = ref(false)
const control = ref(false)
const allBatchRequestsOption = ref()
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <div class=" flex flex-col items-center justify-center gap-5 text-size-4 w-full">
      <div class="w-full items-center justify-center flex">
        <div class="setting-section-header">
          {{ t('settings.driverInfo.a') }}
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
            v-model="driverCode"
            class="input-class"
            filled
            dense
          />
        </div>
        <div class="row-item">
          {{ t('settings.driverInfo.driverName') }}
          <q-input
            v-model="driverName"
            class="input-class"
            filled
            dense
          />
        </div>
        <div class="row-item">
          {{ t('settings.driverInfo.driverFileName') }}
          <q-input
            v-model="fileName"
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
          <q-checkbox v-model="nv5" :label="t('settings.driverInfo.n-v5')" />
        </div>
        <div class="row-item-bottom">
          <q-checkbox v-model="control" :label="t('settings.driverInfo.control')" />
        </div>
        <div class="row-item-bottom">
          <q-radio
            v-model="allBatchRequestsOption"
            :val="0"
            :label="t('settings.driverInfo.allBatchRequests')"
          />
        </div>
        <div class="row-item-bottom">
          <q-radio
            v-model="allBatchRequestsOption"
            :val="1"
            :label="t('settings.driverInfo.totalRequest')"
          />
        </div>
      </div>
      <div class="flex gap-5 my-10">
        <q-btn
          color="primary"
          :label="t('settings.submit')"
          outline
          class="border-width-2"
          icon="done"
        />
        <q-btn
          color="primary"
          :label="t('settings.cancel')"
          icon="close"
          outline
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
  }
  .input-class {
    width: 10rem;
  }
}
</style>
