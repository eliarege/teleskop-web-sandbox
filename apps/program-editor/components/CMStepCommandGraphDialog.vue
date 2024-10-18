<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import type { ChartData, ChartOptions } from 'chart.js'
import { BarController, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js'
import { Bar } from 'vue-chartjs'

const { t } = useI18n()
const editor = useEditorStore()
const { dialogRef } = useDialogPluginComponent()

ChartJS.register(Title, Tooltip, Legend, BarElement, BarController, CategoryScale, LinearScale)

const chartData = ref<ChartData>()
const chartOptions = ref<ChartOptions<'bar'>>()

interface CommandLength {
  commandNo: number
  startStep: number
  endStep: number
}

const commandsLength = ref<CommandLength[]>([])

function updateCommandLength(commandNo: number, stepIndex: number) {
  const existingCommand = getLastAddedByCommandNo(commandNo)

  if (existingCommand && existingCommand.endStep === stepIndex) {
    existingCommand.endStep += 1
  } else {
    commandsLength.value.push({ commandNo, startStep: stepIndex, endStep: stepIndex + 1 })
  }
}

function calcCommandsLength() {
  editor.program.steps.forEach((step, stepIndex) => {
    updateCommandLength(step.mainCommand.commandNo!, stepIndex + 1)

    step.parallelCommands.forEach((parallelCommand) => {
      updateCommandLength(parallelCommand.commandNo!, stepIndex + 1)
    })
  })
}

function getLastAddedByCommandNo(commandNo: number) {
  return [...commandsLength.value].reverse().find(item => item.commandNo === commandNo) || null
}

function calculateChartData() {
  calcCommandsLength()

  const dataPoints = commandsLength.value.map(({ commandNo, startStep, endStep }) => {
    const commandName = editor.machine.commands.get(commandNo)?.name || t('apperance.unknownCommand')
    return { x: [startStep, endStep], y: commandName }
  })

  chartData.value = {
    datasets: [
      {
        label: t('apperance.commands'),
        data: dataPoints,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  }
}

chartOptions.value = {
  indexAxis: 'y',
  scales: {
    x: {
      min: 1,
      title: {
        display: true,
        text: t('apperance.steps'),
      },
      ticks: {
        stepSize: 1,
        font: {
          size: 14,
        },
      },
    },

    y: {
      title: {
        display: true,
        text: t('apperance.commands'),
      },
      ticks: {
        font: {
          size: 14,
        },
      },
    },
  },
  plugins: {
    tooltip: {
      displayColors: false,
      callbacks: {
        label(context) {
          return [
          `${t('apperance.stepStart')}: ${context.dataset.data[context.dataIndex]?.x[0]}`,
          `${t('apperance.stepEnd')}: ${context.dataset.data[context.dataIndex]?.x[1]}`,
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
          {{ t('apperance.stepCommandGraph') }}
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
        <Bar
          id="step-command-graph"
          :options="chartOptions"
          :data="chartData"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
