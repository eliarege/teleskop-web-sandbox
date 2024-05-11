const InputType = {
  AnalogInput: 0,
  DigitalInput: 1,
  DigitalOutput: 7,
  VirtualInput: 8,
  Command: 4,
  Lock: 5,
} as const
/**
 * **Path**: `/tbb6500/data/locks/locks_inputs`
 *
 * **Example**:
 * ```txt
 * 0 0 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 0
 * 0 1 13 1 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 0
 * 0 7 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 0
 * 0 4 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 0
 * 0 5 52 1 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 0
 * ```
 */
export function parseSeperatedLocks(line: string) {
  const regex = /"[^"]+"|\S+/g
  const parts = [...line.matchAll(regex)].map(p => p[0].replace(/"/g, ''))

  const lockId = Number.parseInt(parts[0], 10)
  const inputType = Number.parseInt(parts[1], 10)
  const logicType = Number.parseInt(parts[parts.length - 1], 10)
  let inputs: any[] = []

  switch (inputType) {
    case InputType.AnalogInput:
      inputs = parseAnalogInputs(parts.slice(2, -1))
      break
    case InputType.DigitalInput:
      inputs = parseDigitalInputs(parts.slice(2, -1))
      break
    case InputType.DigitalOutput:
      inputs = parseDigitalOutputs(parts.slice(2, -1))
      break
    case InputType.Command:
      inputs = parseCommandInputs(parts.slice(2, -1))
      break
    case InputType.Lock:
      inputs = parseLockInputs(parts.slice(2, -1))
      break
    case InputType.VirtualInput: // Virtual input
      inputs = parseVirtualInputs(parts.slice(2, -1))
      break
    default:
      break
  }

  return { lockId, inputType, inputs, logicType }
}

function parseAnalogInputs(parts: string[]) {
  const inputs = []
  for (let i = 0; i < parts.length; i += 5) {
    if (Number.parseInt(parts[i], 10) !== -1) {
      inputs.push({
        id: Number.parseInt(parts[i], 10),
        r1min: (parts[i + 1]),
        r2max: (parts[i + 2]),
        histerisis: (parts[i + 3]),
        state: (parts[i + 4]),
      })
    }
  }
  return inputs
}

function parseDigitalInputs(parts: string[]) {
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

function parseDigitalOutputs(parts: string[]) {
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

function parseCommandInputs(parts: string[]) {
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

function parseLockInputs(parts: string[]) {
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

function parseVirtualInputs(parts: string[]) {
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
