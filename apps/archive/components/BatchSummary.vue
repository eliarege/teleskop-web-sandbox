<!-- eslint-disable vue/no-use-v-if-with-v-for -->
<script setup lang="ts">
import { format } from 'date-fns'
import { formatDuration } from '~/utils/functions'

const props = defineProps<{
  machine: any
  joborderData: any
  actualDuration: number
  startParameters: any
  svgChartContent: any
  consumptions: any
  consumptionUnits: any
  programInfo: Array<any>
  totalManualDelay: number
}>()
const { t, d } = useNuxtApp().$i18n
// FIXME: Selman abi BADATA.STOP_DURATION_OPER  BADATA  .STOP_DURATION_ALR  BADATA.STOP_DURATION_WARNING_ALR
// ancak bu fieldlar 0 ama programlarda delay gösteriyor?? check this out
let totalAlarmDelay = 0
const totalManuel = props.totalManualDelay
let totalOperatorDelay = 0
props.programInfo.forEach((prg) => {
  totalAlarmDelay += prg.alarmDelay
  totalOperatorDelay += prg.operatorDelay
})
const totalActiveWork = props.actualDuration - totalAlarmDelay - totalManuel - totalOperatorDelay
const percentages = [
  (totalActiveWork / props.actualDuration) * 100 || 100,
  (totalManuel / props.actualDuration) * 100 || 0,
  (totalAlarmDelay / props.actualDuration) * 100 || 0,
  (totalOperatorDelay / props.actualDuration) * 100 || 0,
]
const colors = ['blue', 'red', 'purple', 'yellow'] // Corresponding colors

const programRows = props.programInfo.map((program) => {
  return {
    ...program,
    interventions: program.interventions.map(int => `${int.explanation} (${int.eventCount})`),
  }
})
interface Column {
  name: string
  label: string
  style?: any
  format?: (value: any, row?: any) => string
  render?: (cell: Cell) => VNode
}
interface Cell<T = any> {
  value: T
  col: Column
  row: any
  colIndex: number
  rowIndex: number
  _visited: boolean
  _group: number
  _below: Cell | null
  _right: Cell | null
  _rect: Rect | null
}

const columns: Column[] = [
  {
    name: 'programNo',
    label: t(`batchSummary.programNo`),
  },
  {
    name: 'programName',
    label: t(`batchSummary.programName`),
  },
  {
    name: 'startTime',
    label: t(`batchSummary.startTime`),
    format: val => d(val, 'datetime'),
  },
  {
    name: 'endTime',
    label: t(`batchSummary.endTime`),
    format: val => d(val, 'datetime'),
  },
  {
    name: 'theoreticalDuration',
    label: t(`batchSummary.theoreticalDuration`),
    format: val => formatDuration(val),
  },
  {
    name: 'actualDuration',
    label: t(`batchSummary.actualDuration`),
    format: val => formatDuration(val),
  },
  {
    name: 'status',
    label: t('batchSummary.status'),
    style: { color: 'red', fontSize: '16px' },
    format: (_, row) => row.theoreticalDuration > row.actualDuration ? t('batchSummary.fast') : t('batchSummary.slow'),
  },
  {
    name: 'deviation',
    label: t(`batchSummary.deviation`),
    format: val => formatDuration(val),
  },
  {
    name: 'manualDelay',
    label: t(`batchSummary.manualDelay`),
    format: val => formatDuration(val),
  },
  {
    name: 'operatorDelay',
    label: t(`batchSummary.operatorDelay`),
    format: val => formatDuration(val),
  },
  {
    name: 'alarmDelay',
    label: t(`batchSummary.alarmDelay`),
    format: val => formatDuration(val),
  },
  {
    name: 'interventions',
    label: t('batchSummary.interventions'),
    style: { paddingLeft: '0px', paddingRight: '0px' },
    render: (cell: Cell<string[]>) => h('ul', {
      class: 'intervention-list-cell',
    }, cell.value.map(v => h('li', { style: { paddingLeft: '5px' } }, v))),
  },
]
// Compute the pie data with angles and colors
const pieData = computed(() => {
  const cumulativePercent = []
  percentages.reduce((prev, curr) => {
    cumulativePercent.push(prev)
    return prev + curr
  }, 0)

  return percentages.map((percentage, index) => {
    const startAngle = cumulativePercent[index] || 0
    const endAngle = startAngle + percentage
    return {
      startAngle,
      endAngle,
      color: colors[index],
    }
  })
})

// Convert polar coordinates (angle, radius) to Cartesian coordinates (x, y)
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees + 120) * (Math.PI / 180)
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

// Create an SVG path for the pie chart segment
function getPath(startAngle, endAngle) {
  const start = polarToCartesian(16, 16, 16, startAngle * 3.6)
  const end = polarToCartesian(16, 16, 16, endAngle * 3.6)
  const largeArcFlag = endAngle - startAngle <= 50 ? 0 : 1
  return `
    M 16 16
    L ${start.x} ${start.y}
    A 16 16 0 ${largeArcFlag} 1 ${end.x} ${end.y}
    Z
  `
}
const legends = [
  { color: 'blue', label: t('batchSummary.activeDuration') },
  { color: 'red', label: t('batchSummary.manuelDuration') },
  { color: 'purple', label: t('batchSummary.alarmDelay') },
  { color: 'yellow', label: t('batchSummary.operatorDelay') },
]
</script>

<template>
  <div class="batch-summary">
    {{ t('batchSummary._') }}
    <!-- Header Tables -->
    <div class="header-tables">
      <!-- Makine Bilgileri -->
      <table class="info-table">
        <thead>
          <tr>
            <th colspan="2">
              {{ t('batchSummary.machineInfo') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(value, key) in machine" :key="key">
            <td class="info-table-td">
              {{ t(`batchSummary.${key}`) }}
            </td>
            <td class="info-table-td">
              {{ value }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- İş Emri -->
      <table class="info-table">
        <thead>
          <tr>
            <th colspan="2">
              {{ `${t('batchSummary.joborder')} - ${joborderData.joborder}` }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(value, key) in joborderData" :key="key">
            <td class="info-table-td">
              {{ t(`batchSummary.${key}`) }}
            </td>
            <td class="info-table-td">
              {{ value }}
            </td>
          </tr>
          <tr class="bold-red-th">
            <td class="info-table-td">
              {{ t(`batchSummary.status`) }}
            </td>
            <td class="info-table-td bold-red-th">
              {{ joborderData.theoreticalDuration > joborderData.actualDuration ? t('batchSummary.fast') : t('batchSummary.slow') }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Batch Başlatma Parametreleri -->
      <table
        class="info-table"
      >
        <thead>
          <tr>
            <th colspan="2">
              {{ t('batchSummary.batchStartParameters') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="param in startParameters" :key="`paramName${param.name}`">
            <td class="info-table-td">
              {{ param.name }}
            </td>
            <td class="info-table-td">
              {{ param.value }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pie Chart Container -->
      <div class="chart-container">
        <!-- Dynamic Pie Chart -->
        <svg
          width="150"
          height="150"
          viewBox="0 0 32 32"
          class="filled-pie-chart"
        >
          <circle
            r="16"
            cx="16"
            cy="16"
            fill="white"
          />
          <template v-for="(data, index) in pieData" :key="index">
            <path
              :d="getPath(data.startAngle, data.endAngle)"
              :fill="data.color"
            />
          </template>
        </svg>
        <div class="pie-desc">
          <div
            v-for="league of legends"
            :key="`${league.color}legen`"
            class="pie-desc-item"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 12 12"
            >
              <rect
                width="12"
                height="12"
                :fill="league.color"
              />
            </svg> {{ league.label }}
          </div>
        </div>
      </div>
    </div>
    <div class="text-section">
      <table class="info-table-consumptions">
        <tbody>
          <tr>
            <template
              v-for="(value, key, index1) in consumptions"
              :key="`row1-${index1}`"
            >
              <td
                v-if="Number(index1) < 5"
                class="info-table-consumptions-bold"
              >
                {{ t(`joborderSummary.${key}`) }}
              </td>
              <td
                v-if="Number(index1) < 5"
              >
                {{ Number(value).toFixed(2) }} {{ consumptionUnits[key] }}
              </td>
            </template>
          </tr>
          <tr>
            <template
              v-for="(value, key, index2) in consumptions"
              :key="`row2-${index2}`"
            >
              <td
                v-if="Number(index2) >= 5"
                class="info-table-consumptions-bold"
              >
                {{ t(`joborderSummary.${key}`) }}
              </td>
              <td
                v-if="Number(index2) >= 5"
              >
                {{ Number(value).toFixed(2) }} {{ consumptionUnits[key] }}
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="line-chart-container">
      <div v-html="svgChartContent" />
    </div>
    <div class="custom-component-section">
      <BatchSummaryProgramTable :rows="programRows" :columns="columns" />
    </div>
  </div>
</template>

<style scoped>
.pie-desc-item {
  height: 15px;
  display: flex;
  gap: 5px;
  padding-left: 5px;
  padding-top: 5px;
}

.pie-desc {
  border-color: #888;
  font-size: 10px;
  margin: 0px;
  padding-left: 30px;
  display: flex;
  flex-direction: column;
}
.square-color {
  height: 12px;
  width: 12px;
}
.chart-container {
  text-align: center;
  margin-bottom: 20px;
}

.filled-pie-chart {
  transform: rotate(-90deg); /* Align first slice to the top */
}
body {
  font-size: 12px;
}
.header-tables {
  display: flex;
  height: 200px;
}
.info-table {
  border-collapse: collapse;
  margin: 0 5px;
}
.info-table-consumptions {
  border-collapse: collapse;
  margin: 0 5px;
  font-size: 12px;
}
.info-table-consumptions-bold {
  font-weight: bold;
}
.info-table th {
  padding-left: 3px;
  background-color: #f0f0f0;
  font-size: 10px;
}
td {
  padding: 0 3px;
  font-size: 10px;
  border: 1px solid #a8a8a8;
}
.chart-container {
  padding-left: 30px;
}
.chart-container,
.line-chart-container {
  text-align: center;
}
.text-section {
  margin: 20px 0;
}
.filled-pie-chart {
  transform: rotate(-90deg);
}
.custom-component-section {
  margin: 20px 0;
  font-size: 10px;
}
</style>
