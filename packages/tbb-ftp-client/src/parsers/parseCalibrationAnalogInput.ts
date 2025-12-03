import type { CalibrationAnalogInput } from '../types'
import { splitLines } from '../utils/common'
import { tokenize } from '../utils/tokenize'

/**
 * **Path**: `/tbb6500/data/kalibrasyon/aikalibrasyon`
 *
 * Dosya formatındaki her satırdaki değerler sırasıyla:
 * 1) Analog giriş numarası, analog giriş dosyasındaki ile eşlenik şekilde.
 * 2) Kalibrasyon tipi
 * 3) Kalibrasyon formatı
 * 4) Kalibrasyon tipi 0 ise hat_rl formülü (bu bilgi sadece tip 0 ise var, dolayısı ile bundan sonraki bilgilerin sırası da değişik)
 * 5) Çift tırnak içerisinde alt limit formülü, epac’lı cihazlar için 0
 * 6) Çift tırnak içerisinde üst limit formülü, epac’lı cihazlar için 0
 * 7) Kalibrasyon birimi
 * 8) Kalibrasyon tipi 1 veya 2 ise measure_values değerleri (epac’lılar için 50 çift, diğerleri için 10 çift) (aşağıda örnek olarak 3 çifti renklendirdim, çiftlerden ilki seviye, ikincisi analog girişten gelen değer)
 * 9) Kalibrasyon alarm görevleri
 *
 * **Example**:
 * ```txt
 * 2 0 0 -110 "0" "T1_Max_Temperature+5" 'C 130
 * 3 0 0 -110 "0" "T2_Max_Temperature+5" 'C 130
 * 4 1 0 "0" "MT_Max_Level+200" lt 0.00 4.21 1000.00 5.40 1600.00 6.60 2500.00 8.19 3400.00 9.59 4450.00 11.01 6000.00 13.00 8000.00 15.64 9600.00 17.43 10400.00 18.45 0
 * 5 1 0 "0" "T1_Max_Level+25" lt 0.00 0.09 50.00 0.73 100.00 1.88 150.00 3.03 200.00 4.05 250.00 5.12 300.00 6.27 400.00 8.50 500.00 10.63 600.00 12.85 0
 * ```
 */
export function parseCalibrationAnalogInput(content: string): CalibrationAnalogInput[] {
  const lines = splitLines(content)
  const calibrationAnalogInputs: CalibrationAnalogInput[] = []

  for (const line of lines) {
    const tokens = tokenize(line)
    const id = tokens.get(0, 'integer')
    const calibType = tokens.get(1, 'integer')
    const format = tokens.get(2, 'integer')

    if (calibType === 0) {
      const hat_rl = tokens.get(3, 'integer')
      const lowerLimitFormula = tokens.get(4, 'string')
      const upperLimitFormula = tokens.get(5, 'string')
      const unit = tokens.get(6, 'string')
      const calibrationAlarmTasks = tokens.get(7, 'integer')

      calibrationAnalogInputs.push({
        id,
        calibType,
        format,
        hat_rl,
        lowerLimitFormula,
        upperLimitFormula,
        unit,
        measureValues: [],
        calibrationAlarmTasks,
      })
    } else {
      const lowerLimitFormula = tokens.get(3, 'string')
      const upperLimitFormula = tokens.get(4, 'string')
      const unit = tokens.get(5, 'string')

      const input: CalibrationAnalogInput = {
        id,
        calibType,
        format,
        hat_rl: null,
        lowerLimitFormula,
        upperLimitFormula,
        unit,
        measureValues: [],
        calibrationAlarmTasks: 0,
      }

      if (calibType === 1 || calibType === 2) {
        let i = 6
        for (; i < tokens.length - 1; i += 2) {
          const level = tokens.get(i, 'float')
          const value = tokens.get(i + 1, 'float')
          input.measureValues!.push({ level, value })
        }
        // If there is a standalone number at end, it is calibrationAlarmTasks
        if (i < tokens.length) {
          input.calibrationAlarmTasks = tokens.get(i, 'integer')
        }
      }
      calibrationAnalogInputs.push(input)
    }
  }

  return calibrationAnalogInputs
}
