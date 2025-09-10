<script lang="ts" setup>
import { defineComponent, h, ref, shallowRef } from 'vue'
import type {
  ComponentItemConfig,
  LayoutConfig,
  RowOrColumnItemConfig,
  StackItemConfig,
} from 'golden-layout'
import { interpolateRgb } from 'd3'
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import { breakpointsTailwind } from '@vueuse/core'
import { addSeconds, format } from 'date-fns'
import { withBase } from 'ufo'
import ExpandableMessage from '../components/ExpandableMessage.vue'
import type { DuoAny, DuoParsed, DuoRaw } from '~/types/utils'
import type {
  AnalogInputOutputType,
  BasicProgram,
  Batch,
  BatchAlarm,
  BatchCommand,
  BatchInfo,
  BatchParameters,
  BatchStep,
  BatchValues,
  CalculatedValue,
  Counter,
  DigitalInputOutputType,
  Machine,
  MachineCommand,
  Program,
  Reel,
  TaskResponse,
  TaskStatus,
} from '~/types/archive'
import JobOrderInfo from '~/components/JobOrderInfo.vue'
import StartParameters from '~/components/StartParameters.vue'
import AnalogInputOutput from '~/components/AnalogInputOutput.vue'
import DigitalInputOutput from '~/components/DigitalInputOutput.vue'
import CompareButton from '~/components/CompareButton.vue'
import Commands from '~/components/Commands.vue'
import Alarms from '~/components/Alarms.vue'
import ActualPrograms from '~/components/ActualPrograms.vue'
import TheoreticalPrograms from '~/components/TheoreticalPrograms.vue'
import Chart from '~/components/Chart.vue'
import ActualSteps from '~/components/ActualSteps.vue'
import TheoreticalSteps from '~/components/TheoreticalSteps.vue'
import { printJoborderRecipe, printJoborderSummary } from '~/utils/functions'
import ArchiveChart from '~/components/ArchiveChart.vue'
import InterventionsDialog from '~/components/InterventionsDialog.vue'
import JoborderSummarySettingsDialog from '~/components/JoborderSummarySettingsDialog.vue'
import CycleTimes from '~/components/CycleTimes.vue'
import { insertBatchValues } from '~/shared/io'

const { t } = useI18n()
const $q = useQuasar()
const config = useRuntimeConfig()

const route = useRoute()

const batchKey = Number(route.params.batchkey)
const selectedDate = ref(new Date())
const response = await fetch(withBase(`/api/batch/${batchKey}`, config.app.baseURL))
const taskId = response.headers.get('Task-ID')
const batchData = ref<DuoAny<Batch>>()
const settingsStore = userSettingsStore()
// task'in ilerlemesini takip etmek için yapıldı
const batchDataPromise = response.json().then((data: TaskResponse<DuoAny<Batch>>): void => {
  if (data.status === 'success') {
    batchData.value = data.data
    if (batchData.value.active)
      scheduleBatchFetch(batchData.value, 60)
    settingsStore.machineId = batchData.value!.machine.id
    settingsStore.initializeSettings()
  } else {
    navigateTo('/')
  }
})
await trackTaskProgress()

// API'dan gelen batchData'nın içerisinde .active = true olduğu durumlarda çalışır.
// Bitmiş iş emirleri için düzenli fetch atmaya gerek yoktur
async function scheduleBatchFetch(batch: DuoAny<Batch>, seconds: number) {
  setTimeout(async () => {
    const incomingValues = await $fetch<DuoAny<BatchValues>>(`/api/batch/${batchKey}/values?since=${batch.lastRecordDate}`)
    insertBatchValues(batch, incomingValues)
    if (incomingValues.active) {
      scheduleBatchFetch(batch, seconds)
    } else {
      batch.joborderInfo = await $fetch<BatchInfo>(`/api/batch/${batchKey}/info`)
    }
  }, seconds * 1000)
}

async function trackTaskProgress() {
  try {
    while (true) {
      const data = await $fetch<TaskStatus>(`/api/task/${taskId}`)
      if (data.state === 'active') {
        $q.loading.show({
          messageColor: 'white',
          spinnerColor: 'green',
          message: data.message,
        })
      } else if (data.state === 'failed') {
        throw new Error('Task failed.')
      } else {
        await batchDataPromise
        $q.loading.hide()
        break
      }
      await sleep(300)
    }
  } catch (error: any) {
    $q.loading.hide()
    console.error('Error tracking task progress:', error)
    $q.notify({
      color: 'red',
      position: 'top',
      message: `An error occured. Returning...`,
    })
  }
}

function getCommandsWithNames() {
  if (!batchData.value?.machine?.commands) {
    console.error('Batch data is not available')
    return []
  }

  return batchData.value.mergedCommands.map((mergedCommand) => {
    const commandNo = mergedCommand.commandNo
    const command = batchData.value!.machine.commands.find(
      cmd => cmd.commandNo === commandNo,
    )
    return {
      ...mergedCommand,
      commandName: command ? command.name : t('unknownCommand'),
      icon: command ? command.icon : '',
    }
  })
}
console.log(batchData.value)

const colorInterpolator = [
  '#ff0000', // 'red',
  '#0000ff', // 'blue',
  '#ffff00', // 'yellow',
  '#008000', // 'green',
  '#800080', // 'purple',
  '#00ffff', // 'cyan',
  '#ff00ff', // 'fuchsia',
  '#ffa500', // 'orange',
  '#add8e6', // 'lightblue',
  '#ff007f', // 'rose',
  '#78716c', // 'stone',
  '#00ff00', // 'lime',
]

/**
 * Sayfa kapatılırken ilgili makine için ayarlar zaten kaydediliyor.
 * Ancak yeni bir metrik gelmesi veya makinenin ilk defa açılması gibi durumlara karşı
 * ilgili setting'in olup olmadığı kontrol edilir ve yoksa eklenir.
 */
function initializeSetting(type: string, ioIndex: number, unit?: string) {
  const key = `${type}_${ioIndex}`
  let visibility = false
  const setting = settingsStore.settings.get(key)
  if (type === 'analogInputs' && ioIndex === 0) {
    visibility = true
  }
  if (!setting)
    settingsStore.setSetting(
      key,
      colorInterpolator[ioIndex % 12],
      visibility,
      type === 'counters' ? `${unit}-counters` : (unit || 'undef'), // TODO: unit means axis lt-counter something like
    )
}

// Axis sadece analog io'lar ve counter'lar için mevcuttur
function setAxisForAnalogSettingsOnInitialize(
  command: AnalogInputOutputType | Counter,
  type: string,
) {
  const commandKey = `${type}_${command.ioIndex}`
  // const axisesWithSameUnit = Array.from(settingsStore.axises).map(el => el[1]).filter(axis => axis.unit === command.calibUnit || 'undef')
  // if (axisesWithSameUnit.some(axis => axis.ioKeys.includes(commandKey)))
  //   return

  // if (settingsStore.hasUserSettings())
  //   return
  let unit = ''
  if (command.calibUnit) {
    if (type === 'counters') {
      unit = `${command.calibUnit}-counters`
    } else {
      unit = command.calibUnit
    }
  }

  if (unit && !settingsStore.units.includes(unit))
    settingsStore.units.push(unit)
  const axis = settingsStore.axises.get(unit)
  if (axis) {
    if (!axis.ioKeys.includes(commandKey))
      axis.ioKeys.push(commandKey)
  } else {
    settingsStore.axises.set(unit || 'undef', {
      color: '#FFFFFF',
      unit: unit || 'undef',
      name: unit || 'undef',
      max: 0,
      min: 0,
      ioKeys: [commandKey],
      visible: false,
      isDefault: unit === '\'C',
    })
  }
}

batchData.value?.analogInputs.forEach((command) => {
  setAxisForAnalogSettingsOnInitialize(command, 'analogInputs')
  initializeSetting('analogInputs', command.ioIndex, command.calibUnit)
})
batchData.value?.analogOutputs.forEach((command) => {
  setAxisForAnalogSettingsOnInitialize(command, 'analogOutputs')
  initializeSetting('analogOutputs', command.ioIndex)
})
batchData.value?.digitalInputs.forEach((command) => {
  initializeSetting('digitalInputs', command.ioIndex)
})
batchData.value?.digitalOutputs.forEach((command) => {
  initializeSetting('digitalOutputs', command.ioIndex)
})
batchData.value?.digitalOutputLocks.forEach((command) => {
  initializeSetting('digitalOutputLocks', command.ioIndex)
})
batchData.value?.cycleTimes.forEach((cycle) => {
  initializeSetting('cycleTimes', cycle.reelNo)
})
batchData.value?.counters.forEach((command) => {
  setAxisForAnalogSettingsOnInitialize(command, 'counters')
  initializeSetting('counters', command.ioIndex, command.calibUnit)
})
batchData.value?.calculatedValues.forEach((command) => {
  initializeSetting('calculatedValues', command.ioIndex)
})
// Command bilgisi ve isimleri farklı yerden gelir frontta birleşir
const mergedCommandsWithNames = computed(() => getCommandsWithNames())
// Teorik sıcaklık hesaplama kısmı için lütfen herhangi bir şey değiştirmeden önce
// @egeiliklier 'e danışınız.
const theoreticalCommands = calculateTheoreticalCommands(batchData.value?.joborderInfo.startTime, 25, batchData.value?.theoreticalPrograms, batchData.value?.machine)
const { theoreticalPrograms, errors } = calculateProgramTheoreticalTemperature(
  batchData.value?.joborderInfo.startTime,
  25, // Flat 25 normalde DB'den alınacak. TODO:
  batchData.value?.theoreticalPrograms,
  batchData.value?.machine,
)
if (errors.length) {
  $q.notify({
    timeout: 0,
    type: 'negative',
    position: 'top-right',
    group: false,
    actions: [
      {
        label: t('dismiss'),
        color: 'white',
        noCaps: true,
      },
    ],
    multiLine: true,
    message: h(ExpandableMessage, {
      title: t('commandErrors.title'),
      details: errors.map(error => t(`commandErrors.${error.code}`, error.params)),
    }),
  })
}

const actualPrograms = computed(() => {
  const prgs: Array<BasicProgram> = []
  batchData.value?.actualCommands.forEach((step, index, arr) => {
    if (index === 0 || step.programNo !== arr[index - 1].programNo) {
      prgs.push({
        programNo: step.programNo,
        programName: step?.programName,
        startTime: step.startTime,
        endTime: '',
      })
    } else {
      prgs[prgs.length - 1].endTime = step.endTime
    }
  })
  return prgs
})
const chart = ref<InstanceType<typeof ArchiveChart>>()

/**
 * Component kullanımları aşağıdaki gibidir.
 * Bu implementation golden-layout kullanımı için öncelenmiştir.
 * Lütfen useGoldenLayout.ts dosyasını inceleyiniz.
 *
 * prop - event ekleme dışında kalan implementationlar için
 * lütfen @egeiliklier ile iletişime geçiniz.
 */
const components: Record<string, () => any> = {
  JobOrderInfo: () =>
    h(JobOrderInfo, {
      jobOrderInfo: batchData.value?.joborderInfo as BatchInfo,
    }),
  StartParameters: () =>
    h(StartParameters, {
      startParameters: (batchData.value?.batchParameters
      || []) as BatchParameters[],
      selectedTime: selectedDate.value,
    }),
  ActualSteps: () =>
    h(ActualSteps, {
      commands: batchData.value?.actualCommands as DuoAny<BatchCommand>[],
      selectedTime: selectedDate.value,
      machineCommands: batchData.value?.machine.commands as MachineCommand[],
      onUpdateSelectedTime: (time: string) => updateSelectedTime(time),
    }),
  ActualPrograms: () =>
    h(ActualPrograms, {
      programs: actualPrograms.value as BasicProgram[],
      selectedTime: selectedDate.value,
    }),
  TheoreticalPrograms: () =>
    h(TheoreticalPrograms, {
      programs: theoreticalPrograms,
      selectedTime: selectedDate.value,
    }),
  TheoreticalSteps: () =>
    h(TheoreticalSteps, {
      commands: theoreticalCommands as DuoAny<BatchCommand>[],
      selectedTime: selectedDate.value,
      machineCommands: batchData.value?.machine.commands as MachineCommand[],
      onUpdateSelectedTime: (time: string) => updateSelectedTime(time),
    }),
  AIN: () =>
    h(AnalogInputOutput, {
      commands:
        batchData.value?.analogInputs || ([] as AnalogInputOutputType[]),
      selectedTime: selectedDate.value,
      typeKey: 'analogInputs',
    }),

  AOUT: () =>
    h(AnalogInputOutput, {
      commands:
        batchData.value?.analogOutputs || ([] as AnalogInputOutputType[]),
      selectedTime: selectedDate.value,
      typeKey: 'analogOutputs',
    }),
  Counter: () =>
    h(AnalogInputOutput, {
      commands: batchData.value?.counters || [] as Counter[],
      selectedTime: selectedDate.value,
      typeKey: 'counters',
    }),
  CalculatedValues: () =>
    h(AnalogInputOutput, {
      commands: batchData.value?.calculatedValues.filter(cv => cv.ioValues.length) || [] as CalculatedValue[],
      selectedTime: selectedDate.value,
      typeKey: 'calculatedValues',
    }),
  DIN: () =>
    h(DigitalInputOutput, {
      commands: (batchData.value?.digitalInputs
      || []) as DigitalInputOutputType[],
      selectedTime: selectedDate.value,
      typeKey: 'digitalInputs',
    }),
  DOUTFunc: () =>
    h(DigitalInputOutput, {
      commands: (batchData.value?.digitalOutputs
      || []) as DigitalInputOutputType[],
      selectedTime: selectedDate.value,
      typeKey: 'digitalOutputs',
    }),
  DOUTLock: () =>
    h(DigitalInputOutput, {
      commands: (batchData.value?.digitalOutputLocks
      || []) as DigitalInputOutputType[],
      selectedTime: selectedDate.value,
      typeKey: 'digitalOutputsLock',
    }),
  CycleTimes: () =>
    h(CycleTimes, {
      cycles: (batchData.value?.cycleTimes || []) as Reel[],
      selectedTime: selectedDate.value,
    }),
  CompareButton: () => h(CompareButton),
  Alarms: () =>
    h(Alarms, {
      alarms: batchData.value?.alarms as BatchAlarm[],
      selectedTime: selectedDate.value,
      onRowClicked: (time: string) => updateSelectedTime(time),
    }),

  Commands: () =>
    h(Commands, {
      commands: mergedCommandsWithNames.value as any[],
      selectedTime: selectedDate.value,
      onCommandClicked: (time: string) => updateSelectedTime(time),
    }),
  Chart: () =>
    h(ArchiveChart, {
      'ref': chart,
      'batch': { ...batchData.value, mergedCommands: mergedCommandsWithNames.value },
      theoreticalPrograms,
      'modelValue': selectedDate.value,
      'onUpdate:modelValue': (newVal: Date) => {
        selectedDate.value = newVal
      },
    }),
}
const componentTypes = Object.keys(components)
const componentInstances = shallowRef<
  { id: number, type: string, element: HTMLElement }[]
>([])

let instanceId = 0

function createComponent(type: string, element: HTMLElement) {
  if (!componentTypes.includes(type)) {
    throw new Error(`Component not found: '${type}'`)
  }
  instanceId++
  componentInstances.value = componentInstances.value.concat({
    id: instanceId,
    type,
    element,
  })
}

function destroyComponent(toBeRemoved: HTMLElement) {
  componentInstances.value = componentInstances.value.filter(
    ({ element }) => element !== toBeRemoved,
  )
}

function freezeLayoutConfig(config: LayoutConfig) {
  if (config.root) {
    const recurse = (
      config: RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig,
    ) => {
      if (config.type === 'component') {
        config.reorderEnabled = false
        config.isClosable = false
      } else {
        for (const child of config.content) {
          recurse(child)
        }
      }
    }
    recurse(config.root)
  }
  return config
}

// GOLDEN LAYOUT PANELS
/**
 * CARE: Golden layout size belirlerken girilmiş size / toplam size yapıyor
 * Yani %20 vermiş olmanız ilgili alanın %20'sini kaplayaacağı anlamına gelmez.
 * İlgili alanın % / Toplam %
 * ( % anlamsız aslında flat değer bunlar )
 */
const layoutConfig = freezeLayoutConfig({
  dimensions: {
    defaultMinItemHeight: '50px',
    defaultMinItemWidth: '80px',
  },
  root: {
    type: 'row',
    content: [
      {
        size: '20%',
        type: 'column',
        content: [
          {
            size: '30%',
            type: 'row',
            content: [
              {
                type: 'stack',
                header: {
                  maximise: false,
                },
                content: [
                  {
                    title: t('panels.jobOrderInfo'),
                    type: 'component',
                    componentType: 'JobOrderInfo',
                    componentState: {
                      i18nKey: 'panels.jobOrderInfo',
                    },
                  },
                  {
                    title: t('panels.startParameters'),
                    type: 'component',
                    componentType: 'StartParameters',
                    componentState: {
                      i18nKey: 'panels.startParameters',
                    },
                  },
                ],
              },
            ],
          },
          {
            type: 'row',
            content: [
              {
                type: 'stack',
                size: '30%',
                header: {
                  maximise: false,
                },
                content: [
                  {
                    title: t('panels.actualPrograms'),
                    type: 'component',
                    componentType: 'ActualPrograms',
                    componentState: {
                      i18nKey: 'panels.actualPrograms',
                    },
                  },
                  {
                    title: t('panels.theoricPrograms'),
                    type: 'component',
                    componentType: 'TheoreticalPrograms',
                    componentState: {
                      i18nKey: 'panels.theoricPrograms',
                    },
                  },
                ],
              },
            ],
          },
          {
            type: 'row',
            content: [
              {
                type: 'stack',
                header: {
                  maximise: false,
                },
                content: [
                  {
                    title: t('panels.AIN'),
                    type: 'component',
                    componentType: 'AIN',
                    componentState: {
                      i18nKey: 'panels.AIN',
                    },
                  },
                  {
                    title: t('panels.DIN'),
                    type: 'component',
                    componentType: 'DIN',
                    componentState: {
                      i18nKey: 'panels.DIN',
                    },
                  },
                  {
                    title: t('panels.AOUT'),
                    type: 'component',
                    componentType: 'AOUT',
                    componentState: {
                      i18nKey: 'panels.AOUT',
                    },
                  },
                  {
                    title: t('panels.cycleTimes'),
                    type: 'component',
                    componentType: 'CycleTimes',
                    componentState: {
                      i18nKey: 'panels.cycleTimes',
                    },
                  },
                  {
                    title: t('panels.counter'),
                    type: 'component',
                    componentType: 'Counter',
                    componentState: {
                      i18nKey: 'panels.counter',
                    },
                  },
                  {
                    title: t('panels.calculatedValues'),
                    type: 'component',
                    componentType: 'CalculatedValues',
                    componentState: {
                      i18nKey: 'panels.calculatedValues',
                    },
                  },
                  {
                    title: t('panels.DOUTFunc'),
                    type: 'component',
                    componentType: 'DOUTFunc',
                    componentState: {
                      i18nKey: 'panels.DOUTFunc',
                    },
                  },
                  {
                    title: t('panels.DOUTLock'),
                    type: 'component',
                    componentType: 'DOUTLock',
                    componentState: {
                      i18nKey: 'panels.DOUTLock',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        size: '80%',
        type: 'column',
        content: [
          {
            size: '60%',
            type: 'row',
            content: [
              {
                title: t('panels.chartComponent'),
                type: 'component',
                componentType: 'Chart',
                componentState: {
                  i18nKey: 'panels.chartComponent',
                },
              },
            ],
          },
          {
            title: t('panels.commands'),
            size: '15%',
            header: {
              maximise: false,
            },
            type: 'component',
            componentType: 'Commands',
            componentState: {
              i18nKey: 'panels.commands',
            },
          },
          {
            size: '25%',
            type: 'row',
            content: [
              {
                title: t('panels.alarms'),
                size: '50%',
                header: {
                  maximise: false,
                },
                type: 'component',
                componentType: 'Alarms',
                componentState: {
                  i18nKey: 'panels.alarms',
                },
              },
              {
                title: t('panels.actualPrograms'),
                type: 'component',
                componentType: 'ActualSteps',
                componentState: {
                  i18nKey: 'panels.actualPrograms',
                },
              },
              {
                title: t('panels.theoricPrograms'),
                type: 'component',
                componentType: 'TheoreticalSteps',
                componentState: {
                  i18nKey: 'panels.theoricPrograms',
                },
              },
            ],
          },
        ],
      },
    ],
  },
})

const { element, layout } = useGoldenLayout(
  createComponent,
  destroyComponent,
  layoutConfig,
)
// eslint-disable-next-line unused-imports/no-unused-vars
function resetLayout() {
  layout.value?.loadLayout(layoutConfig)
}

function updateSelectedTime(time: string): any {
  selectedDate.value = new Date(time)
}
const tooltipOptions = computed(() => [
  { label: t('tooltipOptions.markedAnalogInputs'), value: 1 },
  { label: t('tooltipOptions.markedAnalogOutputs'), value: 2 },
  { label: t('tooltipOptions.markedCalcualtedValues'), value: 3 },
  { label: t('tooltipOptions.selectedTime'), value: 4 },
  { label: t('tooltipOptions.currentDuration'), value: 5 },
  { label: t('tooltipOptions.activeUser'), value: 6 },
  { label: t('tooltipOptions.activeCommandTimeInfo'), value: 7 },
  { label: t('tooltipOptions.manuelMeasuredValues'), value: 8 },
])
function showTooltipOptionDialog() {
  $q.dialog({
    title: t('tooltipOptions.title'),
    message: t('tooltipOptions.message'),
    options: {
      type: 'checkbox',
      model: [...settingsStore.tooltipSettings],
      items: tooltipOptions.value,
    },
    cancel: true,
  }).onOk((data) => {
    settingsStore.updateTooltipSettings(data)
  })
}
function showInterventionsDialog() {
  $q.dialog({
    component: InterventionsDialog,
    componentProps: {
      interventions: batchData.value?.interventions,
    },
  }).onOk((data) => {
    updateSelectedTime(data)
  })
}
async function showJoborderSummarySettingsDialog() {
  const erpParameters = await $fetch(`/api/batch/${batchKey}/erp-parameters`)
  $q.dialog({
    component: JoborderSummarySettingsDialog,
    componentProps: {
      erpParameters,
    },
  }).onOk(async (data) => {
    await $fetch(`/api/batch/${batchKey}/erp-parameters`, {
      method: 'PUT',
      body: {
        erpParameters: data,
      },
    })
  })
}

const tt = (key: string) => toRef(() => t(key))

const items = [
  {
    label: tt('topbar.report._'),
    subMenu: {
      items: [
        [
          {
            label: tt('topbar.report.batchSum'),
            // disabled: !batchData.value?.joborderInfo.endTime,
            onClick: async () => {
              chart.value?.resetZoom()
              await nextTick()
              printBatchSummary(
                batchKey,
                batchData.value!.machine,
                batchData.value!.joborderInfo,
                batchData.value!.batchParameters,
              )
            },
          },
        ],
        [
          {
            label: tt('topbar.report.joborderSum'),
            onClick: () =>
              printJoborderSummary(
                Number(batchKey),
                batchData.value!.joborderInfo,
                actualPrograms.value,
              ),
          },
          {
            label: tt('topbar.report.joborderSumSettings'),
            onClick: () => showJoborderSummarySettingsDialog(),
          },
        ],
        [
          {
            label: tt('topbar.report.joborderRecipe'),
            onClick: () =>
              printJoborderRecipe(
                Number(batchKey),
                batchData.value!.joborderInfo,
                actualPrograms.value,
              ),
          },
        ],
      ],
    },
  },
  {
    label: tt('topbar.options._'),
    subMenu: {
      items: [
        [
          {
            label: tt('topbar.options.tooltip'),
            icon: () => {
              return settingsStore.showGraphTooltip ? 'check' : ''
            },
            onClick: () =>
              (settingsStore.showGraphTooltip
                = !settingsStore.showGraphTooltip),
          },
          {
            label: tt('topbar.options.tooltipOptions'),
            onClick: () => showTooltipOptionDialog(),
          },
        ],
      ],
    },
  },
  {
    label: tt('topbar.interventions'),
    onClick: () => showInterventionsDialog(),
  },
] as TopbarMenuItem[]
</script>

<template>
  <QPage>
    <div
      ref="element"
      style="width: 100%; height: calc(100vh - 42px)"
      class="overflow-hidden w-full"
    >
      <teleport
        v-for="{ id, type, element: el } in componentInstances"
        :key="id"
        :to="el"
      >
        <component :is="components[type]" />
      </teleport>
    </div>
    <Teleport defer to="#topbar-buttons">
      <TopbarButton
        v-for="(item, index) in items"
        :key="index"
        class="topbar-link"
        :label="toValue(item.label)"
        :disable="toValue(item.disabled)"
        @click="item.onClick ? item.onClick() : ''"
      >
        <TopbarMenu v-if="item.subMenu" v-bind="item.subMenu" />
      </TopbarButton>
    </Teleport>
  </QPage>
</template>
