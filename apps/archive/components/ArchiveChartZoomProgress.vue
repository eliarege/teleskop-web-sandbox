<script setup lang="ts">
import { type D3BrushEvent, type ScaleLinear, type ScaleTime, type Selection, axisBottom, axisLeft, line as d3Line, max as d3Max, select as d3Select, zoom as d3Zoom, interpolateRgb, scaleLinear, scaleTime,
} from 'd3'
import { addMinutes, differenceInMinutes } from 'date-fns'
import type { Batch } from '~/types/archive'
import { formatDatetime } from '~/utils/functions'

const props = defineProps<{
  batch: Batch
  selectedDate: Date | null
}>()

defineEmits<{
  'update:selectedDate': [date: Date]
}>()

const chartEl = ref<HTMLElement>()
const xAxisEl = ref<SVGGElement>()
const yAxisEl = ref<SVGGElement>()

const clipId = useId()

let xAxis: Selection<any, any, any, any> | undefined
let yAxis: Selection<any, any, any, any> | undefined

const { width: outerWidth, height: outerHeight } = useElementSize(chartEl)
const margin = { top: 20, right: 50, bottom: 50, left: 50 }

const innerRect = computed(() => {
  return {
    width: Math.max(outerWidth.value - margin.left - margin.right, 0),
    height: Math.max(outerHeight.value - margin.top - margin.bottom, 0),
  }
})

const xExtent = computed(() => {
  const start = new Date(props.batch.jobOrderInfo.startTime),
  const end = props.batch.jobOrderInfo.endTime
    ? new Date(props.batch.jobOrderInfo.endTime)
    : addMinutes(new Date(props.batch.jobOrderInfo.startTime), 15),
  return [
    start,
    end,
  ] as [Date, Date]
})

const xScale = ref<ScaleTime<number, number>>(
  scaleTime().range([0, innerRect.value.width]).domain(xExtent.value),
)

const analogInputs = computed(() => {
  return props.batch.analogInputs.filter(() => true)
})

const yScales = computed(() => {
  return analogInputs.value.map((ai) => {
    const max = d3Max(ai.ioValues, v => v.value)
    return scaleLinear()
      .range([innerRect.value.height, 0])
      .domain([0, (max || 0) * 1.1])
  })
})

const xAxisTickScale = scaleLinear().range([0, 16]).domain([200, 1280]).clamp(true)
const yAxisTickScale = scaleLinear().range([0, 16]).domain([150, 1024]).clamp(true)

const xAxisTickCount = computed(() => Math.round(xAxisTickScale(outerWidth.value)))
const yAxisTickCount = computed(() => Math.round(yAxisTickScale(outerHeight.value)))

function updateXAxis() {
  const ticks = xScale.value.ticks(xAxisTickCount.value)
  const tickDiff = ticks.length > 1 ? differenceInMinutes(ticks[1], ticks[0]) : 0
  const showSeconds = tickDiff === 0

  xAxis?.call(
    axisBottom(xScale.value)
      .tickFormat(value =>
        formatDatetime(value.valueOf(), showSeconds ? 'HH:mm:ss' : 'HH:mm'),
      )
      .ticks(xAxisTickCount.value),
  )
}

const colorInterpolator = interpolateRgb('red', 'blue')

const lines = computed(() => {
  return yScales.value.map((scale, index) => {
    const lineGenerator = d3Line()
      .x((d: any) => xScale.value(new Date(d.time)))
      .y((d: any) => scale(d.value))

    return {
      color: colorInterpolator(index / analogInputs.value.length),
      line: lineGenerator,
    }
  })
})

function updateYAxis() {
  yAxis?.call(
    axisLeft(yScales.value[0]).ticks(yAxisTickCount.value),
  )
  yAxis?.selectAll('.dashed-line').remove()
  yAxis?.selectAll('.tick')
    .append('line')
    .filter((_, i) => i > 0)
    .attr('class', 'dashed-line')
    .attr('stroke', 'gray')
    .attr('stroke-dasharray', 4)
    .attr('opacity', 0.6)
    .attr('x1', 0)
    .attr('x2', innerRect.value.width)
    .attr('y1', 0)
    .attr('y2', 0)
}

const zoom = d3Zoom()
  .scaleExtent([1, 32]) // Set zoom limits
  .extent([
    [margin.left, 0],
    [innerRect.value.width, innerRect.value.height],
  ])
  .translateExtent([
    [margin.left, Number.NEGATIVE_INFINITY],
    [innerRect.value.width - margin.right, Number.POSITIVE_INFINITY],
  ])
  .on('zoom', zoomed)

// The zoomed function
function zoomed(event) {
  // Rescale the x-axis based on zoom
  const xz = event.transform.rescaleX(xScale.value)

  // Update the xScale with the rescaled version
  xScale.value = xz

  // Update the lines with the new x-scale
  d3Select(chartEl.value!)
    .selectAll('path')
    .attr('d', (d, index) => {
      const lineObj = lines.value[index]
      const inputValues = analogInputs.value[index]?.ioValues

      if (!lineObj || !inputValues)
        return null

      // Generate the path with the updated x-scale
      return lineObj.line(inputValues)
    })

  // Update the x-axis with the new scale
  xAxis?.call(axisBottom(xz).ticks(xAxisTickCount.value))
}

onMounted(() => {
  if (!chartEl.value)
    return

  xAxis = d3Select(xAxisEl.value!)
  yAxis = d3Select(yAxisEl.value!)

  updateXAxis()
  updateYAxis()

  // Apply the zoom behavior to the SVG element
  d3Select(chartEl.value!)
    .select('svg')
    .call(zoom)
})

watch([xScale, xAxisTickCount], updateXAxis)
watch([yScales, yAxisTickCount], updateYAxis)
function renderLines() {
  d3Select(chartEl.value!)
    .select('g')
    .selectAll('path')
    .data(lines.value)
    .join('path')
    .attr('fill', 'none')
    .attr('stroke', d => d.color)
    .attr('stroke-width', 1.5)
    .attr('d', (d, index) => {
      const inputValues = analogInputs.value[index]?.ioValues
      return inputValues ? d.line(inputValues) : null
    })
}

watch([lines, analogInputs], renderLines)
</script>

<template>
  <div ref="chartEl" class="chart">
    <svg :viewBox="`0 0 ${outerWidth} ${outerHeight}`">
      <defs>
        <clipPath :id="clipId">
          <rect :width="innerRect.width" :height="innerRect.height" />
        </clipPath>
      </defs>
      <g :transform="`translate(${margin.left},${margin.top})`">
        <g
          ref="xAxisEl"
          class="x-axis"
          :transform="`translate(0,${innerRect.height})`"
        />
        <g ref="yAxisEl" class="y-axis" />
        <g :clip-path="`url(#${clipId})`">
          <path
            v-for="(line, index) in lines"
            :key="index"
            :d="line.line(analogInputs[index].ioValues)!"
            fill="none"
            :stroke="line.color"
            stroke-width="1.5"
          />
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
