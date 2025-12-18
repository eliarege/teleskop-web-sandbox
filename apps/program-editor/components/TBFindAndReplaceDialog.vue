<script setup lang="ts">
import { ParameterType } from '~/shared/constants'
import type { CommandParameter, MachineCommand } from '~/shared/types'

const props = defineProps<{
  machineId: number
  machineName: string
  machineCommands: Map<number, MachineCommand>
}>()

const $q = useQuasar()
const { t } = useI18n()
const kc = useKeycloak()
const editor = useEditorStore()
const { notifyError, notifyWarning } = useNotify()
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

// Selected criteria for deletion/editing
const selectedCriteriaIndex = ref<number | null>(null)

const searchCriteriaDialog = ref(false)
// Command seçenekleri
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
    // Validation for between vs single value
    if (isBetweenSelected.value) {
      if (selectedParameterValueMin.value === null || selectedParameterValueMax.value === null)
        return
    } else {
      if (selectedParameterValue.value === null || selectedParameterValue.value === '')
        return
    }

    // Check if this parameter already exists
    const existingIndex = searchCriteria.value.findIndex(c =>
      c.commandNo === commandNo.value && c.type === 'parameter' && c.parameter?.parameterIndex === index,
    )

    // Prepare the parameter value based on comparison type
    let parameterValue = isBetweenSelected.value
      ? `${selectedParameterValueMin.value}-${selectedParameterValueMax.value}`
      : selectedParameterValue.value

    // For SELECT parameters, convert text to numeric value
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
    // IO processing
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

  // For SELECT parameters, convert numeric value back to text for display
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

const searchResults = ref<{ machineId: number, machineName: string, programNo: number, programName: string, step: string }[]>([])
const selectedResults = ref<{ machineId: number, machineName: string, programNo: number, programName: string, step: string }[]>([])
const isSearching = ref(false)

async function performSearch() {
  // Clear previous results
  searchResults.value = []
  selectedResults.value = []
  isSearching.value = true

  try {
    // Step 1: Validate search criteria
    if (!commandNo.value) {
      notifyWarning(t('findAndReplace.selectCommandFirst'))
      return
    }

    // Step 2: Determine which machines to search
    let machineIds: number[] = []

    if (searchType.value === '1') {
      // This machine only
      machineIds = [props.machineId]
    } else if (searchType.value === '2') {
      // Selected machines
      machineIds = editor.selectedMachines.map(m => m.id)
    }

    if (machineIds.length === 0) {
      notifyWarning(t('findAndReplace.noMachinesSelected'))
      return
    }

    // Step 3: Map search criteria for backend
    const mappedCriteria = searchCriteria.value.map((criteria) => {
      const mapped = {
        type: criteria.type,
        parameterIndex: criteria.parameter?.parameterIndex,
        parameterValue: criteria.parameter?.parameterValue,
        parameterType: criteria.parameter?.parameterType,
        comparison: 'EQUALS' as const, // For now, use EQUALS as default
        ioIndex: criteria.io?.ioIndex,
        ioValues: criteria.io?.ioValues?.filter(io => io.defaultValue).map((io) => {
          const mappedType = Number.parseInt(io.ioType)
          const mappedPhysicalId = Number.parseInt(io.ioPhysicalId)
          // Map IO types and physical IDs
          return {
            type: mappedType,
            physicalId: mappedPhysicalId,
          }
        }) || [],
      }

      return mapped
    })

    const searchParams = {
      machineIds,
      commandNo: commandNo.value,
      searchCriteria: mappedCriteria,
      stepRange: searchInSelectedSteps.value
        ? {
            start: startStepNo.value,
            end: endStepNo.value,
          }
        : undefined,
    }

    // Step 4: Call optimized backend search endpoint
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
        matchedParameter?: {
          index: number
          value: string
        }
        matchedIO?: {
          index: number
          id: string
        }
      }>
    }

    if (searchResponse.success) {
      // Step 5: Map results to expected format
      searchResults.value = searchResponse.results.map(result => ({
        machineId: result.machineId,
        machineName: result.machineName,
        programNo: result.programNo,
        programName: result.programName,
        step: (result.stepNo + 1).toString(), // Display steps starting from 1 instead of 0
      }))

      // Results mapped for UI display
    } else {
      console.error('Search failed:', searchResponse)
      throw new Error('Search failed')
    }
  } catch (error) {
    console.error('Search error:', error)
    notifyError(t('findAndReplace.searchError'))
  } finally {
    isSearching.value = false
  }
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogCancel"
  >
    <QCard class="w-[900px] max-w-[90vw]">
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
        <!-- Üst bölüm: Command selector ve arama seçenekleri -->
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
              <label class="text-subtitle2 text-grey-8 dark:text-grey-3 q-mb-xs block">
                {{ t('findAndReplace.searchScope') }}
              </label>
              <div class="q-gutter-sm">
                <q-radio
                  v-model="searchType"
                  val="1"
                  :label="t('findAndReplace.thisMachine', { machineName: props.machineName })"
                  dense
                />
                <div class="flex flex-col">
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
                  <div v-if="editor.selectedMachines.length > 0" class="pl-6 pt-1">
                    <div class="text-xs text-grey-6 dark:text-grey-4 cursor-help">
                      <span class="font-medium">
                        {{ t('findAndReplace.machinesSelected', { count: editor.selectedMachines.length }) }}
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
                            v-for="machine in editor.selectedMachines"
                            :key="machine.id"
                            class="q-mb-xs"
                          >
                            • {{ machine.name }}
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

            <!-- Adım Aralığı ve Seçim Butonu -->
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

              <!-- Selected step range display -->
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

          <!-- Search Criteria -->
          <div class="flex flex-col gap-3 flex-1">
            <div class=" text-gray-8 dark:text-gray-3 flex items-center gap-2">
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
                      <!-- parammetre tipi number ise -->
                      <div v-if="getParameterType(selectedParameterIndex) === ParameterType.NUMBER" class="flex flex-col">
                        <span class="pl-2"> {{ `${t('findAndReplace.parameterDefaultValue')}: ${machineCommands.get(commandNo!)?.parameters.find(p => p.index === selectedParameterIndex)?.value}` }} </span>
                        <span class="pl-2"> {{ `${t('findAndReplace.parameterMinValue')}: ${machineCommands.get(commandNo!)?.parameters.find(p => p.index === selectedParameterIndex)?.minValue}` }} </span>
                        <span class="pl-2"> {{ `${t('findAndReplace.parameterMaxValue')}: ${machineCommands.get(commandNo!)?.parameters.find(p => p.index === selectedParameterIndex)?.maxValue}` }} </span>

                        <!-- Single value input for non-between comparisons -->
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

                        <!-- Two inputs for between comparison -->
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
                      <!-- parametre tipi select ise -->
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
                          <!-- IO options list -->
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
                    <!-- Parameter -->
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

                    <!-- IO Value -->
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
        </div>

        <!-- Alt bölüm: Results Table -->
        <!-- Results Table -->
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
