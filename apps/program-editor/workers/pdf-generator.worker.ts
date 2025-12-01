import { jsPDF } from 'jspdf'
import type { ProcessType } from '~/shared/types'

interface PDFGenerationData {
  machineName: string
  machineId: number
  programs: any[]
  selectedCommandNos: number[]
  commandList: any[]
  translations: Record<string, string>
}

interface StepData {
  stepNumber: number
  commandNo: number
  commandName: string
  parameters: any[]
  ioList: any[]
  commandInfo: any
  isParallel: boolean
}

function formatDuration(duration: number): string {
  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  const seconds = duration % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function getProcessTypeName(typeValue: number, processTypes: any[]): string {
  return processTypes.find(pt => pt.value === typeValue)?.label || ''
}

function filterSteps(program: any, selectedCommandNos: number[], commandList: any[]): StepData[] {
  const filteredSteps: StepData[] = []
  let stepNumber = 1

  program.steps.forEach((step: any) => {
    if (selectedCommandNos.includes(step.mainCommand.commandNo)) {
      const mainCommandInfo = commandList.find(cmd => cmd.commandNo === step.mainCommand.commandNo)

      if (mainCommandInfo) {
        filteredSteps.push({
          stepNumber,
          commandNo: step.mainCommand.commandNo,
          commandName: mainCommandInfo.name,
          parameters: step.mainCommand.parameters,
          ioList: step.mainCommand.ioList,
          commandInfo: mainCommandInfo,
          isParallel: false,
        })

        step.parallelCommands.forEach((parallelCmd: any) => {
          const parallelCommandInfo = commandList.find(cmd => cmd.commandNo === parallelCmd.commandNo)
          if (parallelCommandInfo) {
            filteredSteps.push({
              stepNumber,
              commandNo: parallelCmd.commandNo,
              commandName: parallelCommandInfo.name,
              parameters: parallelCmd.parameters,
              ioList: parallelCmd.ioList,
              commandInfo: parallelCommandInfo,
              isParallel: true,
            })
          }
        })

        stepNumber++
      }
    }
  })

  return filteredSteps
}

function generatePDFDocument(data: PDFGenerationData, processTypes: ProcessType[]): any {
  const doc = new jsPDF() as any // eslint-disable-line new-cap
  const { programs, selectedCommandNos, commandList, translations: t, machineName, machineId } = data

  programs.forEach((program, programIndex) => {
    if (programIndex > 0) {
      doc.addPage()
    }
    let startY = 10

    // Makine ve Program Başlık Kutusu
    doc.setDrawColor(0)
    doc.setLineWidth(0.5)
    doc.rect(14, startY, 182, 23)

    // Başlık içeriği
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')

    // İlk satır: Makine No ve Makine Adı
    doc.text(`${t.machineNo}`, 20, startY + 5)
    doc.text(`: ${machineId}`, 50, startY + 5)
    doc.text(`${t.machineName}`, 80, startY + 5)
    doc.text(`: ${machineName}`, 105, startY + 5)

    // İkinci satır: Program No ve Program Adı
    doc.text(`${t.programNo}`, 20, startY + 10)
    doc.text(`: ${program.programNo}`, 50, startY + 10)
    doc.text(`${t.programName}`, 80, startY + 10)
    doc.text(`: ${program.name}`, 105, startY + 10)

    // Üçüncü satır: Adım Sayısı, Süre, Proses Kodu
    doc.text(`${t.stepCount}`, 20, startY + 15)
    doc.text(`: ${program.steps.length}`, 50, startY + 15)
    doc.text(`${t.duration}`, 80, startY + 15)
    doc.text(`: ${formatDuration(program.duration)}`, 100, startY + 15)
    doc.text(`${t.processCode}`, 130, startY + 15)
    doc.text(`: ${getProcessTypeName(program.typeId, processTypes)}`, 160, startY + 15)

    // Dördüncü satır: Oluşturma ve Değiştirme Tarihleri
    doc.setFontSize(9)
    doc.text(`${t.createdAt}`, 20, startY + 20)
    doc.text(`: ${program.createdAt ? new Date(program.createdAt).toLocaleString('tr-TR') : '-'}`, 50, startY + 20)
    doc.text(`${t.updatedAt}`, 110, startY + 20)
    doc.text(`: ${program.updatedAt ? new Date(program.updatedAt).toLocaleString('tr-TR') : '-'}`, 145, startY + 20)

    startY += 30

    const filteredSteps = filterSteps(program, selectedCommandNos, commandList)

    if (filteredSteps.length > 0) {
      filteredSteps.forEach((step) => {
        // Sayfa kontrolü
        if (startY > 250) {
          doc.addPage()
          startY = 15
        }

        // Adım ve Komut Başlığı
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        const stepText = step.isParallel ? '' : `${step.stepNumber}    `
        const leftMargin = step.isParallel ? 60 : 14
        doc.text(`${stepText}    ${step.commandNo}  ${step.commandName}`, leftMargin, startY)

        startY += step.parameters.length > 0 || step.ioList.length > 0 ? 4 : 1

        // Parametreler
        if (step.parameters && step.parameters.length > 0) {
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.text(t.parameter, 80, startY)
          doc.text(t.name, 110, startY)
          doc.text(t.value, 150, startY)
          startY += 1

          doc.setDrawColor(200)
          doc.setLineWidth(0.1)
          doc.line(80, startY, 196, startY)
          startY += 4

          doc.setFont('helvetica', 'normal')
          step.parameters.forEach((param: any) => {
            const paramInfo = step.commandInfo.parameters.find((p: any) => p.index === param.index)
            if (paramInfo && startY < 280) {
              doc.text(paramInfo.name || '-', 110, startY)
              doc.text(String(param.value || '0'), 150, startY)
              startY += 4
            }
          })
          startY -= 2
        }

        // IO Listesi
        if (step.ioList && step.ioList.length > 0) {
          if (startY > 250) {
            doc.addPage()
            startY = 15
          }

          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.text('IO', 80, startY)
          doc.text(t.name, 110, startY)
          doc.text(t.value, 150, startY)
          startY += 1

          doc.setDrawColor(200)
          doc.setLineWidth(0.1)
          doc.line(80, startY, 196, startY)
          startY += 4

          doc.setFont('helvetica', 'normal')
          step.ioList.forEach((io: any) => {
            const ioInfo = step.commandInfo.ioList.find((i: any) => i.index === io.ioIndex)
            if (ioInfo && startY < 280) {
              doc.text(ioInfo.name || '-', 110, startY)
              // IO value formatı: [[index, value]]
              const ioValue = io.value && io.value.length > 0
                ? io.value.map((v: any) => ioInfo.selections.find((s: any) => s.index === v[0])?.name || v[1]).join(', ')
                : '-'
              doc.text(ioValue, 150, startY)
              startY += 4
            }
          })
          startY -= 2
        }

        // Ayırıcı çizgi
        if (startY < 280) {
          doc.setDrawColor(200)
          doc.setLineWidth(0.1)
          const lineStartX = step.isParallel ? 60 : 14
          doc.line(lineStartX, startY, 196, startY)
          startY += 4
        }
      })
    } else {
      // Seçili komut yoksa bilgi mesajı
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      doc.text(t.noSelectedCommands, 14, startY)
    }
  })

  // Tüm sayfalara sayfa numarası ekle
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`${t.page} ${i} / ${pageCount}`, 105, 287, { align: 'center' })
  }

  return doc.output('arraybuffer')
}

// Web Worker message handler
globalThis.onmessage = (e: MessageEvent) => {
  const { data, processTypes }: { data: PDFGenerationData, processTypes: ProcessType[] } = e.data

  try {
    const pdfArrayBuffer = generatePDFDocument(data, processTypes)
    globalThis.postMessage({ success: true, data: pdfArrayBuffer }, [pdfArrayBuffer])
  } catch (error) {
    globalThis.postMessage({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
