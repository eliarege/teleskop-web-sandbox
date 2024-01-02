import type { LockGeneral } from '../types'

/**
 *   '/tbb6500/data/locks/locks_inputs'
 * example: 0 0 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 0
 * 0 1 13 1 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 0
 * 0 7 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 0
 * 0 4 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 0
 * 0 5 52 1 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 0
 */
export function parseLine(line) {
  const regex = /"[^"]+"|\S+/g
  const parts = []
  let match

  while ((match = regex.exec(line)) !== null) {
    parts.push(match[0].replace(/"/g, ''))
  }

  const lockId = Number.parseInt(parts[0], 10)
  const inputType = Number.parseInt(parts[1], 10)
  const logicType = Number.parseInt(parts[parts.length - 1], 10)
  let inputs = []

  switch (inputType) {
    case 0: // Analog input
      inputs = parseAnalogInputs(parts.slice(2, -1))
      break
    case 1: // Digital input
      inputs = parseDigitalInputs(parts.slice(2, -1))
      break
    case 7: // Digital output
      inputs = parseDigitalOutputs(parts.slice(2, -1))
      break
    case 4: // Command
      inputs = parseCommandInputs(parts.slice(2, -1))
      break
    case 5: // Lock
      inputs = parseLockInputs(parts.slice(2, -1))
      break
    case 8: // Virtual input
      inputs = parseVirtualInputs(parts.slice(2, -1))
      break
  }

  return { lockId, inputType, inputs, logicType }
}

function parseAnalogInputs(parts) {
  const inputs = []
  for (let i = 0; i < parts.length; i += 5) {
    inputs.push({
      id: Number.parseInt(parts[i], 10),
      r1min: (parts[i + 1]),
      r2max: (parts[i + 2]),
      histerisis: (parts[i + 3]),
      state: (parts[i + 4]),
    })
  }
  return inputs
}

function parseDigitalInputs(parts) {
  const inputs = []
  for (let i = 0; i < parts.length; i += 2) {
    if (Number.parseInt(parts[i], 10) !== -1) {
      inputs.push({
        id: Number.parseInt(parts[i], 10),
        state: Number.parseInt(parts[i + 1], 10),
      })
    }
  }
  return inputs
}

function parseDigitalOutputs(parts) {
  const outputs = []
  for (let i = 0; i < parts.length; i += 2) {
    if (Number.parseInt(parts[i], 10) !== -1) {
      outputs.push({
        id: Number.parseInt(parts[i], 10),
        state: Number.parseInt(parts[i + 1], 10),
      })
    }
  }
  return outputs
}

function parseCommandInputs(parts) {
  const commands = []
  for (let i = 0; i < parts.length; i += 2) {
    if (Number.parseInt(parts[i], 10) !== -1) {
      commands.push({
        id: Number.parseInt(parts[i], 10),
        state: Number.parseInt(parts[i + 1], 10),
      })
    }
  }
  return commands
}

function parseLockInputs(parts) {
  const locks = []
  for (let i = 0; i < parts.length; i += 2) {
    if (Number.parseInt(parts[i], 10) !== -1) {
      locks.push({
        id: Number.parseInt(parts[i], 10),
        state: Number.parseInt(parts[i + 1], 10),
      })
    }
  }
  return locks
}

function parseVirtualInputs(parts) {
  const inputs = []
  for (let i = 0; i < parts.length; i += 2) {
    if (Number.parseInt(parts[i], 10) !== -1) {
      inputs.push({
        id: Number.parseInt(parts[i], 10),
        state: Number.parseInt(parts[i + 1], 10),
      })
    }
  }
  return inputs
}
