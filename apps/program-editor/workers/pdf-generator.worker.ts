import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import RobotoBold from '@teleskop/nuxt-base/assets/fonts/Roboto-Bold.ttf?base64'
import RobotoRegular from '@teleskop/nuxt-base/assets/fonts/Roboto-Regular.ttf?base64'
import type { CommandIOSelection, MachineCommand, ProcessType, Program, ProgramDetailPDFData, ProgramDurationData, ProgramPDFMessage, ProgramStep, ProgramStepCommand, ProgramTableRow } from '~/shared/types'

function formatDuration(duration: number): string {
  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  const seconds = duration % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Verilen `stepId` için adım süresini bulur.
 * Bulunamazsa `null` döner (PDF'te süre gösterilmez).
 */
function findStepDuration(durations: ProgramDurationData | undefined, stepId: number): number | null {
  if (!durations)
    return null
  const step = durations.steps.find(s => s.stepId === stepId)
  return step ? step.duration : null
}

/**
 * Verilen `stepId` için kümülatif süreyi bulur.
 * Bulunamazsa `null` döner (PDF'te süre gösterilmez).
 */
function findCumulativeDuration(durations: ProgramDurationData | undefined, stepId: number): number | null {
  if (!durations)
    return null
  const step = durations.steps.find(s => s.stepId === stepId)
  return step ? step.cumulativeDuration : null
}

function getProcessTypeName(typeId: number, processTypes: ProcessType[]): string {
  return processTypes.find(pt => pt.value === typeId)?.label || ''
}

function filterSteps(program: Program, selectedCommandNos: number[]): ProgramStep[] {
  return program.steps.filter(step => selectedCommandNos.includes(step.mainCommand.commandNo))
}

function getCommandName(commandList: MachineCommand[], commandNo: number): string {
  return commandList.find(cmd => cmd.commandNo === commandNo)?.name || ''
}

function getParameterName(commandList: MachineCommand[], commandNo: number, paramIndex: number): string {
  const command = commandList.find(cmd => cmd.commandNo === commandNo)
  return command?.parameters.find(param => param.index === paramIndex)?.name || ''
}

function getIOName(commandList: MachineCommand[], commandNo: number, ioIndex: number): string {
  const command = commandList.find(cmd => cmd.commandNo === commandNo)
  return command?.ioList.find(io => io.index === ioIndex)?.name || ''
}

function getIOSelections(commandList: MachineCommand[], commandNo: number, ioIndex: number): CommandIOSelection[] {
  const command = commandList.find(cmd => cmd.commandNo === commandNo)
  const io = command?.ioList.find(io => io.index === ioIndex)
  return io?.selections || []
}

function formatDate(date: string | Date | null, locale: string): string {
  return date ? new Date(date).toLocaleString(locale) : '-'
}

function createDocument(): jsPDF {
  const doc = new jsPDF()
  doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegular)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.addFileToVFS('Roboto-Bold.ttf', RobotoBold)
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')
  doc.setFont('Roboto', 'normal')

  return doc
}

function getParameterValue(commandList: MachineCommand[], commandNo: number, paramIndex: number, value: string | number): string {
  const command = commandList.find(cmd => cmd.commandNo === commandNo)
  const parameter = command?.parameters.find(param => param.index === paramIndex)

  if (!parameter) {
    return String(value)
  }

  if (parameter.type === 'SELECT') {
    const selection = parameter.selections.find(sel => sel.value === value)
    return selection ? selection.name : String(value)
  } else if (parameter.type === 'NUMBER' && parameter.format === 'DURATION') {
    return formatDuration(Number(value))
  }

  return String(value)
}

function generateProgramDetailPDF(data: ProgramDetailPDFData): jsPDF {
  const doc = createDocument()

  const { machine, programs, selectedCommandNos, commandList, translations, locale, processTypes, programDurations } = data

  programs.forEach((program, programIndex) => {
    if (programIndex > 0) {
      doc.addPage()
    }
    let startY = 10

    // Makine ve Program Başlık Kutusu
    doc.setDrawColor(0)
    doc.setLineWidth(0.5)
    doc.rect(14, startY, 182, 28)

    // Başlık içeriği
    doc.setFontSize(10)
    doc.setFont('Roboto', 'bold')

    // İlk satır: Makine No ve Makine Adı
    doc.text(`${translations.machineNo || 'Machine No'}`, 20, startY + 5)
    doc.text(`: ${machine.id}`, 50, startY + 5)
    doc.text(`${translations.machineName || 'Machine Name'}`, 80, startY + 5)
    doc.text(`: ${machine.name?.slice(0, 30)}`, 110, startY + 5)

    // İkinci satır: Program No ve Program Adı
    doc.text(`${translations.programNo || 'Program No'}`, 20, startY + 10)
    doc.text(`: ${program.programNo}`, 50, startY + 10)
    doc.text(`${translations.programName || 'Program Name'}`, 80, startY + 10)
    doc.text(`: ${program.name?.slice(0, 30)}`, 110, startY + 10)

    // Üçüncü satır: Adım Sayısı, Oluşturma Tarihi
    doc.text(`${translations.stepCount || 'Step Count'}`, 20, startY + 15)
    doc.text(`: ${program.steps.length}`, 50, startY + 15)
    doc.text(`${translations.createdAt || 'Created At'}`, 80, startY + 15)
    doc.text(`: ${formatDate(program.createdAt, locale)}`, 110, startY + 15)

    // Dördüncü satır: Süre, Güncellenme Tarihi
    doc.text(`${translations.duration || 'Duration'}`, 20, startY + 20)
    doc.text(`: ${formatDuration(program.duration)}`, 50, startY + 20)
    doc.text(`${translations.updatedAt || 'Updated At'}`, 80, startY + 20)
    doc.text(`: ${formatDate(program.updatedAt, locale)}`, 110, startY + 20)

    // Beşinci satır: Proses Kodu
    doc.text(`${translations.processCode || 'Process Code'}`, 20, startY + 25)
    doc.text(`: ${getProcessTypeName(program.typeId, processTypes)}`, 50, startY + 25)

    startY += 35

    const filteredSteps = filterSteps(program, selectedCommandNos)

    // Bu programa ait adım bazlı süre bilgisi (varsa)
    const durations = programDurations?.[programIndex]

    if (filteredSteps.length > 0) {
      filteredSteps.forEach((step, index) => {
        // Sayfa kontrolü
        if (startY > 250) {
          doc.addPage()
          startY = 15
        }

        // Ana Komut
        doc.setFontSize(10)
        doc.setFont('Roboto', 'bold')
        doc.text(`${index + 1}    ${step.mainCommand.commandNo}  ${getCommandName(commandList, step.mainCommand.commandNo)}`, 14, startY)

        // Adım süresi ve kümülatif süre (saniye -> HH:MM:SS)
        // Format: "<adım süresi>  <kümülatif>"  sağa hizalı (196 mm sağ kenar)
        const stepDuration = findStepDuration(durations, step.stepId)
        const cumulativeDuration = findCumulativeDuration(durations, step.stepId)
        if (stepDuration !== null && cumulativeDuration !== null) {
          const durationText = `${formatDuration(stepDuration)}  ${formatDuration(cumulativeDuration)}`
          doc.text(durationText, 196, startY, { align: 'right' })
        }

        startY += 4
        // Parametreler
        if (step.mainCommand.parameters && step.mainCommand.parameters.length > 0) {
          doc.setFontSize(9)
          doc.setFont('Roboto', 'bold')
          doc.text((translations.parameter || 'Parameter'), 80, startY)
          doc.text((translations.name || 'Name'), 110, startY)
          doc.text((translations.value || 'Value'), 150, startY)
          startY += 1

          doc.setDrawColor(200)
          doc.setLineWidth(0.1)
          doc.line(80, startY, 196, startY)
          startY += 4

          doc.setFont('Roboto', 'normal')
          step.mainCommand.parameters.forEach((param) => {
            const paramName = getParameterName(commandList, step.mainCommand.commandNo, param.index)
            if (paramName && startY < 280) {
              doc.text(paramName || '-', 110, startY)
              doc.text(getParameterValue(commandList, step.mainCommand.commandNo, param.index, param.value), 150, startY)
              startY += 4
            }
          })
          startY -= 2
        }

        // IO Listesi
        if (step.mainCommand.ioList && step.mainCommand.ioList.length > 0) {
          if (startY > 250) {
            doc.addPage()
            startY = 15
          }

          startY += 4
          doc.setFontSize(9)
          doc.setFont('Roboto', 'bold')
          doc.text('IO', 80, startY)
          doc.text((translations.name || 'Name'), 110, startY)
          doc.text((translations.value || 'Value'), 150, startY)
          startY += 1

          doc.setDrawColor(200)
          doc.setLineWidth(0.1)
          doc.line(80, startY, 196, startY)
          startY += 4

          doc.setFont('Roboto', 'normal')
          step.mainCommand.ioList.forEach((io) => {
            const ioName = getIOName(commandList, step.mainCommand.commandNo, io.ioIndex)
            if (ioName && startY < 280) {
              doc.text(ioName || '-', 110, startY)
              const selections = getIOSelections(commandList, step.mainCommand.commandNo, io.ioIndex)
              if (io.value && io.value.length > 0) {
                io.value.forEach((v, index) => {
                  // v[1] is physicalId
                  const selectionItem = selections.find(s => s.physicalId === v[1])
                  const valueText = selectionItem ? selectionItem.name : String(v[1])
                  doc.text(valueText, 150, startY)
                  if (index < io.value.length - 1) {
                    startY += 4
                  }
                })
              } else {
                doc.text('-', 150, startY)
              }
              startY += 4
            }
          })
          startY -= 2
        }

        // Paralel Komutlar
        if (step.parallelCommands && step.parallelCommands.length > 0) {
          // Çizgi
          doc.setDrawColor(200)
          doc.setLineWidth(0.1)
          doc.line(60, startY, 196, startY)
          startY += 4

          step.parallelCommands.forEach((pCmd: ProgramStepCommand) => {
            if (startY > 250) {
              doc.addPage()
              startY = 15
            }

            doc.setFontSize(10)
            doc.setFont('Roboto', 'bold')
            doc.text(`${pCmd.commandNo}  ${getCommandName(commandList, pCmd.commandNo)}`, 60, startY)
            startY += 4

            // Parametreler
            if (pCmd.parameters && pCmd.parameters.length > 0) {
              doc.setFontSize(9)
              doc.setFont('Roboto', 'bold')
              doc.text((translations.parameter || 'Parameter'), 80, startY)
              doc.text((translations.name || 'Name'), 110, startY)
              doc.text((translations.value || 'Value'), 150, startY)
              startY += 1

              doc.setDrawColor(200)
              doc.setLineWidth(0.1)
              doc.line(80, startY, 196, startY)
              startY += 4

              doc.setFont('Roboto', 'normal')
              pCmd.parameters.forEach((param) => {
                const paramName = getParameterName(commandList, pCmd.commandNo, param.index)
                if (paramName && startY < 280) {
                  doc.text(paramName || '-', 110, startY)
                  doc.text(getParameterValue(commandList, pCmd.commandNo, param.index, param.value), 150, startY)
                  startY += 4
                }
              })
            }

            // IO Listesi
            if (pCmd.ioList && pCmd.ioList.length > 0) {
              if (startY > 250) {
                doc.addPage()
                startY = 15
              }

              startY += 4
              doc.setFontSize(9)
              doc.setFont('Roboto', 'bold')
              doc.text('IO', 80, startY)
              doc.text((translations.name || 'Name'), 110, startY)
              doc.text((translations.value || 'Value'), 150, startY)
              startY += 1

              doc.setDrawColor(200)
              doc.setLineWidth(0.1)
              doc.line(80, startY, 196, startY)
              startY += 4

              doc.setFont('Roboto', 'normal')
              pCmd.ioList.forEach((io) => {
                const ioName = getIOName(commandList, pCmd.commandNo, io.ioIndex)
                if (ioName && startY < 280) {
                  doc.text(ioName || '-', 110, startY)
                  const selections = getIOSelections(commandList, pCmd.commandNo, io.ioIndex)
                  if (io.value && io.value.length > 0) {
                    io.value.forEach((v, index) => {
                      // v[1] is physicalId
                      const selectionItem = selections.find(s => s.physicalId === v[1])
                      const valueText = selectionItem ? selectionItem.name : String(v[1])
                      doc.text(valueText, 150, startY)
                      if (index < io.value.length - 1) {
                        startY += 4
                      }
                    })
                  } else {
                    doc.text('-', 150, startY)
                  }
                  startY += 4
                }
              })
            }
            startY -= 2

            // çizgi
            if (startY < 280 && pCmd !== step.parallelCommands[step.parallelCommands.length - 1]) {
              doc.setDrawColor(200)
              doc.setLineWidth(0.1)
              doc.line(60, startY, 196, startY)
              startY += 4
            }
          })
        }

        // Adım sonu çizgi
        if (startY < 280) {
          doc.setDrawColor(0)
          doc.setLineWidth(0.5)
          doc.line(14, startY, 196, startY)
          startY += 4
        }
      })
    } else {
      // Seçili komut yoksa bilgi mesajı
      doc.setFontSize(10)
      doc.setFont('Roboto', 'normal')
      doc.text((translations.noSelectedCommands || 'No selected commands'), 14, startY)
    }
  })

  // Tüm sayfalara sayfa numarası ekle
  const pageCount = doc.internal.pages.length - 1
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setFont('Roboto', 'normal')
    doc.text(`${(translations.page || 'Page')} ${i} / ${pageCount}`, 105, 287, { align: 'center' })
  }

  return doc
}

interface ProgramListPDFData {
  machines: {
    id: number
    name: string
    programs: ProgramTableRow[]
  }[]
  translations: Record<string, string>
  locale: string
  processTypes: ProcessType[]
}

function generateProgramListPDF(data: ProgramListPDFData): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const { machines, translations, locale, processTypes } = data

  doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegular)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.addFileToVFS('Roboto-Bold.ttf', RobotoBold)
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')

  doc.setFont('Roboto', 'normal')

  let startY = 10

  for (const machine of machines) {
    if (!machine.programs.length)
      continue

    const machineHeader = `${(translations.machineNo || 'Machine No')}: ${machine.id}  |  ${(translations.machineName || 'Machine Name')}: ${machine.name}`

    autoTable(doc, {
      startY: startY + 12,
      head: [
        [{
          content: machineHeader,
          colSpan: 8,
          styles: {
            halign: 'left',
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            font: 'Roboto',
            fontStyle: 'bold',
          },
        }],
        [
          (translations.programNo || 'Program No'),
          (translations.programName || 'Program Name'),
          (translations.duration || 'Duration'),
          (translations.stepCount || 'Step Count'),
          (translations.type || 'Type'),
          (translations.versionNo || 'Version No'),
          (translations.updatedAt || 'Updated At'),
          (translations.createdAt || 'Created At'),
        ],
      ],
      body: machine.programs.map(p => [
        p.programNo,
        p.name,
        formatDuration(p.duration),
        p.stepCount,
        getProcessTypeName(p.typeId, processTypes),
        p.versionNo,
        formatDate(p.updatedAt, locale),
        formatDate(p.createdAt, locale),
      ]),
      margin: { top: 15, right: 14, bottom: 20, left: 14 },
      styles: {
        font: 'Roboto',
        fontStyle: 'normal',
      },
      headStyles: {
        font: 'Roboto',
        fontStyle: 'bold',
      },
    })

    startY = (doc as any).lastAutoTable.finalY + 15

    const lastMachine = machines[machines.length - 1]
    const isLastMachine = machine.id === lastMachine.id

    if (startY > 200 && !isLastMachine) {
      doc.addPage()
      startY = 15
    }
  }

  const pageCount = doc.internal.pages.length - 1
  doc.setFontSize(9)
  doc.setFont('Roboto', 'normal')

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `${(translations.page || 'Page')} ${i} / ${pageCount}`,
      148,
      200,
      { align: 'center' },
    )
  }

  return doc
}

globalThis.onmessage = (e: MessageEvent<ProgramPDFMessage>) => {
  try {
    let pdf: jsPDF

    if (e.data.type === 'PROGRAM_LIST') {
      pdf = generateProgramListPDF(e.data.payload)
    } else if (e.data.type === 'PROGRAM_DETAIL') {
      pdf = generateProgramDetailPDF(e.data.payload)
    } else {
      throw new Error('Invalid PDF type')
    }

    const buffer = pdf.output('arraybuffer')
    globalThis.postMessage({ success: true, data: buffer }, [buffer])
  } catch (err) {
    globalThis.postMessage({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}
