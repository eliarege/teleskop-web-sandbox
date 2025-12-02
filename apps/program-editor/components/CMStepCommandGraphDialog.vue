<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import type { ChartData, ChartOptions } from 'chart.js'
import { BarController, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js'
import { Bar } from 'vue-chartjs'
import type { Machine, Program } from '~/shared/types'

const props = defineProps<{
  machine: Machine
  program: Program
}>()

defineEmits([...useDialogPluginComponent.emits])

const { t } = useI18n()
const { mt } = useProjectTranslations()
const { dialogRef, onDialogHide } = useDialogPluginComponent()

ChartJS.register(Title, Tooltip, Legend, BarElement, BarController, CategoryScale, LinearScale)

interface ChartDataPoint {
  x: [number, number]
  y: string
}

interface CommandLength {
  commandNo: number
  startStep: number
  endStep: number
}

const isFullScreen = ref(false)
const chartRef = ref()
const chartData = ref<ChartData<'bar'>>()
const chartOptions = ref<ChartOptions<'bar'>>()

const commandsLength = ref<CommandLength[]>([])

watch(isFullScreen, () => {
  nextTick(() => {
    chartRef.value?.chart?.resize()
  })
})

function updateCommandLength(commandNo: number, stepIndex: number) {
  const existingCommand = getLastAddedByCommandNo(commandNo)

  if (existingCommand?.endStep === stepIndex) {
    existingCommand.endStep += 1
  } else {
    commandsLength.value.push({ commandNo, startStep: stepIndex, endStep: stepIndex + 1 })
  }
}

function calcCommandsLength() {
  props.program.steps.forEach((step, stepIndex) => {
    updateCommandLength(step.mainCommand.commandNo!, stepIndex + 1)
    step.parallelCommands.forEach(cmd => updateCommandLength(cmd.commandNo!, stepIndex + 1))
  })
}

function getLastAddedByCommandNo(commandNo: number) {
  return [...commandsLength.value].reverse().find(item => item.commandNo === commandNo)
}

function calculateChartData() {
  calcCommandsLength()

  const dataPoints: ChartDataPoint[] = commandsLength.value.map(({ commandNo, startStep, endStep }) => {
    const machineCommandName = props.machine.commands.get(commandNo)?.name || ''
    const commandName = `${commandNo}/${mt(machineCommandName, props.machine.id) || t('apperance.unknownCommand')}`

    return { x: [startStep, endStep] as [number, number], y: commandName }
  })

  chartData.value = {
    datasets: [
      {
        label: t('apperance.commands'),
        data: dataPoints as any,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  }
}

chartOptions.value = {
  indexAxis: 'y',
  maintainAspectRatio: false,
  responsive: true,
  scales: {
    x: {
      min: 1,
      title: { display: true, text: t('apperance.steps') },
      ticks: { stepSize: 1, font: { size: 14 } },
    },
    y: {
      title: { display: true, text: t('apperance.commands') },
      ticks: { font: { size: 14 } },
    },
  },
  plugins: {
    tooltip: {
      displayColors: false,
      callbacks: {
        label(context) {
          const cmd = commandsLength.value[context.dataIndex]
          return [
            `${t('apperance.stepStart')}: ${cmd.startStep}`,
            `${t('apperance.stepEnd')}: ${cmd.endStep}`,
          ]
        },
      },
      titleFont: { size: 16 },
      bodyFont: { size: 14 },
    },
  },
}

function takeScreenshot(): void {
  const canvas = document.querySelector('#chart-container canvas') as HTMLCanvasElement | null
  if (!canvas)
    return

  const link = document.createElement('a')
  const { id: machineId, name: machineName } = props.machine
  const { programNo, name: programName } = props.program

  link.download = `${machineId}-${machineName}_${programNo}-${programName}_${t('stepCommandGraph.slug')}`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

onMounted(calculateChartData)

onBeforeUnmount(() => {
  chartData.value = undefined
  chartRef.value = undefined
})
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    :full-height="isFullScreen"
    :full-width="isFullScreen"
    @hide="onDialogHide"
  >
    <q-card class="flex flex-col min-w-6xl min-h-2xl max-w-6xl max-h-2xl !dark:(bg-dark-4)">
      <div id="container">
        <q-card-section class="select-none bg-gray-1 dark:bg-dark-3">
          <div class="text-h6 flex">
            {{ t('stepCommandGraph.label') }}
            <q-space />
            <q-btn
              v-close-popup
              class="text-gray-4 dark:text-gray-6"
              icon="close"
              flat
              round
              dense
            />
          </div>
          <div class="text-h8 flex flex-col color-gray-6 dark:text-gray-4">
            <span>{{ props.machine.id }} - {{ props.machine.name }}</span>
            <span>{{ props.program.programNo }} - {{ props.program.name }}</span>
          </div>
        </q-card-section>
        <q-card-section>
          <div class="flex justify-end mb-2">
            <q-btn
              :label="t('stepCommandGraph.fullScreen')"
              class="setting-btn"
              color="blue"
              icon="fullscreen"
              @click="isFullScreen = !isFullScreen"
            />
            <q-btn
              :label="t('stepCommandGraph.download')"
              class="setting-btn"
              color="green"
              icon="download"
              @click="takeScreenshot"
            />
          </div>
          <div
            id="chart-container"
            :style="{ width: isFullScreen ? '100%' : '99%', height: isFullScreen ? '75vh' : '50vh', position: 'relative' }"
          >
            <Bar
              v-if="chartData"
              id="step-command-graph"
              :options="chartOptions"
              :data="chartData"
            />
          </div>
        </q-card-section>
      </div>
    </q-card>
  </q-dialog>
</template>

<style lang="postcss" scoped>
.setting-btn {
  @apply text-xs;
  @apply mr-2;
}
</style>
