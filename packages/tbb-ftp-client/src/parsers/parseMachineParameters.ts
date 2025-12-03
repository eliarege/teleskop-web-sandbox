import type { MachineParameter } from '../types'
import { splitLines } from '../utils/common'

const pattern = /^SABIT_(\d+)=(.+)$/i
/**
 * Makine sabitlerinin saklandığı dosyadır. Değerler virgül ile ayrılmıştır. Sırası ile:
 *
 * 1) Makine sabiti ismi
 * 2) Varsayılan değer
 * 3) DM Area adresi
 * 4) Ekran görünürlüğü
 * 5) Değer alt limiti
 * 6) Değer üst limiti
 * 7) Format
 * 8) Sabit numarası (SABIT_X ifadesindeki X’in bir fazlası (X+1) şekilde olur.)
 * 9) Birim
 *
 * **Path**: `/tbb6500/data/config/makinesabitleri`
 *
 * **Example**:
 * ```txt
 * SABIT_0=AK Ust,4500,9100,1,0,9000,0,1,0
 * ```
 *
 * @docs https://eliarelektronik.atlassian.net/wiki/spaces/TXXX/pages/3745513508/Teleskop+veri+taban+tablolar+ve+ili+kili+dosyalar+n+formatlar
 */
export function parseMachineParameters(content: string) {
  const machineParameters: Partial<MachineParameter>[] = []

  for (const line of splitLines(content)) {
    const match = pattern.exec(line)
    if (!match)
      continue

    const id = match[1]
    const values = match[2].split(',')

    // machineparameterid, paramstring, defaultValue, dmArea,
    // consScreen, paramlowlimit, paramhighlimit, consFormat,
    // paramNo,consUnit
    if (values && values.length) {
      const parameter: Partial<MachineParameter> = {
        machineParameterId: Number.parseInt(id),
        paramString: values[0],
        defaultValue: Number.parseInt(values[1]),
        dmArea: Number.parseInt(values[2]),
        consScreen: Number.parseInt(values[3]),
        paramLowLimit: Number.parseInt(values[4]),
        paramHighLimit: Number.parseInt(values[5]),
        consFormat: Number.parseInt(values[6]),
        consUnit: Number.parseInt(values[8]),
      }
      machineParameters.push(parameter)
    }
  }
  return machineParameters
}
