<script lang="ts" setup>
import InputDuration from './InputDuration.vue'
import InputNumber from './InputNumber.vue'
import type { CommandFormula, CommandParameter, ParameterItem, ParameterSelections } from '~/shared/types'

const props = defineProps<{
  path: string
  parameter: CommandParameter
  commandNo: number
  parameterError?: { type: string, parameterIndex?: number, parameterName?: string }
}>()

const $q = useQuasar()
const { t } = useI18n()
const editor = useEditorStore()
const { mt } = useProjectTranslations()
const { $commandManager } = useNuxtApp()
const programParameter: ParameterItem = editor.getPathElement(props.path)
const model = ref(Number(programParameter.value))
const isLastStep = Number(props.path.split('.')[1]) === editor.program.steps.length - 1

const rules = [
  (value: number | string) => value !== '' || t('input.required', { field: t('program.parameter') }),
  (value: number | string) => (Number(value) >= props.parameter.minValue && Number(value) <= props.parameter.maxValue) || t('valueOutOfRange', { minValue: props.parameter.minValue, maxValue: props.parameter.maxValue }),
]

const options = computed(() => {
  const selections = props.parameter.selections ?? []
  return selections.map((selection: ParameterSelections) => ({
    name: mt(selection.name, editor.machine.id),
    value: selection.value,
  }))
})

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

const labelLength = computed(() => {
  return props.parameter.name ? mt(props.parameter.name, editor.machine.id).length : 0
})

// TODO: update other steps parameter
function handleInputBlur() {
  const settings = useProgramWriteSettings()

  if (!isLastStep && settings.value.changeParallelCommandParameterInOtherSteps) {
    const stepIndex = Number(props.path.split('.')[1])
    const programCommand = editor.program.steps[stepIndex].mainCommand
    $commandManager.executeCommand('moveParallelStep', { $q }, 'changeParameter', props.commandNo, programCommand, programParameter)
  }
}
</script>

<template>
  <div class="flex">
    <DevOnly>
      <div class="color-gray-5 text-3">
        {{ props.commandNo }} - {{ props.parameter.index }} - {{ props.parameter.group }}
      </div>
    </DevOnly>

    <template v-if="parameter.type === 'NUMBER'">
      <InputDuration
        v-if="parameter.format === 'DURATION'"
        v-model="model"
        dense
        outlined
        :label="parameter.name ? mt(parameter.name, editor.machine.id) : undefined"
        :rules="rules"
        style="width: 150px;"
        class="text-3"
        hide-bottom-space
        :class="{ 'border-2 border-red-2': props.parameterError }"
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
        :label="parameter.name ? mt(parameter.name, editor.machine.id) : undefined"
        type="decimal"
        :maxlength="10"
        :hide-bottom-space="true"
        :format="parameter.format"
        outlined
        dense
        :style="{ 'maxWidth': '150px', '--q-label-length': labelLength }"
        class="text-3 dynamic-min-width"
        :class="{ 'border-2 border-red rounded-2': props.parameterError }"
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

    <template v-else-if="parameter.type === 'SELECT' || parameter.type === 'SELECT_ADDITIVE'">
      <QSelect
        v-model="model"
        :label="parameter.name ? mt(parameter.name, editor.machine.id) : undefined"
        :options="options"
        option-label="name"
        option-value="value"
        options-dense
        map-options
        emit-value
        outlined
        dense
        :style="{ 'maxWidth': '150px', '--q-label-length': labelLength }"
        class="text-3 q-select-nowrap dynamic-min-width"
        :class="{ 'border-2 border-red rounded-2': props.parameterError }"
      />
    </template>

    <template v-else-if="parameter.type === 'SELECTABLE_FORMULA'">
      <QSelect
        v-model="model"
        :label="parameter.name ? mt(parameter.name, editor.machine.id) : undefined"
        :options="formulaOptions"
        :option-label="(f) => f.label?.trim().slice(0, 15)"
        option-value="value"
        options-dense
        map-options
        emit-value
        outlined
        dense
        :style="{ 'maxWidth': '150px', '--q-label-length': labelLength }"
        class="text-3 q-select-nowrap dynamic-min-width"
        :class="{ 'border-2 border-red rounded-2': props.parameterError }"
      >
        <template #option="scope">
          <QItem
            v-close-popup
            dense
            clickable
            :active="model === scope.opt.value"
            active-class="bg-blue-1"
            class="text-3"
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
    </template>

    <template v-else-if="parameter.type === 'CHECKBOX'">
      <InputCheckbox
        v-model="model"
        :label="parameter.name ? mt(parameter.name, editor.machine.id) : undefined"
        :class="{ 'border-2 border-red rounded-2': props.parameterError }"
        @blur="handleInputBlur"
      />
    </template>
  </div>
</template>

<style scoped>
.q-select-nowrap :deep(.q-field__native) {
  white-space: nowrap;
}

.dynamic-min-width {
  min-width: calc(var(--q-label-length) * 0.6em + 2.5rem);
}
</style>
