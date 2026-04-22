import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import RobotoBold from '@teleskop/nuxt-base/assets/fonts/Roboto-Bold.ttf?base64'
import RobotoRegular from '@teleskop/nuxt-base/assets/fonts/Roboto-Regular.ttf?base64'
import type { BasicProgram, BatchInfo, BatchIntervention, BatchParameters, ConsumptionKey, ConsumptionUnits, Consumptions, ERPParameter, Machine, RecipeStep } from '~/types/archive'
import { formatDatetime, formatDuration } from '~/utils/functions'

// ── Helpers ──────────────────────────────────────────────────────────────────

const WATER_KEY_RE = /^waterType\d$/

function isWaterKey(key: string): boolean {
  return WATER_KEY_RE.test(key)
}

export function printPDF(pdf: jsPDF) {
  const blob = pdf.output('blob')
  const url = URL.createObjectURL(blob)
  const printWindow = window.open(url, '_blank')

  if (printWindow) {
    printWindow.focus()
    printWindow.print()
  }

  URL.revokeObjectURL(url)
}

function getConsumptionRows(
  t: (key: string) => string,
  consumptions: Consumptions,
  consumptionUnits: ConsumptionUnits,
  waterTypes: Record<string, string | null>,
) {
  return Object.entries(consumptions)
    .map(([key, value]) => {
      let name = ''
      if (isWaterKey(key) && waterTypes[key]) {
        name = waterTypes[key]!
      } else if (!isWaterKey(key)) {
        name = t(`jobOrderSummary.${key}`)
      }
      return { name, amount: Number(value).toFixed(2), unit: consumptionUnits[key as ConsumptionKey] }
    })
    .filter(row => row.name !== '')
}

/** Create a landscape or portrait jsPDF instance with consistent defaults */
function createPdf(orientation: 'portrait' | 'landscape' = 'portrait') {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
  doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegular)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.addFileToVFS('Roboto-Bold.ttf', RobotoBold)
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')
  doc.setFont('Roboto', 'normal')
  return doc
}

/** Draw a single filled pie slice using line-segment arc approximation */
function drawPieSlice(
  doc: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  color: number[],
) {
  const steps = Math.max(20, Math.ceil(Math.abs(endAngle - startAngle) * 20))
  const segments: number[][] = []

  // First segment: center → arc start
  segments.push([radius * Math.cos(startAngle), radius * Math.sin(startAngle)])

  let prevX = cx + radius * Math.cos(startAngle)
  let prevY = cy + radius * Math.sin(startAngle)

  for (let i = 1; i <= steps; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / steps)
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    segments.push([x - prevX, y - prevY])
    prevX = x
    prevY = y
  }

  doc.setFillColor(color[0], color[1], color[2])
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.3)
  // closed=true draws the closing line back to (cx, cy)
  doc.lines(segments, cx, cy, [1, 1], 'FD', true)
}

// ── Grafik SVG → PDF ─────────────────────────────────────────────────────────

function svgToPngDataUrl(svg: string, width: number, height: number): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = width * 2
      canvas.height = height * 2
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null); return
      }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.scale(2, 2)
      const svgBase64 = btoa(unescape(encodeURIComponent(svg)))
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => resolve(null)
      img.src = `data:image/svg+xml;base64,${svgBase64}`
    } catch {
      resolve(null)
    }
  })
}

function getChartSvgData(): { svg: string, width: number, height: number } | null {
  const chartEl = document.querySelector('.chart svg') as SVGSVGElement | null
  if (!chartEl)
    return null

  const rect = chartEl.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0)
    return null

  const clone = chartEl.cloneNode(true) as SVGSVGElement

  clone.querySelectorAll('foreignObject').forEach(el => el.remove())
  clone.querySelector('#chart-selected-time-line')?.remove()
  clone.querySelector('#chart-tooltip')?.remove()
  clone.querySelector('#top-alarm-defs')?.remove()

  // Computed style'ları orijinal elementten oku, clone'a inline yaz
  function inlineStyles(original: Element, cloned: Element) {
    if (!(original instanceof HTMLElement || original instanceof SVGElement))
      return
    const computed = window.getComputedStyle(original)
    const props = [
      'fill',
      'stroke',
      'stroke-width',
      'stroke-dasharray',
      'stroke-opacity',
      'fill-opacity',
      'opacity',
      'font-size',
      'font-family',
      'font-weight',
      'text-anchor',
      'dominant-baseline',
      'display',
      'visibility',
      'color',
      'stop-color',
      'stop-opacity',
    ]
    const parts: string[] = []
    for (const prop of props) {
      const val = computed.getPropertyValue(prop)
      if (val)
        parts.push(`${prop}:${val}`)
    }
    if (parts.length)
      cloned.setAttribute('style', parts.join(';'))

    const origKids = Array.from(original.children)
    const cloneKids = Array.from(cloned.children)
    for (let i = 0; i < origKids.length && i < cloneKids.length; i++)
      inlineStyles(origKids[i], cloneKids[i])
  }

  inlineStyles(chartEl, clone)

  const w = Math.round(rect.width)
  const h = Math.round(rect.height)

  clone.setAttribute('width', String(w))
  clone.setAttribute('height', String(h))
  if (!clone.getAttribute('viewBox'))
    clone.setAttribute('viewBox', `0 0 ${w} ${h}`)

  const svg = new XMLSerializer().serializeToString(clone)

  return { svg, width: w, height: h }
}

async function addSvgChartToPdf(doc: jsPDF, y: number): Promise<number> {
  const data = getChartSvgData()
  if (!data)
    return y

  try {
    const dataUrl = await svgToPngDataUrl(data.svg, data.width, data.height)
    if (!dataUrl)
      return y

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = { left: 14, right: 0 }
    const availableWidth = pageWidth - margin.left - margin.right
    const aspectRatio = data.height / data.width
    const imgHeight = availableWidth * aspectRatio

    if (y + imgHeight > pageHeight - 10) {
      doc.addPage()
      y = 15
    }

    doc.addImage(dataUrl, 'PNG', margin.left, y, availableWidth, imgHeight)
    return y + imgHeight + 5
  } catch {
    return y
  }
}

// ── printChartSVG ────────────────────────────────────────────────────────────

export async function printChartSVG(options: {
  machineId: number
  machineName: string
  jobOrder: string
  programNos: number[]
  startTime: string
  endTime: string | null
}) {
  const { t } = useNuxtApp().$i18n
  const doc = createPdf('landscape')

  const formattedStartTime = format(new Date(options.startTime), 'dd/MM/yyyy HH:mm:ss')
  const formattedEndTime = options.endTime ? format(new Date(options.endTime), 'dd/MM/yyyy HH:mm:ss') : '-'
  const programNosStr = options.programNos.join(', ')

  // Header info – three side-by-side tables
  const headerY = 12

  autoTable(doc, {
    startY: headerY,
    margin: { left: 14 },
    tableWidth: 85,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 8, halign: 'center', cellPadding: 1.8 },
    styles: { fontSize: 8, cellPadding: 1.5, font: 'Roboto' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
    head: [[{ content: t('batchSummary.machineInfo'), colSpan: 2 }]],
    body: [
      [t('batchSummary.machineNo'), String(options.machineId)],
      [t('batchSummary.machineName'), options.machineName],
    ],
  })

  autoTable(doc, {
    startY: headerY,
    margin: { left: 104 },
    tableWidth: 135,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 8, halign: 'center', cellPadding: 1.8 },
    styles: { fontSize: 8, cellPadding: 1.5, font: 'Roboto' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
    head: [[{ content: t('batchSummary.batchInfo'), colSpan: 2 }]],
    body: [
      [t('batchSummary.jobOrder'), options.jobOrder],
      [t('batchSummary.programNo'), programNosStr],
      [t('batchSummary.startTime'), formattedStartTime],
      [t('batchSummary.endTime'), formattedEndTime],
    ],
  })

  const headerFinalY = (doc as any).lastAutoTable.finalY + 3

  // Chart SVG as image
  await addSvgChartToPdf(doc, headerFinalY)

  addFooter(doc)

  doc.setProperties({ title: `${t('chart')}_${options.jobOrder}.pdf` })
  printPDF(doc)
}

// ── printJoborderRecipe ──────────────────────────────────────────────────────

export async function printJoborderRecipe(
  batchKey: number,
  jobOrderInfo: BatchInfo,
  programs: BasicProgram[],
) {
  const { t } = useNuxtApp().$i18n
  const recipe = await $fetch<RecipeStep[]>(`/api/batch/${batchKey}/recipe`)

  const doc = createPdf('portrait')

  let y = 15

  // Title(ortalı)
  doc.setFontSize(13)
  doc.setFont('Roboto', 'bold')
  doc.text(t('recipe'), doc.internal.pageSize.getWidth() / 2, y, { align: 'center' })
  y += 7

  // Machine info table (left)
  autoTable(doc, {
    startY: y,
    margin: { left: 14 },
    tableWidth: 88,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 8, halign: 'center', cellPadding: 1.8 },
    styles: { fontSize: 8, cellPadding: 1.5, font: 'Roboto' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
    head: [[{ content: t('machine'), colSpan: 2 }]],
    body: [
      [t('machineNo'), String(jobOrderInfo.machineId)],
      [t('machineName'), jobOrderInfo.machineName],
    ],
  })
  const afterMachineRecipe = (doc as any).lastAutoTable.finalY

  // Job order info table (right)
  autoTable(doc, {
    startY: y,
    margin: { left: 107 },
    tableWidth: 90,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 8, halign: 'center', cellPadding: 1.8 },
    styles: { fontSize: 8, cellPadding: 1.5, font: 'Roboto' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
    head: [[{ content: t('jobOrder'), colSpan: 2 }]],
    body: [
      [t('jobOrderNo'), jobOrderInfo.jobOrder],
      [t('startTime'), format(jobOrderInfo.startTime, 'HH:mm:ss dd/MM/yyyy')],
      [t('endTime'), jobOrderInfo.endTime ? format(jobOrderInfo.endTime, 'HH:mm:ss dd/MM/yyyy') : '-'],
    ],
  })
  const afterJobOrderRecipe = (doc as any).lastAutoTable.finalY

  y = Math.max(afterMachineRecipe, afterJobOrderRecipe) + 8

  // Group recipes by programNo
  const recipesByProgram = new Map<number, RecipeStep[]>()
  for (const rc of recipe) {
    const progNo = Number(rc.programNo)
    if (!recipesByProgram.has(progNo))
      recipesByProgram.set(progNo, [])
    recipesByProgram.get(progNo)!.push(rc)
  }

  // For each program: header + recipe table
  for (const program of programs) {
    const pageHeight = doc.internal.pageSize.getHeight()
    if (y > pageHeight - 40) {
      doc.addPage()
      y = 15
    }

    // Program header
    doc.setFontSize(9)
    doc.setFont('Roboto', 'bold')
    doc.text(`${t('programNo')}: ${program.programNo}  |  ${t('programName')}: ${program.programName || '-'}  |  ${t('processType')}: ${program.processType || '-'}`, 14, y)
    doc.setFont('Roboto', 'normal')
    y += 2

    const programRecipes = recipesByProgram.get(program.programNo) || []

    if (programRecipes.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: 14 },
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2, font: 'Roboto' },
        head: [[t('ISN'), t('materialCode'), t('materialName'), t('actualAmount'), t('recipeAmount')]],
        body: programRecipes.map(rc => [
          rc.ISN,
          rc.chemCode,
          rc.materialName,
          Number(rc.amount / 1000).toFixed(2),
          rc.recipeAmount ? Number(rc.recipeAmount).toFixed(2) : '-',
        ]),
      })
      y = (doc as any).lastAutoTable.finalY + 8
    } else {
      doc.setFontSize(8)
      doc.text('-', 14, y + 4)
      y += 10
    }
  }

  addFooter(doc)

  doc.setProperties({ title: `${t('recipe')}_${jobOrderInfo.jobOrder}.pdf` })
  printPDF(doc)
}

// ── printJobOrderSummary ─────────────────────────────────────────────────────

export async function printJobOrderSummary(
  batchKey: number,
  jobOrderInfo: BatchInfo,
  programs: BasicProgram[],
) {
  const { t } = useNuxtApp().$i18n

  const consumptions = await $fetch<Consumptions>(`/api/batch/${batchKey}/consumptions`)
  const consumptionUnits = await $fetch<ConsumptionUnits>(`/api/batch/${batchKey}/consumption-units`)
  const erpParameters = await $fetch<ERPParameter[]>(`/api/batch/${batchKey}/erp-parameters-value`)
  const waterTypes = await $fetch<Record<string, string | null>>(`/api/water-types`)

  const doc = createPdf('portrait')

  let y = 15

  // Title (centered)
  doc.setFontSize(13)
  doc.setFont('Roboto', 'bold')
  doc.text(t('jobOrderSummary._'), doc.internal.pageSize.getWidth() / 2, y, { align: 'center' })
  y += 7

  // Machine info table (left)
  autoTable(doc, {
    startY: y,
    margin: { left: 14 },
    tableWidth: 88,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 8, halign: 'center', cellPadding: 1.8 },
    styles: { fontSize: 8, cellPadding: 1.5, font: 'Roboto' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    head: [[{ content: t('machine'), colSpan: 2 }]],
    body: [
      [t('machineNo'), String(jobOrderInfo.machineId)],
      [t('machineName'), jobOrderInfo.machineName],
    ],
  })
  const afterMachine = (doc as any).lastAutoTable.finalY

  // Job order info table (right)
  autoTable(doc, {
    startY: y,
    margin: { left: 107 },
    tableWidth: 90,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 8, halign: 'center', cellPadding: 1.8 },
    styles: { fontSize: 8, cellPadding: 1.5, font: 'Roboto' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42 } },
    head: [[{ content: t('jobOrder'), colSpan: 2 }]],
    body: [
      [t('partyNumber'), jobOrderInfo.partyNumber ?? '-'],
      [t('jobOrderNo'), jobOrderInfo.jobOrder],
      [t('processGroup'), 'DYEING'],
      [t('startTime'), format(jobOrderInfo.startTime, 'HH:mm:ss dd/MM/yyyy')],
      [t('endTime'), jobOrderInfo.endTime ? format(jobOrderInfo.endTime, 'HH:mm:ss dd/MM/yyyy') : '-'],
      [t('theoreticalDuration'), formatDuration(jobOrderInfo.theoreticalDuration)],
      [t('actualDuration'), formatDuration(jobOrderInfo.actualDuration!)],
      [t('deviation'), formatDuration(jobOrderInfo.deviation!)],
    ],
  })
  const afterJobOrder = (doc as any).lastAutoTable.finalY

  y = Math.max(afterMachine, afterJobOrder) + 8

  // Programs
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2, font: 'Roboto' },
    head: [[t('programNo'), t('programName')]],
    body: programs.map(prg => [prg.programNo, prg.programName || '']),
  })
  y = (doc as any).lastAutoTable.finalY + 8

  // Consumptions
  const consumptionData = getConsumptionRows(t, consumptions, consumptionUnits, waterTypes)

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    margin: { left: 14 },
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2, font: 'Roboto' },
    head: [[t('consumptions'), t('amount'), t('unit')]],
    body: consumptionData.map(row => [row.name, row.amount, row.unit]),
  })

  y = (doc as any).lastAutoTable.finalY + 8

  // Starting Parameters
  autoTable(doc, {
    startY: y,
    margin: { left: 14 },
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2, font: 'Roboto' },
    head: [[t('parameter'), t('amount'), t('unit')]],
    body: erpParameters.map(param => [
      param.parameterName,
      Number(param.value).toFixed(2),
      param.unit ?? '',
    ]),
  })

  addFooter(doc)

  doc.setProperties({ title: `${t('jobOrderSummary.fileName')}_${jobOrderInfo.jobOrder}.pdf` })
  printPDF(doc)
}

// ── printBatchSummary ────────────────────────────────────────────────────────

export async function printBatchSummary(
  batchKey: number,
  machineInfo: Machine,
  jobOrderInfo: BatchInfo,
  batchParameters: BatchParameters[],
) {
  const { t, d } = useNuxtApp().$i18n

  // Prepare data
  const machineData: [string, string][] = [
    [t('batchSummary.machineNo'), String(machineInfo.id)],
    [t('batchSummary.machineName'), machineInfo.name],
    [t('batchSummary.model'), machineInfo.model],
    [t('batchSummary.theoreticalCharge'), String(machineInfo.theoreticalCharge)],
    [t('batchSummary.capacity'), String(machineInfo.capacity)],
    [t('batchSummary.operator'), jobOrderInfo.operatorName],
  ]

  const jobOrderData: Record<string, string> = {
    jobOrder: jobOrderInfo.jobOrder,
    startTime: format(jobOrderInfo.startTime, 'HH:mm:ss dd/MM/yyyy'),
    endTime: jobOrderInfo.isCancelled ? '-' : jobOrderInfo.endTime ? format(jobOrderInfo.endTime, 'HH:mm:ss dd/MM/yyyy') : '-',
    cancelTime: jobOrderInfo.isCancelled && jobOrderInfo.endTime ? format(jobOrderInfo.endTime, 'HH:mm:ss dd/MM/yyyy') : '-',
    theoreticalEndTime: format(
      new Date(new Date(jobOrderInfo.startTime).getTime() + jobOrderInfo.theoreticalDuration * 1000),
      'HH:mm:ss dd/MM/yyyy',
    ),
    actualDuration: jobOrderInfo.actualDuration ? formatDuration(jobOrderInfo.actualDuration) : '-',
    actualTheoreticalDuration: jobOrderInfo.actualTheoreticalDuration ? formatDuration(jobOrderInfo.actualTheoreticalDuration) : '-',
    theoreticalDuration: jobOrderInfo.theoreticalDuration ? formatDuration(jobOrderInfo.theoreticalDuration) : '-',
    deviation: jobOrderInfo.deviation ? formatDuration(jobOrderInfo.deviation) : '-',
  }

  const jobOrderTableData: [string, string][] = Object.entries(jobOrderData).map(
    ([key, value]) => [t(`batchSummary.${key}`), value],
  )
  // Add status row
  const statusText = jobOrderData.theoreticalDuration > jobOrderData.actualDuration
    ? t('batchSummary.fast')
    : t('batchSummary.slow')
  jobOrderTableData.push([t('batchSummary.status'), statusText])

  const startParamData: [string, string][] = batchParameters.map(param => [
    param.name,
    param.paramValues[0].value.toFixed(2),
  ])

  // Fetch server data
  const consumptions = await $fetch<Consumptions>(`/api/batch/${batchKey}/consumptions`)
  const consumptionUnits = await $fetch<ConsumptionUnits>(`/api/batch/${batchKey}/consumption-units`)
  const { programInfo, totalManualDelay } = await $fetch<{ programInfo: any[], totalManualDelay: number }>(`/api/batch/${batchKey}/batch-summary`)
  const waterTypes = await $fetch<Record<string, string | null>>(`/api/water-types`)

  // Pie chart calculations
  const actualDuration = jobOrderInfo.actualDuration || 0
  let totalAlarmDelay = 0
  let totalOperatorDelay = 0
  programInfo.forEach((prg: any) => {
    totalAlarmDelay += prg.alarmDelay
    totalOperatorDelay += prg.operatorDelay
  })
  const totalActiveWork = actualDuration - totalAlarmDelay - totalManualDelay - totalOperatorDelay

  const doc = createPdf('portrait')
  let y = 12

  // Title(ortalı)
  doc.setFontSize(13)
  doc.setFont('Roboto', 'bold')
  doc.text(t('batchSummary._'), doc.internal.pageSize.getWidth() / 2, y, { align: 'center' })
  y += 7

  // Three tables side by side
  const colWidth = 55

  autoTable(doc, {
    startY: y,
    margin: { left: 14 },
    tableWidth: colWidth,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 8, halign: 'center', cellPadding: 1.8 },
    styles: { fontSize: 7, cellPadding: 1.2, font: 'Roboto' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 25 } },
    head: [[{ content: t('batchSummary.machineInfo'), colSpan: 2 }]],
    body: machineData,
  })
  const afterMachine = (doc as any).lastAutoTable.finalY

  autoTable(doc, {
    startY: y,
    margin: { left: 74 },
    tableWidth: colWidth + 15,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 8, halign: 'center', cellPadding: 1.8 },
    styles: { fontSize: 7, cellPadding: 1.2, font: 'Roboto' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
    head: [[{ content: t('batchSummary.jobOrder'), colSpan: 2 }]],
    body: jobOrderTableData,
  })
  const afterJobOrder = (doc as any).lastAutoTable.finalY

  autoTable(doc, {
    startY: y,
    margin: { left: 150 },
    tableWidth: colWidth - 10,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 8, halign: 'center', cellPadding: 1.8 },
    styles: { fontSize: 7, cellPadding: 1.2, font: 'Roboto' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 25 } },
    head: [[{ content: t('batchSummary.batchStartParameters'), colSpan: 2 }]],
    body: startParamData,
  })
  const afterParams = (doc as any).lastAutoTable.finalY

  y = Math.max(afterMachine, afterJobOrder, afterParams) + 3

  y += 3

  // ── Pie chart ──
  const pieLabels = [
    { label: t('batchSummary.activeDuration'), value: totalActiveWork, color: [0, 0, 255] },
    { label: t('batchSummary.manuelDuration'), value: totalManualDelay, color: [255, 0, 0] },
    { label: t('batchSummary.alarmDelay'), value: totalAlarmDelay, color: [128, 0, 128] },
    { label: t('batchSummary.operatorDelay'), value: totalOperatorDelay, color: [200, 200, 0] },
  ]

  const pieRadius = 25
  const pieCx = 45
  const pieCy = y + pieRadius + 2

  const pieTotal = pieLabels.reduce((sum, d) => sum + Math.max(0, d.value), 0)
  if (pieTotal > 0) {
    let startAngle = -Math.PI / 2
    for (const item of pieLabels) {
      const value = Math.max(0, item.value)
      if (value === 0)
        continue
      const sliceAngle = (value / pieTotal) * 2 * Math.PI
      drawPieSlice(doc, pieCx, pieCy, pieRadius, startAngle, startAngle + sliceAngle, item.color)
      startAngle += sliceAngle
    }
  }

  doc.setFontSize(8)
  const legendX = 80
  let legendY = y + 8
  for (const item of pieLabels) {
    doc.setFillColor(item.color[0], item.color[1], item.color[2])
    doc.rect(legendX, legendY - 3, 3, 3, 'F')
    doc.setTextColor(0, 0, 0)
    const pct = actualDuration > 0 ? ((item.value / actualDuration) * 100).toFixed(1) : '0.0'
    doc.text(`${item.label}: ${formatDuration(item.value)} (%${pct})`, legendX + 5, legendY)
    legendY += 6
  }

  y = pieCy + pieRadius + 5

  // ── Chart ──
  y = await addSvgChartToPdf(doc, y) + 5

  y += 5

  // ── Consumptions ──
  const consumptionData = getConsumptionRows(t, consumptions, consumptionUnits, waterTypes)
  if (consumptionData.length) {
    // Check if we need a new page
    if (y > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage()
      y = 15
    }

    autoTable(doc, {
      startY: y,
      margin: { left: 14 },
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], fontSize: 8, cellPadding: 1.8 },
      styles: { fontSize: 7, cellPadding: 1.2, font: 'Roboto' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
      head: [[t('consumptions'), t('amount'), t('unit')]],
      body: consumptionData.map(row => [row.name, row.amount, row.unit]),
    })
    y = (doc as any).lastAutoTable.finalY + 5
  }

  // ── Program Info Table ──
  if (programInfo.length) {
    // Check if we need a new page
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage()
      y = 15
    }

    const programRows = programInfo.map((program: any) => {
      const interventionsStr = program.interventions
        ?.map((int: any) => `${int.explanation} (${int.eventCount})`)
        ?.join(', ') ?? ''

      return [
        program.programNo,
        program.programName ?? '',
        program.startTime ? d(program.startTime, 'datetime') : '',
        program.endTime ? d(program.endTime, 'datetime') : '',
        formatDuration(program.theoreticalDuration),
        formatDuration(program.actualDuration),
        program.theoreticalDuration > program.actualDuration ? t('batchSummary.fast') : t('batchSummary.slow'),
        formatDuration(program.deviation),
        formatDuration(program.manualDelay),
        formatDuration(program.operatorDelay),
        formatDuration(program.alarmDelay),
        interventionsStr,
      ]
    })

    autoTable(doc, {
      startY: y,
      margin: { left: 14 },
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], fontSize: 6 },
      styles: { fontSize: 6, cellPadding: 1.2, font: 'Roboto' },
      head: [[
        t('batchSummary.programNo'),
        t('batchSummary.programName'),
        t('batchSummary.startTime'),
        t('batchSummary.endTime'),
        t('batchSummary.theoreticalDuration'),
        t('batchSummary.actualDuration'),
        t('batchSummary.status'),
        t('batchSummary.deviation'),
        t('batchSummary.manualDelay'),
        t('batchSummary.operatorDelay'),
        t('batchSummary.alarmDelay'),
        t('batchSummary.interventions'),
      ]],
      body: programRows,
      columnStyles: {
        6: { textColor: [255, 0, 0] }, // status column red
      },
    })
  }

  addFooter(doc)

  doc.setProperties({ title: `${t('batchSummary.fileName')}_${jobOrderInfo.jobOrder}.pdf` })
  printPDF(doc)
}

// ── printJobOrderInterventionReport ──────────────────────────────────────────

export function printJobOrderInterventionReport(options: {
  jobOrderNo: string
  startTime: Date | null
  endTime: Date | null
  cancelTime: Date | null
  interventions: BatchIntervention[]
}) {
  const { t } = useNuxtApp().$i18n
  const doc = createPdf('portrait')

  const pageWidth = doc.internal.pageSize.getWidth()

  const jobOrderNo = options.jobOrderNo ?? '-'
  const startTime = options.startTime ? format(options.startTime, 'dd/MM/yyyy HH:mm:ss') : '-'
  const endTime = options.endTime ? format(options.endTime, 'dd/MM/yyyy HH:mm:ss') : '-'
  const cancelTime = options.cancelTime ? format(options.cancelTime, 'dd/MM/yyyy HH:mm:ss') : '-'

  // Header
  doc.setFontSize(14)
  doc.setFont('Roboto', 'bold')
  doc.text(t('interventionReport.title'), pageWidth / 2, 15, { align: 'center' })

  // Info Table
  autoTable(doc, {
    startY: 22,
    margin: { left: 15, right: 15 },
    tableWidth: 90,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 8, halign: 'center', cellPadding: 1.8 },
    styles: { fontSize: 8, cellPadding: 1.5, font: 'Roboto' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    head: [[{ content: t('interventionReport.jobOrderInfo'), colSpan: 2 }]],
    body: [
      [t('interventionReport.jobOrderNo'), jobOrderNo],
      [t('interventionReport.startTime'), startTime],
      [t('interventionReport.endTime'), endTime],
      [t('interventionReport.cancelTime'), cancelTime],
    ],
  })

  const y = (doc as any).lastAutoTable.finalY + 5

  // Main Table
  const tableRows = (options.interventions ?? []).map((int) => {
    const timeFormatted = format(new Date(int.time), 'dd/MM/yyyy HH:mm:ss')
    const explanation = Array.isArray(int.explanation)
      ? int.explanation.join(' | ')
      : int.explanation ?? '-'
    const operator = int.operator ?? '-'

    return [timeFormatted, operator, explanation]
  })

  autoTable(doc, {
    startY: y,
    head: [[t('interventionReport.interventionTime'), t('operator'), t('description')]],
    body: tableRows,
    styles: { fontSize: 7, font: 'Roboto' },
    headStyles: { fontSize: 9, font: 'Roboto', fillColor: [41, 128, 185] },
    columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 30 } },
    margin: { left: 15, right: 15 },
    theme: 'grid',
  })

  addFooter(doc)

  doc.setProperties({ title: `${t('interventionReport.fileName')}_${jobOrderNo}.pdf` })
  printPDF(doc)
}

function addFooter(doc: jsPDF) {
  const { t } = useNuxtApp().$i18n

  const pageCount = doc.getNumberOfPages()
  const printDate = formatDatetime()

  doc.setFontSize(9)

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    // Alt çizgi
    doc.setDrawColor(0)
    doc.line(14, doc.internal.pageSize.getHeight() - 15, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 15)

    // Sayfa numarası ve basım tarihi
    doc.setFont('Roboto', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`${t('printedOn')}: ${printDate}`, 14, doc.internal.pageSize.getHeight() - 10)
    doc.text(`${t('page')} ${i} / ${pageCount}`, doc.internal.pageSize.getWidth() - 50, doc.internal.pageSize.getHeight() - 10)
  }
}
