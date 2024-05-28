<script lang="ts" setup>
import InputDuration from './InputDuration.vue'
import InputNumber from './InputNumber.vue'
import type { CommandParameters, ParameterItem } from '~/shared/types'

const props = defineProps<{
  path: string
  parameter: CommandParameters
}>()

const { t } = useI18n()
const editor = useEditorStore()
const programParameter: ParameterItem = editor.getPathElement(props.path)
const model = ref(Number(programParameter.value))

const rules = [
  (value: any) => !!value || t('input.required', { field: t('program.parameter') }),
  (value: any) => (value >= props.parameter.minValue && value <= props.parameter.maxValue) || t('valueOutOfRange', { minValue: props.parameter.minValue, maxValue: props.parameter.maxValue }),
]

const options = computed(() => props.parameter.selections || [])

watch(() => model.value, (newValue) => {
  programParameter.value = newValue
})
</script>

<template>
  <template v-if="parameter.type === 'NUMBER'">
    <InputDuration
      v-if="parameter.format === 'DURATION'"
      v-model="model"
      :label="parameter.name"
      :min-value="parameter.minValue"
      :max-value="parameter.maxValue"
    />
    <InputNumber
      v-else
      v-model="model"
      :rules="rules"
      :label="parameter.name.charAt(0).toUpperCase() + parameter.name.slice(1)"
      type="decimal"
      :maxlength="10"
      :hide-bottom-space="true"
      outlined
      dense
    />
  </template>
  <QSelect
    v-else-if="parameter.type === 'SELECT'"
    v-model="model"
    :label="parameter.name"
    :options="options"
    option-label="name"
    option-value="value"
    options-dense
    map-options
    emit-value
    outlined
    dense
    style="width: 150px;"
  />
</template>
