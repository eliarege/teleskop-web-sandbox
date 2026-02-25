import { renderToString } from '@vue/server-renderer'
import { Notify } from 'quasar'
import { format } from 'date-fns'
import { interpolateNumber } from 'd3'
import JobOrderSummary from '~/components/JobOrderSummary.vue'
import RecipeSummary from '~/components/RecipeSummary.vue'
import BatchSummary from '~/components/BatchSummary.vue'
import type { AnalogInputOutputType, BasicProgram, BatchInfo, BatchParameters, CalculatedValue, ConsumptionUnits, Counter, DigitalInputOutputType, ERPParameter, Machine, Program } from '~/types/archive'
import type { DuoRaw } from '~/types/utils'

export function formatDuration(sec: number): string {
  const totalSeconds = Math.abs(Math.floor(sec))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [
    sec < 0 ? `-${String(hours).padStart(2, '0')}` : String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':')
}

export function getApproxIoValueAtTime(
  time: Date,
  ioValues: Array<{ time: string, value: number }>,
  strategy: 'closestTime' | 'lastTime' | 'interpolated' = 'interpolated',
): { time: string, value: number } {
  const selectedTime = time.getTime()
  const sortedIoValues = ioValues.toSorted((a, b) =>
    new Date(a.time).getTime() - new Date(b.time).getTime(),
  )

  if (strategy === 'closestTime') {
    // Exit if we the diff increases, since the array is sorted
    let closest = { time: '', value: 0 }
    let closestDiff = Number.POSITIVE_INFINITY
    for (const current of sortedIoValues) {
      const currentTime = new Date(current.time).getTime()
      const currentDiff = Math.abs(currentTime - selectedTime)

      if (currentDiff < closestDiff) {
        closest = current
        closestDiff = currentDiff
      } else if (currentDiff > closestDiff) {
        break
      }
    }
    return closest
  } else if (strategy === 'lastTime') {
    let last = { time: '', value: 0 }
    for (const current of sortedIoValues) {
      const currentTime = new Date(current.time).getTime()
      if (currentTime <= selectedTime) {
        last = current
      } else {
        break
      }
    }
    return last
  } else if (strategy === 'interpolated') {
    let beforePoint = null
    let afterPoint = null

    for (let i = 0; i < sortedIoValues.length; i++) {
      const pointTime = new Date(sortedIoValues[i].time).getTime()
      if (pointTime > selectedTime) {
        afterPoint = sortedIoValues[i]
        beforePoint = i > 0 ? sortedIoValues[i - 1] : null
        break
      }
    }

    if (!afterPoint && sortedIoValues.length > 0) {
      beforePoint = sortedIoValues[sortedIoValues.length - 1]
    }

    if (beforePoint && afterPoint) {
      const beforeTime = new Date(beforePoint.time).getTime()
      const afterTime = new Date(afterPoint.time).getTime()
      const t = (selectedTime - beforeTime) / (afterTime - beforeTime)

      const interpolator = interpolateNumber(beforePoint.value, afterPoint.value)
      const interpolatedValue = interpolator(t)

      return {
        time: time.toISOString(),
        value: interpolatedValue,
      }
    } else if (beforePoint) {
      return beforePoint
    } else if (afterPoint) {
      return afterPoint
    }
  }

  return { time: '', value: 0 }
}

export function getCommandsWithClosestTime(
  slcTime: Date,
  commands: DuoRaw<AnalogInputOutputType[] | DigitalInputOutputType[] | Counter[] | CalculatedValue[]>,
  getWith: 'closestTime' | 'lastTime' | 'interpolated' = 'lastTime',
) {
  return commands.map((io) => {
    const values = io?.ioValues ?? []
    const closestIoValue = values.length > 0
      ? getApproxIoValueAtTime(slcTime, values, getWith)
      : { time: '', value: 0 }
    return {
      ...io,
      closestIoValue,
    }
  })
}

export function getCommandsWithClosestTimeDigital(
  slcTime: Date,
  commands: DuoRaw<AnalogInputOutputType[] | DigitalInputOutputType[]>,
) {
  const selectedTime = slcTime.getTime()

  return commands.map((io) => {
    const closestIoValue = io?.ioValues?.length > 0
      ? io.ioValues.reduce((closest, current) => {
        const currentTime = new Date(current.time).getTime()
        const closestTime = closest.time ? new Date(closest.time).getTime() : Number.NEGATIVE_INFINITY

        // Only consider times less than the selected time
        if (currentTime >= selectedTime)
          return closest

        const currentDiff = selectedTime - currentTime
        const closestDiff = selectedTime - closestTime

        return closestTime === Number.NEGATIVE_INFINITY || currentDiff < closestDiff ? current : closest
      }, { time: '', value: 0 })
      : { time: '', value: 0 }

    return {
      ...io,
      closestIoValue,
    }
  })
}

function formatSecondsToHHMMSS(sec: number) {
  const sign = sec < 0 ? '-' : ''
  sec = Math.abs(sec)

  const hours = Math.floor(sec / 3600)
  const minutes = Math.floor((sec % 3600) / 60)
  const seconds = Math.floor(sec % 60)

  return (
    sign
    + [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':')
  )
}

function openPrintWindow(html: string, options?: { autoClose?: boolean, windowFeatures?: string }) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const printWindow = window.open(url, '_blank', options?.windowFeatures ?? 'left=100,top=100,width=1200,height=800')

  if (!printWindow)
    return

  printWindow.onload = () => {
    URL.revokeObjectURL(url)
    printWindow.focus()

    if (options?.autoClose) {
      printWindow.addEventListener('afterprint', () => {
        printWindow.close()
      })
    }

    printWindow.print()
  }
}

export async function printJoborderRecipe(batchKey: number, jobOrderInfo: BatchInfo, programs: BasicProgram[]) {
  const recipe = await $fetch(`/api/batch/${batchKey}/recipe`)

  const appContent = await renderToString(h(RecipeSummary, { recipe, jobOrderInfo, programs }))

  openPrintWindow(`
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
          }
          .container {
            width: 90%;
            margin: 20px auto;
          }
          .header,
          .section {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
          }
          .section-title {
            font-weight: bold;
            border-bottom: 1px solid black;
            padding-bottom: 5px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .table th,
          .table td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
          }
          .highlight-red {
            color: red;
          }
        </style>
      </head>
      <body>
        ${appContent}
      </body>
    </html>
  `)
}
export async function printJobOrderSummary(batchKey: number, jobOrderInfo: BatchInfo, programs: BasicProgram[]) {
  const consumptions = await $fetch(`/api/batch/${batchKey}/consumptions`)
  const consumptionUnits = await $fetch<ConsumptionUnits>(`/api/batch/${batchKey}/consumption-units`)
  const erpParameters = await $fetch<ERPParameter[]>(`/api/batch/${batchKey}/erp-parameters-value`)
  const waterTypes = await $fetch<Record<string, string | null>>(`/api/water-types`)
  console.log(consumptions, consumptionUnits, erpParameters, waterTypes)
  // Render the component as HTML using Vue's server renderer
  const appContent = await renderToString(h(JobOrderSummary, {
    consumptions,
    jobOrderInfo,
    programs,
    consumptionUnits,
    erpParameters,
    waterTypes,
  }))

  openPrintWindow(`
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
          }
          .container {
            width: 90%;
            margin: 20px auto;
          }
          .header,
          .section {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
          }
          .section-title {
            font-weight: bold;
            border-bottom: 1px solid black;
            padding-bottom: 5px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .table th,
          .table td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
          }
          .highlight-red {
            color: red;
          }
        </style>
      </head>
      <body>
        ${appContent}
      </body>
    </html>
  `)
}
export function setAxisVisibility(keyParam: string, changeTo: boolean) {
  const { t } = useNuxtApp().$i18n
  const settingsStore = userSettingsStore()
  let count = 0
  settingsStore.axises.forEach((axis) => {
    if (axis.visible && !axis.isDefault)
      count += 1
  })
  const axx = settingsStore.axises.get(keyParam)
  if (!axx)
    return
  if (count >= 4 && !axx.visible && changeTo) {
    Notify.create({
      message: t('errors.cannotShowMoreThanFourAxis'),
      group: 'axisError',
      type: 'negative',
      position: 'top',
    })
  } else {
    axx.visible = changeTo
  }
}

function removeElement(el: Element, selector: string) {
  const xyz = el.querySelector(selector)
  xyz?.parentNode?.removeChild(xyz)
}
export function getChartSVG() {
  const chartEl = document.querySelector('.chart')
  if (!chartEl)
    return
  const clonedChart = chartEl.cloneNode(true) as Element
  clonedChart.querySelectorAll('foreignObject').forEach((group) => {
    group.remove()
  })
  removeElement(clonedChart, '#chart-selected-time-line')
  removeElement(clonedChart, '#chart-tooltip')
  removeElement(clonedChart, '#top-alarm-defs')
  return clonedChart.innerHTML
}

export function printChartSVG(options: {
  machineId: number
  machineName: string
  jobOrder: string
  programNos: number[]
  startTime: string
  endTime: string | null
}) {
  const svgContent = getChartSVG()
  const { t } = useNuxtApp().$i18n
  const formattedStartTime = format(new Date(options.startTime), 'dd/MM/yyyy HH:mm:ss')
  const formattedEndTime = options.endTime ? format(new Date(options.endTime), 'dd/MM/yyyy HH:mm:ss') : '-'
  const programNosStr = options.programNos.join(', ')

  openPrintWindow(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
        @page {
          size: landscape;
          margin: 5mm;
        }

        body {
          margin: 4px 10px;
          font-family: Arial, sans-serif;
          font-size: 12px;
        }

        .print-header {
          border-bottom: 2px solid #333;
          padding-bottom: 6px;
          margin-bottom: 6px;
        }

        .header-titles, .header-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }

        .header-titles {
          font-size: 14px;
          margin-bottom: 4px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          white-space: nowrap;
        }

        .chart-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          height: calc(100vh - 70px);
        }

        svg {
          width: 100%;
          height: 100%;
        }
      </style>
    </head>

    <body>
      <div class="print-header">
        <div class="header-titles">
          <div><b>${t('batchSummary.machineInfo')}</b></div>
          <div><b>${t('batchSummary.batchInfo')}</b></div>
        </div>

        <div class="header-grid">
          <div class="info-item">
            <div><b>${t('batchSummary.machineNo')}:</b> ${options.machineId}</div>
            <div><b>${t('batchSummary.machineName')}:</b> ${options.machineName}</div>
          </div>

          <div class="info-item">
            <div><b>${t('batchSummary.jobOrder')}:</b> ${options.jobOrder}</div>
            <div><b>${t('batchSummary.programNo')}:</b> ${programNosStr}</div>
          </div>

          <div class="info-item">
            <div><b>${t('batchSummary.startTime')}:</b> ${formattedStartTime}</div>
            <div><b>${t('batchSummary.endTime')}:</b> ${formattedEndTime}</div>
          </div>
        </div>
      </div>

      <div class="chart-wrapper">
        ${svgContent}
      </div>
    </body>
  </html>
  `, { autoClose: true })
}

export async function printBatchSummary(
  batchKey: number,
  machineInfo: Machine,
  jobOrderInfo: BatchInfo,
  batchParameters: BatchParameters[],
) {
  const machine = {
    machineNo: machineInfo.id,
    machineName: machineInfo.name,
    model: machineInfo.model,
    theoreticalCharge: machineInfo.theoreticalCharge,
    capacity: machineInfo.capacity,
    operator: jobOrderInfo.operatorName,
  }
  const jobOrderData = {
    jobOrder: jobOrderInfo.jobOrder,
    startTime: format(jobOrderInfo.startTime, 'HH:mm:ss dd/MM/yyyy'),
    endTime: jobOrderInfo.isCancelled ? '-' : jobOrderInfo.endTime ? format(jobOrderInfo.endTime, 'HH:mm:ss dd/MM/yyyy') : '-',
    cancelTime: jobOrderInfo.isCancelled && jobOrderInfo.endTime ? format(jobOrderInfo.endTime, 'HH:mm:ss dd/MM/yyyy') : '-',
    theoreticalEndTime: format(
      new Date(
        (new Date(jobOrderInfo.startTime)).getTime()
        + jobOrderInfo.theoreticalDuration * 1000,
      ),
      'HH:mm:ss dd/MM/yyyy',
    ),
    actualDuration: jobOrderInfo.actualDuration ? formatSecondsToHHMMSS(jobOrderInfo.actualDuration) : '-',
    actualTheoreticalDuration: jobOrderInfo.actualTheoreticalDuration ? formatSecondsToHHMMSS(jobOrderInfo.actualTheoreticalDuration) : '-',
    theoreticalDuration: jobOrderInfo.theoreticalDuration ? formatSecondsToHHMMSS(jobOrderInfo.theoreticalDuration) : '-',
    deviation: jobOrderInfo.deviation ? formatSecondsToHHMMSS(jobOrderInfo.deviation) : '-',
  }
  const startParameters = batchParameters.map((param) => {
    return {
      name: param.name,
      value: (param.paramValues[0].value).toFixed(2),
    }
  })
  const svgChartContent = getChartSVG()

  const consumptions = await $fetch(`/api/batch/${batchKey}/consumptions`)
  const consumptionUnits = await $fetch(`/api/batch/${batchKey}/consumption-units`)
  const { programInfo, totalManualDelay } = await $fetch(`/api/batch/${batchKey}/batch-summary`)
  const waterTypes = await $fetch<Record<string, string | null>>(`/api/water-types`)

  // Render the BatchSummary component
  const appContent = await renderToString(
    h(BatchSummary, {
      machine,
      jobOrderData,
      actualDuration: jobOrderInfo.actualDuration || 0,
      startParameters,
      svgChartContent,
      consumptions,
      consumptionUnits,
      programInfo,
      waterTypes,
      totalManualDelay,
    }),
  )

  openPrintWindow(`
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
          }
          ol,
          ul,
          menu {
            list-style: none;
            margin: 0;
            padding: 0;
          }
          .pie-desc-item {
            height: 10px;
            display: flex;
            gap: 5px;
            padding-left: 5px;
            padding-top: 5px;
          }
          .color-red-sq {
            background-color: red;
          }
          .color-blue-sq {
            background-color: blue;
          }
          .color-purple-sq {
            background-color: purple;
          }
          .color-yellow-sq {
            background-color: yellow;
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
            background-color: red;
            border: 1px solid;
          }
          .chart-container {
            text-align: center;
            margin-bottom: 20px;
          }
          .filled-pie-chart {
            transform: rotate(-90deg);
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
          .bold-red-th {
            font-size: 14px;
            color: red;
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
          .custom-component-section {
            margin: 20px 0;
            font-size: 10px;
          }
          .q-table--dense.no-hover tbody tr:hover td::before {
            content: unset !important;
          }
          .q-table--dense {
            border-width: 1px 0 0 1px;
            border-style: solid;
            border-color: #888;
          }
          .q-table--dense td {
            border-width: 0 1px 1px 0;
            border-style: solid;
            border-color: #888;
            padding-left: 5px;
            padding-right: 5px;
          }
          .intervention-list-cell > :not([hidden]) ~ :not([hidden]) {
            border-width: 1px 0 0 0;
            border-style: solid;
            border-color: rgb(136, 136, 136);
          }
        </style>
      </head>
      <body>
        ${appContent}
      </body>
    </html>
  `)
}

export function flattenPrograms(programs: Program[]) {
  return programs.flatMap((program, programIndex) => {
    return program.steps.flatMap((step, mainStep) => {
      return [
        {
          programNo: program.programNo,
          programName: program.name,
          programIndex,
          mainStep,
          parallelStep: 0,
          commandNo: step.mainCommand.commandNo,
          parameters: step.mainCommand.parameters,
          ioList: step.mainCommand.ioList,
        },
        ...step.parallelCommands.map((command, parallelIndex) => {
          return {
            programNo: program.programNo,
            programName: program.name,
            programIndex,
            mainStep,
            parallelStep: parallelIndex + 1,
            commandNo: command.commandNo,
            parameters: command.parameters,
            ioList: command.ioList,
          }
        }),
      ]
    })
  })
}

export function orderArray(array: Array<any>, predefinedOrder: Array<number | string | boolean>, key?: string) {
  const orderedData = array.sort((a: any, b: any) => {
    const indexA = predefinedOrder.indexOf(key ? a[key] : a)
    const indexB = predefinedOrder.indexOf(key ? b[key] : b)
    if (indexA === -1 && indexB === -1)
      return 0 // Both are unordered
    if (indexA === -1)
      return 1 // a is unordered, comes after b
    if (indexB === -1)
      return -1 // b is unordered, comes after a
    return indexA - indexB
  })
  return orderedData
}
