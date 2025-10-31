<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import { CategoryScale, Chart as ChartJS, Legend, LineController, LineElement, LinearScale, PointElement, Title, Tooltip } from 'chart.js'
import { isDef } from '@teleskop/utils'
import type { CSSProperties } from 'vue'
import { calculateProgramDurationPoint } from '~/shared/formula'
import { screenshot } from '~/shared/utils'
import type { Machine, Program } from '~/shared/types'

const props = defineProps<{
  machine: Machine
  program: Program
  initialTemperature: number
}>()

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LineController, CategoryScale, LinearScale)

const { t } = useI18n()
const editor = useEditorStore()
const { dialogRef, onDialogCancel } = useDialogPluginComponent()

const showIcons = ref(true)
const showSlopes = ref(true)
const showDurations = ref(true)
const isFullScreen = ref(false)

const labelsPlugin = {
  id: 'customLabels',
  afterDatasetsDraw(chart: ChartJS) {
    const { ctx, data } = chart
    const meta = chart.getDatasetMeta(0)

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    meta.data.forEach((element: any, index: number) => {
      const point = data.datasets[0].data[index] as Point
      if (!point || index >= meta.data.length - 1)
        return

      const { x, y } = element.tooltipPosition()
      const nextElement = meta.data[index + 1]
      const nextPos = nextElement.tooltipPosition(false)
      const distance = Math.sqrt((nextPos.x - x) ** 2 + (nextPos.y - y) ** 2)

      if (distance < 50)
        return

      const midX = (x + nextPos.x) / 2
      const midY = (y + nextPos.y) / 2

      const drawLabel = (text: string, yOffset: number) => {
        ctx.fillStyle = '#fff'
        ctx.strokeStyle = '#ccc'
        ctx.lineWidth = 1
        const metrics = ctx.measureText(text)
        const boxWidth = metrics.width + 8
        const boxHeight = 16
        const yPos = midY + yOffset

        ctx.fillRect(midX - boxWidth / 2, yPos - boxHeight / 2, boxWidth, boxHeight)
        ctx.strokeRect(midX - boxWidth / 2, yPos - boxHeight / 2, boxWidth, boxHeight)
        ctx.fillStyle = '#666'
        ctx.font = '11px Arial'
        ctx.fillText(text, midX, yPos)
      }

      if (showSlopes.value && point.slope !== 0)
        drawLabel(`${Number.parseFloat(point.slope.toFixed(1)).toString()}°C`, 5)

      if (showDurations.value && point.duration >= 600)
        drawLabel(`${Math.floor(point.duration / 60)}'`, -18)
    })

    ctx.restore()
  },
}

ChartJS.register(labelsPlugin)

const chartData = ref<ChartData<'line', (number | Point | null)[], unknown>>()
const chartOptions = ref<ChartOptions<'line'>>()
const chartRef = ref<{ chart: ChartJS }>()

function calculateChartData() {
  const { timeData, dataPoints, stepInfo } = calculateProgramDurationPoint(
    props.machine,
    props.program,
    props.initialTemperature,
  )

  const [minX, maxX] = [Math.min(...dataPoints.map(p => p.x)), Math.max(...dataPoints.map(p => p.x))]
  const [minY, maxY] = [Math.min(...dataPoints.map(p => p.y)), Math.max(...dataPoints.map(p => p.y))]

  chartData.value = {
    datasets: [{
      label: t('apperance.temperature(c)'),
      data: calcDataPoints(dataPoints, stepInfo, timeData),
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: dataPoints.map((_, index) =>
        editor.getCommandIcon(stepInfo[index]?.commandNo)?.color ?? '#000000',
      ),
    }],
  }

  chartOptions.value = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        displayColors: false,
        callbacks: {
          title: context => formatDuration(timeData[context[0].dataIndex]),
          label: (context) => {
            const step = stepInfo[context.dataIndex]
            if (!isDef(step))
              return
            return [
              `${step.step}. ${t('apperance.step')}`,
              `${step.commandNo} ${step.commandName}`,
              `${t('apperance.temperature(c)')}: ${context.parsed.y}`,
            ]
          },
        },
        titleFont: { size: 16 },
        bodyFont: { size: 14 },
        caretPadding: 16,
        xAlign: 'center',
        yAlign: 'top',
      },
    },
    scales: {
      y: {
        min: minY - 10,
        max: maxY + 10,
        title: { display: true, text: t('apperance.temperature(c)') },
        ticks: { font: { size: 14 } },
      },
      x: {
        type: 'linear',
        min: minX,
        max: maxX,
        title: { display: true, text: t('apperance.time(h)') },
        ticks: {
          autoSkip: false,
          font: { size: 14 },
          callback: value => formatDuration(Number(value)),
        },
      },
    },
    onResize: () => nextTick(() => {
      if (chartData.value?.datasets)
        chartData.value.datasets[0].data = calcDataPoints(dataPoints, stepInfo, timeData)
    }),
  }
}

interface Coordinate {
  x: number
  y: number
}

interface Point {
  x: number
  y: number
  icon: string
  color: string
  slope: number
  duration: number
}

function calcDataPoints(dataPoints: Coordinate[], stepInfo: { commandNo: number, commandName: string, step: number }[], timeData: number[]): Point[] {
  return dataPoints.map(({ x, y }, index) => {
    const commandIcon = editor.getCommandIcon(stepInfo[index]?.commandNo)
    const isNotLast = index < dataPoints.length - 1

    return {
      x,
      y,
      icon: commandIcon?.name ?? '',
      color: commandIcon?.color ?? '#FF0000',
      slope: isNotLast ? calculateSlope(dataPoints[index], dataPoints[index + 1]) : 0,
      duration: isNotLast && index < timeData.length - 1 ? timeData[index + 1] - timeData[index] : 0,
    }
  })
}

function getIconStyle(point: Point): CSSProperties {
  const chartInstance = chartRef.value?.chart
  if (!chartInstance || !chartOptions.value?.scales?.x || !chartOptions.value.scales.y)
    return { display: 'none' }

  const chartArea = chartInstance.chartArea
  if (!chartArea)
    return { display: 'none' }

  const xScale = chartOptions.value.scales.x
  const yScale = chartOptions.value.scales.y
  const xMin = typeof xScale.min === 'number' ? xScale.min : 0
  const xMax = typeof xScale.max === 'number' ? xScale.max : 1
  const yMin = typeof yScale.min === 'number' ? yScale.min : 0
  const yMax = typeof yScale.max === 'number' ? yScale.max : 1

  const xRelative = (point.x - xMin) / (xMax - xMin)
  const x = chartArea.left + (xRelative * (chartArea.right - chartArea.left))
  const yRelative = (point.y - yMin) / (yMax - yMin)
  const y = chartArea.bottom - (yRelative * (chartArea.bottom - chartArea.top))

  return {
    position: 'absolute',
    left: `${x}px`,
    top: `${y - 16}px`,
    transform: 'translate(-50%, -50%)',
    color: point.color,
    fontSize: '16px',
    pointerEvents: 'none',
  }
}

function calculateSlope(point1: Coordinate, point2: Coordinate): number {
  if (!point1 || !point2 || point1.x === point2.x)
    return 0
  return (point2.y - point1.y) / ((point2.x - point1.x) / 60)
}

function takeScreenshot() {
  const element = document.getElementById('chart-container')
  if (element)
    screenshot(element, `${props.machine.id}-${props.machine.name}/${props.program.programNo}-${props.program.name}-${t('tempTimeGraph.slug')}`)
}

onMounted(calculateChartData)

watch([showIcons, showSlopes, showDurations], () => {
  chartRef.value?.chart?.render()
})
</script>

<template>
  <q-dialog
    ref="dialogRef"
    :full-width="isFullScreen"
    :full-height="isFullScreen"
  >
    <q-card class="flex flex-col min-w-6xl min-h-2xl max-w-6xl max-h-2xl !dark:(bg-dark-4)">
      <div id="container">
        <q-card-section class="select-none bg-gray-1 dark:bg-dark-3">
          <div class="text-h6 flex">
            {{ t('tempTimeGraph.label') }}
            <q-space />
            <q-btn
              v-close-popup
              class="text-gray-4 dark:text-gray-6"
              icon="close"
              flat
              round
              dense
              @click="onDialogCancel"
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
              :label="showIcons ? t('tempTimeGraph.hideIcons') : t('tempTimeGraph.showIcons')"
              class="setting-btn"
              color="primary"
              icon="image"
              @click="showIcons = !showIcons"
            />
            <!-- <q-btn
              :label="showSlopes ? t('tempTimeGraph.hideSlopes') : t('tempTimeGraph.showSlopes')"
              class="setting-btn"
              color="secondary"
              icon="timeline"
              @click="showSlopes = !showSlopes"
            />
            <q-btn
              :label="showDurations ? t('tempTimeGraph.hideDuration') : t('tempTimeGraph.showDuration')"
              class="setting-btn"
              color="orange"
              icon="timelapse"
              @click="showDurations = !showDurations"
            /> -->
            <q-btn
              :label="t('tempTimeGraph.fullScreen')"
              class="setting-btn"
              color="primary"
              icon="fullscreen"
              @click="isFullScreen = !isFullScreen"
            />
            <q-btn
              :label="t('tempTimeGraph.download')"
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
            <Line
              v-if="chartData"
              ref="chartRef"
              :options="chartOptions"
              :data="chartData"
            />
            <!-- Icon overlays -->
            <template v-if="showIcons">
              <div
                v-for="(point, index) in (chartData?.datasets[0].data as Point[] ?? [])"
                :key="`icon-${index}`"
              >
                <UnoIcon
                  v-if="point"
                  :style="getIconStyle(point)"
                  :class="point.icon"
                />
              </div>
            </template>
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
