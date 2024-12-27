<script setup lang="ts">
import {
  type BrushBehavior,
  type D3BrushEvent,
  type ScaleLinear,
  type ScaleTime,
  type Selection,
  axisBottom,
  axisLeft,
  axisRight,
  brush as d3Brush,
  extent as d3Extent,
  line as d3Line,
  max as d3Max,
  select as d3Select,
  interpolateRgb,
  interpolateRgbBasis,
  scaleBand,
  scaleLinear,
  scaleLog,
  scaleSqrt,
  scaleTime,
  style,
} from 'd3'
import {
  addHours,
  addMinutes,
  addSeconds,
  differenceInMilliseconds,
  differenceInMinutes,
  differenceInSeconds,
  format,
  formatDuration,
  intervalToDuration,
} from 'date-fns'
import type { QBtnProps } from 'quasar'
import AxisesVisibilityDialog from './AxisesVisibilityDialog.vue'
import ReelDataDialog from './ReelDataDialog.vue'
import type { Batch, DigitalInputOutputType, Reel, TheoreticalProgram } from '~/types/archive'
import UpdateAxisDialog from '~/components/UpdateAxisDialog.vue'

const props = defineProps<{
  batch: Batch
  theoreticalPrograms: TheoreticalProgram[]
}>()
const emit = defineEmits<{
  updateModelValue: [date: Date]
}>()
const { t } = useI18n()
const selectedTime = defineModel<Date>({ required: true })
const settingsStore = userSettingsStore()
const startTime = ref(new Date(props.batch.joborderInfo.startTime)) // props.batch.joborderInfo.startTime
const chartEl = ref<HTMLElement>()
const xAxisEl = ref<SVGGElement>()
const reelsXAxisEl = ref<SVGGElement>()
const yAxisEl = ref<SVGGElement>()
const reelsYAxisEl = ref<SVGGElement>()

const clipId = useId()

let xAxis: Selection<any, any, any, any> | undefined
let xAxisReels: Selection<any, any, any, any> | undefined
let yAxisLeft: Selection<any, any, any, any> | undefined
let yAxisReels: Selection<any, any, any, any> | undefined
const yAxisesRight = ref(new Map<string, Selection<any, any, any, any>>())
const visibleAxises = computed(() => {
  return new Map(
    [...settingsStore.axises.entries()].filter(
      ax => ax[1].visible && !ax[1].isDefault,
    ),
  )
})
const { width: outerWidth, height: outerHeight } = useElementSize(chartEl)
const margin = ref({ top: 20, right: 180, bottom: 50, left: 50 })
let chartHeightMultiplier = 1

function updateMultipliers() {
  if (settingsStore.bottomChartVisibilityStatus !== 0) {
    margin.value.bottom = 0
    chartHeightMultiplier = 0.7
  } else {
    margin.value.bottom = 50
    chartHeightMultiplier = 1
  }
}
updateMultipliers()
function changeBottomVisibiltyStatus() {
  settingsStore.updateChartState()
  updateMultipliers()
}
// dont show io mean bottom 50 multp 1
const innerRect = computed(() => {
  return {
    width: Math.max(
      outerWidth.value - margin.value.left - margin.value.right,
      0,
    ),
    height: Math.max(
      outerHeight.value - margin.value.top - margin.value.bottom,
      0,
    ),
  }
})

const id = useId()
const theoreticalTemperatures = props.theoreticalPrograms.flatMap(t => t.ioValues)

const endTime = ref(
  new Date(props.batch.joborderInfo.endTime || theoreticalTemperatures[theoreticalTemperatures.length - 1].time),
  // return addMinutes(new Date(startTime.value), 80)
)
const xExtent = computed(() => {
  const a = [
    new Date(startTime.value),
    new Date(endTime.value),
    // props.batch.joborderInfo.endTime
    //   ? new Date(props.batch.joborderInfo.endTime)
    //   : joborderEndTime.value,
  ] as [Date, Date]
  return a
})

const xScale = computed(() => {
  return scaleTime().range([0, innerRect.value.width]).domain(xExtent.value)
})

// FIXME: TFDBSETTINGS like 25 from db
// const theoreticalPrograms = calculateProgramTheoreticalTemperature(
//   startTime.value,
//   25,
//   props.batch.theoreticalPrograms,
//   props.batch.machine,
// )
settingsStore.updateAxis('\'C', {
  max: Math.max(
    settingsStore.axises.get('\'C')?.max,
    Number(d3Max(theoreticalTemperatures, v => v.value)),
  ),
})
const colorTransitionPortions: number[] = []

const joborderDurationTheoreticalDuration
  = new Date(
    theoreticalTemperatures[theoreticalTemperatures.length - 1].time,
  ).getTime() - startTime.value.getTime()
theoreticalTemperatures.forEach((io, index) => {
  if (index) {
    if (
      theoreticalTemperatures[index].programNo
      !== theoreticalTemperatures[index - 1].programNo
    ) {
      const durationUntilStart
        = new Date(theoreticalTemperatures[index - 1].time).getTime()
        - startTime.value.getTime()
      colorTransitionPortions.push(
        durationUntilStart / joborderDurationTheoreticalDuration,
      )
      colorTransitionPortions.push(
        durationUntilStart / joborderDurationTheoreticalDuration,
      )
    }
  }
})

const dataSet = computed(() => {
  const set: { io: any, color: string, axis?: any, isDefault?: boolean }[] = []
  set.push({
    io: { ioValues: theoreticalTemperatures, settingKey: 'DEFAULT' },
    isDefault: true,
    color: '#FFFFFF',
    axis: '\'C',
  })
  props.batch.analogInputs.forEach((io) => {
    const setting = settingsStore.getSetting(`analogInputs_${io.ioIndex}`)
    if (setting && setting.selected)
      set.push({
        io: { ...io, type: 'AIN', settingKey: `analogInputs_${io.ioIndex}` },
        color: setting.color,
        axis: setting.axis,
      })
  })
  props.batch.analogOutputs.forEach((io) => {
    const setting = settingsStore.getSetting(`analogOutputs_${io.ioIndex}`)
    if (setting && setting.selected)
      set.push({
        io: { ...io, type: 'AOUT', settingKey: `analogOutputs_${io.ioIndex}` },
        color: setting.color,
        axis: setting.axis,
      })
  })

  return set.length ? set : [{ io: { ioValues: [] }, color: '#FFFFFF' }]
})

const digitalDataSet = computed(() => {
  if (settingsStore.bottomChartVisibilityStatus === 1) {
    const set = [] as DigitalInputOutputType[]
    props.batch.digitalInputs.forEach((io) => {
      const setting = settingsStore.getSetting(`digitalInputs_${io.ioIndex}`)
      if (setting && setting.selected)
        set.push(io)
    })
    props.batch.digitalOutputs.forEach((io) => {
      const setting = settingsStore.getSetting(`digitalOutputs_${io.ioIndex}`)
      if (setting && setting.selected)
        set.push(io)
    })
    props.batch.digitalOutputLocks.forEach((io) => {
      const setting = settingsStore.getSetting(
        `digitalOutputLocks_${io.ioIndex}`,
      )
      if (setting && setting.selected)
        set.push(io)
    })
    return set.map((io) => {
      const firstIO = { value: io.ioValues[0].value, time: startTime.value }
      const lastIO = { value: io.ioValues[io.ioValues.length - 1].value, time: endTime.value }
      return { ...io, ioValues: [firstIO, ...io.ioValues, lastIO] }
    })
  } else return []
})

const reelsDataSet = computed(() => {
  if (settingsStore.bottomChartVisibilityStatus === 2) {
    const cycs = []
    props.batch.cycleTimes.forEach((cycle) => {
      const setting = settingsStore.getSetting(`cycleTimes_${cycle.reelNo}`)
      if (setting && setting.selected)
        cycs.push({ ...cycle, color: setting.color })
    })
    return cycs
  } else return []
})
// FIXME: If first io has not the unit of 'C it will show some axis different from 'C on the left
const yScales = computed(() => {
  return dataSet.value.map((aio) => {
    const setting = settingsStore.getSetting(aio.io.settingKey)
    let max = Number(d3Max(aio.io.ioValues, v => v.value))
    const axis = settingsStore.axises.get(setting.axis || 'undef')
    if (axis) {
      if (max > axis.max)
        axis.max = max
      else
        max = axis.max
    }
    return scaleLinear()
      .range([innerRect.value.height * chartHeightMultiplier, 0])
      .domain([0, max * 1.1])
  })
})
const reelYScale = computed(() => {
  const max = Number(
    d3Max(
      reelsDataSet.value.map(cyc => d3Max(cyc.cycles, c => c.duration)),
    ),
  )
  return scaleLinear()
    .range([
      innerRect.value.height - 20,
      innerRect.value.height * chartHeightMultiplier + 30,
    ])
    .domain([0, max * 1.1])
})

const xAxisTickScale = scaleLinear()
  .range([0, 16])
  .domain([200, 1280])
  .clamp(true)

const yAxisTickScale = scaleLinear()
  .range([0, 16])
  .domain([150, 1024])
  .clamp(true)

const xAxisTickCount = computed(() => {
  return Math.round(xAxisTickScale(outerWidth.value))
})

const yAxisTickCount = computed(() => {
  return Math.round(yAxisTickScale(outerHeight.value * chartHeightMultiplier))
})

function updateXAxis() {
  const ticks = xScale.value.ticks(xAxisTickCount.value)
  const tickDiff
    = ticks.length > 1 ? differenceInMinutes(ticks[1], ticks[0]) : 0
  const showSeconds = tickDiff === 0

  xAxis?.call(
    axisBottom(xScale.value)
      .tickFormat(value =>
        format(value.valueOf(), showSeconds ? 'HH:mm:ss' : 'HH:mm'),
      )
      .ticks(xAxisTickCount.value),
  )
  xAxisReels?.call(
    axisBottom(xScale.value)
      .tickFormat(value =>
        format(value.valueOf(), showSeconds ? 'HH:mm:ss' : 'HH:mm'),
      )
      .ticks(xAxisTickCount.value),
  )
}

const colorInterpolator = interpolateRgbBasis([
  'purple',
  'blue',
  'red',
  'orange',
])

const lines = computed(() => {
  return yScales.value.map((scale, index) => {
    return {
      color: dataSet.value[index]?.color || '#FFFFFF',
      isDefault: dataSet.value[index]?.isDefault,
      line: d3Line()
        .x((d: any) => {
          return xScale.value(new Date(d.time))
        })
        .y((d: any) => scale(d.value)),
    }
  })
})
const reelLines = computed(() => {
  return reelsDataSet.value.map((cyc) => {
    return {
      color: cyc?.color || '#FFFFFF',
      line: d3Line()
        .x((d: any) => {
          return xScale.value(new Date(d.cycledAt))
        })
        .y((d: any) => reelYScale.value(d.duration)),
    }
  })
})
function updateYAxises() {
  yAxisLeft?.call(
    axisLeft(yScales.value[0]) // FIXME
      .ticks(yAxisTickCount.value),
  )
  yAxisReels?.call(
    axisLeft(reelYScale.value) // FIXME
      .ticks(yAxisTickCount.value),
  )
  customizeYAxis(yAxisReels, false)
  customizeYAxis(yAxisLeft, false)
  visibleAxises.value.forEach((axis, key) => {
    yAxisesRight.value.get(key)?.call(
      axisRight(
        scaleLinear()
          .range([innerRect.value.height * chartHeightMultiplier, 0])
          .domain([0, axis.max * 1.1]),
      ).ticks(yAxisTickCount.value),
    )
    customizeYAxis(yAxisesRight.value.get(key), true, 'transparent')
  })
  // yScales.value.forEach((yScale, index) => {
  //   if (index && dataSet.value[index].axis) {

  //   }
  // })
  // TODO: This part can be optimized by caching line elements
}
function customizeYAxis(yAxis: any, isRight: boolean, color?: string) {
  yAxis?.selectAll('.dashed-line').remove()
  yAxis
    ?.selectAll('.tick')
    .append('line')
    .filter((d, i) => i > 0)
    .attr('class', 'dashed-line')
    .attr('stroke', color || 'gray')
    .attr('stroke-dasharray', 4)
    .attr('opacity', 0.6)
    .attr('x1', isRight ? 0 : innerRect.value.width)
    .attr('x2', isRight ? -innerRect.value.width : 0)
    .attr('y1', 0)
    .attr('y2', 0)
}
const selectedX = ref<number | null>(null)
function formatASCII(asci: string) {
  return btoa(asci).replaceAll(/[=+\/]/g, '-')
}
onMounted(() => {
  xAxis = d3Select(xAxisEl.value!)
  xAxisReels = d3Select(reelsXAxisEl.value!)
  yAxisLeft = d3Select(yAxisEl.value!)
  yAxisReels = d3Select(reelsYAxisEl.value!)
  visibleAxises.value.forEach((axis, key) => {
    yAxisesRight.value.set(key, d3Select(`#${id}-${formatASCII(key)}`))
  })
  updateXAxis()
  updateYAxises()
  if (selectedTime.value) {
    drawSelectedTimeLine()
  }
})

function drawSelectedTimeLine() {
  const xCoord = xScale.value(new Date(selectedTime.value))
  selectedX.value = xCoord
}

watch([xScale, xAxisTickCount], () => {
  updateXAxis()
})

watch([yScales, yAxisTickCount, reelYScale], () => {
  updateYAxises()
})
watch(visibleAxises, async (newval) => {
  await nextTick()
  visibleAxises.value.forEach((axis, key) => {
    yAxisesRight.value.set(key, d3Select(`#${id}-${formatASCII(key)}`))
  })
  updateYAxises()
})
watch(selectedTime, () => {
  drawSelectedTimeLine()
  emit('updateModelValue', selectedTime.value)
})
function handleChartClick(event: MouseEvent) {
  const rect = chartEl.value?.getBoundingClientRect()
  if (!rect)
    return

  const xCoord = event.clientX - rect.left - margin.value.left
  selectedTime.value = xScale.value.invert(xCoord)
  selectedX.value = xCoord
}

const uniqueBars = ref(
  [] as {
    alarmNo: number
    color: any
    value: { startTime: string | Date, endTime: string | Date }[]
  }[],
)
props.batch.alarms.forEach((alarm) => {
  const uniqueIndex = uniqueBars.value.findIndex(
    al => alarm.alarmNo === al.alarmNo,
  )
  if (uniqueIndex === -1) {
    uniqueBars.value.push({
      alarmNo: alarm.alarmNo,
      color: '',
      value: [{ startTime: alarm.startTime, endTime: alarm.endTime || new Date() }],
    })
  } else {
    uniqueBars.value[uniqueIndex].value.push({
      startTime: alarm.startTime,
      endTime: alarm.endTime || new Date(),
    })
  }
})
uniqueBars.value = uniqueBars.value.map((bar, index) => {
  return { ...bar, color: colorInterpolator(index / uniqueBars.value.length) }
})

const barLength
  = uniqueBars.value.length * 10 > 70 ? 70 : uniqueBars.value.length * 10

const barScale = computed(() =>
  scaleBand<string>()
    .domain(uniqueBars.value.map(b => `${b.alarmNo}`))
    .range([
      (innerRect.value.height - barLength) * chartHeightMultiplier,
      innerRect.value.height * chartHeightMultiplier,
    ]) // Bars at the bottom
    .padding(0.1),
)
const tooltipContent = computed(() => {
  if (selectedX.value === null)
    return null

  const tooltipData = dataSet.value
    .map((dataset) => {
      // Find the closest data point

      let closestPoint

      if (dataset.io.ioValues.length) {
        closestPoint = dataset.io.ioValues.reduce((prev, curr) => {
          const prevDiff = Math.abs(
            new Date(prev.time).getTime() - selectedTime.value.getTime(),
          )
          const currDiff = Math.abs(
            new Date(curr.time).getTime() - selectedTime.value.getTime(),
          )
          return currDiff < prevDiff
            ? { ...curr, name: dataset.io.name }
            : { ...prev, name: dataset.io.name }
        })
      }

      return {
        value: closestPoint,
        color: dataset.color,
        type: dataset.io.type,
      }
    })
    .filter(
      io =>
        (settingsStore.tooltipSettings.includes(1) && io.type === 'AIN')
        || (settingsStore.tooltipSettings.includes(2) && io.type === 'AOUT'),
    )

  if (settingsStore.bottomChartVisibilityStatus === 2) {
    reelsDataSet.value.forEach((reel) => {
      let closestPoint
      if (reel.cycles.length) {
        closestPoint = reel.cycles.reduce((prev, curr) => {
          const prevDiff = Math.abs(
            new Date(prev.cycledAt).getTime() - selectedTime.value.getTime(),
          )
          const currDiff = Math.abs(
            new Date(curr.cycledAt).getTime() - selectedTime.value.getTime(),
          )
          return currDiff < prevDiff
            ? { ...curr, name: `${reel.reelNo + 1}. ${t('reel')}` }
            : { ...prev, name: `${reel.reelNo + 1}. ${t('reel')}` }
        })
      }
      tooltipData.push({
        value: closestPoint,
        color: reel.color,
        type: '',
      })
    })
  }
  return {
    time: selectedTime.value,
    data: tooltipData,
  }
})

onKeyStroke(['p', 'P'], (event: KeyboardEvent) => {
  if (event.ctrlKey) {
    event.preventDefault()
    printChartSVG()
  }
})
function formatDurationHHMMSS(startDate, endDate) {
  // Calculate the difference in milliseconds
  const ms = differenceInMilliseconds(endDate, startDate)

  // Convert milliseconds to hours, minutes, and seconds
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)

  // Format as 'hh:mm:ss'
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':')
}
function computeWidth(ioValues, idx) {
  const startTimeTemp = new Date(ioValues[idx].time)
  const endTimeTemp
    = idx + 1 < ioValues.length
      ? new Date(ioValues[idx + 1].time)
      : xScale.value.domain()[1]
  return xScale.value(endTimeTemp) - xScale.value(startTimeTemp)
}
interface QBtnWithTooltip extends QBtnProps {
  tooltip?: string
}
const $q = useQuasar()
const buttons = computed(() =>
  [
    {
      icon: 'print',
      tooltip: t('print'),
      onClick: () => printChartSVG(),
    },
    {
      icon: settingsStore.showGraphTooltip ? 'comments_disabled' : 'comment',
      tooltip: settingsStore.showGraphTooltip
        ? t('hideTooltip')
        : t('showTooltip'),
      onClick: () =>
        (settingsStore.showGraphTooltip = !settingsStore.showGraphTooltip),
    },
    {
      icon: !settingsStore.bottomChartVisibilityStatus
        ? 'looks_one'
        : settingsStore.bottomChartVisibilityStatus === 1
          ? 'looks_two'
          : 'visibility_off',
      tooltip: !settingsStore.bottomChartVisibilityStatus
        ? t('showDigitalIOs')
        : settingsStore.bottomChartVisibilityStatus === 1
          ? t('showCycleTimes')
          : t('hide'),
      onClick: () => changeBottomVisibiltyStatus(),
    },
    {
      icon: 'settings',
      tooltip: t('updateAxises'),
      onClick: () => {
        $q.dialog({
          component: UpdateAxisDialog,
          componentProps: {
            analogInputs: props.batch.analogInputs,
            analogOutputs: props.batch.analogOutputs,
          },
        })
      },
    },
    {
      icon: 'stacked_line_chart',
      tooltip: t('addRemoveAxis'),
      onClick: () => {
        $q.dialog({
          component: AxisesVisibilityDialog,
        })
      },
    },
    {
      icon: 'analytics',
      tooltip: t('reelDataDialog'),
      onClick: () => {
        $q.dialog({
          component: ReelDataDialog,
          componentProps: {
            cycleTimes: props.batch.cycleTimes,
          },
        })
      },
    },
  ] as Array<QBtnWithTooltip>,
)
</script>

<template>
  <div ref="chartEl" class="chart">
    <svg
      :viewBox="`0 0 ${outerWidth} ${outerHeight}`"
      :width="outerWidth"
      :height="outerHeight"
    >
      <g
        :transform="`translate(${innerRect.width + margin.right - 10}, ${margin.top})`"
      >
        <foreignObject
          v-for="(button, index) in buttons"
          :key="`button-${index}`"
          :x="0"
          :y="`${index * 3}rem`"
          width="3rem"
          height="3rem"
        >
          <q-btn
            v-bind="button"
            dense
            class="w-full h-full color-gray"
          >
            <q-tooltip v-if="button.tooltip">
              {{ button.tooltip }}
            </q-tooltip>
          </q-btn>
        </foreignObject>
      </g>
      <defs>
        <clipPath :id="clipId">
          <rect :width="innerRect.width" :height="innerRect.height" />
        </clipPath>
      </defs>
      <g :transform="`translate(${margin.left},${margin.top})`">
        <g
          ref="xAxisEl"
          class="x-axis"
          :transform="`translate(0,${innerRect.height * chartHeightMultiplier})`"
        />
        <g ref="yAxisEl" class="y-axis" />
        <g
          v-for="([key, axis], index) in visibleAxises.entries()"
          :id="`${id}-${formatASCII(key)}`"
          :key="`${key}-axis`"
          class="y-axis-right"
          :transform="`translate(${innerRect.width + index * 35}, 0)`"
        >
          <text
            :id="`axis-${index}`"
            fill="black"
            :y="-5"
          >
            {{ axis.unit === "undef" ? t("undef") : axis.unit }}
          </text>
        </g>
        <g :clip-path="`url(#${clipId})`">
          <path
            v-for="(line, index) in lines"
            :key="`${index}-line`"
            :d="line.line(dataSet[index].io.ioValues)!"
            fill="none"
            :stroke="line.isDefault ? 'url(#koko)' : line.color"
            :stroke-width="line.isDefault ? 1 : 2.5"
          />
          <linearGradient id="koko">
            <stop
              v-for="(point, index) of colorTransitionPortions"
              :key="`point${index}`"
              :offset="point"
              :stop-color="['blue', 'red', 'red', 'blue'][index % 4]"
            />
          </linearGradient>
        </g>
        <line
          v-if="selectedX !== null"
          id="chart-selected-time-line"
          :x1="selectedX"
          :x2="selectedX"
          y1="0"
          :y2="
            settingsStore.bottomChartVisibilityStatus
              ? outerHeight - 40
              : innerRect.height
          "
          stroke="black"
          stroke-dasharray="4"
          stroke-width="2"
        />
        <g :clip-path="`url(#${clipId})`">
          <g v-for="barLine in uniqueBars" :key="`${barLine.alarmNo}-bar`">
            <rect
              v-for="(bar, indexBar) in barLine.value"
              :key="`${indexBar}-${barLine.alarmNo}`"
              :x="xScale(new Date(bar.startTime))"
              :y="barScale(`${barLine.alarmNo}`)"
              :width="
                xScale(new Date(bar.endTime)) - xScale(new Date(bar.startTime))
              "
              :height="barScale.bandwidth()"
              :fill="barLine.color"
              :stroke="barLine.color"
              stroke-width="1"
            />
          </g>
        </g>
        <g
          v-if="
            tooltipContent
              && selectedX !== null
              && settingsStore.showGraphTooltip
          "
          id="chart-tooltip"
          :transform="`translate(${selectedX + 10}, 10)`"
        >
          <rect
            class="tooltip-bg"
            width="240"
            :height="90 + tooltipContent.data.length * 20"
            rx="4"
            fill="white"
            stroke="gray"
            stroke-width="1"
            opacity="0.9"
          />
          <text
            v-if="settingsStore.tooltipSettings.includes(4)"
            x="8"
            y="20"
          >
            {{ format(tooltipContent.time, "HH:mm:ss dd/MM/yyyy") }}
          </text>
          <text
            v-if="settingsStore.tooltipSettings.includes(5)"
            x="8"
            y="40"
          >
            {{ t("tooltipOptions.timePassed") }}:
            {{ formatDurationHHMMSS(startTime, tooltipContent.time) }}
          </text>
          <text
            v-if="settingsStore.tooltipSettings.includes(6)"
            x="8"
            y="60"
          >
            {{ t("tooltipOptions.activeUser") }}:
            {{ batch.joborderInfo.operatorName }}
          </text>

          <g v-for="(item, index) in tooltipContent.data" :key="index">
            <text
              x="8"
              :y="80 + index * 20"
              class="text-sm"
              :fill="item.color"
            >
              {{
                `${item?.value?.name}: ${item?.value?.value?.toFixed(2) || item?.value?.duration}`
              }}
            </text>
          </g>
        </g>
        <g
          v-if="settingsStore.bottomChartVisibilityStatus === 1"
          :transform="`translate(${0}, ${outerHeight * chartHeightMultiplier + 20})`"
        >
          <g class="io-status-bars">
            <template
              v-for="(io, index) in digitalDataSet"
              :key="`digital-io-${index}`"
            >
              <text :y="index * 20 - 2" style="font-size: x-small">
                {{ io.name }}
              </text>
              <rect
                v-for="(value, idx) in io.ioValues"
                :key="`io-${index}-value-${idx}`"
                :x="xScale(new Date(value.time))"
                :width="computeWidth(io.ioValues, idx)"
                :height="8"
                :y="index * 20"
                :fill="value.value ? 'blue' : 'grey'"
                stroke="none"
              />
            </template>
          </g>
        </g>
        <g v-show="settingsStore.bottomChartVisibilityStatus === 2">
          <g
            ref="reelsXAxisEl"
            class="x-axis"
            :transform="`translate(0,${outerHeight - 40})`"
          />
          <g ref="reelsYAxisEl" class="y-axis-reels" />
          <g :clip-path="`url(#${clipId})`">
            <path
              v-for="(line, index) in reelLines"
              :key="`${index}-line-reel`"
              :d="line.line(reelsDataSet[index].cycles)!"
              fill="none"
              :stroke="line.color"
              stroke-width="3"
            />
          </g>
        </g>
        <rect
          :width="innerRect.width"
          :height="innerRect.height"
          fill="transparent"
          style="cursor: crosshair"
          @click="handleChartClick"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.chart {
  padding: 0px !important;
  width: 100%;
  height: 100%;
}
</style>
