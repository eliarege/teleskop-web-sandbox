<script setup lang="ts">
import { FormKitSchema } from '@formkit/vue'

const props = defineProps<{
  show: boolean
  formClass: string
}>()

const emit = defineEmits(['close'])

const { t } = useI18n()

type Label = 'ttbuserManagentActive' | 'ttbphaseModeActive' | 'ttbCustomErpPrmOptimization' | 'ttbAllowedCharsForJobOrder'
  | 'ttbRecipeEnterActive' | 'ttbTimeBasedModeActive' | 'ttbDyehouseNumber' | 'ttbProcessUsageActive' | 'ttbSaveIOValuesInDatabase'
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
]

const formData = ref<Partial<Setting>>({})

const { data: _setting } = useLazyFetch('/api/machines/teleskop-settings', {
  default: () => ({}),
  onResponse: (res) => {
    const data = res.response._data
    formData.value = data.reduce((acc: Setting, item: { id: number, value: string }) => {
      const key = settingsList.find(d => d.value === item.id)?.label
      if (key === 'ttbDyehouseNumber') {
        acc[key] = Number.parseInt(item.value)
      } else if (key) {
        acc[key as Label] = item ? item.value === '1' : false
      }
      return acc
    }, {})
    for (const item of settingsList) {
      if (!formData.value[item.label as Label]) {
        formData.value[item.label as Label] = false
      }
    }
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
]))

async function handleSubmit() {
  const submitData: Record<number, number | boolean> = {}
  for (const [key, value] of Object.entries(formData.value)) {
    const setting = settingsList.find(d => d.label === key)
    if (setting) {
      submitData[setting.value] = value
    }
  }
  await $fetch('/api/machines/teleskop-settings', {
    method: 'PUT',
    body: submitData,
  })
}
</script>

<template>
  <q-dialog
    :model-value="props.show"
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
          <FormKit type="submit" :label="t('submit')" />
        </FormKit>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
