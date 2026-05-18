<script setup lang="ts">
import { jsPDF } from 'jspdf'
import jsbarcode from 'jsbarcode'
import autoTable from 'jspdf-autotable'
import { RecipeType } from '~/shared/constants'
import { useStateStore } from '~/store/State'
import type { JobOrderParams, Machine, RecipeMasterStep, RecipeProgramMaster } from '~/shared/types'

type ImageAsset = {
  dataUrl: string
  format: 'PNG' | 'JPEG'
}

type JobInfoCell = { entry: { label: string, value: string }, valueLines: string[], height: number }
type JobInfoRow = { cells: JobInfoCell[], rowHeight: number }

const props = defineProps({
  batchNo: {
    type: String,
    required: false,
  },
  steps: {
    type: Object as PropType<RecipeMasterStep[]>,
    required: false,
  },
  recipeParams: {
    type: Object as PropType<RecipeProgramMaster>,
    required: false,
  },
  params: {
    type: Object as PropType<JobOrderParams>,
    required: false,
  },
  machines: {
    type: Object as PropType<Machine[]>,
    required: false,
  },
})
const pdfTheme = {
  text: [31, 41, 55] as const,
  muted: [107, 114, 128] as const,
  accent: [16, 185, 129] as const,
  panelBackground: [248, 250, 252] as const,
  divider: [229, 231, 235] as const,
  highlight: [236, 253, 245] as const,
  warningBackground: [254, 243, 199] as const,
}
type PdfTheme = typeof pdfTheme

const { t, d } = useI18n()
const { userProfile } = useKeycloak()
const route = useRoute()
const stateStore = useStateStore()
const companyInfo = ref<Record<string, any> | null>(null)
const currentTime = ref(new Date().toLocaleString())
const currentUser = computed(() => {
  if (userProfile.value) {
    if (userProfile.value.lastName) {
      return `${userProfile.value.firstName} ${userProfile.value.lastName}`
    } else {
      return userProfile.value.firstName || t('DefaultUser')
    }
  } else {
    return t('DefaultUser')
  }
})

const fetchedSteps = ref<RecipeMasterStep[]>([])
const fetchedRecipeParams = ref<RecipeProgramMaster | null>(null)
const fetchedParams = ref<JobOrderParams | null>(null)
const fetchedMachines = ref<Machine[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const actualSteps = computed(() => props.steps || fetchedSteps.value)
const actualRecipeParams = computed(() => props.recipeParams || fetchedRecipeParams.value)
const actualParams = computed(() => props.params || fetchedParams.value)
const actualMachines = computed(() => props.machines || fetchedMachines.value)

const jobIdentifierList = computed(() => {
  if (!actualParams.value)
    return [] as string[]

  const numberOfJobs = actualParams.value.numberOfJobs || 1
  const rawJobNo = actualParams.value.jobNo ? String(actualParams.value.jobNo) : ''

  if (!rawJobNo)
    return numberOfJobs > 1 ? Array.from({ length: numberOfJobs }, (_, idx) => `JOB_${idx + 1}`) : []

  if (numberOfJobs <= 1)
    return [rawJobNo]

  const prefixMatch = rawJobNo.match(/(.+)_\d+$/)
  const prefix = prefixMatch ? prefixMatch[1] : rawJobNo
  return Array.from({ length: numberOfJobs }, (_, idx) => `${prefix}_${idx + 1}`)
})

const jobNumbers = computed(() => {
  const identifiers = jobIdentifierList.value
  if (!identifiers.length)
    return ''
  if (identifiers.length === 1)
    return identifiers[0]
  return `${identifiers[0]} - ${identifiers[identifiers.length - 1]}`
})

const hasManyJobs = computed(() => {
  if (!actualParams.value)
    return false
  return (actualParams.value.numberOfJobs || 1) > 3
})

const barcodeValue = computed(() => {
  const identifiers = jobIdentifierList.value
  if (!identifiers.length)
    return ''
  if (identifiers.length === 1)
    return identifiers[0]
  return `${identifiers[0]} - ${identifiers[identifiers.length - 1]}`
})

const barcodeUrl = computed(() => {
  if (!barcodeValue.value)
    return ''
  return `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(barcodeValue.value)}&code=Code128&translate-esc=false`
})

const batchNoToUse = computed(() => props.batchNo || (route.query.batchNo as string | undefined))
const jobOrderShowPrefs = computed(() => {
  const show = stateStore.jobOrderPrefs?.show || {}
  return {
    orderNo: show.orderNo,
    PartyNo: show.PartyNo,
    yarn: show.yarn,
    ASNo: show.ASNo,
  }
})

const pdfObjectUrl = ref<string | null>(null)
const pdfError = ref<string | null>(null)
const isGeneratingPdf = ref(false)
const pdfReady = computed(() => Boolean(pdfObjectUrl.value))
const pdfFileName = computed(() => {
  if (!actualParams.value)
    return 'job-order.pdf'
  return `job-order-${actualParams.value.jobNo}.pdf`
})
const isClient = import.meta.client
let currentPdfDoc: jsPDF | null = null
let pdfGenerationCounter = 0

onMounted(async () => {
  if (batchNoToUse.value && !props.steps && !props.recipeParams && !props.params && !props.machines) {
    await fetchJobOrderData()
  }
})

onBeforeUnmount(() => {
  resetPdfPreview()
})

watch(
  () => ({
    steps: actualSteps.value,
    recipe: actualRecipeParams.value,
    params: actualParams.value,
    machines: actualMachines.value,
    company: companyInfo.value,
    prefs: jobOrderShowPrefs.value,
  }),
  async ({ recipe, params }) => {
    if (!isClient)
      return

    if (!recipe || !params) {
      resetPdfPreview()
      return
    }

    await generatePdfDocument()
  },
  { immediate: true },
)

async function fetchJobOrderData() {
  if (!batchNoToUse.value)
    return

  isLoading.value = true
  error.value = null

  try {
    const data = await $fetch(`/api/job-orders/${batchNoToUse.value}`)
    fetchedSteps.value = data.steps
    fetchedRecipeParams.value = data.recipeParams
    fetchedParams.value = data.params
    fetchedMachines.value = data.machines
    if (data.requestTime) {
      currentTime.value = d(new Date(data.requestTime), 'datetime') as unknown as string
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch job order data'
    console.error('Failed to fetch job order:', err)
  } finally {
    isLoading.value = false
  }
}

fetchCompanyInfo()

async function registerPdfFonts(doc: jsPDF) {

  const robotoRegular = await import('@teleskop/nuxt-base/assets/fonts/Roboto-Regular.ttf?base64')
  const robotoBold = await import('@teleskop/nuxt-base/assets/fonts/Roboto-Bold.ttf?base64')

  doc.addFileToVFS('Roboto-Regular.ttf', robotoRegular.default)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.addFileToVFS('Roboto-Bold.ttf', robotoBold.default)
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')

  doc.setFont('Roboto', 'normal')
}

function collectMaterialsFromProgram(program: RecipeMasterStep) {
  const regularMaterials = (program.steps || []).flatMap(step =>
    step.materials.map(material => ({
      ...material,
      calculated: calculateAmount(material, program),
      isIntermediateStep: false,
    })),
  )

  const manualMaterials = (program.manualSteps || []).flatMap(manualStep =>
    manualStep.materials.map(material => ({
      ...material,
      calculated: calculateAmount(material, program),
      isIntermediateStep: true,
      nextStep: manualStep.nextStep,
      displayOrderNo: manualStep.nextStep,
    })),
  )

  const allMaterials = [...regularMaterials, ...manualMaterials]
  return allMaterials.sort((a, b) => {
    const aOrder = a.isIntermediateStep ? a.displayOrderNo - 0.5 : a.orderNo
    const bOrder = b.isIntermediateStep ? b.displayOrderNo - 0.5 : b.orderNo
    return aOrder - bOrder
  })
}

function calculateAmount(row: any, program: any) {
  if (!actualParams.value)
    return '0'

  if (row.type === RecipeType.DYE) {
    if (row.unit === 0)
      return `${row.amount * program.totalWeight * 10} g`
    else if (row.unit === 1)
      return `${row.amount * program.flotte} g`
    else if (row.unit === 2)
      return `${row.amount * program.flotte} cc`
    else
      return `${row.amount} ${t(`units.${row.unit}`)}`
  } else {
    if (row.unit === 0)
      return `${row.amount * actualParams.value.totalWeight * 10} g`
    else if (row.unit === 1)
      return `${row.amount * actualParams.value.flotte} g`
    else if (row.unit === 2)
      return `${row.amount * actualParams.value.flotte} cc`
    else
      return `${row.amount} ${t(`units.${row.unit}`)}`
  }
}

async function fetchCompanyInfo() {
  try {
    companyInfo.value = await $fetch('/api/company/info')
  } catch (fetchError) {
    console.error('Failed to fetch company logo:', fetchError)
  }
}

function resetPdfPreview() {
  if (!isClient)
    return
  if (pdfObjectUrl.value)
    URL.revokeObjectURL(pdfObjectUrl.value)
  pdfObjectUrl.value = null
  currentPdfDoc = null
}

async function generatePdfDocument(): Promise<jsPDF | null> {
  if (!actualRecipeParams.value || !actualParams.value)
    return null

  const requestId = ++pdfGenerationCounter
  isGeneratingPdf.value = true
  pdfError.value = null

  try {
    const doc = await constructJobOrderPdf()

    if (requestId !== pdfGenerationCounter)
      return doc

    currentPdfDoc = doc
    if (isClient) {
      const blob = doc.output('blob')
      if (pdfObjectUrl.value)
        URL.revokeObjectURL(pdfObjectUrl.value)
      pdfObjectUrl.value = URL.createObjectURL(blob)
    }

    return doc
  } catch (err: any) {
    if (requestId === pdfGenerationCounter)
      pdfError.value = err?.message || 'Failed to generate PDF'
    console.error('Failed to generate job order PDF:', err)
    return null
  } finally {
    if (requestId === pdfGenerationCounter)
      isGeneratingPdf.value = false
  }
}

async function constructJobOrderPdf() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  await registerPdfFonts(doc)

  const marginLeft = 18
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - marginLeft * 2
  let cursorY = 16
  const company = companyInfo.value
  const theme = pdfTheme

  doc.setTextColor(...theme.text)

  const logoAsset = company?.logoPath ? await loadImageAsset(company.logoPath) : null
  const barcodePayload = getBarcodePayload()
  const barcodeAsset = barcodePayload ? (await generateBarcodeAsset(barcodePayload)) : null

  const headerTop = cursorY
  let headerBottom = headerTop

  if (logoAsset)
    doc.addImage(logoAsset.dataUrl, logoAsset.format, marginLeft, headerTop - 3, 24, 24)

  if (barcodeAsset) {
    const barcodeWidth = 70
    headerBottom = Math.max(
      headerBottom,
      drawBarcodePanel(
        doc,
        barcodeAsset,
        getBarcodeLabel(),
        marginLeft + contentWidth - barcodeWidth,
        headerTop,
        barcodeWidth,
        theme,
      ),
    )
  }

  const headerX = marginLeft + (logoAsset ? 28 : 0)
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(15)
  doc.text(company?.name || t('BatchRecipeSystem'), headerX, headerTop, { baseline: 'top' })
  doc.setFont('Roboto', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...theme.muted)
  doc.text(`${t('jobOrderParams.PreparedBy')}: ${currentUser.value}`, headerX, headerTop + 6, { baseline: 'top' })
  doc.text(`${t('jobOrderParams.PreparationDate')}: ${currentTime.value}`, headerX, headerTop + 9, { baseline: 'top' })
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...theme.text)
  doc.text(`${t('jobOrderParams.IDs')}: ${jobNumbers.value || '-'}`, headerX, headerTop + 13, { baseline: 'top' })
  headerBottom = Math.max(headerBottom, headerTop + 16)
  cursorY = headerBottom + 4

  cursorY = drawSectionDivider(doc, marginLeft, contentWidth, cursorY, theme)

  cursorY = drawJobInfoPanel(doc, getJobInfoEntries(), marginLeft, cursorY, contentWidth, theme)

  if (actualParams.value?.notes)
    cursorY = drawNotesPanel(doc, actualParams.value.notes, marginLeft, cursorY, contentWidth, theme)

  cursorY = drawSectionDivider(doc, marginLeft, contentWidth, cursorY, theme)

  for (const program of actualSteps.value || []) {
    if (cursorY > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage()
      cursorY = 20
      doc.setTextColor(...theme.text)
    }

    doc.setFillColor(...theme.highlight)
    doc.setDrawColor(...theme.highlight)
    doc.roundedRect(marginLeft, cursorY, contentWidth, 10, 2, 2, 'FD')
    doc.setFont('Roboto', 'bold')
    doc.setFont('Roboto', 'bold')
    doc.setFontSize(11.5)
    doc.setTextColor(...theme.text)
    doc.text(`${program.programNo ?? '-'} — ${program.programName ?? '-'}`, marginLeft + 4, cursorY + 4.5, { baseline: 'top' })
    cursorY += 14

    doc.setFont('Roboto', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...theme.muted)
    const metaLine = [
      `${t('jobOrderParams.FlotteRatio')}: ${program.flotteRatio ?? '-'}`,
      `${t('jobOrderParams.DyeWeight')}: ${program.totalWeight ?? '-'}`,
      `${t('jobOrderParams.Flotte')}: ${program.flotte ?? '-'}`,
    ].join('   •   ')
    const metaLines = doc.splitTextToSize(metaLine, contentWidth)
    doc.text(metaLines, marginLeft, cursorY, { baseline: 'top' })
    cursorY += metaLines.length * 4.2 + 2

    const materials = collectMaterialsFromProgram(program)
    if (!materials.length) {
      cursorY += 8
      cursorY = drawSectionDivider(doc, marginLeft, contentWidth, cursorY, theme)
      continue
    }

    const calculationsColumnWidth = Math.max(32, contentWidth - (16 + 16 + 28 + 56 + 24 + 18))

    autoTable(doc, {
      head: [[
        t('recipeFields.OrderNo'),
        t('recipeFields.AutoMan'),
        t('materialFields.Code'),
        t('materialFields.Name'),
        t('jobOrderParams.RecipeAmount'),
        t('Unit'),
        t('jobOrderParams.Calculated'),
      ]],
      body: materials.map(material => [
        getOrderLabel(material),
        getAutoManualLabel(material),
        material.materialCode || '',
        material.materialName || '',
        formatAmount(material.amount),
        getUnitLabel(material.unit),
        material.calculated,
      ]),
      startY: cursorY,
      tableWidth: contentWidth,
      margin: { left: marginLeft, right: marginLeft },
      styles: {
        font: 'Roboto',
        fontSize: 8.5,
        cellPadding: 2.2,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.1,
        textColor: [...theme.text],
      },
      headStyles: {
        fontStyle: 'bold',
        fillColor: [234, 236, 240],
        textColor: [45, 55, 72],
      },
      alternateRowStyles: {
        fillColor: [252, 252, 253],
      },
      columnStyles: {
        3: { halign: 'left' },
        6: { halign: 'left' },
      },
      tableLineColor: [...theme.divider],
      tableLineWidth: 0.1,
      didParseCell: (data: any) => {
        if (data.section !== 'body')
          return
        const material = materials[data.row.index]
        if (material?.isIntermediateStep)
          data.cell.styles.fillColor = [...theme.warningBackground]
        if (material?.type === RecipeType.DYE)
          data.cell.styles.fontStyle = 'bold'
      },
    })

    cursorY = ((doc as any).lastAutoTable?.finalY || cursorY) + 8
    cursorY = drawSectionDivider(doc, marginLeft, contentWidth, cursorY, theme)
  }

  return doc
}

function getJobInfoEntries() {
  if (!actualRecipeParams.value || !actualParams.value)
    return []

  const entries: Array<{ label: string, value: string }> = []

  entries.push({
    label: `${t('jobOrderParams.ID')} / ${t('jobOrderParams.IDs')}`,
    value: jobNumbers.value || '-',
  })
  entries.push({
    label: `${t('recipeFields.ID')} (${t('RecipeVariant')})`,
    value: `${actualRecipeParams.value.recipeId || '-'}${actualRecipeParams.value.variantName ? ` (${actualRecipeParams.value.variantName})` : ''}`,
  })
  entries.push({
    label: t('jobOrderParams.TotalWeight'),
    value: actualParams.value.totalWeight != null ? `${actualParams.value.totalWeight} kg` : '-',
  })
  if (stateStore.partCountActive && actualParams.value.partCount != null) {
    entries.push({
      label: t('jobOrderParams.PartCount'),
      value: String(actualParams.value.partCount)
    })
  }
  entries.push({
    label: t('jobOrderParams.Flotte'),
    value: actualParams.value.flotte != null ? String(actualParams.value.flotte) : '-',
  })
  entries.push({
    label: `${t('Machine')} / ${t('Machines')}`,
    value: formatMachineSummary(),
  })
  entries.push({
    label: `${t('jobOrderParams.ColorCode')} / ${t('jobOrderParams.ColorName')}`,
    value: `${actualRecipeParams.value.colorCode || '-'} / ${actualRecipeParams.value.colorName || '-'}`,
  })
  entries.push({ label: t('Customer'), value: actualParams.value.customerName || '-' })
  entries.push({ label: t('FabricType'), value: actualParams.value.fabricType || '-' })

  if (jobOrderShowPrefs.value.orderNo)
    entries.push({ label: t('jobOrderParams.OrderNo'), value: actualParams.value.orderNo || '-' })
  if (jobOrderShowPrefs.value.PartyNo === undefined || jobOrderShowPrefs.value.PartyNo)
    entries.push({ label: t('jobOrderParams.PartyNo'), value: actualParams.value.partyNo || '-' })
  if (jobOrderShowPrefs.value.yarn)
    entries.push({ label: t('jobOrderParams.Yarn'), value: actualParams.value.yarn || '-' })
  if (jobOrderShowPrefs.value.ASNo)
    entries.push({ label: t('jobOrderParams.ASNo'), value: actualParams.value.ASNo || '-' })

  entries.push({ label: t('jobOrderParams.PreparedBy'), value: currentUser.value })
  entries.push({ label: t('jobOrderParams.PreparationDate'), value: currentTime.value })
  entries.push({ label: t('Programs'), value: formatProgramsSummary() })

  return entries
}

function drawJobInfoPanel(doc: jsPDF, entries: Array<{ label: string, value: string }>, startX: number, startY: number, availableWidth: number, theme: PdfTheme) {
  if (!entries.length)
    return startY

  const columns = Math.min(4, Math.max(2, entries.length))
  const gutter = 6
  const columnWidth = (availableWidth - gutter * (columns - 1)) / columns
  const paddingX = 3.5
  const paddingY = 3.5
  const rowSpacing = 1.2
  const labelHeight = 2.2
  const valueLineHeight = 3.2

  const rowBlocks: JobInfoRow[] = []
  let panelHeight = paddingY * 2

  for (let i = 0; i < entries.length; i += columns) {
    const rowEntries = entries.slice(i, i + columns)
    const cells = rowEntries.map((entry) => {
      const valueLines = doc.splitTextToSize(entry.value || '-', columnWidth - paddingX * 2)
      const height = labelHeight + valueLines.length * valueLineHeight + 2
      return { entry, valueLines, height }
    })
    const rowHeight = Math.max(...cells.map(cell => cell.height))
    rowBlocks.push({ cells, rowHeight })
    panelHeight += rowHeight
    if (i + columns < entries.length)
      panelHeight += rowSpacing
  }

  doc.setFillColor(...theme.panelBackground)
  doc.setDrawColor(...theme.divider)
  doc.roundedRect(startX, startY, availableWidth, panelHeight, 3, 3, 'FD')

  let currentY = startY + paddingY
  rowBlocks.forEach((block, blockIndex) => {
    block.cells.forEach((cell, cellIndex) => {
      const columnX = startX + cellIndex * (columnWidth + gutter) + paddingX
      doc.setFont('Roboto', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(...theme.muted)
      doc.text(String(cell.entry.label || '').toUpperCase(), columnX, currentY, { baseline: 'top' })
      doc.setFont('Roboto', 'bold')
      doc.setFontSize(8.2)
      doc.setTextColor(...theme.text)
      doc.text(cell.valueLines, columnX, currentY + 2.8, { baseline: 'top' })
    })
    currentY += block.rowHeight
    if (blockIndex < rowBlocks.length - 1)
      currentY += rowSpacing
  })

  return startY + panelHeight + 4
}

function drawSectionDivider(doc: jsPDF, startX: number, availableWidth: number, startY: number, theme: PdfTheme) {
  doc.setDrawColor(...theme.divider)
  doc.setLineWidth(0.3)
  doc.line(startX, startY, startX + availableWidth, startY)
  return startY + 5
}

function drawBarcodePanel(doc: jsPDF, asset: ImageAsset, label: string, startX: number, startY: number, width: number, theme: PdfTheme) {
  const panelWidth = Math.min(width, 92)
  const panelX = startX
  const paddingX = 6
  const paddingY = 4
  const barcodeHeight = 16
  const panelHeight = barcodeHeight + paddingY * 2 + 8

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...theme.divider)
  doc.roundedRect(panelX, startY, panelWidth, panelHeight, 3, 3, 'FD')

  doc.setFont('Roboto', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...theme.muted)
  doc.text(label, panelX + paddingX, startY + paddingY, { baseline: 'top' })

  doc.addImage(
    asset.dataUrl,
    asset.format,
    panelX + paddingX,
    startY + paddingY + 5,
    panelWidth - paddingX * 2,
    barcodeHeight,
  )

  return startY + panelHeight + 4
}

function drawNotesPanel(doc: jsPDF, notes: string, startX: number, startY: number, width: number, theme: PdfTheme) {
  const noteLines = doc.splitTextToSize(notes, width - 12)
  const blockHeight = noteLines.length * 4 + 18

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...theme.divider)
  doc.roundedRect(startX, startY, width, blockHeight, 3, 3, 'FD')

  doc.setFont('Roboto', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...theme.muted)
  doc.text(t('jobOrderParams.Notes'), startX + 6, startY + 6, { baseline: 'top' })

  doc.setFont('Roboto', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...theme.text)
  doc.text(noteLines, startX + 6, startY + 12, { baseline: 'top' })

  return startY + blockHeight + 8
}

function formatMachineSummary() {
  if (!actualMachines.value || !actualMachines.value.length)
    return '-'
  return actualMachines.value
    .map((machine, idx) => `${idx + 1}. ${machine.machineId}${machine.machineName ? ` - ${machine.machineName}` : ''}`)
    .join('; ')
}

function formatProgramsSummary() {
  if (!actualSteps.value || !actualSteps.value.length)
    return '-'
  return actualSteps.value.map(program => program.programNo).filter(Boolean).join(', ')
}

function formatAmount(value: number | string) {
  if (value === undefined || value === null)
    return '-'
  return String(value)
}

function getUnitLabel(unit: number | string) {
  if (unit === undefined || unit === null)
    return '-'
  return t(`units.${unit}`)
}

function getAutoManualLabel(material: any) {
  if (material.isIntermediateStep)
    return t('Man')
  return material.isManual ? t('Man') : t('Auto')
}

function getOrderLabel(material: any) {
  if (material.isIntermediateStep)
    return t('Man')
  return material.orderNo != null ? String(material.orderNo) : '-'
}

function getColorComponents(colorCode?: number | null) {
  if (typeof colorCode !== 'number')
    return null
  const r = (colorCode >> 16) & 255
  const g = (colorCode >> 8) & 255
  const b = colorCode & 255
  return [r, g, b] as const
}

function getBarcodeLabel() {
  const identifiers = jobIdentifierList.value
  if (!identifiers.length)
    return ''
  if (identifiers.length === 1)
    return `${t('jobOrderParams.ID')}: ${identifiers[0]}`
  return `${t('jobOrderParams.IDRange')}: ${identifiers[0]} - ${identifiers[identifiers.length - 1]}`
}

function getBarcodePayload() {
  if (!barcodeValue.value)
    return null
  return barcodeValue.value
}

async function loadImageAsset(url: string | null | undefined): Promise<ImageAsset | null> {
  if (!url)
    return null
  try {
    const response = await fetch(url)
    if (!response.ok)
      return null
    const blob = await response.blob()
    const format = blob.type.includes('png') ? 'PNG' : 'JPEG'
    const dataUrl = await new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
    if (!dataUrl)
      return null
    return { dataUrl, format: format as 'PNG' | 'JPEG' }
  } catch (err) {
    console.warn('Failed to load image asset for PDF', err)
    return null
  }
}

async function generateBarcodeAsset(payload: string | null): Promise<ImageAsset | null> {
  if (!payload || !isClient)
    return null

  try {
    const canvas = document.createElement('canvas')
    jsbarcode(canvas, payload, {
      format: 'CODE128',
      displayValue: false,
      margin: 0,
      width: 24,
      height: 24,
    })
    return { dataUrl: canvas.toDataURL('image/png'), format: 'PNG' as const }
  } catch (err) {
    console.warn('Failed to render barcode locally:', err)
    if (barcodeUrl.value)
      return await loadImageAsset(barcodeUrl.value)
    return null
  }
}

async function downloadPdf() {
  if (!isClient)
    return
  if (!pdfReady.value)
    await generatePdfDocument()
  if (currentPdfDoc)
    currentPdfDoc.save(pdfFileName.value)
}

async function printPdf() {
  if (!isClient)
    return
  if (!pdfReady.value)
    await generatePdfDocument()
  if (currentPdfDoc) {
    currentPdfDoc.autoPrint()
    currentPdfDoc.output('dataurlnewwindow')
  }
}
</script>

<template>
  <div class="job-order-overview">
    <div v-if="isLoading" class="status-message">
      {{ t('Loading...') }}
    </div>
    <div v-else-if="error" class="status-message status-message--error">
      {{ error }}
    </div>
    <template v-else-if="actualParams && actualRecipeParams">
      <div class="job-order-overview__toolbar">
        <QBtn
          color="primary"
          icon="download"
          :label="t('jobOrderPdf.Download')"
          :disable="!pdfReady"
          :loading="isGeneratingPdf && !pdfReady"
          @click="downloadPdf"
        />
        <QBtn
          color="primary"
          icon="print"
          :label="t('Print')"
          :disable="!pdfReady"
          :loading="isGeneratingPdf && !pdfReady"
          @click="printPdf"
        />
      </div>

      <div v-if="pdfError" class="status-message status-message--error">
        {{ pdfError }}
      </div>

      <div class="pdf-preview">
        <div v-if="isGeneratingPdf && !pdfObjectUrl" class="pdf-preview__placeholder">
          <QSpinner color="primary" size="40px" />
          <span>{{ t('jobOrderPdf.Generating') }}</span>
        </div>
        <iframe
          v-else-if="pdfObjectUrl"
          :src="pdfObjectUrl"
          class="pdf-preview__frame"
          :title="t('jobOrderPdf.Title')"
        />
        <div v-else class="pdf-preview__placeholder">
          {{ t('jobOrderPdf.NoPreview') }}
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.job-order-overview {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.job-order-overview__toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.status-message {
  padding: 12px 16px;
  border-radius: 8px;
  background-color: #f3f4f6;
  color: #111827;
  font-size: 14px;
}

.status-message--error {
  background-color: #fee2e2;
  color: #b91c1c;
}

.pdf-preview {
  min-height: 600px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background-color: #ffffff;
  display: flex;
  align-items: stretch;
  justify-content: center;
  overflow: hidden;
}

.pdf-preview__frame {
  width: 100%;
  border: none;
  min-height: 780px;
}

.pdf-preview__placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 14px;
  color: #6b7280;
}
</style>
