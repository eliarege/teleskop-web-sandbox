<script lang="ts" setup>
import InputDuration from './InputDuration.vue'
import InputNumber from './InputNumber.vue'
import type { CommandFormula, CommandParameter, ParameterItem, ParameterSelections } from '~/shared/types'

const props = defineProps<{
  stepId: number
  parallelIndex: number // -1 for main command, >= 0 for parallel command
  parameterIndex: number
  parameter: CommandParameter
  commandNo: number
  parameterError?: { type: string, parameterIndex?: number, parameterName?: string }
}>()

const emit = defineEmits<{
  (e: 'parameterBlur', parameterIndex: number, oldValue: number | string, newValue: number | string): void
}>()

const { t } = useI18n()
const editor = useEditorStore()
const machine = useMachineStore()
const { mt } = useProjectTranslations()
const teleskopSettings = useTeleskopSettingsStore()

const programParameter = editor.getPathElement({
  stepId: props.stepId,
  parallelIndex: props.parallelIndex,
  parameterIndex: props.parameterIndex,
})
const model = computed({
  get: () => Number(programParameter.value),
  set: (newValue) => {
    programParameter.value = newValue
  },
})

const previousValue = ref(Number(programParameter.value))
const rules = [
  (value: number | string) => value !== '' || t('input.required', { field: t('program.parameter') }),
  (value: number | string) => (Number(value) >= props.parameter.minValue && Number(value) <= props.parameter.maxValue) || t('valueOutOfRange', { minValue: props.parameter.minValue, maxValue: props.parameter.maxValue }),
]

interface Option {
  label: string
  value: number | string
  formula?: string
}

const options = computed<Option[]>(() => {
  const selections = props.parameter.selections ?? []
  if (props.parameter.type === 'SELECTABLE_FORMULA') {
    return machine.currentMachine.commandFormulas
      .filter((f: CommandFormula) => f.commandNo === props.commandNo)
      .map((f: CommandFormula) => ({
        label: f.formulaName,
        value: f.formulaId,
        formula: f.formula,
      }))
  } else {
    return selections.map((selection: ParameterSelections) => ({
      label: mt(selection.name, machine.currentMachine.id),
      value: selection.value,
    }))
  }
})

const isOptimizable = computed(() => {
  return teleskopSettings.treatmentSettings.optimizedEnable && machine.currentMachine.treatmentParameters.find((tp) => {
    return tp.commandNo === props.commandNo && tp.parameterIndex === props.parameter.index
  })
})

const labelLength = computed(() => {
  return props.parameter.name ? mt(props.parameter.name, machine.currentMachine.id).length : 0
})

const selectTypes = ['SELECT', 'SELECT_ADDITIVE', 'SELECTABLE_FORMULA']

const valueLength = computed(() => {
  const isSelect = selectTypes.includes(props.parameter.type)
  if (isSelect) {
    const currentOption = options.value.find(opt => opt.value === model.value)
    return currentOption ? currentOption.label.length : 0
  } else {
    return String(model.value).length
  }
})

const isValueInRange = computed(() => {
  const value = Number(model.value)
  return value >= props.parameter.minValue && value <= props.parameter.maxValue
})

const stepIndex = computed(() => editor.program.steps.findIndex(s => s.stepId === props.stepId))

function handleFocus() {
  const step = editor.program.steps[stepIndex.value]
  if (step && !editor.isStepSelected(step.stepId)) {
    editor.selectedSteps = [step]
  }
}

function handleBlur() {
  // Değer geçerli aralıkta değilse dialog çıkmasın
  if (!isValueInRange.value) {
    return
  }

  // Sadece değer değiştiyse event emit et
  if (model.value !== previousValue.value) {
    emit('parameterBlur', props.parameter.index, previousValue.value, model.value)
    previousValue.value = model.value
  }
}
</script>

<template>
  <div class="flex" :class="{ 'parameter-input-error': !!props.parameterError }">
    <template v-if="parameter.type === 'NUMBER'">
      <InputDuration
        v-if="parameter.format === 'DURATION'"
        v-model="model"
        dense
        outlined
        :label="parameter.name ? mt(parameter.name, machine.currentMachine.id) : undefined"
        :rules="rules"
        style="width: 150px;"
        class="text-3"
        hide-bottom-space
        @input-blur="handleBlur"
        @focus="handleFocus"
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
        :label="parameter.name ? mt(parameter.name, machine.currentMachine.id) : undefined"
        type="decimal"
        :maxlength="10"
        :hide-bottom-space="true"
        :format="parameter.format"
        outlined
        dense
        :style="{ '--q-label-length': labelLength }"
        class="text-3 dynamic-width"
        @input-blur="handleBlur"
        @focus="handleFocus"
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
        :label="parameter.name ? mt(parameter.name, machine.currentMachine.id) : undefined"
        :options="options"
        option-value="value"
        options-dense
        map-options
        emit-value
        outlined
        dense
        :style="{ '--q-label-length': labelLength, '--q-value-length': valueLength }"
        class="text-3 q-select-nowrap dynamic-width"
        @focus="handleFocus"
      />
    </template>

    <template v-else-if="parameter.type === 'SELECTABLE_FORMULA'">
      <QSelect
        v-model="model"
        :label="parameter.name ? mt(parameter.name, machine.currentMachine.id) : undefined"
        :options="options"
        :option-label="(f) => f.label?.trim().slice(0, 15)"
        option-value="value"
        options-dense
        map-options
        emit-value
        outlined
        dense
        :style="{ '--q-label-length': labelLength, '--q-value-length': valueLength }"
        class="text-3 q-select-nowrap dynamic-width"
        @focus="handleFocus"
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
        {{ options.find((f) => f.value === model)?.formula }}
      </QTooltip>
    </template>

    <template v-else-if="parameter.type === 'CHECKBOX'">
      <InputCheckbox
        v-model="model"
        :label="parameter.name ? mt(parameter.name, machine.currentMachine.id) : undefined"
        @input-blur="handleBlur"
        @focus="handleFocus"
      />
    </template>
  </div>
</template>

<style scoped>
.q-select-nowrap :deep(.q-field__native) {
  white-space: nowrap;
}

.dynamic-width {
  min-width: calc(var(--q-label-length, 1) * 0.6em + 3rem);
  max-width: max(150px, calc(var(--q-value-length, 0) * 1em + 3rem));
}
</style>

<style>
.parameter-input-error .q-field--outlined .q-field__control:hover:before {
  border-color: transparent;
}
.parameter-input-error .q-field--outlined .q-field__control:after {
  border-color: currentColor;
  border-width: 2px;
  transform: scale3d(1, 1, 1);
}
.parameter-input-error .q-field__label {
  animation: q-field-label 0.36s;
}
.parameter-input-error .q-field__control {
  color: var(--q-negative);
}
</style>
