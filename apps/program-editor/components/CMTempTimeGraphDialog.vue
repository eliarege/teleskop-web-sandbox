<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import { CategoryScale, Chart as ChartJS, Legend, LineController, LineElement, LinearScale, PointElement, Title, Tooltip } from 'chart.js'
import { calculateProgramStepDuration } from '~/shared/formula'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LineController, CategoryScale, LinearScale)

const { t } = useI18n()
const { dark } = useQuasar()
const editor = useEditorStore()
const { dialogRef } = useDialogPluginComponent()

const chartData = ref<ChartData>()
const chartOptions = ref<ChartOptions<'line'>>()

function calculateChartData() {
  const tempData: number[] = [editor.teleskopSettings.initialTemperature]
  const timeData: number[] = [0]
  const dataPoints: { x: number, y: number }[] = [{ x: 0, y: editor.teleskopSettings.initialTemperature }]
  const stepInfo: { step: number, commandNo: number, commandName: string }[] = []
  const pointStyles: string[] = ['circle']
  const pointBackgroundColors: string[] = ['green']

  for (let i = 0; i < editor.program.steps.length; i++) {
    const { temperature, duration } = calculateProgramStepDuration(
      editor.program,
      editor.machine,
      editor.teleskopSettings.initialTemperature,
      i,
    )

    tempData.push(temperature)
    timeData.push(timeData[i] + duration)

    const commandNo = editor.program.steps[i].mainCommand.commandNo!
    const machineCommand = editor.machine.commands.get(commandNo)!
    stepInfo.push({ step: i + 1, commandNo, commandName: machineCommand.name })

    dataPoints.push({ x: timeData[i + 1], y: temperature })

    if (machineCommand.isUnload) {
      pointStyles.push('rectRot')
      pointBackgroundColors.push('red')
    } else {
      pointStyles.push('circle')
      pointBackgroundColors.push('green')
    }
  }

  chartData.value = {
    datasets: [
      {
        label: t('apperance.temperature(c)'),
        data: dataPoints.map(({ x, y }) => ({ x, y })),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointStyle: pointStyles,
        pointBackgroundColor: pointBackgroundColors,
      },
    ],
  }

  chartOptions.value = {
    plugins: {
      tooltip: {
        displayColors: false,
        callbacks: {
          title: (context) => {
            return `${formatDuration(timeData[context[0].dataIndex])}`
          },
          label: (context) => {
            if (stepInfo[context.dataIndex] === undefined)
              return
            return [
              `${stepInfo[context.dataIndex].step}. ${t('apperance.step')}`,
              `${stepInfo[context.dataIndex].commandNo} ${stepInfo[context.dataIndex].commandName}`,
              `${t('apperance.temperature(c)')}: ${context.parsed.y}`,
            ]
          },
        },
        titleFont: {
          size: 16,
        },
        bodyFont: {
          size: 14,
        },
      },
    },
    scales: {
      y: {
        grid: {
          color: dark.isActive ? 'rgb(80, 80, 80)' : 'rgb(211, 211, 211)',
        },
        title: {
          display: true,
          text: t('apperance.temperature(c)'),
        },
        ticks: {
          font: {
            size: 14,
          },
        },
      },
      x: {
        type: 'linear',
        grid: {
          color: dark.isActive ? 'rgb(80, 80, 80)' : 'rgb(211, 211, 211)',
        },
        title: {
          display: true,
          text: t('apperance.time(h)'),
        },
        ticks: {
          autoSkip: false,
          font: {
            size: 14,
          },
          autoSkip: false,
          callback: (value) => {
            return `${formatDuration(Number(value))}`
          },
        },
      },
    },
  }
}

onMounted(() => {
  calculateChartData()
})
</script>

<template>
  <q-dialog ref="dialogRef" persistent>
    <q-card class="flex flex-col max-w-6xl max-h-2xl min-w-6xl min-h-2xl">
      <q-card-section class="bg-gray-1 !dark:(bg-dark-1) flex justify-between">
        <span class="text-h6">
          {{ t('apperance.tempTimeGraph') }}
        </span>
        <q-separator class="q-my-md" />
        <q-btn
          v-close-popup
          icon="close"
          flat
          round
          dense
        />
      </q-card-section>
      <q-card-section>
        <Line
          id="myChart"
          :options="chartOptions"
          :data="chartData"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
