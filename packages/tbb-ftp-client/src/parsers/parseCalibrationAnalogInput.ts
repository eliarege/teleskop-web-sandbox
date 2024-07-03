import type { CalibrationAnalogInput } from '../types'

const generalPattern = /^(\d+) (\d+) (\d+) (.+)$/gm

// typeZeroPattern is for if the calibration type is 0 only
const typeZeroPattern = /^(\S+) ("[^"]*") ("[^"]*") (\S+) (d+)$/gm
const typeNonZeroPattern = /^("[^"]*") ("[^"]*") (\S+) (.+)$/gm

/**
 * **Path**: `/tbb6500/data/kalibrasyon/aikalibrasyon`
 *
 * **Example**:
 * ```txt
 * 2 0 0 -110 "0" "T1_Max_Temperature+5" 'C 130
 * 3 0 0 -110 "0" "T2_Max_Temperature+5" 'C 130
 * 4 1 0 "0" "MT_Max_Level+200" lt 0.00 4.21 1000.00 5.40 1600.00 6.60 2500.00 8.19 3400.00 9.59 4450.00 11.01 6000.00 13.00 8000.00 15.64 9600.00 17.43 10400.00 18.45 0
 * 5 1 0 "0" "T1_Max_Level+25" lt 0.00 0.09 50.00 0.73 100.00 1.88 150.00 3.03 200.00 4.05 250.00 5.12 300.00 6.27 400.00 8.50 500.00 10.63 600.00 12.85 0
 * ```
 */
export function parseCalibrationAnalogInput(content: string) {
  const inputs = []
  let match
  match = generalPattern.exec(content)

  while (match !== null) {
    const id = Number.parseInt(match[1])
    const calibType = Number.parseInt(match[2])
    const format = Number.parseInt(match[3])

    if (calibType === 0) {
      const zeroMatches = typeZeroPattern.exec(match[4])
      if (zeroMatches !== null) {
        const hat_rl = Number.parseInt(zeroMatches[1])
        const lowerLimitFormula = zeroMatches[2].replace(/"/g, '')
        const upperLimitFormula = zeroMatches[3].replace(/"/g, '')
        const unit = match[4]
        const measureValue = Number.parseInt(match[5])

        const input: CalibrationAnalogInput = {
          id,
          calibType,
          format,
          hat_rl,
          lowerLimitFormula,
          upperLimitFormula,
          unit,
          measureValue,
        }

        inputs.push(input)
      }
    } else {
      const nonZeroMatches = typeNonZeroPattern.exec(match[4])
      if (nonZeroMatches !== null) {
        const lowerLimitFormula = match[5].replace(/"/g, '')
        const upperLimitFormula = match[6].replace(/"/g, '')
        const unit = match[7]
        const [calibrationAlarmTasks, ...rest] = match[8].split(/\s+/)

        const input: CalibrationAnalogInput = {
          id,
          calibType,
          format,
          lowerLimitFormula,
          upperLimitFormula,
          unit,
          calibrationAlarmTasks: Number.parseInt(calibrationAlarmTasks),
        }

        if (calibType === 1 || calibType === 2) {
          const measureValues = []
          for (let i = 0; i < rest.length; i += 2) {
            measureValues.push({
              level: Number.parseFloat(rest[i]),
              value: Number.parseFloat(rest[i + 1]),
            })
          }
          input.measureValues = measureValues
        }

        inputs.push(input)
      }
    }

    match = generalPattern.exec(content)
  }
  return inputs
}
