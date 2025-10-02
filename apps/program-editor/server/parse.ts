import { set as setTimestamp } from 'date-fns'
import type { Machine, MachineCommand, ParameterItem, Program, ioListItem } from '../shared/types'
import { BEGIN_HEADER, BEGIN_PROGRAM, FIRST_COMMAND_NO, LAST_COMMAND_NO } from './constants'

/**
 * Capture groups:
 *
 * 1) Komut no
 * 2) Adım index
 * 3) Ek Paralel ?
 * 4) Faz Bilgisi aktif mi?
 * 5) Faz index (4 varsa)
 * 6) Faz no (4 varsa)
 * 7) IO'lar
 * 8) SP'ler
 */

const COMMAND_PATTERN = /^(\d{1,3}) F=1 P=(\d+)(?:-(\d+))?( FI=(\d+) FN=(\d+))? IO=((?:\[.+?\])*) SP=(-?\d+(?:\.\d+)?(?: -?\d+(?:\.\d+)?)*)?$/

/** Reads next line, throws if EOF or does not match pattern. */
function readLineStrict(it: IterableIterator<string>, pattern: RegExp | string): RegExpMatchArray {
  const line = it.next()
  if (line.done)
    throw new Error('Unexpected end of iterator')

  if (typeof pattern === 'string') {
    if (pattern !== line.value)
      throw new Error(`Unexpected line. Expected: ${pattern}, received: ${line.value}`)

    return [line.value]
  } else {
    const match = line.value.match(pattern)
    if (!match)
      throw new Error(`Unexpected line. Expected pattern: ${pattern}, received: ${line.value}`)

    return match
  }
}

/**
 * Flexible header parser that can handle unknown parameters gracefully
 * Reads header parameters until BEGIN_PROGRAM is encountered
 */
function parseHeaderFlexible(it: IterableIterator<string>, program: Program): string | null {
  const knownParams = new Set([
    'ISIM',
    'OLUSTURMATARIH',
    'OLUSTURMASAAT',
    'DEGISIKLIKTARIH',
    'DEGISIKLIKSAAT',
    'YAZAR',
    'YORUMLAR',
    'PROCESSCODE',
    'ADDITIONALPROCESSCODE',
  ])

  // Temporary storage for date/time parsing
  let createdAtDate: Date | null = null
  let updatedAtDate: Date | null = null

  while (true) {
    const line = it.next()
    if (line.done) {
      throw new Error('Unexpected end of file while parsing header')
    }

    // If we encounter BEGIN_PROGRAM, return it so main function can handle it
    if (line.value === BEGIN_PROGRAM) {
      return line.value
    }

    // Skip empty lines
    if (!line.value.trim()) {
      continue
    }

    // Parse parameter line: PARAMETER=VALUE
    const match = line.value.match(/^([A-Z_]+)=(.*)$/)
    if (match) {
      const [, paramName, paramValue] = match

      if (knownParams.has(paramName)) {
        // Handle known parameters
        switch (paramName) {
          case 'ISIM': {
            program.name = paramValue || ''
            break
          }

          case 'OLUSTURMATARIH': {
            const dateMatch = paramValue.match(/^((\d\d)\.(\d\d)\.(\d\d))?$/)
            if (dateMatch && dateMatch[1]) {
              createdAtDate = setTimestamp(new Date(), {
                date: Number.parseInt(dateMatch[2]),
                month: Number.parseInt(dateMatch[3]) - 1,
                year: 2000 + Number.parseInt(dateMatch[4]),
                hours: 0,
                minutes: 0,
                seconds: 0,
                milliseconds: 0,
              })
            }
            break
          }

          case 'OLUSTURMASAAT': {
            const timeMatch = paramValue.match(/^(([0-1]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?)?$/)
            if (timeMatch && timeMatch[1] && createdAtDate) {
              program.createdAt = setTimestamp(createdAtDate, {
                hours: Number.parseInt(timeMatch[2]),
                minutes: Number.parseInt(timeMatch[3]),
                seconds: Number.parseInt(timeMatch[4] || '0'),
              })
            } else if (createdAtDate) {
              program.createdAt = createdAtDate
            }
            break
          }

          case 'DEGISIKLIKTARIH': {
            const updatedDateMatch = paramValue.match(/^((\d\d)\.(\d\d)\.(\d\d))?$/)
            if (updatedDateMatch && updatedDateMatch[1]) {
              updatedAtDate = setTimestamp(new Date(), {
                date: Number.parseInt(updatedDateMatch[2]),
                month: Number.parseInt(updatedDateMatch[3]) - 1,
                year: 2000 + Number.parseInt(updatedDateMatch[4]),
                hours: 0,
                minutes: 0,
                seconds: 0,
                milliseconds: 0,
              })
            }
            break
          }

          case 'DEGISIKLIKSAAT': {
            const updatedTimeMatch = paramValue.match(/^(([0-1]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?)?$/)
            if (updatedTimeMatch && updatedTimeMatch[1] && updatedAtDate) {
              program.updatedAtTBB = setTimestamp(updatedAtDate, {
                hours: Number.parseInt(updatedTimeMatch[2]),
                minutes: Number.parseInt(updatedTimeMatch[3]),
                seconds: Number.parseInt(updatedTimeMatch[4] || '0'),
              })
            } else if (updatedAtDate) {
              program.updatedAtTBB = updatedAtDate
            }
            break
          }

          case 'YAZAR': {
            program.author = paramValue || null
            break
          }

          case 'YORUMLAR': {
            program.comment = paramValue || ''
            break
          }

          case 'PROCESSCODE': {
            program.typeId = paramValue ? Number.parseInt(paramValue) : 0
            break
          }

          case 'ADDITIONALPROCESSCODE': {
            program.additionalTypeId = paramValue ? Number.parseInt(paramValue) : 0
            break
          }
        }
      } else {
        // Handle unknown parameters - just log a warning
        console.warn(`Unknown header parameter found: ${paramName}=${paramValue}`)
      }
    } else {
      // Line doesn't match PARAMETER=VALUE format
      console.warn(`Invalid header line format: ${line.value}`)
    }
  }
}

export function parseProgramString(programString: string, machine: Pick<Machine, 'id' | 'commands'>): Program {
  const program = createEmptyProgram()

  const reader = programString.split('\n')

  const it = reader[Symbol.iterator]()

  // Parse header flexibly
  readLineStrict(it, BEGIN_HEADER)
  const beginProgramLine = parseHeaderFlexible(it, program)

  // Validate that we got the expected BEGIN_PROGRAM line
  if (beginProgramLine !== BEGIN_PROGRAM) {
    throw new Error(`Expected ${BEGIN_PROGRAM}, got: ${beginProgramLine}`)
  }
  readLineStrict(it, FIRST_COMMAND_NO)

  let receivedLastCommand = false
  let lastStepIndex = -1
  let currentStepArrayIndex = -1

  // Read rest of the lines via `for await`
  for (const line of it) {
    if (line === LAST_COMMAND_NO) {
      receivedLastCommand = true
      break
    }

    const match = line.match(COMMAND_PATTERN)
    if (!match) {
      continue
    }

    const commandNo = Number.parseInt(match[1])
    const command = machine.commands.get(commandNo)
    if (!command) {
      continue
    }

    const stepIndex = Number.parseInt(match[2])

    if (stepIndex !== lastStepIndex) {
      lastStepIndex = stepIndex
      currentStepArrayIndex++
      program.steps.push({
        stepId: 0,
        mainCommand: {
          commandId: 0,
          commandNo,
          ioList: parseCommandIOList(match[7], command),
          parameters: parseCommandParameters(program.programNo, match[8], command),
        },
        parallelCommands: [],
      })
    } else {
      if (currentStepArrayIndex >= 0 && program.steps[currentStepArrayIndex]) {
        program.steps[currentStepArrayIndex].parallelCommands.push({
          commandId: 0,
          commandNo,
          ioList: parseCommandIOList(match[7], command),
          parameters: parseCommandParameters(program.programNo, match[8], command),
        })
      }
    }
  }

  if (!receivedLastCommand)
    throw new Error('Invalid program file, did not receive LAST_COMMAND_NO (999)')

  return program
}

function parseCommandParameters(programNo: number, parameter: string, command: MachineCommand): ParameterItem[] {
  const parameters: ParameterItem[] = []
  const editableParameters = command.parameters.filter(p => p.editable)
  if (parameter) {
    const parameterValues = parameter.split(' ')
    for (let index = 0; index < parameterValues.length; index++) {
      const parameterValue = parameterValues[index]
      const commandParameter = editableParameters[index]

      if (commandParameter) {
        parameters.push({
          index: commandParameter.index,
          value: Number.parseInt(parameterValue),
          optimized: false,
        })
      }
    }
  }

  return parameters
}

function parseCommandIOList(list: string, command: MachineCommand): ioListItem[] {
  const ioList: ioListItem[] = []
  const IO_OUTER_RE = /\[(.+?)\]/g
  const IO_SELECTION_RE = /\((\d+?,\d+?)\)/g

  const ioMatches = [...list.matchAll(IO_OUTER_RE)]
  for (let index = 0; index < ioMatches.length; index++) {
    const ioMatch = ioMatches[index]
    const ioValues: ioListItem['value'] = []

    const ioSelectionMatches = [...ioMatch[1].matchAll(IO_SELECTION_RE)]
    for (const ioSelectionMatch of ioSelectionMatches) {
      const [type, physicalId] = ioSelectionMatch[1].split(',').map(v => Number.parseInt(v))
      ioValues.push([type, physicalId])
    }

    const commandIO = command.ioList.find(io => io.index === index)
    if (commandIO) {
      ioList.push({
        ioIndex: index,
        ioId: commandIO.physicalId,
        value: ioValues,
      })
    }
  }
  return ioList
}

function createEmptyProgram(): Program {
  return {
    name: '',
    icon: '',
    programNo: 0,
    duration: 0,
    author: null,
    comment: '',
    typeId: 0,
    additionalTypeId: 0,
    typeName: '',
    machineId: 0,
    steps: [],
    createdAt: null,
    updatedAt: null,
    isChanged: false,
    tbbProgramChangedEvent: 0,
    prgState: 0,
    updatedAtTBB: null,
    totalChemReq: 0,
    totalDyeReq: 0,
    manChemReq: 0,
    autoChemReq: 0,
    autoDyeReq: 0,
    manDyeReq: 0,
  }
}
