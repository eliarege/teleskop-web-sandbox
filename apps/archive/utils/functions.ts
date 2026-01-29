import { renderToString } from '@vue/server-renderer'
import { Notify } from 'quasar'
import { format } from 'date-fns'
import JobOrderSummary from '~/components/JobOrderSummary.vue'
import RecipeSummary from '~/components/RecipeSummary.vue'
import BatchSummary from '~/components/BatchSummary.vue'
import type { AnalogInputOutputType, BasicProgram, BatchInfo, BatchParameters, CalculatedValue, ConsumptionUnits, Counter, DigitalInputOutputType, ERPParameter, Machine, Program } from '~/types/archive'
import type { DDate } from '~/types/utils'

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

export function getCommandsWithClosestTime(
  slcTime: Date,
  commands: AnalogInputOutputType[] | DigitalInputOutputType[] | Counter[] | CalculatedValue[],
  getWith: 'closestTime' | 'lastTime' = 'closestTime',
) {
  const selectedTime = slcTime.getTime()

  return commands.map((io) => {
    const values = io?.ioValues ?? []
    let closestIoValue = { time: '' as unknown as DDate, value: 0 }
    if (getWith === 'closestTime') {
      if (values.length > 0)
        closestIoValue = io.ioValues.reduce((closest, current) => {
          const currentTime = new Date(current.time).getTime()
          const closestTime = new Date(closest.time).getTime()

          const currentDiff = Math.abs(currentTime - selectedTime)
          const closestDiff = Math.abs(closestTime - selectedTime)

          return currentDiff < closestDiff ? current : closest
        })
    } else if (getWith === 'lastTime') {
      const filtered = values
        .filter(
          v => new Date(v.time).getTime() <= selectedTime,
        )
        .sort((a, b) => (new Date(a.time)).getTime() - (new Date(b.time)).getTime())
      if (filtered.length > 0)
        closestIoValue = filtered[filtered.length - 1]
    }
    return {
      ...io,
      closestIoValue,
    }
  })
}
export function getCommandsWithClosestTimeDigital(
  slcTime: Date,
  commands: AnalogInputOutputType[] | DigitalInputOutputType[],
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

export async function printJoborderRecipe(batchKey: number, jobOrderInfo: BatchInfo, programs: BasicProgram[]) {
  const recipe = await $fetch(`/api/batch/${batchKey}/recipe`)

  const appContent = await renderToString(h(RecipeSummary, { recipe, jobOrderInfo, programs }))

  // Create a new window or document for printing
  const printWindow = window.open('', '_blank', 'left=100,top=100,width=1200,height=800')

  if (!printWindow)
    return

  // Define the HTML content for the printable document
  const content = `
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
      `

  // Write the content to the new window/document
  printWindow.document.open()
  printWindow.document.write(content)
  printWindow.document.close()
  printWindow.focus()

  // Trigger print dialog after content is loaded
  printWindow.print()
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

  // Create a new window or document for printing
  const printWindow = window.open('', '_blank', 'left=100,top=100,width=1200,height=800')

  if (!printWindow)
    return

  // Define the HTML content for the printable document
  const content = `
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
      `

  // Write the content to the new window/document
  printWindow.document.open()
  printWindow.document.write(content)
  printWindow.document.close()
  printWindow.focus()

  // Trigger print dialog after content is loaded
  printWindow.print()
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

export function printChartSVG() {
  const svgContent = getChartSVG()
  // Create a new window for printing
  const printWindow = window.open('', 'Print SVG', 'height=600,width=800')
  if (!printWindow)
    return

  // Write the SVG content to the new window
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        svg {
          max-width: 100%;
          max-height: 100%;
        }
      </style>
    </head>
    <body>
      ${svgContent}
    </body>
    </html>
  `)

  // Print the new window
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()

  // Close the new window
  printWindow.close()
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

  // Create a new window or document for printing
  const printWindow = window.open('', '_blank', 'left=100,top=100,width=1200,height=800')

  if (!printWindow)
    return

  // Define the HTML content for the printable document
  const content = `
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
              .filled-pie-chart {
                transform: rotate(-90deg);
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
      `

  // Write the content to the new window/document
  printWindow.document.open()
  printWindow.document.write(content)
  printWindow.document.close()
  printWindow.focus()

  // Trigger print dialog after content is loaded
  printWindow.print()
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
