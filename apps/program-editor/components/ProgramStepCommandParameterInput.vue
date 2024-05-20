<script lang="ts" setup>
import InputDuration from './InputDuration.vue'
import InputNumber from './InputNumber.vue'
import type { CommandParameters, ParameterItem, ParameterSelections } from '~/shared/types'

const props = defineProps<{
  path: string
  parameter: CommandParameters
}>()

const editor = useEditorStore()
const programParameter: ParameterItem = editor.getPathElement(props.path)
</script>

<template>
  <template v-if="parameter.type === 'NUMBER'">
    <InputDuration
      v-if="parameter.format === 'DURATION'"
      v-model="programParameter.value"
      :label="parameter.name"
      :min-value="parameter.minValue"
      :max-value="parameter.maxValue"
    />
    <InputNumber
      v-else
      v-model="programParameter.value"
      :label="parameter.name"
      :min-value="parameter.minValue"
      :max-value="parameter.maxValue"
    />
  </template>
  <QSelect
    v-else-if="parameter.type === 'SELECT'"
    v-model="programParameter.value"
    :label="parameter.name"
    :options="parameter.selections"
    option-label="name"
    map-options
    emit-value
    options-dense
    outlined
    dense
    style="width: 150px;"
  />
</template>
