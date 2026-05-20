<script setup lang="ts">
import { useQuasar } from 'quasar'
import { useStateStore } from '~/store/State'
import { Unit, getUnitOptions } from '~/shared/enums'
import type { Machine } from '~/shared/types'

const q = useQuasar()
const { t } = useI18n()
const { notifySuccess, notifyFail } = useNotify()
const stateStore = useStateStore()

const companyData = ref({
  name: '',
  logoPath: null as string | null,
  logoSize: 24 as number,
  showCompanyName: true as boolean,
})

const originalData = ref({ ...companyData.value })
const logoFile = ref<File | null>(null)

const selectedMachine = ref(stateStore.defaultMachine)
const originalMachine = ref(stateStore.defaultMachine)
const partCountActive = ref(stateStore.partCountActive)
const originalPartCountActive = ref(stateStore.partCountActive)
const defaultUnitTypeDye = ref(stateStore.defaultUnitTypeDye)
const originalDefaultUnitTypeDye = ref(stateStore.defaultUnitTypeDye)
const defaultUnitTypeChem = ref(stateStore.defaultUnitTypeChem)
const originalDefaultUnitTypeChem = ref(stateStore.defaultUnitTypeChem)
const partCountColumn = ref<string | null>(stateStore.partCountColumn)
const originalPartCountColumn = ref<string | null>(stateStore.partCountColumn)
const jobOrderPrefs = ref({ ...stateStore.jobOrderPrefs })
const originalJobOrderPrefs = ref({ ...stateStore.jobOrderPrefs })
const { data: machines } = await useFetch<Machine[]>('/api/machines')

const unitOptions = computed(() => getUnitOptions(t))
const partCountColumnOptions = computed(() => [
  { label: t('None'), value: null },
  ...Array.from({ length: 50 }, (_, i) => ({
    label: `Parameter${i + 1}`,
    value: `Parameter${i + 1}`,
  })),
])

fetchCompanyData()

async function fetchCompanyData() {
  try {
    const result = await $fetch<{
      name: string
      logoPath: string | null
      logoSize: number
      showCompanyName: boolean
      partCountActive: boolean
      defaultUnitTypeDye: number
      defaultUnitTypeChem: number
      partCountColumn: string | null
    }>('/api/company/info')
    if (result) {
      companyData.value = { name: result.name, logoPath: result.logoPath, logoSize: result.logoSize ?? 24, showCompanyName: result.showCompanyName ?? true }
      originalData.value = { name: result.name, logoPath: result.logoPath, logoSize: result.logoSize ?? 24, showCompanyName: result.showCompanyName ?? true }
      selectedMachine.value = stateStore.defaultMachine
      originalMachine.value = stateStore.defaultMachine
      partCountActive.value = result.partCountActive ?? false
      originalPartCountActive.value = result.partCountActive ?? false
      defaultUnitTypeDye.value = result.defaultUnitTypeDye ?? Unit.Percent
      originalDefaultUnitTypeDye.value = result.defaultUnitTypeDye ?? Unit.Percent
      defaultUnitTypeChem.value = result.defaultUnitTypeChem ?? Unit.GramPerLiter
      originalDefaultUnitTypeChem.value = result.defaultUnitTypeChem ?? Unit.GramPerLiter
      partCountColumn.value = result.partCountColumn ?? null
      originalPartCountColumn.value = result.partCountColumn ?? null
      stateStore.partCountActive = result.partCountActive ?? false
      stateStore.defaultUnitTypeDye = result.defaultUnitTypeDye ?? Unit.Percent
      stateStore.defaultUnitTypeChem = result.defaultUnitTypeChem ?? Unit.GramPerLiter
      stateStore.partCountColumn = result.partCountColumn ?? null
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
  formData.append('logoSize', String(companyData.value.logoSize))
  formData.append('showCompanyName', String(companyData.value.showCompanyName))
  formData.append('partCountActive', String(partCountActive.value))
  formData.append('defaultUnitTypeDye', String(defaultUnitTypeDye.value))
  formData.append('defaultUnitTypeChem', String(defaultUnitTypeChem.value))
  formData.append('partCountColumn', partCountColumn.value ?? '')
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
      stateStore.partCountActive = partCountActive.value
      originalPartCountActive.value = partCountActive.value
      stateStore.defaultUnitTypeDye = defaultUnitTypeDye.value
      originalDefaultUnitTypeDye.value = defaultUnitTypeDye.value
      stateStore.defaultUnitTypeChem = defaultUnitTypeChem.value
      originalDefaultUnitTypeChem.value = defaultUnitTypeChem.value
      stateStore.partCountColumn = partCountColumn.value
      originalPartCountColumn.value = partCountColumn.value
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
  partCountActive.value = originalPartCountActive.value
  defaultUnitTypeDye.value = originalDefaultUnitTypeDye.value
  defaultUnitTypeChem.value = originalDefaultUnitTypeChem.value
  partCountColumn.value = originalPartCountColumn.value
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
        <QCardSection>
          <QInput
            v-model.number="companyData.logoSize"
            :label="t('companyFields.LogoSize')"
            type="number"
            filled
            :min="1"
            :max="200"
          />
        </QCardSection>
        <QCardSection>
          <QCheckbox
            v-model="companyData.showCompanyName"
            :label="t('companyFields.ShowCompanyName')"
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
          <strong>{{ t('settings.RecipeConfiguration') }}</strong>
        </QCardSection>
        <QSeparator />
        <QCardSection>
          <div class="row items-center q-gutter-md">
            <QCheckbox
              v-model="partCountActive"
              :label="t('PartCountActive')"
            />
            <QSelect
              v-model="partCountColumn"
              :label="t('PartCountColumn')"
              :disable="!partCountActive"
              filled
              dense
              emit-value
              map-options
              options-dense
              :options="partCountColumnOptions"
              option-label="label"
              option-value="value"
              class="col"
            />
          </div>
        </QCardSection>
        <QCardSection>
          <QSelect
            v-model="defaultUnitTypeDye"
            :label="t('DefaultUnitTypeDye')"
            filled
            dense
            emit-value
            map-options
            options-dense
            :options="unitOptions"
            option-label="name"
            option-value="id"
          />
        </QCardSection>
        <QCardSection>
          <QSelect
            v-model="defaultUnitTypeChem"
            :label="t('DefaultUnitTypeChem')"
            filled
            dense
            emit-value
            map-options
            options-dense
            :options="unitOptions"
            option-label="name"
            option-value="id"
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
