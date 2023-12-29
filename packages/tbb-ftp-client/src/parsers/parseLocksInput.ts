import type { LockGeneral } from '../types'

/**
 *   '/tbb6500/data/locks/locks_inputs'
 * example: 0 0 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 0
 * 0 1 13 1 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 0
 * 0 7 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 0
 * 0 4 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 0
 * 0 5 52 1 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 0
 */
const pattern = /^(\d+) (\d+) (.+)$/gim

export function parseLockInput(content: string) {
  const locks = []
  let match = pattern.exec(content)

  while (match !== null) { // match all
    const exampleLine = '56 0 3 "BK2 Max.sicaklik" "0" 0.0 2 7 "BK2 Isit Sev" "0" 0.0 3 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 0'
    const lock = parseAnalogInputs(exampleLine)
    locks.push(lock)
    match = pattern.exec(content)
  }

  return locks
}

function parseAnalogInputs(line) {
  const parts = line.split(' ').map(part => part.replace(/"/g, '')) // Split and remove quotes
  const lockId = Number.parseInt(parts[0]) + 1
  const logicType = Number.parseInt(parts[parts.length - 1])
  const analogInputs = []

  for (let i = 2; i < parts.length - 1; i += 5) {
    const id = Number.parseInt(parts[i]) + 1
    const r1min = Number.parseFloat(parts[i + 1])
    const r2max = Number.parseFloat(parts[i + 2])
    const histerisis = Number.parseFloat(parts[i + 3])
    const status = Number.parseFloat(parts[i + 4])

    analogInputs.push({ id, r1min, r2max, histerisis, status })
  }

  return { lockId, analogInputs, logicType }
}
