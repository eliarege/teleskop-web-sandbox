<script setup lang="ts">
import { useQuasar } from 'quasar'
import { useStateStore } from '~/store/State'
import type { Machine } from '~/shared/types'

const $q = useQuasar()
const { t } = useI18n()
const stateStore = useStateStore()

const companyData = ref({
  name: '',
  logoPath: null as string | null,
})

const originalData = ref({ ...companyData.value })
const logoFile = ref<File | null>(null)

const selectedMachine = ref(stateStore.defaultMachine)
const originalMachine = ref(stateStore.defaultMachine)
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
  } catch (error) {
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

      $q.notify({ type: 'positive', message: t('Success') })
      fetchCompanyData()
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: t('Failed') })
  }
}

function onReset() {
  companyData.value = { ...originalData.value }
  logoFile.value = null
  selectedMachine.value = originalMachine.value
}
</script>

<template>
  <QCard class="q-pa-md">
    <QCardSection flex-center>
      <strong>{{ t('companyFields.Info') }}</strong>
    </QCardSection>
    <QSeparator />

    <QCardSection>
      <QInput
        v-model="companyData.name"
        :label="t('companyFields.Name')"
        outlined
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
    <QCardSection>
      <h6>{{ t('DefaultMachine') }}</h6>
      <QSelect
        v-model="selectedMachine"
        :label="t('DefaultMachine')"
        outlined
        dense
        map-options
        emit-value
        options-dense
        option-label="machineName"
        option-value="machineId"
        :options="machines"
      />
    </QCardSection>

    <QCardSection class="q-gutter-sm row flex-center">
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
    </QCardSection>
  </QCard>
</template>

<style scoped>
.company-logo {
  max-width: 200px;
  max-height: 200px;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 5px;
}
</style>
