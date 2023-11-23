<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const reqMechanism = ref()
const reqMechanismNorCompletedOption = ref(false)
const reqMechanismAnswer = ref()
const archiveRetention = ref()
const orderBasedActive = ref(false)
const orderBasedRequired = ref(false)
const tozBoyaTartim = ref(1)
const tozBoyaCozme = ref(1)
const tozChemTartim = ref(1)
const manuelMateryalTartim = ref(1)
const generics = ref([false, false, false])
const genericCodes = ref(['', '', ''])
const genericOptions = ref([[1], [2], [3]])
const genericTexts = [t('settings.activeSaltRequest'), t('settings.activeGenericMaterial1'), t('settings.activeGenericMaterial2')]
const reqMechanismAnswerOptions = ref([
  { value: 1, label: t('settings.requestMechanism.ans1') },
  { value: 2, label: t('settings.requestMechanism.ans2') },
  { value: 3, label: t('settings.requestMechanism.ans3') },
])
const reqMechOptions = [
  { value: 1, label: t('settings.requestMechanism.request1') },
  { value: 2, label: t('settings.requestMechanism.request2') },
  { value: 3, label: t('settings.requestMechanism.request3') },
]
const tartimOptions = ref([
  { value: 1, label: t('settings.powderDye.opt1') },
  { value: 2, label: t('settings.powderDye.opt2') },
])
const tartimOptionsExtra = ref([
  { value: 1, label: t('settings.powderDye.opt1') },
  { value: 2, label: t('settings.powderDye.opt2') },
  { value: 3, label: t('settings.powderDye.opt3') },
])
const others = ref([
  { label: t('settings.checkTankLevelInChemicalRequests'), value: false },
  { label: t('settings.executeOrderOnlyInPlannedMachine'), value: false },
  { label: t('settings.determineCouplingRecipe'), value: false },
  { label: t('settings.checkTankNumberWhenMakingManualOnlineRequest'), value: false },
])
const settingSlots = [0, 1, 2, 3, 4]
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <div class="e-border flex items-center justify-center gap-5 text-size-4 w-full">
      <div class="grid-container">
        <div
          v-for="n in 10"
          :key="n"
          class="grid-item setting-section"
        >
          <div v-if="n === 1">
            <div class="setting-section-header">
              {{ t('settings.requestMechanism.a') }}
            </div>
            <div class="flex flex-col mt-5 ">
              <q-option-group
                v-model="reqMechanism"
                :options="reqMechOptions"
                type="radio"
              />
              <q-checkbox
                v-model="reqMechanismNorCompletedOption"
                :disable="reqMechanism !== 3"
                :label="t('settings.requestMechanism.requestCheckBox')"
              />
              <div class="flex py-5 gap-5">
                <span style="white-space: normal; width: 40%;">
                  {{ t('settings.requestMechanism.answer') }}
                </span>
                <span style="width: 12rem; ">
                  <q-select
                    v-model="reqMechanismAnswer"
                    :options="reqMechanismAnswerOptions"
                    option-value="value"
                    option-label="label"
                    filled
                  />
                </span>
              </div>
            </div>
          </div>
          <div v-if="n === 2">
            <div
              class="items-center pt-5"
              style="white-space: normal;"
            >
              {{ t('settings.requestMechanism.infoText') }}
            </div>
          </div>
          <div v-if="n === 3">
            <div class="setting-section-header">
              {{ t('settings.archiveRetentionPeriod') }}
            </div>
            <div class="flex  gap-5 m-5">
              <div class="flex gap-15 items-center">
                <span class="w-80">
                  {{ `${t('settings.archiveRetentionDayCount')}:` }}
                </span>
                <q-input
                  v-model="archiveRetention"
                  filled
                  class="w-20"
                />
              </div>
              <div class="flex gap-15 items-center">
                <span class="w-80">
                  {{ t('settings.oldRequestInfoDelete') }}
                </span>
                <q-input
                  v-model="archiveRetention"
                  filled
                  class="w-20"
                />
              </div>
            </div>
          </div>
          <div v-if="n === 4">
            <div class="setting-section-header">
              {{ t('settings.orderBasedDyeRequest.a') }}
            </div>
            <div class="m-5">
              <q-checkbox v-model="orderBasedActive" :label="t('settings.orderBasedDyeRequest.active')" />
              <q-checkbox v-model="orderBasedRequired" :label="t('settings.orderBasedDyeRequest.required')" />
            </div>
          </div>

          <div v-if="n === 5">
            <div class="setting-section-header">
              {{ t('settings.powderDye.sendPowderDyeInformationWhen') }}
            </div>
            <div class="p-5">
              <q-option-group
                v-model="tozBoyaTartim"
                :options="tartimOptions"
                type="radio"
              />
            </div>
          </div>

          <div v-if="n === 6">
            <div class="setting-section-header">
              {{ t('settings.powderDye.sendPowderDyeInformationWhen') }}
            </div>
            <div class="p-5">
              <q-option-group
                v-model="tozBoyaCozme"
                :options="tartimOptionsExtra"
                type="radio"
              />
            </div>
          </div>

          <div v-if="n === 7">
            <div class="setting-section-header">
              {{ t('settings.powderDye.sendPowderDyeInformationWhen') }}
            </div>
            <div class="p-5">
              <q-option-group
                v-model="tozChemTartim"
                :options="tartimOptions"
                type="radio"
              />
            </div>
          </div>

          <div v-if="n === 8">
            <div class="setting-section-header">
              {{ t('settings.powderDye.sendPowderDyeInformationWhen') }}
            </div>
            <div class="p-5">
              <q-option-group
                v-model="manuelMateryalTartim"
                :options="tartimOptions"
                type="radio"
              />
            </div>
          </div>

          <div v-if="n === 9">
            <div class="setting-section-header">
              {{ t('settings.genericRequests') }}
            </div>
            <div class="flex m-5 gap-15">
              <div class="flex flex-col">
                <q-checkbox
                  v-for="a in [0, 1, 2]"
                  :key="a"
                  v-model="generics[a]"
                  class="m-3"
                  :label="genericTexts[a]"
                />
              </div>
              <div class="flex flex-col">
                <q-select
                  v-for="a in [0, 1, 2]"
                  :key="a"
                  v-model="genericCodes[a]"
                  :options="genericOptions[a]"
                  :disable="!generics[a]"
                  class="m-3 w-40"
                  dense
                  filled
                />
              </div>
            </div>
          </div>
          <div v-if="n === 10">
            <div class="setting-section-header">
              {{ t('settings.other') }}
            </div>
            <div class="m-5">
              <q-checkbox
                v-for="a in [0, 1, 2, 3]"
                :key="a"
                v-model="others[a].value"
                :label="others[a].label"
              />
            </div>
          </div>
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
.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(5, 1fr);
  gap: 1rem;
  width: 100%;
}

/* Mobile view */
@media (max-width: 600px) {
  .grid-container {
    grid-template-columns: repeat(1, 1fr);
    grid-template-rows: repeat(10, 1fr);
  }
}

.grid-item {
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
}
.setting-section-header {
  align-items: center;
  font-size: x-large;
}
.setting-section {
  padding-left: 6.25rem;
  padding-right: 6.25rem;
  padding-top: 2.5rem;
}
</style>
