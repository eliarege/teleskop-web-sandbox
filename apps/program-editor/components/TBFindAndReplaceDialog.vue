<script setup lang="ts">
import { ParameterType } from '~/shared/constants'
import type { CommandParameter, MachineCommand } from '~/shared/types'
import ReplaceConfirmDialog from '~/components/ReplaceConfirmDialog.vue'

const props = defineProps<{
  machineId: number
  machineName: string
  machineCommands: Map<number, MachineCommand>
}>()

const $q = useQuasar()
const { t } = useI18n()
const kc = useKeycloak()
const machine = useMachineStore()
const { notifyError, notifyWarning, notifySuccess } = useNotify()
const { dialogRef, onDialogCancel } = useDialogPluginComponent()

const commandNo = ref<number | null>(null)
const machineCommands = computed<Map<number, MachineCommand>>(() => props.machineCommands)

const searchCriteria = ref<{
  commandNo: number | null
  type: 'parameter' | 'io'
  parameter?: {
    parameterIndex: number
    parameterName: string
    parameterValue: number | string | null
    parameterType?: string
  }
  io?: {
    ioIndex: number
    ioName: string
    ioValues: { name: string, index: number, ioType: string, ioPhysicalId: string, defaultValue: boolean }[]
  }
}[]>([])

const searchType = ref<string>('1')
const comparisonType = ref<{ label: string, value: string, symbol: string } | null>(null)
const startStepNo = ref<number>(1)
const endStepNo = ref<number>(60)
const searchInSelectedSteps = ref<boolean>(false)
const selectedCriteriaIndex = ref<number | null>(null)
const searchCriteriaDialog = ref(false)

type ReplaceValueEntry = {
  type: 'parameter'
  parameterIndex: number
  parameterName: string
  parameterValue: number | string | null
  parameterType?: string
} | {
  type: 'io'
  ioIndex: number
  ioName: string
  ioValues: { name: string, index: number, ioType: string, ioPhysicalId: string, defaultValue: boolean }[]
} | {
  type: 'newCommand'
  commandNo: number
  commandName: string
  parameters: { parameterIndex: number, value: string }[]
  ioValues: { ioIndex: number, selectionIndex: number, type: number, physicalId: number }[]
}

const replaceValues = ref<ReplaceValueEntry[]>([])
const selectedReplaceIndex = ref<number | null>(null)
const replaceValuesDialog = ref(false)
const newCommandDialog = ref(false)

const replaceSelectedParameter = ref('')
const replaceSelectedParameterIndex = computed(() => Number(replaceSelectedParameter.value?.split('-')[1]))
const replaceSelectedParameterValue = ref<number | string | null>(null)
const isReplaceParameterSelected = computed(() => replaceSelectedParameter.value?.split('-')[0] === 'pr')
const isReplaceIOSelected = computed(() => replaceSelectedParameter.value?.split('-')[0] === 'io')

const newCommandNo = ref<number | null>(null)
const newCommandParamValues = ref<Record<number, string>>({})
const newCommandIOSelections = ref<Record<number, Record<number, boolean>>>({})
const newCommandPreview = computed(() => {
  if (!newCommandNo.value)
    return null
  return machineCommands.value.get(newCommandNo.value) || null
})

watch(newCommandNo, (val) => {
  newCommandParamValues.value = {}
  newCommandIOSelections.value = {}
  if (val) {
    const command = machineCommands.value.get(val)
    if (command) {
      for (const param of command.parameters) {
        if (param.editable) {
          newCommandParamValues.value[param.index] = param.value ?? '0'
        }
      }
      for (const io of command.ioList) {
        if (io.selectable) {
          newCommandIOSelections.value[io.index] = {}
          for (const sel of io.selections) {
            newCommandIOSelections.value[io.index][sel.index] = sel.defaultValue
          }
        }
      }
    }
  }
})

const commandOptions = computed(() => {
  return Array.from(props.machineCommands.values()).map(cmd => ({
    label: `${cmd.commandNo} - ${cmd.name}`,
    value: cmd.commandNo,
  }))
})

const selectedParameter = ref('')
const selectedParameterIndex = computed(() => Number(selectedParameter.value?.split('-')[1]))
const selectedParameterValue = ref<number | string | null>(null)

// Between range values
const selectedParameterValueMin = ref<number | null>(null)
const selectedParameterValueMax = ref<number | null>(null)

const comparisonOptions: { label: string, value: string, symbol: string }[] = [
  {
    label: t('findAndReplace.equals'),
    value: 'EQUALS',
    symbol: '=',
  },
  {
    label: t('findAndReplace.greaterThan'),
    value: 'GREATER_THAN',
    symbol: '>',
  },
  {
    label: t('findAndReplace.lessThan'),
    value: 'LESS_THAN',
    symbol: '<',
  },
  {
    label: t('findAndReplace.between'),
    value: 'BETWEEN',
    symbol: '~',
  },
]

const isBetweenSelected = computed(() => {
  return comparisonType.value?.value === 'BETWEEN'
})

function addSearchCriteria() {
  if (!commandNo.value || !selectedParameter.value)
    return

  const [source, indexStr] = selectedParameter.value.split('-')
  const index = Number(indexStr)
  const isParameter = source === 'pr'
  const command = machineCommands.value.get(commandNo.value)
  const name = isParameter
    ? command?.parameters.find(p => p.index === index)?.name || ''
    : command?.ioList.find(io => io.index === index)?.name || ''

  if (isParameter) {
    if (isBetweenSelected.value) {
      if (selectedParameterValueMin.value === null || selectedParameterValueMax.value === null)
        return
    } else {
      if (selectedParameterValue.value === null || selectedParameterValue.value === '')
        return
    }

    const existingIndex = searchCriteria.value.findIndex(c =>
      c.commandNo === commandNo.value && c.type === 'parameter' && c.parameter?.parameterIndex === index,
    )

    let parameterValue = isBetweenSelected.value
      ? `${selectedParameterValueMin.value}-${selectedParameterValueMax.value}`
      : selectedParameterValue.value

    const parameterDef = command?.parameters.find(p => p.index === index)
    if (parameterDef?.type === ParameterType.SELECT && !isBetweenSelected.value) {
      const selection = parameterDef.selections.find(s => s.name === selectedParameterValue.value)
      parameterValue = selection ? selection.value.toString() : selectedParameterValue.value
    }

    const criteriaData = {
      commandNo: commandNo.value,
      type: 'parameter' as const,
      parameter: {
        parameterIndex: index,
        parameterName: name,
        parameterValue,
        parameterType: parameterDef?.type || ParameterType.NUMBER,
      },
    }

    if (existingIndex >= 0) {
      searchCriteria.value[existingIndex] = criteriaData
    } else {
      searchCriteria.value.push(criteriaData)
    }
  } else {
    const existingIndex = searchCriteria.value.findIndex(c =>
      c.commandNo === commandNo.value && c.type === 'io' && c.io?.ioIndex === index,
    )

    const ioDef = command?.ioList.find(io => io.index === index)
    if (!ioDef)
      return

    const hasSelectedValues = ioDef.selections.some(sel => sel.defaultValue)
    if (!hasSelectedValues) {
      notifyWarning(t('findAndReplace.selectAtLeastOneIOValue'))
      return
    }

    const ioValues = ioDef.selections.map(sel => ({
      name: sel.name,
      index: sel.index,
      ioType: sel.type.toString(),
      ioPhysicalId: sel.physicalId.toString(),
      defaultValue: sel.defaultValue,
    }))

    const criteriaData = {
      commandNo: commandNo.value,
      type: 'io' as const,
      io: { ioIndex: index, ioName: name, ioValues },
    }

    if (existingIndex >= 0) {
      searchCriteria.value[existingIndex] = criteriaData
    } else {
      searchCriteria.value.push(criteriaData)
    }
  }

  searchCriteriaDialog.value = false
}

function openSearchCriteriaDialog() {
  selectedParameter.value = ''
  selectedParameterValue.value = null
  selectedParameterValueMin.value = null
  selectedParameterValueMax.value = null
  comparisonType.value = null
  searchCriteriaDialog.value = true
}

function deleteSearchCriteria() {
  if (selectedCriteriaIndex.value !== null) {
    searchCriteria.value.splice(selectedCriteriaIndex.value, 1)
    selectedCriteriaIndex.value = null
  }
}

function openReplaceValuesDialog() {
  replaceSelectedParameter.value = ''
  replaceSelectedParameterValue.value = null
  replaceValuesDialog.value = true
}

function addReplaceValue() {
  if (!commandNo.value || !replaceSelectedParameter.value)
    return

  const [source, indexStr] = replaceSelectedParameter.value.split('-')
  const index = Number(indexStr)
  const isParameter = source === 'pr'
  const command = machineCommands.value.get(commandNo.value)
  const name = isParameter
    ? command?.parameters.find(p => p.index === index)?.name || ''
    : command?.ioList.find(io => io.index === index)?.name || ''

  if (isParameter) {
    if (replaceSelectedParameterValue.value === null || replaceSelectedParameterValue.value === '')
      return

    const parameterDef = command?.parameters.find(p => p.index === index)
    let parameterValue = replaceSelectedParameterValue.value

    if (parameterDef?.type === ParameterType.SELECT) {
      const selection = parameterDef.selections.find(s => s.name === replaceSelectedParameterValue.value)
      parameterValue = selection ? selection.value.toString() : replaceSelectedParameterValue.value
    }

    const existingIndex = replaceValues.value.findIndex(v =>
      v.type === 'parameter' && v.parameterIndex === index,
    )

    const entry: ReplaceValueEntry = {
      type: 'parameter',
      parameterIndex: index,
      parameterName: name,
      parameterValue,
      parameterType: parameterDef?.type || ParameterType.NUMBER,
    }

    if (existingIndex >= 0) {
      replaceValues.value[existingIndex] = entry
    } else {
      replaceValues.value.push(entry)
    }
  } else {
    const ioDef = command?.ioList.find(io => io.index === index)
    if (!ioDef)
      return

    const hasSelectedValues = ioDef.selections.some(sel => sel.defaultValue)
    if (!hasSelectedValues) {
      notifyWarning(t('findAndReplace.selectAtLeastOneIOValue'))
      return
    }

    const ioValues = ioDef.selections.map(sel => ({
      name: sel.name,
      index: sel.index,
      ioType: sel.type.toString(),
      ioPhysicalId: sel.physicalId.toString(),
      defaultValue: sel.defaultValue,
    }))

    const existingIndex = replaceValues.value.findIndex(v =>
      v.type === 'io' && v.ioIndex === index,
    )

    const entry: ReplaceValueEntry = {
      type: 'io',
      ioIndex: index,
      ioName: name,
      ioValues,
    }

    if (existingIndex >= 0) {
      replaceValues.value[existingIndex] = entry
    } else {
      replaceValues.value.push(entry)
    }
  }

  replaceValuesDialog.value = false
}

function deleteReplaceValue() {
  if (selectedReplaceIndex.value !== null) {
    replaceValues.value.splice(selectedReplaceIndex.value, 1)
    selectedReplaceIndex.value = null
  }
}

function openNewCommandDialog() {
  newCommandNo.value = null
  newCommandDialog.value = true
}

function addNewCommand() {
  if (!newCommandNo.value)
    return

  const command = machineCommands.value.get(newCommandNo.value)
  if (!command)
    return

  // Remove existing newCommand entry if any
  const existingIndex = replaceValues.value.findIndex(v => v.type === 'newCommand')
  if (existingIndex >= 0) {
    replaceValues.value.splice(existingIndex, 1)
  }

  const parameters = Object.entries(newCommandParamValues.value).map(([index, value]) => ({
    parameterIndex: Number(index),
    value: String(value),
  }))

  const ioValues: { ioIndex: number, selectionIndex: number, type: number, physicalId: number }[] = []
  for (const io of command.ioList) {
    if (!io.selectable)
      continue
    const selectionState = newCommandIOSelections.value[io.index] || {}
    for (const sel of io.selections) {
      if (selectionState[sel.index]) {
        ioValues.push({ ioIndex: io.index, selectionIndex: sel.index, type: sel.type, physicalId: sel.physicalId })
      }
    }
  }

  replaceValues.value.push({
    type: 'newCommand',
    commandNo: newCommandNo.value,
    commandName: command.name,
    parameters,
    ioValues,
  })

  newCommandDialog.value = false
  replaceValuesDialog.value = false
}

function getReplaceParameterType(parameterIndex: number): string | null {
  if (!commandNo.value)
    return null
  const command = machineCommands.value.get(commandNo.value)
  const parameter = command?.parameters.find(p => p.index === parameterIndex)
  return parameter ? parameter.type : null
}

const isParameterSelected = computed(() => selectedParameter.value?.split('-')[0] === 'pr')
const isIOSelected = computed(() => selectedParameter.value?.split('-')[0] === 'io')

const { $commandManager } = useNuxtApp()
const selectMachineDialog = () => $commandManager.executeCommand('selectMachine', { $q })

function openProgram(machineId: number, programNo: number) {
  const url = `/machine/${machineId}/program/${programNo}`
  window.open(url, '_blank')
}

function getParameterDefaultName(parameterIndex: number): CommandParameter['value'] {
  if (!commandNo.value)
    return ''

  const command = machineCommands.value.get(commandNo.value)
  const parameter = command?.parameters.find(p => p.index === parameterIndex)
  const selection = parameter?.selections.find(s => s.value === Number(parameter.value))
  const defaultValue = selection ? selection.name : ''
  return defaultValue
}

function getParameterDisplayValue(commandNo: number | null, parameterIndex: number, parameterValue: string | number | null, parameterType?: string): string {
  if (!commandNo || parameterValue === null || parameterValue === undefined)
    return ''

  const command = machineCommands.value.get(commandNo)
  const parameter = command?.parameters.find(p => p.index === parameterIndex)

  if (parameterType === ParameterType.SELECT && parameter?.selections) {
    const selection = parameter.selections.find(s => s.value.toString() === parameterValue.toString())
    return selection ? selection.name : parameterValue.toString()
  }

  return parameterValue.toString()
}

function getParameterType(parameterIndex: number): string | null {
  if (!commandNo.value)
    return null

  const command = machineCommands.value.get(commandNo.value)
  const parameter = command?.parameters.find(p => p.index === parameterIndex)
  return parameter ? parameter.type : null
}

function getParameterDisplaySymbol(commandNo: number | null, parameterIndex: number): string {
  if (!commandNo)
    return '='

  const command = machineCommands.value.get(commandNo)
  const parameter = command?.parameters.find(p => p.index === parameterIndex)

  if (parameter?.type === ParameterType.SELECT) {
    return ':'
  }

  return comparisonType.value?.symbol || '='
}

const searchResults = ref<{ machineId: number, machineName: string, programNo: number, programName: string, step: string, stepNo: number, parallelStep: number }[]>([])
const selectedResults = ref<{ machineId: number, machineName: string, programNo: number, programName: string, step: string, stepNo: number, parallelStep: number }[]>([])
const isSearching = ref(false)
const isReplacing = ref(false)

watch(commandNo, () => {
  searchCriteria.value = []
  selectedCriteriaIndex.value = null
  searchResults.value = []
  selectedResults.value = []
  replaceValues.value = []
  selectedReplaceIndex.value = null
})

function getRowKey(row: { machineId: number, programNo: number, step: string }) {
  return `${row.machineId}-${row.programNo}-${row.step}`
}

async function performSearch() {
  searchResults.value = []
  selectedResults.value = []
  isSearching.value = true

  try {
    if (!commandNo.value) {
      notifyWarning(t('findAndReplace.selectCommandFirst'))
      return
    }

    let machineIds: number[] = []

    if (searchType.value === '1') {
      machineIds = [props.machineId]
    } else if (searchType.value === '2') {
      machineIds = machine.selectedMachines.map(m => m.id)
    } else if (searchType.value === '3') {
      // Compatible machines: resolve via backend
      const compatResponse = await kc.fetch('/api/search/compatible-machines', {
        method: 'POST',
        body: { machineId: props.machineId, commandNo: commandNo.value },
      }) as { machineIds: number[] }
      machineIds = compatResponse.machineIds
    }

    if (machineIds.length === 0) {
      notifyWarning(t('findAndReplace.noMachinesSelected'))
      return
    }

    const mappedCriteria = searchCriteria.value.map((criteria) => {
      return {
        type: criteria.type,
        parameterIndex: criteria.parameter?.parameterIndex,
        parameterValue: criteria.parameter?.parameterValue,
        parameterType: criteria.parameter?.parameterType,
        comparison: 'EQUALS' as const,
        ioIndex: criteria.io?.ioIndex,
        ioValues: criteria.io?.ioValues?.filter(io => io.defaultValue).map((io) => {
          return {
            type: Number.parseInt(io.ioType),
            physicalId: Number.parseInt(io.ioPhysicalId),
          }
        }) || [],
      }
    })

    const searchParams = {
      machineIds,
      commandNo: commandNo.value,
      searchCriteria: mappedCriteria,
      stepRange: searchInSelectedSteps.value
        ? { start: startStepNo.value, end: endStepNo.value }
        : undefined,
    }

    const response = await kc.fetch('/api/search/find-programs', {
      method: 'POST',
      body: { searchParams },
    })

    const searchResponse = response as {
      success: boolean
      operation: string
      count: number
      results: Array<{
        machineId: number
        machineName: string
        programNo: number
        programName: string
        stepNo: number
        parallelStep: number
        currentCommandNo: number
      }>
    }

    if (searchResponse.success) {
      searchResults.value = searchResponse.results.map(result => ({
        machineId: result.machineId,
        machineName: result.machineName,
        programNo: result.programNo,
        programName: result.programName,
        step: (result.stepNo + 1).toString(),
        stepNo: result.stepNo,
        parallelStep: result.parallelStep,
      }))
    } else {
      throw new Error('Search failed')
    }
  } catch (error) {
    console.error('Search error:', error)
    notifyError(t('findAndReplace.searchError'))
  } finally {
    isSearching.value = false
  }
}

async function performReplace() {
  if (selectedResults.value.length === 0) {
    notifyWarning(t('findAndReplace.noResultsSelected'))
    return
  }
  if (replaceValues.value.length === 0) {
    notifyWarning(t('findAndReplace.noNewValues'))
    return
  }

  $q.dialog({
    component: ReplaceConfirmDialog,
    componentProps: {
      count: selectedResults.value.length,
    },
  }).onOk(async () => {
    isReplacing.value = true
    try {
      const targets = selectedResults.value.map(r => ({
        machineId: r.machineId,
        programNo: r.programNo,
        stepNo: r.stepNo,
        parallelStep: r.parallelStep,
      }))

      const mappedReplaceValues = replaceValues.value.map((v) => {
        if (v.type === 'parameter') {
          return {
            type: 'parameter' as const,
            parameterIndex: v.parameterIndex,
            parameterValue: String(v.parameterValue),
            parameterType: v.parameterType || ParameterType.NUMBER,
          }
        } else if (v.type === 'io') {
          return {
            type: 'io' as const,
            ioIndex: v.ioIndex,
            ioValues: v.ioValues.filter(io => io.defaultValue).map(io => ({
              type: Number.parseInt(io.ioType),
              physicalId: Number.parseInt(io.ioPhysicalId),
            })),
          }
        } else {
          return {
            type: 'newCommand' as const,
            commandNo: v.commandNo,
            commandName: v.commandName,
            parameters: v.parameters,
            ioValues: v.ioValues,
          }
        }
      })

      await kc.fetch('/api/search/replace-programs', {
        method: 'POST',
        body: {
          targets,
          originalCommandNo: commandNo.value,
          replaceValues: mappedReplaceValues,
        },
      })

      notifySuccess(t('findAndReplace.replaceSuccess', { count: selectedResults.value.length }))

      // Re-run search to refresh results
      await performSearch()
    } catch (error) {
      console.error('Replace error:', error)
      notifyError(t('findAndReplace.replaceError'))
    } finally {
      isReplacing.value = false
    }
  })
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogCancel"
  >
    <QCard class="w-[1200px] max-w-[95vw]">
      <!-- Başlık -->
      <QCardSection>
        <div class="text-h6 flex items-center">
          {{ t('findAndReplace.title') }}
          <QSpace />
          <QBtn
            icon="close"
            class="text-gray-4 dark:text-gray-6"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
      </QCardSection>

      <!-- İçerik -->
      <QCardSection class="text-gray-8 dark:text-gray-3">
        <!-- Üst bölüm: 3 sütun -->
        <div class="flex gap-4 mb-4">
          <!-- Sol panel: Command Selector ve Arama Seçenekleri -->
          <div class="flex flex-col gap-3 flex-1">
            <QSelect
              v-model="commandNo"
              :options="commandOptions"
              :label="t('findAndReplace.selectCommand')"
              options-dense
              map-options
              emit-value
              outlined
              dense
            />

            <!-- Arama Kapsamı -->
            <div class="q-mb-sm">
              <label class="text-subtitle2 text-grey-8 dark:text-grey-3 q-mb-xs pb-1 block">
                {{ t('findAndReplace.searchScope') }}
              </label>
              <div class="q-gutter-sm">
                <div class="flex flex-col gap-1">
                  <q-radio
                    v-model="searchType"
                    val="1"
                    :label="t('findAndReplace.thisMachine', { machineName: props.machineName })"
                    dense
                  />

                  <!-- Uyumlu makineler -->
                  <q-radio
                    v-model="searchType"
                    val="3"
                    :label="t('findAndReplace.compatibleMachines')"
                    :disable="!commandNo"
                    dense
                  />

                  <div class="flex">
                    <q-radio
                      v-model="searchType"
                      val="2"
                      :label="t('findAndReplace.selectedMachines')"
                      dense
                    />
                    <q-space />
                    <q-btn
                      :label="t('findAndReplace.selectMachine')"
                      :disable="searchType !== '2'"
                      color="primary"
                      size="sm"
                      outline
                      dense
                      @click="selectMachineDialog()"
                    />
                  </div>

                  <!-- Selected machines display -->
                  <div v-if="machine.selectedMachines.length > 0" class="pl-6 pt-1">
                    <div class="text-xs text-grey-6 dark:text-grey-4 cursor-help">
                      <span class="font-medium">
                        {{ t('findAndReplace.machinesSelected', { count: machine.selectedMachines.length }) }}
                      </span>
                      <q-tooltip
                        class="bg-white text-dark shadow-4 text-body2"
                        anchor="top middle"
                        self="bottom middle"
                      >
                        <div class="q-pa-sm">
                          <div class="text-weight-medium q-mb-xs">
                            {{ t('findAndReplace.selectedMachinesList') }}:
                          </div>
                          <div
                            v-for="selectedMachine in machine.selectedMachines"
                            :key="selectedMachine.id"
                            class="q-mb-xs"
                          >
                            • {{ selectedMachine.name }}
                          </div>
                        </div>
                      </q-tooltip>
                    </div>
                  </div>
                  <div v-else class="pl-6 pt-1">
                    <div class="text-xs text-grey-6 dark:text-grey-4 italic">
                      {{ t('findAndReplace.noMachinesSelected') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Adım Aralığı -->
            <div class="flex flex-col">
              <div class="flex items-center">
                <q-checkbox
                  v-model="searchInSelectedSteps"
                  :label="t('findAndReplace.searchInSelectedSteps')"
                  dense
                />
                <q-space />
                <InputNumber
                  v-model="startStepNo"
                  class="w-14"
                  type="positive-integer"
                  hide-bottom-space
                  dense
                  outlined
                  :disable="!searchInSelectedSteps"
                  :maxlength="3"
                >
                  <q-tooltip>
                    {{ t('findAndReplace.startStepNo') }}
                  </q-tooltip>
                </InputNumber>
                <span class="mx-2 font-bold text-grey-6 dark:text-grey-4">-</span>
                <InputNumber
                  v-model="endStepNo"
                  class="w-14"
                  type="positive-integer"
                  hide-bottom-space
                  outlined
                  dense
                  :disable="!searchInSelectedSteps"
                  :maxlength="3"
                >
                  <q-tooltip>
                    {{ t('findAndReplace.endStepNo') }}
                  </q-tooltip>
                </InputNumber>
              </div>

              <div v-if="searchInSelectedSteps" class="pl-6">
                <div class="text-xs text-grey-6 dark:text-grey-4 italic">
                  {{ t('findAndReplace.selectedStepCount', { count: endStepNo - startStepNo + 1 }) }}
                </div>
              </div>
              <div v-else class="pl-6">
                <div class="text-xs text-grey-6 dark:text-grey-4 italic">
                  {{ t('findAndReplace.searchingAllSteps') }}
                </div>
              </div>
            </div>
          </div>

          <!-- Orta panel: Search Criteria -->
          <div class="flex flex-col gap-3 flex-1">
            <div class="text-gray-8 dark:text-gray-3 flex items-center gap-2">
              <q-space />
              <span class="font-bold">
                {{ t('findAndReplace.searchCriteria') }}
              </span>
              <q-space />
              <q-btn
                class="bg-primary text-white"
                icon="add"
                size="sm"
                dense
                flat
                :disable="!commandNo"
                @click="openSearchCriteriaDialog()"
              >
                <q-tooltip>
                  {{ commandNo ? t('findAndReplace.addSearchCriteria') : t('findAndReplace.selectCommandFirst') }}
                </q-tooltip>
              </q-btn>

              <!-- Search Criteria Dialog -->
              <q-dialog v-model="searchCriteriaDialog">
                <q-card class="w-100">
                  <q-card-section>
                    <div class="text-h6 flex">
                      {{ t('findAndReplace.searchCriteria') }}
                      <q-space />
                      <q-btn
                        class="text-gray-4 dark:text-gray-6"
                        icon="close"
                        flat
                        round
                        dense
                        @click="searchCriteriaDialog = false"
                      />
                    </div>
                  </q-card-section>
                  <q-card-section>
                    <q-select
                      v-model="selectedParameter"
                      :options="[
                        ...(machineCommands.get(commandNo!)?.parameters.filter(p => p.editable).map(p => ({
                          name: p.name,
                          index: p.index,
                          source: 'pr',
                        })) || []),
                        ...(machineCommands.get(commandNo!)?.ioList.filter(p => p.selectable).map(p => ({
                          name: p.name,
                          index: p.index,
                          source: 'io',
                        })) || []),
                      ]"
                      option-label="name"
                      :option-value="opt => `${opt.source}-${opt.index}`"
                      :label="t('findAndReplace.selectParameterOrIO')"
                      map-options
                      emit-value
                      outlined
                      dense
                      options-dense
                    />

                    <q-select
                      v-if="isParameterSelected && getParameterType(selectedParameterIndex) === ParameterType.NUMBER"
                      v-model="comparisonType"
                      class="pt-2"
                      :options="comparisonOptions"
                      :label="t('findAndReplace.comparisonType')"
                      options-dense
                      outlined
                      dense
                    />

                    <div v-if="isParameterSelected" class="pt-2">
                      <div v-if="getParameterType(selectedParameterIndex) === ParameterType.NUMBER" class="flex flex-col">
                        <span class="pl-2"> {{ `${t('findAndReplace.parameterDefaultValue')}: ${machineCommands.get(commandNo!)?.parameters.find(p => p.index === selectedParameterIndex)?.value}` }} </span>
                        <span class="pl-2"> {{ `${t('findAndReplace.parameterMinValue')}: ${machineCommands.get(commandNo!)?.parameters.find(p => p.index === selectedParameterIndex)?.minValue}` }} </span>
                        <span class="pl-2"> {{ `${t('findAndReplace.parameterMaxValue')}: ${machineCommands.get(commandNo!)?.parameters.find(p => p.index === selectedParameterIndex)?.maxValue}` }} </span>

                        <q-input
                          v-if="!isBetweenSelected"
                          v-model="selectedParameterValue"
                          class="pt-2"
                          :label="t('findAndReplace.searchValue')"
                          :rules="[
                            val => val >= (machineCommands.get(commandNo!)?.parameters.find(p => p.index === selectedParameterIndex)?.minValue || 0),
                            val => val <= (machineCommands.get(commandNo!)?.parameters.find(p => p.index === selectedParameterIndex)?.maxValue || 0),
                          ]"
                          outlined
                          dense
                        />

                        <div v-if="isBetweenSelected" class="pt-2 flex gap-2">
                          <q-input
                            v-model="selectedParameterValueMin"
                            class="flex-1"
                            :label="t('findAndReplace.minValue')"
                            :rules="[
                              val => val >= (machineCommands.get(commandNo!)?.parameters.find(p => p.index === selectedParameterIndex)?.minValue || 0),
                              val => val <= (machineCommands.get(commandNo!)?.parameters.find(p => p.index === selectedParameterIndex)?.maxValue || 0),
                            ]"
                            outlined
                            dense
                          />
                          <q-input
                            v-model="selectedParameterValueMax"
                            class="flex-1"
                            :label="t('findAndReplace.maxValue')"
                            :rules="[
                              val => val >= (machineCommands.get(commandNo!)?.parameters.find(p => p.index === selectedParameterIndex)?.minValue || 0),
                              val => val <= (machineCommands.get(commandNo!)?.parameters.find(p => p.index === selectedParameterIndex)?.maxValue || 0),
                              val => val >= (selectedParameterValueMin || 0),
                            ]"
                            outlined
                            dense
                          />
                        </div>
                      </div>
                      <div v-else-if="getParameterType(selectedParameterIndex) === ParameterType.SELECT">
                        <span class="pl-2"> {{ `${t('findAndReplace.parameterDefaultValue')}: ${getParameterDefaultName(selectedParameterIndex)}` }} </span>
                        <q-select
                          v-model="selectedParameterValue"
                          class="pt-2"
                          :options="machineCommands.get(commandNo!)?.parameters.find(p => p.index === selectedParameterIndex)?.selections.map(s => s.name) || []"
                          :label="t('findAndReplace.searchValue')"
                          outlined
                          options-dense
                          dense
                        />
                      </div>
                    </div>

                    <div v-if="isIOSelected">
                      <div
                        v-for="io in machineCommands.get(commandNo!)?.ioList || []"
                        :key="io.index"
                      >
                        <div
                          v-if="io.index === selectedParameterIndex"
                          class="flex flex-col pt-2"
                        >
                          <div class="max-h-40 overflow-y-auto border border-gray-3 rounded p-2">
                            <div
                              v-for="selection in io.selections"
                              :key="selection.index"
                              class="flex items-center mb-2"
                            >
                              <q-checkbox
                                v-model="selection.defaultValue"
                                class="mr-2"
                                dense
                              />
                              <span class="text-sm">{{ selection.name }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                  <QCardActions
                    class="q-pa-md bg-gray-1 dark:bg-dark-4"
                    align="right"
                  >
                    <q-btn
                      :label="t('cancel')"
                      class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
                      flat
                      @click="searchCriteriaDialog = false"
                    />
                    <q-btn
                      :label="t('ok')"
                      class="q-mr-sm bg-primary text-white"
                      flat
                      @click="addSearchCriteria()"
                    />
                  </QCardActions>
                </q-card>
              </q-dialog>

              <q-btn
                class="bg-red text-white"
                icon="delete"
                size="sm"
                dense
                flat
                :disable="selectedCriteriaIndex === null"
                @click="deleteSearchCriteria()"
              >
                <q-tooltip>
                  {{ selectedCriteriaIndex !== null
                    ? t('findAndReplace.deleteSelectedCriteria')
                    : t('findAndReplace.deleteSearchCriteria')
                  }}
                </q-tooltip>
              </q-btn>
            </div>

            <q-separator />

            <!-- Search Criteria List -->
            <div class="flex-1 overflow-auto">
              <q-list class="max-h-48 rounded-borders">
                <q-item
                  v-for="(criteria, index) in searchCriteria"
                  :key="index"
                  clickable
                  :active="selectedCriteriaIndex === index"
                  dense
                  @click="selectedCriteriaIndex = index"
                >
                  <q-item-section>
                    <div v-if="criteria.type === 'parameter' && criteria.parameter" class="text-sm">
                      {{
                        `${criteria.parameter.parameterName} ${getParameterDisplaySymbol(
                          criteria.commandNo,
                          criteria.parameter.parameterIndex,
                        )} ${getParameterDisplayValue(
                          criteria.commandNo,
                          criteria.parameter.parameterIndex,
                          criteria.parameter.parameterValue,
                          criteria.parameter.parameterType,
                        )}`
                      }}
                    </div>
                    <div v-else-if="criteria.type === 'io' && criteria.io" class="text-sm">
                      {{
                        `${criteria.io.ioName}: [${criteria.io.ioValues
                          .filter(v => v.defaultValue)
                          .map(v => v.name)
                          .join(", ")}]`
                      }}
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <q-btn
              :label="t('findAndReplace.find')"
              :loading="isSearching"
              class="bg-primary text-white"
              dense
              flat
              @click="performSearch"
            />
          </div>

          <!-- Sağ panel: Yeni Değerler (Replace Values) -->
          <div class="flex flex-col gap-3 flex-1">
            <div class="text-gray-8 dark:text-gray-3 flex items-center gap-2">
              <q-space />
              <span class="font-bold">
                {{ t('findAndReplace.newValues') }}
              </span>
              <q-space />
              <q-btn
                class="bg-primary text-white"
                icon="add"
                size="sm"
                dense
                flat
                :disable="!commandNo"
                @click="openReplaceValuesDialog()"
              >
                <q-tooltip>
                  {{ commandNo ? t('findAndReplace.addNewValue') : t('findAndReplace.selectCommandFirst') }}
                </q-tooltip>
              </q-btn>

              <!-- Replace Values Dialog -->
              <q-dialog v-model="replaceValuesDialog">
                <q-card class="w-100">
                  <q-card-section>
                    <div class="text-h6 flex">
                      {{ t('findAndReplace.newValues') }}
                      <q-space />
                      <q-btn
                        class="text-gray-4 dark:text-gray-6"
                        icon="close"
                        flat
                        round
                        dense
                        @click="replaceValuesDialog = false"
                      />
                    </div>
                  </q-card-section>
                  <q-card-section>
                    <q-select
                      v-model="replaceSelectedParameter"
                      :options="[
                        ...(machineCommands.get(commandNo!)?.parameters.filter(p => p.editable).map(p => ({
                          name: p.name,
                          index: p.index,
                          source: 'pr',
                        })) || []),
                        ...(machineCommands.get(commandNo!)?.ioList.filter(p => p.selectable).map(p => ({
                          name: p.name,
                          index: p.index,
                          source: 'io',
                        })) || []),
                      ]"
                      option-label="name"
                      :option-value="opt => `${opt.source}-${opt.index}`"
                      :label="t('findAndReplace.selectNewValueParameterOrIO')"
                      map-options
                      emit-value
                      outlined
                      dense
                      options-dense
                    />

                    <!-- Replace parameter value input -->
                    <div v-if="isReplaceParameterSelected" class="pt-2">
                      <div v-if="getReplaceParameterType(replaceSelectedParameterIndex) === ParameterType.NUMBER" class="flex flex-col">
                        <span class="pl-2"> {{ `${t('findAndReplace.parameterMinValue')}: ${machineCommands.get(commandNo!)?.parameters.find(p => p.index === replaceSelectedParameterIndex)?.minValue}` }} </span>
                        <span class="pl-2"> {{ `${t('findAndReplace.parameterMaxValue')}: ${machineCommands.get(commandNo!)?.parameters.find(p => p.index === replaceSelectedParameterIndex)?.maxValue}` }} </span>
                        <q-input
                          v-model="replaceSelectedParameterValue"
                          class="pt-2"
                          :label="t('findAndReplace.newValue')"
                          :rules="[
                            val => val >= (machineCommands.get(commandNo!)?.parameters.find(p => p.index === replaceSelectedParameterIndex)?.minValue || 0),
                            val => val <= (machineCommands.get(commandNo!)?.parameters.find(p => p.index === replaceSelectedParameterIndex)?.maxValue || 0),
                          ]"
                          outlined
                          dense
                        />
                      </div>
                      <div v-else-if="getReplaceParameterType(replaceSelectedParameterIndex) === ParameterType.SELECT">
                        <q-select
                          v-model="replaceSelectedParameterValue"
                          class="pt-2"
                          :options="machineCommands.get(commandNo!)?.parameters.find(p => p.index === replaceSelectedParameterIndex)?.selections.map(s => s.name) || []"
                          :label="t('findAndReplace.newValue')"
                          outlined
                          options-dense
                          dense
                        />
                      </div>
                    </div>

                    <!-- Replace IO value selection -->
                    <div v-if="isReplaceIOSelected">
                      <div
                        v-for="io in machineCommands.get(commandNo!)?.ioList || []"
                        :key="io.index"
                      >
                        <div
                          v-if="io.index === replaceSelectedParameterIndex"
                          class="flex flex-col pt-2"
                        >
                          <div class="max-h-40 overflow-y-auto border border-gray-3 rounded p-2">
                            <div
                              v-for="selection in io.selections"
                              :key="selection.index"
                              class="flex items-center mb-2"
                            >
                              <q-checkbox
                                v-model="selection.defaultValue"
                                class="mr-2"
                                dense
                                :label="selection.name"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                  <QCardActions
                    class="q-pa-md bg-gray-1 dark:bg-dark-4"
                    align="right"
                  >
                    <q-btn
                      :label="t('findAndReplace.newCommand')"
                      class="q-mr-sm"
                      color="secondary"
                      flat
                      @click="openNewCommandDialog()"
                    />
                    <q-space />
                    <q-btn
                      :label="t('cancel')"
                      class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
                      flat
                      @click="replaceValuesDialog = false"
                    />
                    <q-btn
                      :label="t('ok')"
                      class="q-mr-sm bg-primary text-white"
                      flat
                      @click="addReplaceValue()"
                    />
                  </QCardActions>
                </q-card>
              </q-dialog>

              <!-- New Command Dialog -->
              <q-dialog v-model="newCommandDialog">
                <q-card class="w-120">
                  <q-card-section>
                    <div class="text-h6 flex">
                      {{ t('findAndReplace.newCommandDialog') }}
                      <q-space />
                      <q-btn
                        class="text-gray-4 dark:text-gray-6"
                        icon="close"
                        flat
                        round
                        dense
                        @click="newCommandDialog = false"
                      />
                    </div>
                  </q-card-section>
                  <q-card-section>
                    <q-select
                      v-model="newCommandNo"
                      :options="commandOptions"
                      :label="t('findAndReplace.selectNewCommand')"
                      options-dense
                      map-options
                      emit-value
                      outlined
                      dense
                    />

                    <!-- Command Input -->
                    <div v-if="newCommandPreview" class="pt-4">
                      <div v-if="newCommandPreview.parameters.filter(p => p.editable).length > 0" class="mb-3">
                        <div class="text-subtitle2 font-bold mb-2">
                          Parameters
                        </div>
                        <div class="border border-gray-3 rounded p-2 max-h-50 overflow-y-auto">
                          <div
                            v-for="param in newCommandPreview.parameters.filter(p => p.editable)"
                            :key="param.index"
                            class="mb-2"
                          >
                            <q-select
                              v-if="param.type === 'SELECT' || param.type === 'SELECT_ADDITIVE'"
                              v-model="newCommandParamValues[param.index]"
                              :options="param.selections.map(s => ({ label: s.name, value: String(s.value) }))"
                              :label="param.name"
                              map-options
                              emit-value
                              outlined
                              dense
                              options-dense
                            />
                            <q-select
                              v-else-if="param.type === 'CHECKBOX'"
                              v-model="newCommandParamValues[param.index]"
                              :options="[{ label: 'Off', value: '0' }, { label: 'On', value: '1' }]"
                              :label="param.name"
                              map-options
                              emit-value
                              outlined
                              dense
                              options-dense
                            />
                            <q-input
                              v-else
                              v-model="newCommandParamValues[param.index]"
                              :label="param.name"
                              type="number"
                              outlined
                              dense
                            />
                          </div>
                        </div>
                      </div>
                      <div v-if="newCommandPreview.ioList.filter(io => io.selectable).length > 0">
                        <div class="text-subtitle2 font-bold mb-2">
                          IO
                        </div>
                        <div class="flex flex-col gap-2">
                          <div
                            v-for="io in newCommandPreview.ioList.filter(io => io.selectable)"
                            :key="io.index"
                          >
                            <div class="text-sm font-medium mb-1">
                              {{ io.name }}
                            </div>
                            <div class="max-h-40 overflow-y-auto border border-gray-3 rounded p-2">
                              <div
                                v-for="selection in io.selections"
                                :key="selection.index"
                                class="flex items-center mb-2"
                              >
                                <q-checkbox
                                  v-model="newCommandIOSelections[io.index][selection.index]"
                                  class="mr-2"
                                  dense
                                  :label="selection.name"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                  <QCardActions
                    class="q-pa-md bg-gray-1 dark:bg-dark-4"
                    align="right"
                  >
                    <q-btn
                      :label="t('cancel')"
                      class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
                      flat
                      @click="newCommandDialog = false"
                    />
                    <q-btn
                      :label="t('ok')"
                      :disable="!newCommandNo"
                      class="q-mr-sm bg-primary text-white"
                      flat
                      @click="addNewCommand()"
                    />
                  </QCardActions>
                </q-card>
              </q-dialog>

              <q-btn
                class="bg-red text-white"
                icon="delete"
                size="sm"
                dense
                flat
                :disable="selectedReplaceIndex === null"
                @click="deleteReplaceValue()"
              >
                <q-tooltip>
                  {{ selectedReplaceIndex !== null
                    ? t('findAndReplace.deleteSelectedNewValue')
                    : t('findAndReplace.deleteNewValue')
                  }}
                </q-tooltip>
              </q-btn>
            </div>

            <q-separator />

            <!-- Replace Values List -->
            <div class="flex-1 overflow-auto">
              <q-list class="max-h-48 rounded-borders">
                <q-item
                  v-for="(entry, index) in replaceValues"
                  :key="index"
                  clickable
                  :active="selectedReplaceIndex === index"
                  dense
                  @click="selectedReplaceIndex = index"
                >
                  <q-item-section>
                    <div v-if="entry.type === 'parameter'" class="text-sm">
                      {{ `${entry.parameterName} = ${getParameterDisplayValue(commandNo, entry.parameterIndex, entry.parameterValue, entry.parameterType)}` }}
                    </div>
                    <div v-else-if="entry.type === 'io'" class="text-sm">
                      {{ `${entry.ioName}: [${entry.ioValues.filter(v => v.defaultValue).map(v => v.name).join(", ")}]` }}
                    </div>
                    <div v-else-if="entry.type === 'newCommand'" class="text-sm font-bold text-secondary">
                      {{ t('findAndReplace.newCommandLabel', { commandName: `${entry.commandNo} - ${entry.commandName}` }) }}
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <q-btn
              :label="t('findAndReplace.replace')"
              :loading="isReplacing"
              :disable="selectedResults.length === 0 || replaceValues.length === 0"
              class="bg-primary text-white"
              dense
              flat
              @click="performReplace"
            />
          </div>
        </div>

        <!-- Alt bölüm: Results Table -->
        <div class="bg-gray-1 dark:bg-gray-8 rounded border">
          <q-table
            v-model:selected="selectedResults"
            :rows="searchResults"
            :columns="[
              { name: 'machineName', label: t('findAndReplace.machine'), field: 'machineName', align: 'left' },
              { name: 'programNo', label: t('findAndReplace.programNo'), field: 'programNo', align: 'left' },
              { name: 'programName', label: t('findAndReplace.program'), field: 'programName', align: 'left' },
              { name: 'step', label: t('findAndReplace.step'), field: 'step', align: 'center' },
              { name: 'actions', label: t('findAndReplace.actions'), field: 'actions', align: 'center' },
            ]"
            :loading="isSearching"
            selection="multiple"
            :row-key="getRowKey"
            flat
            dense
            table-header-style="position: sticky; top: 0; z-index: 1; height: 36px;"
            table-header-class="bg-gray-1 dark:bg-dark-4"
            :rows-per-page-options="[0]"
            :no-data-label="t('findAndReplace.noMatchingResults')"
            class="h-64"
          >
            <template #body-cell-actions="slotProps">
              <q-td :props="slotProps">
                <q-btn
                  icon="open_in_new"
                  color="primary"
                  size="sm"
                  flat
                  round
                  dense
                  @click="openProgram(slotProps.row.machineId, slotProps.row.programNo)"
                >
                  <q-tooltip>
                    {{ t('findAndReplace.openProgram') }}
                  </q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </div>
      </QCardSection>

      <!-- Aksiyonlar -->
      <QCardActions
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
        align="right"
      >
        <QBtn
          :label="t('close')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>

<style scoped>
.q-dialog__inner--minimized > div {
  max-width: none !important;
}

/* Custom scrollbar for table */
.q-table__container {
  max-height: 300px;
  overflow-y: auto;
}

/* Responsive layout for smaller screens */
@media (max-width: 768px) {
  .flex {
    flex-direction: column !important;
  }
}
</style>
