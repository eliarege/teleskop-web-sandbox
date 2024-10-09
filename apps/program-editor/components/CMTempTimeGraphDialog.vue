<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import { CategoryScale, Chart as ChartJS, Legend, LineController, LineElement, LinearScale, PointElement, Title, Tooltip } from 'chart.js'
import { calculateProgramDurationPoint } from '~/shared/formula'

const plugin = {
  id: 'customCanvasBackgroundColor',
  beforeDraw: (chart, args, options) => {
    const { ctx } = chart
    ctx.save()
    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = options.color || '#99ffff'
    ctx.fillRect(0, 0, chart.width, chart.height)
    ctx.restore()
  },
}

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LineController, CategoryScale, LinearScale, plugin)

const { t } = useI18n()
const { dark } = useQuasar()
const editor = useEditorStore()
const { dialogRef } = useDialogPluginComponent()

// New reactive states for toggle features
const showIcons = ref(true)
const showSlopes = ref(true)

const chartData = ref<ChartData>()
const chartOptions = ref<ChartOptions<'line'>>()

function calculateChartData() {
  const { timeData, dataPoints, stepInfo } = calculateProgramDurationPoint(
    editor.program,
    editor.machine,
    editor.teleskopSettings.initialTemperature,
  )

  const minX = Math.min(...dataPoints.map(p => p.x))
  const maxX = Math.max(...dataPoints.map(p => p.x))
  const minY = Math.min(...dataPoints.map(p => p.y))
  const maxY = Math.max(...dataPoints.map(p => p.y))

  chartData.value = {
    datasets: [
      {
        label: t('apperance.temperature(c)'),
        data: dataPoints.map(({ x, y }, index) => {
          const commandIcon = editor.getStepIcon(stepInfo[index]?.commandNo)
          return {
            x,
            y,
            icon: commandIcon?.name,
            color: commandIcon?.color,
          }
        }),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: dataPoints.map((_, index) => {
          const commandIcon = editor.getStepIcon(stepInfo[index]?.commandNo)
          return commandIcon ? commandIcon.color : '#000000'
        }),
      },
    ],
  }

  chartOptions.value = {
    plugins: {
      customCanvasBackgroundColor: {
        color: dark.isActive ? 'black' : 'white',
      },
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
        caretPadding: 16,
        xAlign: 'center',
        yAlign: 'top',
      },
    },
    scales: {
      y: {
        min: Math.min(0, minY - (10 + (minY % 10))),
        max: maxY + (10 - (maxY % 10)),
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
        min: minX,
        max: maxX,
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
          callback: (value) => {
            return `${formatDuration(Number(value))}`
          },
        },
      },
    },
  }
}

interface Point {
  x: number
  y: number
  icon: string
  color: string
}

function getIconStyle(point: Point) {
  const chartInstance = ChartJS.getChart('myChart')
  if (!chartInstance || !chartOptions.value?.scales?.x || !chartOptions.value.scales.y)
    return {}

  const chartArea = chartInstance.chartArea
  if (!chartArea)
    return {}

  const xScale = chartOptions.value.scales.x
  const xRelative = (point.x - xScale.min) / (xScale.max - xScale.min)
  const x = chartArea.left + (xRelative * (chartArea.right - chartArea.left))

  const yScale = chartOptions.value.scales.y
  const yRelative = (point.y - yScale.min) / (yScale.max - yScale.min)
  const y = chartArea.bottom - (yRelative * (chartArea.bottom - chartArea.top))

  return {
    position: 'absolute',
    left: `${x - 8}px`,
    top: `${y - 28}px`,
    color: point.color,
  }
}

function calculateSlope(point1: Point, point2: Point): number {
  if (point2.x === point1.x)
    return 0 // X ekseni aynıysa eğim 0
  return (point2.y - point1.y) / ((point2.x - point1.x) / 60)
}

function getSlopeStyle(point1: Point, point2: Point) {
  const chartInstance = ChartJS.getChart('myChart')
  if (!chartInstance || !chartOptions.value?.scales?.x || !chartOptions.value.scales.y)
    return {}

  const chartArea = chartInstance.chartArea
  if (!chartArea)
    return {}

  const xScale = chartOptions.value.scales.x
  const yScale = chartOptions.value.scales.y

  const xRelative1 = (point1.x - xScale.min) / (xScale.max - xScale.min)
  const yRelative1 = (point1.y - yScale.min) / (yScale.max - yScale.min)
  const xRelative2 = (point2.x - xScale.min) / (xScale.max - xScale.min)
  const yRelative2 = (point2.y - yScale.min) / (yScale.max - yScale.min)

  const xMid = chartArea.left + ((xRelative1 + xRelative2) / 2) * (chartArea.right - chartArea.left)
  const yMid = chartArea.bottom - ((yRelative1 + yRelative2) / 2) * (chartArea.bottom - chartArea.top)

  return {
    position: 'absolute',
    left: `${xMid - 16}px`,
    top: `${yMid - 16}px`,
    fontSize: '12px',
    color: '#333',
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '1px 3px',
  }
}

onMounted(() => {
  calculateChartData()
})

function toggleIcons() {
  showIcons.value = !showIcons.value
}

function toggleSlopes() {
  showSlopes.value = !showSlopes.value
}
</script>

<template>
  <q-dialog ref="dialogRef" persistent>
    <q-card class="flex flex-col max-w-6xl max-h-2xl min-w-6xl min-h-2xl">
      <q-card-section class="bg-gray-1 !dark:(bg-dark-1) flex justify-between">
        <span class="text-h6">
          {{ t('tempTimeGraph._') }}
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
        <div class="flex justify-end mb-2">
          <q-btn
            :label="showIcons ? t('tempTimeGraph.hideIcons') : t('tempTimeGraph.showIcons')"
            class="setting-btn"
            color="primary"
            @click="toggleIcons"
          />
          <q-btn
            :label="showSlopes ? t('tempTimeGraph.hideSlopes') : t('tempTimeGraph.showSlopes')"
            class="setting-btn"
            color="secondary"
            @click="toggleSlopes"
          />
        </div>
        <div style="position: relative;">
          <Line
            id="myChart"
            :options="chartOptions"
            :data="chartData"
          />
          <div
            v-for="(point, index) in chartData?.datasets[0].data"
            :key="index"
          >
            <div
              v-if="showIcons"
              :style="getIconStyle(point)"
              :class="point.icon"
              class="iconify-icon"
            />

            <template v-if="index < chartData?.datasets[0].data.length - 1">
              <span
                v-if="showSlopes && calculateSlope(point, chartData?.datasets[0].data[index + 1]) !== 0"
                :style="getSlopeStyle(point, chartData?.datasets[0].data[index + 1])"
                class="slope-label"
              >
                {{ calculateSlope(point, chartData?.datasets[0].data[index + 1]).toFixed(2) }}
              </span>
            </template>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.iconify-icon {
  width: 16px;
  height: 16px;
}
.slope-label {
  position: absolute;
  font-size: 12px;
  color: #333;
  pointer-events: none;
}
.setting-btn {
  margin-right: 8px;
  font-size: 12px;
}
</style>
