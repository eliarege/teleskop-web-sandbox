<script setup>
import * as d3 from 'd3'

const chartRef = ref(null)
let svg, xScale, lines, data, barData, alarmData, width, height, xAxis, chartContent

onMounted(() => {
  initializeChart()
})

onUnmounted(() => {
  d3.select(window).on('resize.updateChart', null)
})

function initializeChart() {
  const parseTime = d3.timeParse('%Y-%m-%d %H:%M:%S')

  const generateData = (count, prefix) => {
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(2023, 0, i + 1)
      return {
        date,
        [`${prefix}1`]: Math.random() * 50 + 25,
        [`${prefix}2`]: Math.random() * 50 + 25,
        [`${prefix}3`]: Math.random() * 1500 + 1500,
      }
    })
  }

  data = generateData(7, 'value')

  barData = [
    { start: '2023-01-01 06:00:00', end: '2023-01-02 18:00:00', type: 'bar1' },
    { start: '2023-01-02 12:00:00', end: '2023-01-04 06:00:00', type: 'bar2' },
    { start: '2023-01-03 18:00:00', end: '2023-01-05 12:00:00', type: 'bar3' },
    { start: '2023-01-05 00:00:00', end: '2023-01-06 18:00:00', type: 'bar1' },
    { start: '2023-01-06 06:00:00', end: '2023-01-07 12:00:00', type: 'bar2' },
  ].map(d => ({ ...d, start: parseTime(d.start), end: parseTime(d.end) }))

  alarmData = [
    { date: '2023-01-02 12:00:00', value: 2450 },
    { date: '2023-01-04 18:00:00', value: 2600 },
    { date: '2023-01-06 09:00:00', value: 2800 },
  ].map(d => ({ ...d, date: parseTime(d.date), value: +d.value }))

  const margin = { top: 20, right: 120, bottom: 50, left: 50 }
  width = 800 - margin.left - margin.right
  height = 400 - margin.top - margin.bottom

  svg = d3.select(chartRef.value).append('svg')
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('class', 'w-full h-auto')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  xScale = d3.scaleTime().range([0, width])

  xAxis = d3.axisBottom(xScale)

  const xExtent = d3.extent([...data, ...alarmData], d => d.date)
  xScale.domain(xExtent)

  lines = [
    { key: 'value1', color: 'yellow', scale: d3.scaleLinear().range([height, 0]) },
    { key: 'value2', color: 'blue', scale: d3.scaleLinear().range([height, 0]) },
    { key: 'value3', color: 'magenta', scale: d3.scaleLinear().range([height, 0]) },
  ]

  lines.forEach((line) => {
    const extent = d3.extent(data, d => d[line.key])
    line.scale.domain([extent[0] * 0.9, extent[1] * 1.1])
  })

  svg.append('defs').append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', width)
    .attr('height', height)

  svg.append('g')
    .attr('class', 'grid')
    .attr('clip-path', 'url(#clip)')
    .call(d3.axisLeft(lines[0].scale).tickSize(-width).tickFormat('').ticks(10))
    .call(g => g.selectAll('.tick line').attr('class', 'stroke-gray-300 stroke-dasharray-2'))

  const gX = svg.append('g')
    .attr('class', 'x axis cursor-ew-resize')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)

  chartContent = svg.append('g').attr('clip-path', 'url(#clip)')

  updateYAxes()
  drawLines()
  drawBars()
  drawMarkers()
  setupBrushing()
  setupDragging(gX)

  d3.select(window).on('resize.updateChart', updateChart)
}

function updateYAxes() {
  svg.selectAll('.y.axis').remove()
  lines.forEach((line, i) => {
    const yAxis = i === 0 ? d3.axisLeft(line.scale) : d3.axisRight(line.scale)
    svg.append('g')
      .attr('class', `y axis y-axis-${i}`)
      .attr('transform', i === 0 ? null : `translate(${width + (i - 1) * 40}, 0)`)
      .call(yAxis)
      .call(g => g.selectAll('.tick line').attr('stroke', line.color))
      .call(g => g.selectAll('.tick text').attr('fill', line.color))
      .call(g => g.select('.domain').attr('stroke', line.color))
  })
}

function drawLines() {
  chartContent.selectAll('.line').remove()
  chartContent.selectAll('.overlay').remove()
  chartContent.selectAll('.vertical-line').remove()

  lines.forEach((lineConfig) => {
    const line = d3.line()
      .x(d => xScale(d.date))
      .y(d => lineConfig.scale(d[lineConfig.key]))

    chartContent.append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', lineConfig.color)
      .attr('stroke-width', 1.5)
      .attr('d', line)
  })

  const tooltip = d3.select('body').append('div')
    .attr('class', 'absolute p-2 bg-blue-200 rounded-lg text-xs pointer-events-none opacity-0')

  const verticalLine = chartContent.append('line')
    .attr('class', 'vertical-line stroke-gray-500 stroke-dasharray-2 opacity-0')

  chartContent.append('rect')
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height)
    .style('fill', 'none')
    .style('pointer-events', 'all')
    .on('mousemove', (event) => {
      const [xPos] = d3.pointer(event)
      const xDate = xScale.invert(xPos)
      const bisect = d3.bisector(d => d.date).left
      const index = bisect(data, xDate, 1)
      const d0 = data[index - 1]
      const d1 = data[index]
      const d = xDate - d0.date > d1.date - xDate ? d1 : d0

      verticalLine
        .style('opacity', 1)
        .attr('x1', xScale(d.date))
        .attr('y1', 0)
        .attr('x2', xScale(d.date))
        .attr('y2', height)

      let tooltipContent = `Date: ${d3.timeFormat('%Y-%m-%d')(d.date)}<br/>`
      lines.forEach((line) => {
        tooltipContent += `${line.key}: ${d[line.key].toFixed(2)}<br/>`
      })

      tooltip.transition().duration(200).style('opacity', 0.9)
      tooltip.html(tooltipContent)
        .style('left', `${event.pageX + 5}px`)
        .style('top', `${event.pageY - 28}px`)
    })
    .on('mouseout', () => {
      verticalLine.style('opacity', 0)
      tooltip.transition().duration(500).style('opacity', 0)
    })
}

function drawBars() {
  const barColors = { bar1: 'orange', bar2: 'blue', bar3: 'green' }
  const barScale = d3.scaleBand()
    .domain(['bar1', 'bar2', 'bar3'])
    .range([height - 40, height])
    .padding(0.1)

  chartContent.selectAll('.timebar')
    .data(barData)
    .join('rect')
    .attr('class', 'timebar')
    .attr('x', d => xScale(d.start))
    .attr('y', d => barScale(d.type))
    .attr('width', d => xScale(d.end) - xScale(d.start))
    .attr('height', barScale.bandwidth())
    .attr('fill', d => barColors[d.type])
}

function drawMarkers() {
  const triangle = d3.symbol().type(d3.symbolTriangle).size(100)

  chartContent.selectAll('.triangle-marker')
    .data(data.filter((_, i) => i === 3))
    .join('path')
    .attr('class', 'triangle-marker')
    .attr('d', triangle)
    .attr('transform', d => `translate(${xScale(d.date)},${lines[2].scale(d.value3)}) rotate(180)`)
    .attr('fill', 'red')

  chartContent.selectAll('.alarm-icon')
    .data(alarmData)
    .join('path')
    .attr('class', 'alarm-icon')
    .attr('d', 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z')
    .attr('transform', d => `translate(${xScale(d.date)},${lines[2].scale(d.value)}) scale(0.8)`)
    .attr('fill', 'orange')
}

function setupBrushing() {
  const brush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on('end', brushed)

  svg.append('g')
    .attr('class', 'brush')
    .call(brush)

  function brushed(event) {
    if (!event.selection)
      return
    const [[x0, y0], [x1, y1]] = event.selection
    xScale.domain([xScale.invert(x0), xScale.invert(x1)])

    lines.forEach((line) => {
      const yExtent = [line.scale.invert(y1), line.scale.invert(y0)]
      line.scale.domain(yExtent)
    })

    updateChart()
    svg.select('.brush').call(brush.move, null)
  }
}

function setupDragging(gX) {
  let isDragging = false
  let startX

  gX.call(d3.drag()
    .on('start', (event) => {
      isDragging = true
      startX = event.x
    })
    .on('drag', (event) => {
      if (!isDragging)
        return
      const dx = event.x - startX
      const [t0, t1] = xScale.domain().map(d => d.getTime())
      const scale = (t1 - t0) / width
      const newT0 = new Date(t0 - dx * scale)
      const newT1 = new Date(t1 - dx * scale)
      xScale.domain([newT0, newT1])
      updateChart()
      startX = event.x
    })
    .on('end', () => {
      isDragging = false
    }))
}

function updateChart() {
  svg.select('.x.axis').call(xAxis)
  updateYAxes()
  drawLines()
  drawBars()
  drawMarkers()
}

function resetZoom() {
  const xExtent = d3.extent([...data, ...alarmData], d => d.date)
  xScale.domain(xExtent)
  lines.forEach((line) => {
    const extent = d3.extent(data, d => d[line.key])
    line.scale.domain([extent[0] * 0.9, extent[1] * 1.1])
  })
  updateChart()
}

// function addLine() {
//   const newKey = `value${lines.length + 1}`
//   const newColor = d3.schemeCategory10[lines.length % 10]
//   const newScale = d3.scaleLinear().range([height, 0])

//   data.forEach((d) => {
//     d[newKey] = Math.random() * 50 + 25
//   })

//   const newExtent = d3.extent(data, d => d[newKey])
//   newScale.domain([newExtent[0] * 0.9, newExtent[1] * 1.1])

//   lines.push({ key: newKey, color: newColor, scale: newScale })

//   updateYAxes()
//   drawLines()
// }
</script>

<template>
  <div class="max-w-4xl mx-auto my-5">
    <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2" @click="resetZoom">
      Reset Zoom
    </button>
    <div ref="chartRef" class="w-full" />
    <div class="mt-4">
      <!-- <button @click="addLine" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
        Add Line
      </button> -->
    </div>
  </div>
</template>
