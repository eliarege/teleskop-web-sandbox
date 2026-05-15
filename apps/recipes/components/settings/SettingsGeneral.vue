<script setup lang="ts">
import { useQuasar } from 'quasar'
import { useStateStore } from '~/store/State'
import type { Machine } from '~/shared/types'

const q = useQuasar()
const { t } = useI18n()
const { notifySuccess, notifyFail } = useNotify()
const stateStore = useStateStore()

const companyData = ref({
  name: '',
  logoPath: null as string | null,
})

const originalData = ref({ ...companyData.value })
const logoFile = ref<File | null>(null)

const selectedMachine = ref(stateStore.defaultMachine)
const originalMachine = ref(stateStore.defaultMachine)
const jobOrderPrefs = ref({ ...stateStore.jobOrderPrefs })
const originalJobOrderPrefs = ref({ ...stateStore.jobOrderPrefs })
const { data: machines } = await useFetch<Machine[]>('/api/machines')

fetchCompanyData()

async function fetchCompanyData() {
  try {
    const result = await $fetch('/api/company/info')
    if (result) {
      companyData.value = { ...result }
      originalData.value = { ...result }
      selectedMachine.value = stateStore.defaultMachine
      originalMachine.value = stateStore.defaultMachine
    }
  }
  catch (error) {
    console.error('Error fetching company data:', error)
  }
}

function handleFileUpload(files: File[]) {
  if (files.length) {
    logoFile.value = files[0]
    companyData.value.logoPath = URL.createObjectURL(files[0])
  }
}

async function onSave() {
  const formData = new FormData()
  formData.append('name', companyData.value.name)
  if (logoFile.value) {
    formData.append('image', logoFile.value)
  }
  try {
    const result = await $fetch('/api/company/info', {
      method: 'POST',
      body: formData,
    })

    if (result) {
      stateStore.defaultMachine = selectedMachine.value
      originalMachine.value = selectedMachine.value
      stateStore.jobOrderPrefs = { ...jobOrderPrefs.value }
      originalJobOrderPrefs.value = { ...jobOrderPrefs.value }

      notifySuccess(t('Success'))
      fetchCompanyData()
    }
  }
  catch (error) {
    notifyFail(t('Failed'))
  }
}

function onReset() {
  companyData.value = { ...originalData.value }
  logoFile.value = null
  selectedMachine.value = originalMachine.value
  jobOrderPrefs.value = { ...originalJobOrderPrefs.value }
}
</script>

<template>
  <div class="flex flex-col items-center">
    <div class="text-xl">
      {{ t('settings.General') }}
    </div>
  </div>
  <QSeparator class="w-full mt-5 mb-5" />

  <div class="w-full pb-4">
    <div class=" space-y-4">
      <QCard class="w-full" flat bordered>
        <QCardSection>
          <strong>{{ t('companyFields.Info') }}</strong>
        </QCardSection>
        <QSeparator />
        <QCardSection>
          <QInput
            v-model="companyData.name"
            :label="t('companyFields.Name')"
            filled
          />
        </QCardSection>
        <QCardSection>
          <h6>{{ t('companyFields.Logo') }}</h6>
        </QCardSection>
        <QCardSection class="text-center">
          <img
            v-if="companyData.logoPath"
            :src="companyData.logoPath"
            alt="Company Logo"
            class="company-logo"
          >
          <p v-else>
            No logo uploaded
          </p>
        </QCardSection>
        <QCardSection>
          <QUploader
            :label="t('companyFields.UploadLogo')"
            accept=".jpg, .png, .jpeg"
            @added="handleFileUpload"
          />
        </QCardSection>
      </QCard>

      <QCard class="w-full" flat bordered>
        <QCardSection>
          <h6>{{ t('DefaultMachine') }}</h6>
        </QCardSection>
        <QSeparator />
        <QCardSection>
          <QSelect
            v-model="selectedMachine"
            :label="t('DefaultMachine')"
            filled
            dense
            map-options
            emit-value
            options-dense
            option-label="machineName"
            option-value="machineId"
            :options="machines"
          />
        </QCardSection>
      </QCard>

      <QCard class="w-full" flat bordered>
        <QCardSection>
          <h6 class="text-capitalize">
            {{ t('JobOrderPreferences') }}
          </h6>
        </QCardSection>
        <QSeparator />
        <QCardSection>
          <QCheckbox
            v-model="jobOrderPrefs.allowOverrideStartedJobOrders"
            :label="t('AllowOverrideStartedJobOrders')"
          />
        </QCardSection>
        <QCardSection>
          <div class="text-subtitle2 q-mb-sm">
            {{ t('OptionalFields') }}
          </div>
          <div class="q-gutter-sm">
            <QCheckbox
              v-model="jobOrderPrefs.show.ASNo"
              :label="t('jobOrderParams.ASNo')"
              dense
            />
            <QCheckbox
              v-model="jobOrderPrefs.show.yarn"
              :label="t('jobOrderParams.Yarn')"
              dense
            />
            <QCheckbox
              v-model="jobOrderPrefs.show.orderNo"
              :label="t('jobOrderParams.OrderNo')"
              dense
            />
          </div>
        </QCardSection>
      </QCard>
      <div class="q-gutter-sm row justify-start">
        <QBtn
          :label="t('Reset')"
          icon="refresh"
          @click="onReset"
        />
        <QBtn
          :label="t('Save')"
          color="primary"
          icon="save"
          @click="onSave"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.company-logo {
  max-width: 200px;
  max-height: 200px;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 5px;
}

.body--dark .company-logo {
  border-color: rgba(255, 255, 255, 0.28);
}
</style>
