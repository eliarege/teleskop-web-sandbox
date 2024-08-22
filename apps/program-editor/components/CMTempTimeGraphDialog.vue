<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { Line } from 'vue-chartjs'
import { CategoryScale, Chart as ChartJS, Legend, LineController, LineElement, LinearScale, PointElement, Title, Tooltip } from 'chart.js'
import { calculateProgramStepDuration, initialTemperature } from '~/shared/formula'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LineController, CategoryScale, LinearScale)

const { t } = useI18n()
const editor = useEditorStore()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const chartData = ref()
const chartOptions = ref()

function calculateChartData() {
  const tempData: number[] = [initialTemperature]
  const timeData: number[] = [0]
  let formattedTime: string[] = []

  for (let i = 0; i < editor.program.steps.length; i++) {
    const { temperature, duration } = calculateProgramStepDuration(editor.program, editor.machine, i)

    tempData.push(temperature)
    timeData.push(timeData[i] + duration)
  }
  formattedTime = timeData.map(time => formatDuration(time))

  console.log(formattedTime)

  chartData.value = {
    labels: formattedTime,
    datasets: [
      {
        label: 'Sıcaklık (°C)',
        data: tempData,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  }

  chartOptions.value = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        title: {
          display: true,
          text: 'Sıcaklık (°C)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Zaman (saat)',
        },
        beginAtZero: true,
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
    <q-card class="flex flex-col justify-between max-w-5xl max-h-2xl min-w-5xl min-h-2xl">
      <q-card-section class="bg-gray-1 !dark:(bg-dark-1) flex justify-between">
        <span class="text-h6">
          {{ 'Sıcaklık/Zaman Grafiği' }}
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

      <q-card-actions align="right" class="bg-gray-2 !dark:(bg-dark-1)">
        <q-btn
          v-close-popup
          :label="t('okay')"
          outline
          icon="check"
          @click="onDialogCancel"
        />
        <q-btn
          v-close-popup
          outline
          :label="t('cancel')"
          icon="close"
          @click="onDialogOK"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
