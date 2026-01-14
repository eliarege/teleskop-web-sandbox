<script setup lang="ts">
import * as math from 'mathjs'
import type { Formula } from '~/types'

const props = defineProps<{
  show: boolean
  machineId: number
  formula: Partial<Formula>
}>()

const emit = defineEmits(['close', 'refresh'])

const kc = useKeycloak()

const { t } = useI18n()

const { data: startingParameters } = useAuthFetch('/api/formulas/starting-parameter-options', {
  default: () => [],
  query: {
    machineId: props.machineId,
  },
})

const { data: machineConstants } = useAuthFetch('/api/formulas/machine-constant-options', {
  default: () => [],
  query: {
    machineId: props.machineId,
  },
})

const { data: commandParameters } = useAuthFetch('/api/formulas/command-parameter-options', {
  default: () => [],
  query: {
    machineId: props.machineId,
    commandNo: props.formula.commandNo,
  },
})

const expression = ref('')
const {
  hasChanges,
  confirmVisible,
  requestClose,
  confirmDiscard,
  keepEditing,
  markSaved,
} = useUnsavedDialogGuard({
  getState: () => expression.value,
  setState: (state) => {
    expression.value = state || ''
  },
  isOpen: () => props.show,
})
const isValidExpression = ref(true)
const result = ref(0)

const scope = computed(() => {
  return {
    ...startingParameters.value.reduce((acc, param) => {
      const paramName = param.paramString.trim().replace(/\s/g, '_')
      acc[paramName] = param.defaultValue
      return acc
    }, {}),
    ...machineConstants.value.reduce((acc, constant) => {
      const constantName = constant.paramString.trim().replace(/\s/g, '_')
      acc[constantName] = constant.defaultValue
      return acc
    }, {}),
    ...commandParameters.value.reduce((acc, param) => {
      const paramName = param.paramString.trim().replace(/\s/g, '_')
      acc[paramName] = param.defaultValue
      return acc
    }, {}),
  }
})

const errorMessage = ref('')

function evaluateExpression() {
  if (expression.value === '') {
    isValidExpression.value = true
    errorMessage.value = ''
    return
  }
  try {
    result.value = math.evaluate(expression.value, scope.value)
    if (!Number.isFinite(result.value)) {
      isValidExpression.value = false
      errorMessage.value = t('divisionByZero')
    } else {
      isValidExpression.value = true
      errorMessage.value = ''
    }
  } catch (err) {
    isValidExpression.value = false
    errorMessage.value = t('invalidSymbolOrIncompleteExpression')
  }
}

function handleOptionClick(option: { paramString: string, defaultValue: number }) {
  expression.value += `${option.paramString.trim().replace(/\s/g, '_')}`
  evaluateExpression()
}

async function handleSubmit() {
  if (isValidExpression.value) {
    await kc.fetch('/api/formulas/formula', {
      method: 'PUT',
      body: {
        formula: { ...props.formula, formula: expression.value },
        machineId: props.machineId,
        oldFormulaId: props.formula.formulaId,
      },
    })
    emit('refresh')
    emit('close')
    markSaved()
  }
}

expression.value = props.formula.formula?.split(/([*+/()-])/).map((str) => {
  return str.trim().replace(/\s/g, '_')
}).join('') || ''

watch(scope, () => {
  evaluateExpression()
})

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
        <q-icon
          name="close"
          class="flex w-full justify-end mb-4 cursor-pointer"
          size="1.5em"
          @click="handleCancel"
        />
        <q-input
          v-model="expression"
          :label="t('formulaId')"
          clearable
          @update:model-value="evaluateExpression"
        />
        <q-label v-if="!isValidExpression" class="bg-red-400">
          {{ t('invalidExpression') }} {{ errorMessage }}
        </q-label>
        <q-label v-else class="bg-teal-300">
          {{ t('validExpression') }} {{ result }}
        </q-label>
        <div class="flex flex-row w-full justify-around">
          <div class="flex flex-col">
            <h3>{{ t('startingParameters') }}</h3>
            <q-list
              bordered
              separator
              class="overflow-y-auto h-120 w-60"
            >
              <q-item
                v-for="param in startingParameters"
                :key="param.paramString"
                v-ripple
                clickable
                @click="handleOptionClick(param)"
              >
                <q-item-section>
                  {{ param.paramString }}
                </q-item-section>
              </q-item>
            </q-list>
          </div>
          <div class="flex flex-col">
            <h3>{{ t('machineConstants') }}</h3>
            <q-list
              bordered
              separator
              class="overflow-y-auto h-120 w-60"
            >
              <q-item
                v-for="constant in machineConstants"
                :key="constant.paramString"
                v-ripple
                clickable
                @click="handleOptionClick(constant)"
              >
                <q-item-section>
                  {{ constant.paramString }}
                </q-item-section>
              </q-item>
            </q-list>
          </div>
          <div class="flex flex-col">
            <h3>{{ t('commandParameters') }}</h3>
            <q-list
              bordered
              separator
              class="overflow-y-auto h-120 w-60"
            >
              <q-item
                v-for="param in commandParameters"
                :key="param.paramString"
                v-ripple
                clickable
                @click="handleOptionClick(param)"
              >
                <q-item-section>
                  {{ param.paramString }}
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right" class="flex gap-2 m-4">
        <q-btn
          :label="t('cancel')"
          no-caps
          @click="handleCancel"
        />
        <q-btn
          :label="t('submit')"
          color="primary"
          no-caps
          @click="handleSubmit"
        />
      </q-card-actions>
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

<style scoped>
</style>
