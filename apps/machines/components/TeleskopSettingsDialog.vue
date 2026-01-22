<script setup lang="ts">
import { FormKitSchema } from '@formkit/vue'

const props = defineProps<{
  show: boolean
  formClass: string
}>()

const emit = defineEmits(['close'])

const kc = useKeycloak()

const { t } = useI18n()

type Label = (typeof settingsList)[number]['label']
type Setting = Record<Label, number | boolean>

const settingsList = [
  { label: 'ttbuserManagentActive', value: 1 },
  { label: 'ttbphaseModeActive', value: 2 },
  { label: 'ttbCustomErpPrmOptimization', value: 3 },
  { label: 'ttbAllowedCharsForJobOrder', value: 4 },
  { label: 'ttbRecipeEnterActive', value: 5 },
  { label: 'ttbTimeBasedModeActive', value: 6 },
  { label: 'ttbDyehouseNumber', value: 7 },
  { label: 'ttbProcessUsageActive', value: 8 },
  { label: 'ttbSaveIOValuesInDatabase', value: 9 },
  { label: 'ttbInitialTemperature', value: 13 },
] as const

const formData = ref<Partial<Setting>>({})

const {
  hasChanges,
  confirmVisible,
  requestClose,
  confirmDiscard,
  keepEditing,
  markSaved,
} = useUnsavedDialogGuard({
  getState: () => formData.value,
  setState: (state) => {
    formData.value = state ? { ...state } : {}
  },
  isOpen: () => props.show,
})

const { data: _setting } = useAuthFetch('/api/machines/teleskop-settings', {
  default: () => ({}),
  onResponse: (res) => {
    const data = res.response._data
    formData.value = data.reduce((acc: Setting, item: { id: number, value: string }) => {
      const key = settingsList.find(d => d.value === item.id)?.label
      if (key === 'ttbDyehouseNumber') {
        acc[key] = Number.parseInt(item.value)
      } else if (key) {
        acc[key] = item ? item.value === '1' : false
      }
      return acc
    }, {})
    for (const item of settingsList) {
      if (!formData.value[item.label as Label]) {
        formData.value[item.label as Label] = false
      }
    }
    markSaved()
  },

})

const schema = computed(() => ([
  {
    label: t('userControlIsActive'),
    name: 'ttbuserManagentActive',
    $formkit: 'checkbox',
  },
  {
    label: t('phaseModeActive'),
    name: 'ttbphaseModeActive',
    $formkit: 'checkbox',
  },
  {
    label: t('chemicalDyeRecipeIsReadFromERP'),
    name: 'ttbCustomErpPrmOptimization',
    $formkit: 'checkbox',
  },
  {
    label: t('timeBasedPlanningModeActive'),
    name: 'ttbTimeBasedModeActive',
    $formkit: 'checkbox',
  },
  {
    label: t('processUsageActive'),
    name: 'ttbProcessUsageActive',
    $formkit: 'checkbox',
  },
  {
    label: t('ttbSaveIOValuesInDatabase'),
    name: 'ttbSaveIOValuesInDatabase',
    $formkit: 'checkbox',
  },
  {
    label: t('dyeHouseLaundryNumber'),
    name: 'ttbDyehouseNumber',
    validation: 'required',
    $formkit: 'select',
    options: [-1, 1, 2, 3, 4, 5],
  },
  {
    label: t('initialTemperature'),
    name: 'ttbInitialTemperature',
    $formkit: 'number',
    validation: 'required',
    min: -10,
    max: 300,
    step: 1,
  },
]))

async function handleSubmit() {
  const submitData: Record<number, number | boolean> = {}
  for (const [key, value] of Object.entries(formData.value)) {
    const setting = settingsList.find(d => d.label === key)
    if (setting) {
      submitData[setting.value] = value
    }
  }
  await kc.fetch('/api/machines/teleskop-settings', {
    method: 'PUT',
    body: submitData,
  })
  markSaved()
}

function handleCancel() {
  requestClose(() => emit('close'))
}
</script>

<template>
  <q-dialog
    :model-value="props.show"
    :persistent="hasChanges"
    @hide="emit('close')"
  >
    <q-card class="min-w-[1000px]">
      <q-card-section>
        <h3>{{ t('teleskopSettings') }}</h3>
        <FormKit
          v-model="formData"
          :actions="false"
          type="form"
          :form-class="formClass"
          @submit="handleSubmit"
        >
          <FormKitSchema :schema="schema" />
          <slot name="form-content" />
          <div class="flex justify-end gap-2 mt-4">
            <q-btn
              flat
              :label="t('cancel')"
              @click="handleCancel"
            />
            <FormKit type="submit" :label="t('submit')" />
          </div>
        </FormKit>
      </q-card-section>
    </q-card>
  </q-dialog>

  <MaConfirmDialog
    v-model="confirmVisible"
    :title="t('unsavedChanges.title')"
    :message="t('unsavedChanges.message')"
    :cancel-label="t('unsavedChanges.continue')"
    :confirm-label="t('unsavedChanges.discard')"
    confirm-color="negative"
    @confirm="confirmDiscard"
    @cancel="keepEditing"
  />
</template>
