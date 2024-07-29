<script lang="ts" setup>
import InputDuration from './InputDuration.vue'
import InputNumber from './InputNumber.vue'
import type { CommandFormula, CommandParameter, ParameterItem } from '~/shared/types'

const props = defineProps<{
  path: string
  parameter: CommandParameter
  commandno: number
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
  editor.machine.commandFormulas.filter((f: CommandFormula) => f.commandNo === props.commandno).map((f: CommandFormula) => ({
    label: f.formulaName,
    value: f.formulaId,
    formula: f.formula,
  })),
)

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
    />
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
      style="width: 200px;"
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
            <q-tooltip>{{ scope.opt.formula }}</q-tooltip>
          </QItemSection>
        </QItem>
      </template>
    </QSelect>
    <q-tooltip>
      {{ formulaOptions.find((f) => f.value === model)?.formula }}
    </q-tooltip>
  </div>
</template>
