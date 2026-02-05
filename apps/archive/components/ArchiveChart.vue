<script setup lang="ts">
/**
 * Genel anlamıyla bütün component'i anlamak zor olabilir
 * o yüzden gelebilecek feedbackler için hangi partların ne yaptığını açıkladım biraz biraz
 */
import {
  type BrushBehavior,
  type D3BrushEvent,
  type ScaleLinear,
  type ScaleTime,
  type Selection,
  axisBottom,
  axisLeft,
  axisRight,
  brush,
  brushX,
  curveLinear,
  curveStepAfter,
  brush as d3Brush,
  extent as d3Extent,
  line as d3Line,
  max as d3Max,
  min as d3Min,
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
import type { Batch, DigitalInputOutputType, LineType, Reel, TheoreticalProgram } from '~/types/archive'
import UpdateAxisDialog from '~/components/UpdateAxisDialog.vue'

const props = defineProps<{
  batch: Batch
  theoreticalPrograms: TheoreticalProgram[]
}>()

const { t } = useI18n()
const selectedTime = defineModel<Date>({ required: true })
defineExpose({ resetZoom })

// Start time - end time initleri burada başka bir yerde modifiye etmeyiniz
const settingsStore = userSettingsStore()
const theoreticalTemperatures = props.theoreticalPrograms.flatMap(t => t.ioValues)
const startTime = ref(new Date(props.batch.jobOrderInfo.startTime))
function getLastDate() {
  const possibleEndTimes: number[] = [
    new Date(theoreticalTemperatures[theoreticalTemperatures.length - 1].time).getTime(),
    new Date(props.batch.lastRecordDate).getTime(),
    new Date(props.batch.jobOrderInfo.endTime!).getTime(),
  ]
  const maxDateMs = possibleEndTimes.reduce<number>((max: number, value: number) => {
    if (!value)
      return max
    if (!max)
      return value
    return value > max ? value : max
  }, 0) || null
  return maxDateMs ? new Date(maxDateMs) : new Date()
}
const endTime = ref(
  new Date(getLastDate()),
)

// element refleri
const chartEl = ref<HTMLElement>()
const xAxisEl = ref<SVGGElement>()
const reelsXAxisEl = ref<SVGGElement>()
const yAxisEl = ref<SVGGElement>()
const reelsYAxisEl = ref<SVGGElement>()
const svgRef = ref<SVGGElement | null>(null)
const brushGroup = ref<SVGGElement | null>(null)

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

// Chart status deişiyor between show digital io show kule vs
// Chart ve altında kalan digital-io gösterim yeri için gerekli alanı burası oluşturur
// Lütfen sadece burayı update'leyiniz alanlarla alakalı
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
// dont show io means bottom 50 multp 1
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
const xExtendStartTime = ref(startTime.value)
const xExtendEndTime = ref(endTime.value)
const xExtent = computed(() => {
  const a = [
    new Date(xExtendStartTime.value),
    new Date(xExtendEndTime.value),
    // props.batch.jobOrderInfo.endTime
    //   ? new Date(props.batch.jobOrderInfo.endTime)
    //   : jobOrderEndTime.value,
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

/**
 * Teorik sıcaklı grafigindeki renk değişimlerini (program değişince renk değişir)
 * göstermek için yapılmış bir implementation. Değiştirilmesini önermem.
 */
const jobOrderDurationTheoreticalDuration
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
        durationUntilStart / jobOrderDurationTheoreticalDuration,
      )
      colorTransitionPortions.push(
        durationUntilStart / jobOrderDurationTheoreticalDuration,
      )
    }
  }
})
if (!colorTransitionPortions.length)
  colorTransitionPortions.push(0)

// Data set burada oluşturulur analog değerler ve counter - calculated values için
const dataSet = computed(() => {
  const set: { io: any, color: string, axis?: any, isDefault?: boolean, lineType?: LineType }[] = []
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
        lineType: setting.lineType,
        axis: setting.axis,
      })
  })
  props.batch.counters.forEach((io) => {
    const setting = settingsStore.getSetting(`counters_${io.ioIndex}`)
    if (setting && setting.selected)
      set.push({
        io: { ...io, type: 'AIN', settingKey: `counters_${io.ioIndex}` },
        color: setting.color,
        lineType: setting.lineType,
        axis: setting.axis,
      })
  })
  props.batch.calculatedValues.forEach((io) => {
    const setting = settingsStore.getSetting(`calculatedValues_${io.ioIndex}`)
    if (setting && setting.selected)
      set.push({
        io: { ...io, name: t(`calculatedValues.${io.name}`), type: 'AIN', settingKey: `calculatedValues_${io.ioIndex}` },
        color: setting.color,
        lineType: setting.lineType,
        axis: setting.axis,
      })
  })
  props.batch.analogOutputs.forEach((io) => {
    const setting = settingsStore.getSetting(`analogOutputs_${io.ioIndex}`)
    if (setting && setting.selected)
      set.push({
        io: { ...io, type: 'AOUT', settingKey: `analogOutputs_${io.ioIndex}` },
        color: setting.color,
        lineType: setting.lineType,
        axis: setting.axis,
      })
  })

  return set.length ? set : [{ io: { ioValues: [] }, color: '#FFFFFF' }]
})

// Digital iolar için dataset
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

// Reels data seti. Bunların hepsinin tipi ve gösterildikleri alanlar - componentler farklı

const reelsDataSet = computed(() => {
  if (settingsStore.bottomChartVisibilityStatus === 2) {
    const cycs = []
    props.batch.cycleTimes.forEach((cycle) => {
      const setting = settingsStore.getSetting(`cycleTimes_${cycle.reelNo}`)
      if (setting && setting.selected)
        cycs.push({ ...cycle, color: setting.color, lineType: setting.lineType })
    })
    return cycs
  } else return []
})

// yScales array olmak zorunda çünkü birden fazla line için birden fazla axis mevcut
// FIXME: If first io has not the unit of 'C it will show some axis different from 'C on the left
const yScales = computed(() => {
  return dataSet.value.map((aio) => {
    const setting = settingsStore.getSetting(aio.io.settingKey)
    let max = Number(d3Max(aio.io.ioValues, (v: any) => v.value))
    let min = 0
    const axis = settingsStore.axises.get(setting.axis || 'undef')
    if (axis) {
      if (max > axis.max)
        axis.max = max
      else
        max = axis.max

      if (axis.unit.includes('counters')) {
        min = Number(d3Min(aio.io.ioValues, (v: any) => v.value))
        if (axis?.min || axis.min === 0) {
          if (axis.min > min)
            axis.min = min
          else
            min = axis.min
        }
      }
    }
    return scaleLinear()
      .range([innerRect.value.height * chartHeightMultiplier, 0])
      .domain([min * 1.1, max * 1.1])
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
  .range([1, 32])
  .domain([150, 1024])
  .clamp(true)
const reelAxisTickScale = scaleLinear()
  .range([0, 4])
  .domain([0, 200])
  .clamp(true)
const xAxisTickCount = computed(() => {
  return Math.round(xAxisTickScale(outerWidth.value))
})

const yAxisTickCount = computed(() => {
  return Math.round(yAxisTickScale(outerHeight.value * chartHeightMultiplier))
})
const reelsYAxisTickCount = computed(() => {
  return Math.round(reelAxisTickScale(outerHeight.value * (1 - chartHeightMultiplier)))
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
const alarmTypes = computed(() => [
  { type: 0, label: t('alarmSettings.0sh'), color: 'red' },
  { type: 1, label: t('alarmSettings.1sh'), color: 'blue' },
  { type: 2, label: t('alarmSettings.2sh'), color: 'green' },
  { type: 3, label: t('alarmSettings.3sh'), color: 'red' },
  { type: 4, label: t('alarmSettings.4'), color: 'blue' },
  { type: 5, label: t('alarmSettings.5'), color: 'blue' },
  { type: 6, label: t('alarmSettings.6'), color: 'blue' },
  { type: 7, label: t('alarmSettings.7sh'), color: 'blue' },
  { type: 8, label: t('alarmSettings.8'), color: 'blue' },
  { type: 9, label: t('alarmSettings.9'), color: 'yellow' },
  { type: 10, label: t('alarmSettings.10'), color: '#FF00FF' },
  { type: 11, label: t('alarmSettings.11sh'), color: 'blue' },
] as { type: number, label: string, color: string }[])
function colorInterpolator(alarmType: number) {
  return alarmTypes.value.find(alarm => alarm.type === alarmType)?.color || 'blue'
}
// const colorInterpolator = interpolateRgbBasis([
// 'purple',
// 'blue',
// 'red',
// 'orange',
// ])

const lines = computed(() => {
  return yScales.value.map((scale, index) => {
    return {
      color: dataSet.value[index]?.color || '#FFFFFF',
      isDefault: dataSet.value[index]?.isDefault,
      lineType: dataSet.value[index]?.lineType,
      line: d3Line()
        .x((d: any) => {
          return xScale.value(new Date(d.time))
        })
        .y((d: any) => scale(d.value))
        .curve(dataSet.value[index].io.type !== 'AOUT' ? curveLinear : curveStepAfter),
    }
  })
})
const reelLines = computed(() => {
  return reelsDataSet.value.map((cyc, index) => {
    return {
      color: cyc?.color || '#FFFFFF',
      lineType: reelsDataSet.value[index]?.lineType,
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
      .ticks(reelsYAxisTickCount.value),
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
function resetZoom() {
  xExtendStartTime.value = startTime.value
  xExtendEndTime.value = endTime.value
}
function zoom(zoomStartTime: Date, zoomEndTime: Date) {
  xExtendStartTime.value = zoomStartTime
  xExtendEndTime.value = zoomEndTime
}

// Tıkla sürükle bırak şeklinde çalışan zoom functionality
function getBrush() {
  let startX = 0
  let endX = 0
  return brushX()
    .extent([
      [margin.value.left, margin.value.top], // Top-left corner of the brush area
      [innerRect.value.width + margin.value.left, settingsStore.bottomChartVisibilityStatus ? innerRect.value.height + margin.value.bottom : innerRect.value.height + margin.value.top], // Bottom-right corner of the brush area
    ])
    .on('start', (event) => {
      startX = event.sourceEvent.x
      handleChartClick(event.sourceEvent)
    })
  // .on('brush', (event) => {
  //   handleChartClick(event.sourceEvent)
  // })
    .on('end', (event) => {
      if (!event.selection)
        return
      const start = event.selection[0] - margin.value.left
      const end = event.selection[1] - margin.value.left
      endX = event.sourceEvent.x
      const proximityCheck = Math.abs((startX - endX) / (startX + endX) / 2) * 100 > 0.5
      if (proximityCheck) {
        if (startX > endX) {
          const selectedTimeAxisX = xScale.value(selectedTime.value)
          resetZoom()
          selectedTime.value = xScale.value.invert(selectedTimeAxisX)
        } else {
          const startTimeX = xScale.value.invert(start)
          const endTimeX = xScale.value.invert(end)
          const selectedTimeAxisX = xScale.value(selectedTime.value)
          zoom(startTimeX, endTimeX)
          selectedTime.value = xScale.value.invert(selectedTimeAxisX)
        }
      }
      d3Select(brushGroup.value).call(el => brushX().clear(el as Selection<SVGGElement, any, any, any>))
    })
}
onMounted(() => {
  xAxis = d3Select(xAxisEl.value!)
  xAxisReels = d3Select(reelsXAxisEl.value!)
  yAxisLeft = d3Select(yAxisEl.value!)
  yAxisReels = d3Select(reelsYAxisEl.value!)
  visibleAxises.value.forEach((axis, key) => {
    yAxisesRight.value.set(key, d3Select(`#${id}-${formatASCII(key)}`))
  })
  if (brushGroup.value) {
    // TODO: On resize like fullscreen brushı updatelemek lazım xextend
    const brushBehavior = ref(getBrush())
    watch(innerRect, () => {
      brushBehavior.value = getBrush()
      d3Select(brushGroup.value).call(brushBehavior.value)
    })
    d3Select(brushGroup.value).call(brushBehavior.value)

    // Apply the brush to the <g> element
  }
  updateXAxis()
  updateYAxises()
  if (selectedTime.value) {
    drawSelectedTimeLine()
  }
})

const tooltipOffset = ref(10)
function drawSelectedTimeLine() {
  const xStart = xScale.value(new Date(xExtendStartTime.value))
  const xEnd = xScale.value(new Date(xExtendEndTime.value))
  const xCoord = xScale.value(new Date(selectedTime.value))
  selectedX.value = xCoord
  if (xCoord > (xStart + xEnd) / 2)
    tooltipOffset.value = -250
  else
    tooltipOffset.value = 10
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

// fix(AR): TW-178
watch(selectedTime, () => {
  const visibleStart = xExtendStartTime.value.getTime()
  const visibleEnd = xExtendEndTime.value.getTime()
  const needleTime = selectedTime.value.getTime()

  if (needleTime < visibleStart || needleTime > visibleEnd) {
    const needle = differenceInMinutes(xExtendEndTime.value, xExtendStartTime.value)

    let minute = 0
    if (needleTime < visibleStart) {
      minute = differenceInMinutes(xExtendStartTime.value, selectedTime.value)
    } else {
      minute = differenceInMinutes(selectedTime.value, xExtendEndTime.value)
    }

    if (minute < needle / 2) {
      if (needleTime < visibleStart) {
        const shift = minute
        xExtendStartTime.value = addMinutes(xExtendStartTime.value, -shift)
        xExtendEndTime.value = addMinutes(xExtendEndTime.value, -shift)
      } else {
        const shift = minute
        xExtendStartTime.value = addMinutes(xExtendStartTime.value, shift)
        xExtendEndTime.value = addMinutes(xExtendEndTime.value, shift)
      }
    } else {
      resetZoom()
    }
  }

  drawSelectedTimeLine()
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
    alarmType: number
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
      alarmType: alarm.alarmType,
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
  return { ...bar, color: colorInterpolator(bar.alarmType) }
})
const predefinedAlarmTypeOrder = [1, 10, 9, 2, 3, 0]
const orderedAlarms = orderArray(uniqueBars.value, predefinedAlarmTypeOrder, 'alarmType')
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
// Tooltip contenti burası belirler. Tooltip verisini chartta konumlandırmak için lütfen <template> kısmına bakınız
const tooltipContent = computed(() => {
  if (selectedX.value === null)
    return null

  const tooltipData = dataSet.value
    .map((dataset) => {
      // Find the closest data point

      let dataPoint

      if (dataset.io.ioValues.length) {
        if (dataset.io.type === 'AOUT') {
          const filtered = dataset.io.ioValues
            .filter(
              v => (new Date(v.time)).getTime() <= selectedTime.value.getTime(),
            )
            .sort((a, b) => (new Date(a.time)).getTime() - (new Date(b.time)).getTime())

          if (filtered.length > 0)
            dataPoint = { ...filtered[filtered.length - 1], name: dataset.io.name }
        } else {
          dataPoint = dataset.io.ioValues.reduce((prev, curr) => {
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
      }

      return {
        value: dataPoint,
        color: dataset.color,
        type: dataset.io.type,
      }
    })
    .filter(
      io =>
        (settingsStore.tooltipSettings.includes(1) && io.type === 'AIN')
        || (settingsStore.tooltipSettings.includes(2) && io.type === 'AOUT'),
    )

  // TODO: bottomChartVisibilityStatus enum değer olmalı
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
    data: tooltipData.filter(i => i?.value?.name && ((i?.value?.value || i?.value?.value === 0) || i?.value?.duration)),
  }
})

// Printten önce zoomu resetlemek lazım yoksa zoomlu printler
onKeyStroke(['p', 'P'], (event: KeyboardEvent) => {
  if (event.ctrlKey) {
    event.preventDefault()
    resetZoom()
    printChartSVG()
  }
})

onKeyStroke('ArrowRight', (event: KeyboardEvent) => {
  event.preventDefault()
  const newTime = addMinutes(selectedTime.value, 1)
  if (newTime <= endTime.value) {
    selectedTime.value = newTime

    const currentViewDuration = differenceInMinutes(xExtendEndTime.value, xExtendStartTime.value)
    const halfDuration = currentViewDuration / 2
    const proposedStartTime = addMinutes(newTime, -halfDuration)
    const proposedEndTime = addMinutes(newTime, halfDuration)

    if (proposedStartTime < startTime.value) {
      xExtendStartTime.value = startTime.value
      xExtendEndTime.value = addMinutes(startTime.value, currentViewDuration)
    } else if (proposedEndTime > endTime.value) {
      xExtendEndTime.value = endTime.value
      xExtendStartTime.value = addMinutes(endTime.value, -currentViewDuration)
    } else {
      xExtendStartTime.value = proposedStartTime
      xExtendEndTime.value = proposedEndTime
    }
  } else {
    selectedTime.value = endTime.value
  }
})

onKeyStroke('ArrowLeft', (event: KeyboardEvent) => {
  event.preventDefault()
  const newTime = addMinutes(selectedTime.value, -1)
  if (newTime >= startTime.value) {
    selectedTime.value = newTime

    const currentViewDuration = differenceInMinutes(xExtendEndTime.value, xExtendStartTime.value)
    const halfDuration = currentViewDuration / 2
    const proposedStartTime = addMinutes(newTime, -halfDuration)
    const proposedEndTime = addMinutes(newTime, halfDuration)

    if (proposedEndTime > endTime.value) {
      xExtendEndTime.value = endTime.value
      xExtendStartTime.value = addMinutes(endTime.value, -currentViewDuration)
    } else if (proposedStartTime < startTime.value) {
      xExtendStartTime.value = startTime.value
      xExtendEndTime.value = addMinutes(startTime.value, currentViewDuration)
    } else {
      xExtendStartTime.value = proposedStartTime
      xExtendEndTime.value = proposedEndTime
    }
  } else {
    selectedTime.value = startTime.value
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
function getBarEndTime(value: Date | string) {
  return new Date(value) > xExtendEndTime.value ? xExtendEndTime.value : new Date(value)
}
function getBarStartTime(value: Date | string) {
  return xExtendStartTime.value > new Date(value) ? xExtendStartTime.value : new Date(value)
}
function computeWidth(ioValues, idx) {
  const startTimeTemp = new Date(ioValues[idx].time)
  const endTimeTemp
    = idx + 1 < ioValues.length
      ? new Date(ioValues[idx + 1].time)
      : endTime.value
  const res = xScale.value(getBarEndTime(endTimeTemp)) - xScale.value(getBarStartTime(startTimeTemp))
  if (res < 0)
    return 0
  return res
}
function getAlarmWidth(startTime: string | Date, endTime: string | Date) {
  const res = xScale.value(getBarEndTime(endTime)) - xScale.value(getBarStartTime(startTime))
  if (res < 0) {
    return 0
  }
  return res
}
const arrowPoints = computed(() => {
  const unloadPoints: { x: number, y: number }[] = []
  theoreticalTemperatures.forEach((temp) => {
    if (props.batch.machine.commands.find(cmd => cmd.commandNo === temp.commandNo)?.isUnload) {
      unloadPoints.push({
        x: xScale.value(temp.time),
        y: yScales.value[0](temp.value),
      })
    }
  })
  return unloadPoints
})

function getArrowPath(x: number, y: number) {
  const arrowSize = 7
  const offsetX = 50
  const offsetY = 20

  return `M${x + offsetX},${y + offsetY + arrowSize}
          L${x - arrowSize + offsetX},${y + offsetY}
          L${x + arrowSize + offsetX},${y + offsetY}
          Z`
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
      flat: true,
      onClick: async () => {
        resetZoom()
        await nextTick()
        printChartSVG()
      },
    },
    {
      icon: settingsStore.showGraphTooltip ? 'comments_disabled' : 'comment',
      flat: true,
      tooltip: settingsStore.showGraphTooltip
        ? t('hideTooltip')
        : t('showTooltip'),
      onClick: () =>
        (settingsStore.showGraphTooltip = !settingsStore.showGraphTooltip),
    },
    {
      flat: true,
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
      flat: true,
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
      flat: true,
      onClick: () => {
        $q.dialog({
          component: AxisesVisibilityDialog,
        })
      },
    },
    {
      icon: 'analytics',
      tooltip: t('reelDataDialog'),
      flat: true,
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
const selectedCommand = computed(() => {
  return props.batch.mergedCommands.find((cmd) => {
    return new Date(cmd.startTime) <= selectedTime.value && new Date(cmd.endTime) > selectedTime.value
  })
})
</script>

<template>
  <div ref="chartEl" class="chart">
    <g id="top-alarm-defs" style="display: flex; gap: 10px; margin-left: 10px; font-size: small; margin-bottom: -20px;">
      <g
        v-for="alarm of alarmTypes"
        :key="`alarmType${alarm.type}`"
        style="display: flex; align-items: center; justify-content: center; gap: 5px;"
      >
        <g :style="{ height: '8px', width: '8px', backgroundColor: alarm.color }" />
        <text>
          {{ alarm.label }}
        </text>
      </g>
    </g>
    <svg
      ref="svgRef"
      :viewBox="`0 0 ${outerWidth} ${outerHeight}`"
      :width="outerWidth"
      :height="outerHeight"
    >
      <g :clip-path="`url(#${clipId})`">
        <path
          v-for="(point, index) in arrowPoints"
          :key="`arrow-${index}`"
          :d="getArrowPath(point.x, point.y)"
          fill="blue"
          stroke="black"
          stroke-width="0.5"
          class="arrow"
        />
      </g>
      <g
        ref="brushGroup"
        :width="outerWidth"
        :height="outerHeight"
      />
      <!-- Right buttons see buttons[] array -->
      <g
        :transform="`translate(${innerRect.width + margin.right}, ${margin.top})`"
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
      <!-- Right axises -->
      <g
        :transform="`translate(${margin.left},${margin.top})`"
        style="cursor: crosshair;"
      >
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
        <!-- Lines -->
        <g :clip-path="`url(#${clipId})`">
          <path
            v-for="(line, index) in lines"
            :key="`${index}-line`"
            :d="line.line(dataSet[index].io.ioValues)!"
            fill="none"
            :stroke="line.isDefault ? 'url(#koko)' : line.color"
            :stroke-width="line.isDefault ? 1 : 2.5"
            :stroke-dasharray="line.lineType === 'dashed' ? '4,2' : 'none'"
            style="pointer-events: none;"
          />
          <g v-for="(line, index) in lines" :key="`${index}-dots`">
            <g v-if="line.lineType === 'dotted'">
              <circle
                v-for="(point, pointIndex) in dataSet[index].io.ioValues"
                :key="`${index}-${pointIndex}`"
                :cx="xScale(new Date(point.time))"
                :cy="yScales[index](point.value)"
                r="3"
                :fill="line.color"
              />
            </g>
          </g>
          <!-- teorik sıcaklık grafiği -->
          <linearGradient id="koko">
            <stop
              v-for="(point, index) of colorTransitionPortions"
              :key="`point${index}`"
              :offset="point"
              :stop-color="['blue', 'red', 'red', 'blue'][index % 4]"
            />
          </linearGradient>
        </g>
        <!-- selected time line -->
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
        <!-- Alarm bars -->
        <g :clip-path="`url(#${clipId})`">
          <g v-for="barLine in orderedAlarms" :key="`${barLine.alarmNo}-bar`">
            <rect
              v-for="(bar, indexBar) in barLine.value"
              :key="`${indexBar}-${barLine.alarmNo}`"
              :x="xScale(getBarStartTime(bar.startTime))"
              :y="barScale(`${barLine.alarmNo}`)"
              :width="getAlarmWidth(bar.startTime, bar.endTime)"
              :height="barScale.bandwidth()"
              :fill="barLine.color"
              :stroke="barLine.color"
              style="pointer-events: none;"
              stroke-width="1"
            />
          </g>
        </g>
        <!-- Tooltip content pixel pixel belirlenir maybe daha iyi bir implementation yapılabilir. -->
        <g
          v-if="
            tooltipContent
              && selectedX !== null
              && settingsStore.showGraphTooltip
          "
          id="chart-tooltip"
          :transform="`translate(${selectedX + tooltipOffset}, 10)`"
        >
          <rect
            class="tooltip-bg"
            width="240"
            :height="110 + tooltipContent.data.length * 20"
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
            {{ batch.jobOrderInfo.operatorName }}
          </text>
          <text
            v-if="selectedCommand"
            x="8"
            y="80"
          >
            {{ t('tooltipOptions.activeCommand') }}:
            {{ `(${selectedCommand.commandNo}) ${selectedCommand.commandName}` }}
          </text>
          <text
            v-if="selectedCommand"
            x="8"
            y="100"
          >
            {{ t('tooltipOptions.timeUntilCommandStart') }}:
            {{ formatDurationHHMMSS(new Date(selectedCommand.startTime), selectedTime) }}
          </text>
          <g v-for="(item, index) in tooltipContent.data" :key="index">
            <text
              x="8"
              :y="120 + index * 20"
              class="text-sm"
              :fill="item.color"
            >
              {{
                `${item?.value?.name}: ${item?.value?.value?.toFixed(2) || (`${item?.value?.duration} - ${t('cycle')}: ${item.value.count}`)}`
              }}
            </text>
          </g>
        </g>
        <!-- Digital ios -->
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
                :x="xScale(getBarStartTime(value.time))"
                :width="computeWidth(io.ioValues, idx)"
                :height="8"
                :y="index * 20"
                :fill="value.value ? 'blue' : 'grey'"
                style="pointer-events: none;"
                stroke="none"
              />
            </template>
          </g>
        </g>
        <!-- Reel lines -->
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
              :stroke-dasharray="line.lineType === 'dashed' ? '4,2' : 'none'"
            />
            <g v-for="(line, index) in reelLines" :key="`${index}-dots-reel`">
              <g v-if="line.lineType === 'dotted'">
                <circle
                  v-for="(point, pointIndex) in reelsDataSet[index].cycles"
                  :key="`${index}-${pointIndex}`"
                  :cx="xScale(new Date(point.cycledAt))"
                  :cy="reelYScale(point.duration)"
                  r="3"
                  :fill="line.color"
                />
              </g>
            </g>
          </g>
        </g>

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
