<script lang="ts" setup>
import InputDuration from './InputDuration.vue'
import InputNumber from './InputNumber.vue'
import type { CommandFormula, CommandParameter, ParameterItem } from '~/shared/types'

const props = defineProps<{
  path: string
  parameter: CommandParameter
  commandNo: number
}>()

const { t } = useI18n()
const editor = useEditorStore()
const programParameter: ParameterItem = editor.getPathElement(props.path)
const model = ref(Number(programParameter.value))

const rules = [
  (value: number | string) => value !== '' || t('input.required', { field: t('program.parameter') }),
  (value: number | string) => (Number(value) >= props.parameter.minValue && Number(value) <= props.parameter.maxValue) || t('valueOutOfRange', { minValue: props.parameter.minValue, maxValue: props.parameter.maxValue }),
]
const options = computed(() => props.parameter.selections || [])
const formulaOptions = computed(() =>
  editor.machine.commandFormulas.filter((f: CommandFormula) => f.commandNo === props.commandNo).map((f: CommandFormula) => ({
    label: f.formulaName,
    value: f.formulaId,
    formula: f.formula,
  })),
)

const isOptimizable = computed(() => {
  return editor.teleskopSettings.treatmentSettings.optimizedEnable && editor.machine.treatmentParameters.find((tp) => {
    return tp.commandNo === props.commandNo && tp.parameterIndex === props.parameter.index
  })
})

watch(() => model.value, (newValue: number) => {
  programParameter.value = newValue
})
</script>

<template>
  <template v-if="parameter.type === 'NUMBER'">
    <InputDuration
      v-if="parameter.format === 'DURATION'"
      v-model="model"
      dense
      outlined
      :label="parameter.name"
      :rules="rules"
      style="width: 150px;"
    >
      <template #optimized>
        <div v-if="isOptimizable" class="ml-3 flex-center h-full">
          <QCheckbox
            v-model="programParameter.optimized"
            size="sm"
            dense
          />
        </div>
      </template>
    </InputDuration>
    <InputNumber
      v-else
      v-model="model"
      :rules="rules"
      :label="parameter.name"
      type="decimal"
      :maxlength="10"
      :hide-bottom-space="true"
      :format="parameter.format"
      outlined
      dense
      style="width: 150px;"
    >
      <template #optimized>
        <div v-if="isOptimizable" class="ml-3 flex-center h-full">
          <QCheckbox
            v-model="programParameter.optimized"
            size="sm"
            dense
          />
        </div>
      </template>
    </InputNumber>
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
    style="width: 180px;"
  />
  <div v-else-if="parameter.type === 'SELECTABLE_FORMULA'">
    <QSelect
      v-model="model"
      :label="parameter.name"
      :options="formulaOptions"
      option-label="label"
      option-value="value"
      options-dense
      map-options
      emit-value
      outlined
      dense
      style="width: 180px;"
    >
      <template #option="scope">
        <QItem
          v-close-popup
          dense
          clickable
          :active="model === scope.opt.value"
          active-class="bg-blue-1"
          @click="model = scope.opt.value"
        >
          <QItemSection>
            {{ scope.opt.label }}
            <QTooltip>{{ scope.opt.formula }}</QTooltip>
          </QItemSection>
        </QItem>
      </template>
    </QSelect>
    <QTooltip>
      {{ formulaOptions.find((f) => f.value === model)?.formula }}
    </QTooltip>
  </div>
</template>
