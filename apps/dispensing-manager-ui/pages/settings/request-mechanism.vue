<script setup lang="ts">
import { notification } from '~/shared/functions'

const { t, locale } = useI18n()
const settingsData = ref()
const reqMechanism = ref()
const reqMechanismNotCompletedOption = ref()
const reqMechanismAnswer = ref()

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
  { value: 0, label: t('settings.powderDye.opt1') },
  { value: 1, label: t('settings.powderDye.opt2') },
])
const tartimOptionsExtra = ref([
  { value: 0, label: t('settings.powderDye.opt1') },
  { value: 1, label: t('settings.powderDye.opt2') },
  { value: 2, label: t('settings.powderDye.opt3') },
])

const genericOptions = ref()
genericOptions.value = await $fetch('/api/settings/material')

async function fetchSettings() {
  settingsData.value = await $fetch('/api/settings/request-mechanism-setting')

  reqMechanism.value = settingsData.value.reqMechanismOption1 ? 1 : settingsData.value.reqMechanismOption2 ? 2 : 3
  reqMechanismNotCompletedOption.value = settingsData.value.reqMechanismOption3
  reqMechanismAnswer.value = reqMechanismAnswerOptions.value[settingsData.value.reqMechanismAnswer - 1]
  genericOptions.value.forEach((opt) => {
    ['saltCode', 'genericMaterialOne', 'genericMaterialTwo'].forEach((str) => {
      if (opt.materialCode === settingsData.value[str])
        settingsData.value[str] = opt
    })
  })
}

await fetchSettings()

async function changeSettings() {
  const isSuccess = await $fetch('/api/settings/request-mechanism-setting', {
    method: 'put',
    body: {
      reqMechanismOption1: reqMechanism.value === 1 ? 1 : 0,
      reqMechanismOption2: reqMechanism.value === 2 ? 1 : 0,
      reqMechanismOption3: reqMechanism.value === 3 ? 1 : 0,
      reqMechanismAnswer: reqMechanismAnswer.value?.value,
      archiveKeepTime: settingsData.value?.archiveKeepTime,
      archiveDeletionTime: settingsData.value?.archiveDeletionTime,
      joborderBasedActive: settingsData.value?.joborderBasedActive,
      joborderBasedEqualMachinesRequired: settingsData.value?.joborderBasedEqualMachinesRequired,
      tozBoyaTartim: settingsData.value?.tozBoyaTartim,
      tozBoyaCozme: settingsData.value?.tozBoyaCozme,
      tozChemTartim: settingsData.value?.tozChemTartim,
      manuelMateryalTartim: settingsData.value?.manuelMateryalTartim,
      genericSaltActive: settingsData.value?.genericSaltActive,
      saltCode: settingsData.value?.saltCode?.materialCode,
      genericMaterialOneActive: settingsData.value?.genericMaterialOneActive,
      genericMaterialOne: settingsData.value?.genericMaterialOne?.materialCode,
      genericMaterialTwoActive: settingsData.value?.genericMaterialTwoActive,
      genericMaterialTwo: settingsData.value?.genericMaterialTwo?.materialCode,
      chemTankLevelControl: settingsData.value?.chemTankLevelControl,
      manuelOnlineRequestTankNoControl: settingsData.value?.manuelOnlineRequestTankNoControl,
      coupleMechanismSplit: settingsData.value?.coupleMechanismSplit,
      justRunOnPlannedMachine: settingsData.value?.justRunOnPlannedMachine,
    },
  })
  notification(isSuccess, t('warnings.changeResponse', { type: t('warnings.reqMechanism'), result: isSuccess ? t('warnings.success') : t('warnings.fail') }))
  await fetchSettings()
}

const filteredOptions = ref([...genericOptions.value])

function filterOptions(val, update) {
  update(() => {
    if (val === '') {
      filteredOptions.value = [...genericOptions.value]
    } else {
      const lang = locale.value === 'tr' ? 'tr-TR' : 'en-EN'
      const needle = val.toLocaleLowerCase(lang)
      filteredOptions.value = genericOptions.value.filter(v => v.materialLabel.toLocaleLowerCase(lang).includes(needle))
    }
  })
}
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <div class=" flex items-center justify-center w-full h-200 overflow-y-auto">
      <div class="grid-container">
        <div
          v-for="n in 10"
          :key="n"
          class="grid-item settings-section"
        >
          <div v-if="n === 1">
            <div class="settings-section-header">
              {{ t('settings.requestMechanism._') }}
            </div>
            <div class="flex flex-col">
              <q-option-group
                v-model="reqMechanism"
                :options="reqMechOptions"
                type="radio"
                @update:model-value="reqMechanism !== 3 ? reqMechanismNotCompletedOption = false : '' "
              />
              <q-checkbox
                v-model="reqMechanismNotCompletedOption"
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
              {{ t(`settings.requestMechanism.infoText${reqMechanism}`) }}
            </div>
          </div>
          <div v-if="n === 3">
            <div class="settings-section-header">
              {{ t('settings.archiveRetentionPeriod') }}
            </div>
            <div class="flex  gap-5 m-5">
              <div class="flex gap-15 items-center">
                <span class="w-80">
                  {{ `${t('settings.archiveRetentionDayCount')}:` }}
                </span>
                <q-input
                  v-model="settingsData.archiveKeepTime"
                  filled
                  class="w-20"
                />
              </div>
              <div class="flex gap-15 items-center">
                <span class="w-80">
                  {{ t('settings.oldRequestInfoDelete') }}
                </span>
                <q-input
                  v-model="settingsData.archiveDeletionTime"
                  filled
                  class="w-20"
                />
              </div>
            </div>
          </div>
          <div v-if="n === 4">
            <div class="settings-section-header">
              {{ t('settings.orderBasedDyeRequest._') }}
            </div>
            <div class="m-5 flex flex-col">
              <q-checkbox
                v-model="settingsData.joborderBasedActive"
                :label="t('settings.orderBasedDyeRequest.active')"
                @update:model-value="!settingsData.joborderBasedActive ? settingsData.joborderBasedEqualMachinesRequired = false : ''"
              />
              <q-checkbox
                v-model="settingsData.joborderBasedEqualMachinesRequired"
                class="ml-8"
                :disable="!settingsData.joborderBasedActive"
                :label="t('settings.orderBasedDyeRequest.required')"
              />
            </div>
          </div>

          <div v-if="n === 5">
            <div class="settings-section-header">
              {{ t('settings.powderDye.sendPowderDyeInformationWhen') }}
            </div>
            <div class="p-5">
              <q-option-group
                v-model="settingsData.tozBoyaTartim"
                :options="tartimOptions"
                type="radio"
              />
            </div>
          </div>

          <div v-if="n === 6">
            <div class="settings-section-header">
              {{ t('settings.powderDye.sendPowderDyeDissolvingInformationWhen') }}
            </div>
            <div class="p-5">
              <q-option-group
                v-model="settingsData.tozBoyaCozme"
                :options="tartimOptionsExtra"
                type="radio"
              />
            </div>
          </div>

          <div v-if="n === 7">
            <div class="settings-section-header">
              {{ t('settings.powderDye.sendPowderChemicalWeighingInformationWhen') }}
            </div>
            <div class="p-5">
              <q-option-group
                v-model="settingsData.tozChemTartim"
                :options="tartimOptions"
                type="radio"
              />
            </div>
          </div>

          <div v-if="n === 8">
            <div class="settings-section-header">
              {{ t('settings.powderDye.sendManualMaterialWeighingInformationWhen') }}
            </div>
            <div class="p-5">
              <q-option-group
                v-model="settingsData.manuelMateryalTartim"
                :options="tartimOptions"
                type="radio"
              />
            </div>
          </div>

          <div v-if="n === 9" class="mb-20">
            <div class="settings-section-header">
              {{ t('settings.genericRequests') }}
            </div>
            <div class="flex m-5 gap-15">
              <div class="flex flex-col w-full">
                <div class="flex flex-row justify-between">
                  <q-checkbox
                    v-model="settingsData.genericSaltActive"
                    class="m-3"
                    :label="t('settings.activeSaltRequest')"
                  />
                  <q-select
                    v-model="settingsData.saltCode"
                    :options="filteredOptions"
                    :disable="!settingsData.genericSaltActive"
                    class="m-3 w-50"
                    option-label="materialLabel"
                    dense
                    clearable
                    filled
                    use-input
                    @filter="filterOptions"
                  />
                </div>
                <div class="flex flex-row justify-between">
                  <q-checkbox
                    v-model="settingsData.genericMaterialOneActive"
                    class="m-3"
                    :label="t('settings.activeGenericMaterial1')"
                  />
                  <q-select
                    v-model="settingsData.genericMaterialOne"
                    :options="filteredOptions"
                    :disable="!settingsData.genericMaterialOneActive"
                    class="m-3 w-50"
                    option-label="materialLabel"
                    dense
                    clearable
                    filled
                    use-input
                    @filter="filterOptions"
                  />
                </div>
                <div class="flex flex-row justify-between">
                  <q-checkbox
                    v-model="settingsData.genericMaterialTwoActive"
                    class="m-3"
                    :label="t('settings.activeGenericMaterial2')"
                  />
                  <q-select
                    v-model="settingsData.genericMaterialTwo"
                    :options="filteredOptions"
                    :disable="!settingsData.genericMaterialTwoActive"
                    class="m-3 w-50"
                    option-label="materialLabel"
                    clearable
                    dense
                    use-input
                    filled
                    @filter="filterOptions"
                  />
                </div>
              </div>
              <div class="flex flex-col">
                <!-- TODO: Make the selection menu more solid and add searchbar also it should not go all the page long -->
              </div>
            </div>
          </div>
          <div v-if="n === 10" class="mb-20">
            <div class="settings-section-header">
              {{ t('settings.other') }}
            </div>
            <div class="m-5 flex flex-col gap-1">
              <q-checkbox
                v-model="settingsData.chemTankLevelControl"
                :label="t('settings.checkTankLevelInChemicalRequests')"
              />
              <q-checkbox
                v-model="settingsData.justRunOnPlannedMachine"
                :label="t('settings.executeOrderOnlyInPlannedMachine')"
              />
              <q-checkbox
                v-model="settingsData.coupleMechanismSplit"
                :label="t('settings.determineCouplingRecipe')"
              />
              <q-checkbox
                v-model="settingsData.manuelOnlineRequestTankNoControl"
                :label="t('settings.checkTankNumberWhenMakingManualOnlineRequest')"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="bottom-buttons fixed bottom-0 flex justify-center bg-white gap-10 w-full h-20">
        <q-btn
          color="black"
          :label="t('settings.submit')"
          outline
          class="border-width-2 my-5"
          icon="done"
          @click="changeSettings"
        />
        <q-btn
          color="red"
          class="my-5 border-width-2"
          :label="t('settings.cancel')"
          icon="close"
          outline
          @click="fetchSettings"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  width: 100%;
}

/* Mobile view */
@media (max-width: 600px) {

  .grid-container {
    grid-template-columns: repeat(1, 1fr);
  }

  .settings-section-header {
  font-size: medium !important;
  font-weight: bold;
}
  .settings-section {
    font-size: small;
    padding-right: 0rem !important;
    padding-left: 1rem !important;
    white-space: normal;
    overflow-x: hidden;
  }

}

.grid-item {
  width: 100%;
  box-sizing: border-box;
}
.settings-section-header {
  align-items: center;
  font-size: x-large;
}
.settings-section {
  padding-right: 6.25rem;
  padding-left: 6.25rem;
  padding-top: 1rem;
  height:fit-content;
}
</style>
