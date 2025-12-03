import { splitLines } from '../utils/common'
import { tokenize } from '../utils/tokenize'

export type SelectableIoDefinition = {
  commandNo: number
  ioName: string
  isSelectableIO: true
  ioIndex: number
  selectionList: {
    selectIndex: number
    ioType: number
    ioId: number
    isDefault: boolean
  }[]
}

export type NonSelectableIoDefinition = {
  commandNo: number
  ioIndex: number
  ioName: string
  isSelectableIO: false
  ioType: number
  ioId: number
}

export type IoDefinition = SelectableIoDefinition | NonSelectableIoDefinition

/**
 * Komutun kullandığı io tanımlarının tutulduğu dosyayı parse eder. Format boşlukla ayrılmış şekilde sırasıyla:
 *
 * 1. Komut Numarası (integer)
 * 2. IO Adı (string)
 * 3. IO Türü ve ID'si (string, format: "ioType,ioId") - Eğer seçimli IO ise bu ve sonraki çiftler tekrarlanır.
 * 4. Seçim Durumu (integer, 1 = seçili, 0 = seçili değil) - Sadece seçimli IO'lar için geçerlidir.
 *
 * **Path**: `/tbb6500/data/commands/io`
 *
 * **Example**:
 * ```txt
 * 1 "Referans Seçiniz" 4,13 1 4,28 0
 * ```
 */
export function parseCommandIO(content: string): IoDefinition[] {
  const ios: IoDefinition[] = []
  const lines = splitLines(content)
  const counters = new Map<number, number>()

  const getNext = (commandNo: number) => {
    const current = counters.get(commandNo) || 0
    counters.set(commandNo, current + 1)
    return current
  }

  for (const line of lines) {
    const tokens = tokenize(line)
    const isSelectableIO = tokens.length > 4
    const commandNo = tokens.get(0, 'integer')
    const ioIndex = getNext(commandNo)

    if (isSelectableIO) {
      const io: SelectableIoDefinition = {
        commandNo: tokens.get(0, 'integer'),
        ioName: tokens.get(1, 'string'),
        ioIndex,
        isSelectableIO: true,
        selectionList: [],
      }
      for (let i = 2; i < tokens.length; i += 2) {
        const [ioType, ioId] = tokens.get(i, 'integer-list')
        const isDefault = tokens.get(i + 1, 'integer') > 0
        io.selectionList.push({
          selectIndex: io.selectionList.length,
          ioType,
          ioId,
          isDefault,
        })
      }
      ios.push(io)
    } else {
      const [ioType, ioId] = tokens.get(2, 'integer-list')
      const io: NonSelectableIoDefinition = {
        commandNo: tokens.get(0, 'integer'),
        ioName: tokens.get(1, 'string'),
        ioIndex,
        isSelectableIO: false,
        ioType,
        ioId,
      }
      ios.push(io)
    }
  }
  return ios
}
