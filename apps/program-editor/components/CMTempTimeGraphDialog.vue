<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import { CategoryScale, Chart as ChartJS, Legend, LineController, LineElement, LinearScale, PointElement, Title, Tooltip, animator } from 'chart.js'
import html2canvas from 'html2canvas-pro'
import { isDef } from '@teleskop/utils'
import type { CSSProperties } from 'vue'
import { calculateProgramDurationPoint } from '~/shared/formula'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LineController, CategoryScale, LinearScale)

const { t } = useI18n()
const { dark } = useQuasar()
const editor = useEditorStore()
const { dialogRef } = useDialogPluginComponent()

const showIcons = ref(true)
const showSlopes = ref(true)
const showDurations = ref(true)
const isFullScreen = ref(false)

const chartData = ref<ChartData>()
const chartOptions = ref<ChartOptions<'line'>>()
const chartRef = ref<{ chart: ChartJS }>()

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
        data: calcDataPoints(dataPoints, stepInfo, timeData),
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
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        displayColors: false,
        callbacks: {
          title: (context) => {
            return `${formatDuration(timeData[context[0].dataIndex])}`
          },
          label: (context) => {
            if (!isDef(stepInfo[context.dataIndex]))
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
    onResize() {
      nextTick(() => {
        if (chartData.value && chartData.value.datasets) {
          chartData.value.datasets[0].data = calcDataPoints(dataPoints, stepInfo, timeData)
        }
      })
    },
  }
}

interface Point {
  x: number
  y: number
  icon: string
  iconStyle: CSSProperties
  iconIndexStyle: CSSProperties
  color: string
  slope: number
  slopeStyle: CSSProperties
  duration: number
  durationStyle: CSSProperties
}

function calcDataPoints(dataPoints: { x: number, y: number }[], stepInfo: { commandNo: number, commandName: string, step: number }[], timeData: number[]): Point[] {
  return dataPoints.map(({ x, y }, index) => {
    const commandIcon = editor.getStepIcon(stepInfo[index]?.commandNo)
    return {
      x,
      y,
      icon: commandIcon?.name || '',
      iconStyle: getIconStyle({ x, y, color: commandIcon?.color || '#FF0000' }),
      iconIndexStyle: { ...getIconStyle({ x, y, color: commandIcon?.color || '#FF0000' }), margin: '-1px -8px', fontSize: '14px' },
      color: commandIcon?.color || '#FF0000',
      slope: calculateSlope(dataPoints[index], dataPoints[index + 1]),
      slopeStyle: getSlopeStyle(dataPoints[index], dataPoints[index + 1]),
      duration: timeData[index + 1] - timeData[index],
      durationStyle: getDurationStyle(dataPoints[index], dataPoints[index + 1]),
    }
  })
}

function getIconStyle(point: { x: number, y: number, color: string }): CSSProperties {
  const chartInstance = chartRef.value?.chart
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
    left: `${x + 18}px`,
    top: `${y + 24}px`,
    color: point.color,
  }
}

function calculateSlope(point1: { x: number, y: number }, point2: { x: number, y: number }): number {
  if (!point1 || !point2)
    return 0 // adımlardan biri yoksa eğim 0
  if (point1.x === point2.x)
    return 0 // X ekseni aynıysa eğim 0
  return Math.round((point2.y - point1.y) / ((point2.x - point1.x) / 60))
}

function calculatePoint(point1: { x: number, y: number }, point2: { x: number, y: number }) {
  if (!point1 || !point2)
    return {}

  const chartInstance = chartRef.value?.chart
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
    x: xMid,
    y: yMid,
  }
}

function getSlopeStyle(point1: { x: number, y: number }, point2: { x: number, y: number }) {
  const { x: xMid, y: yMid } = calculatePoint(point1, point2)

  return {
    position: 'absolute',
    left: `${xMid}px`,
    top: `${yMid + 42}px`,
    fontSize: '12px',
    color: '#333',
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '1px 3px',
  }
}

function getDurationStyle(point1: { x: number, y: number }, point2: { x: number, y: number }) {
  const { x: xMid, y: yMid } = calculatePoint(point1, point2)

  return {
    position: 'absolute',
    left: `${xMid}px`,
    top: `${yMid + 20}px`,
    fontSize: '12px',
    color: '#333',
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '1px 3px',
  }
}

async function screenShot() {
  const element = document.getElementById('chart-container')
  if (element) {
    const canvas = await html2canvas(element, {
      logging: false,
      useCORS: true,
      scale: window.devicePixelRatio,
      onclone(document) {
        const recurse = (el: Element, cb: (el: Element) => void) => {
          cb(el)
          for (const child of el.children) {
            recurse(child, cb)
          }
        }

        const stringToUInt8Array = (str: string) => {
          const arr = new Uint8Array(str.length)
          for (let i = 0; i < str.length; i++) {
            arr[i] = str.charCodeAt(i)
          }
          return arr
        }

        const UTF8_RE = /^utf-?8$/i
        /** 1st capturing group should return encoding of data if its present, 2nd capturing group returns data. */
        const SVG_DATA_URL_RE = /^url\(['"]?data:image\/svg\+xml(?:;[\w-]+=[\w-]+?)*(?:;([\w-]+))?,(.+?)['"]?\)$/i

        recurse(document.body, (el) => {
          const styles = getComputedStyle(el)
          const svgUrlMatch = styles.maskImage.match(SVG_DATA_URL_RE)

          if (!svgUrlMatch)
            return

          const color = styles.backgroundColor
          let [encoding = 'utf8', data] = svgUrlMatch.slice(1)

          if (UTF8_RE.test(encoding)) {
            const decoder = new TextDecoder(encoding)
            data = decoder.decode(stringToUInt8Array(data))
          }

          const cloneEl = el.cloneNode()
          if (!(cloneEl instanceof HTMLElement))
            return

          cloneEl.style.backgroundColor = 'transparent'
          cloneEl.innerHTML = decodeURIComponent(data)

          const svgEl = cloneEl.firstChild as SVGSVGElement
          svgEl.style.color = color
          svgEl.style.width = '100%'
          svgEl.style.height = '100%'

          el.parentNode?.replaceChild(cloneEl, el)
        })
      },
    })
    const link = document.createElement('a')
    link.download = `${editor.machine.id}-${editor.program.programNo}-${t('tempTimeGraph.lower')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
}

onMounted(() => {
  calculateChartData()
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
        <q-card-section class="bg-gray-1 !dark:(bg-dark-1)">
          <div class="text-h6 flex">
            {{ t('tempTimeGraph._') }}
            <q-space />
            <q-btn
              v-close-popup
              icon="close"
              flat
              round
              dense
            />
          </div>
          <div class="text-h8 flex flex-col">
            <span>{{ editor.machine.id }} - {{ editor.machine.name }}</span>
            <span>{{ editor.program.programNo }} - {{ editor.program.name }}</span>
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
            <q-btn
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
            />
            <q-btn
              :label="t('tempTimeGraph.fullScreen')"
              class="setting-btn"
              color="blue"
              icon="fullscreen"
              @click="isFullScreen = !isFullScreen"
            />
            <q-btn
              :label="t('tempTimeGraph.screenShot')"
              class="setting-btn"
              color="green"
              icon="camera_alt"
              @click="screenShot"
            />
          </div>
          <div
            id="chart-container"
            :style="{ width: isFullScreen ? '100%' : '99%', height: isFullScreen ? '80vh' : '50vh' }"
          >
            <Line
              ref="chartRef"
              :options="chartOptions"
              :data="chartData"
            />
            <div
              v-for="(point, index) in chartData?.datasets[0].data"
              :key="index"
            >
              <!-- Command Icon -->
              <div v-if="showIcons">
                <UnoIcon
                  :style="point.iconStyle"
                  :class="point.icon"
                  class="iconify-icon"
                />
                <div
                  v-if="point.icon"
                  :style="point.iconIndexStyle"
                  class="icon-index"
                >
                  {{ '2' }}
                </div>
              </div>

              <!-- Slope Label -->
              <span
                v-if="showSlopes && point.slope !== 0"
                :style="point.slopeStyle"
                class="slope-label"
              >
                {{ `${point.slope}'C` }}
              </span>

              <!-- Duration Label -->
              <span
                v-if="showDurations && point.duration >= 600"
                :style="point.durationStyle"
                class="duration-label"
              >
                {{ `${Math.floor(point.duration / 60)}'` }}
              </span>
            </div>
          </div>
        </q-card-section>
      </div>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.iconify-icon {
  font-size: 16px;
  position: absolute;
}
.icon-index {
  position: absolute;
  font-size: 14px;
  color: #333;
  pointer-events: none;
  font-weight: bold;
}
.slope-label {
  position: absolute;
  font-size: 14px;
  color: #333;
  pointer-events: none;
  font-weight: bold;
}
.duration-label {
  position: absolute;
  font-size: 14px;
  color: #333;
  pointer-events: none;
  font-weight: bold;
}
.setting-btn {
  margin-right: 8px;
  font-size: 12px;
}
</style>
