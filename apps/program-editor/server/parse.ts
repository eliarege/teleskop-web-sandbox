import { set as setTimestamp } from 'date-fns'
import type { Machine, MachineCommand, ParameterItem, ProgramHeader, ioListItem } from '../shared/types'
import { BEGIN_HEADER, BEGIN_PROGRAM, FIRST_COMMAND_NO, LAST_COMMAND_NO } from './constants'
import { PError } from './error'

const NAME_RE = /^ISIM=(.+)?$/
/** Capture groups: 1) isSet?, 2) date, 3) month, 4) year (20XX) */
const CREATED_AT_DATE_RE = /^OLUSTURMATARIH=((\d\d)\.(\d\d)\.(\d\d))?$/
/** Capture groups: 1) isSet?, 2) hours, 3) minutes, 4) seconds */
const CREATED_AT_TIME_RE = /^OLUSTURMASAAT=(([0-1]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?)?$/
/** Capture groups: 1) isSet?, 2) date, 3) month, 4) year (20XX) */
const UPDATED_AT_DATE_RE = /^DEGISIKLIKTARIH=((\d\d)\.(\d\d)\.(\d\d))?$/
/** Capture groups: 1) isSet?, 2) hours, 3) minutes, 4) seconds */
const UPDATED_AT_TIME_RE = /^DEGISIKLIKSAAT=(([0-1]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?)?$/
const AUTHOR_RE = /^YAZAR=(.+)?$/
const COMMENT_RE = /^YORUMLAR=(.+)?$/
const PROCESS_CODE_RE = /^PROCESSCODE=(\d+)?$/

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

function skipLine(it: IterableIterator<string>): void {
  it.next()
}

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

function readProgramName(it: IterableIterator<string>) {
  const match = readLineStrict(it, NAME_RE)
  return match[1] || ''
}

function readCreatedAt(it: IterableIterator<string>): Date | null {
  const dateMatch = readLineStrict(it, CREATED_AT_DATE_RE)
  let createdAt: Date | null = null
  if (dateMatch[1]) {
    createdAt = setTimestamp(new Date(), {
      date: Number.parseInt(dateMatch[2]),
      month: Number.parseInt(dateMatch[3]) - 1,
      year: 2000 + Number.parseInt(dateMatch[4]),
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    })
    const timeMatch = readLineStrict(it, CREATED_AT_TIME_RE)
    if (timeMatch[1]) {
      createdAt = setTimestamp(createdAt, {
        hours: Number.parseInt(timeMatch[2]),
        minutes: Number.parseInt(timeMatch[3]),
        seconds: Number.parseInt(timeMatch[4] || '0'),
      })
    }
  } else { // Skip CREATED_AT_TIME
    skipLine(it)
  }
  return createdAt
}

function readUpdatedAt(it: IterableIterator<string>): Date | null {
  const dateMatch = readLineStrict(it, UPDATED_AT_DATE_RE)
  let updatedAt: Date | null = null
  if (dateMatch[1]) {
    updatedAt = setTimestamp(new Date(), {
      date: Number.parseInt(dateMatch[2]),
      month: Number.parseInt(dateMatch[3]) - 1,
      year: 2000 + Number.parseInt(dateMatch[4]),
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    })
    const timeMatch = readLineStrict(it, UPDATED_AT_TIME_RE)
    if (timeMatch[1]) {
      updatedAt = setTimestamp(updatedAt, {
        hours: Number.parseInt(timeMatch[2]),
        minutes: Number.parseInt(timeMatch[3]),
        seconds: Number.parseInt(timeMatch[4] || '0'),
      })
    }
  } else { // Skip UPDATED_AT_TIME
    skipLine(it)
  }
  return updatedAt
}
function readAuthor(it: IterableIterator<string>): string | null {
  const match = readLineStrict(it, AUTHOR_RE)
  return match[1] || null
}
function readComment(it: IterableIterator<string>): string | null {
  const match = readLineStrict(it, COMMENT_RE)
  return match[1] || null
}
function readProcessCode(it: IterableIterator<string>): number {
  const match = readLineStrict(it, PROCESS_CODE_RE)
  return match[1] ? Number.parseInt(match[1]) : 0
}

export function parseProgramString(programString: string, machine: Pick<Machine, 'id' | 'commands'>): ProgramHeader {
  const program = createEmptyProgram()

  const reader = programString.split('\n')

  const it = reader[Symbol.iterator]()
  // Order is important
  readLineStrict(it, BEGIN_HEADER)
  program.name = readProgramName(it)
  program.createdAt = readCreatedAt(it)
  program.updatedAt = readUpdatedAt(it)
  program.author = readAuthor(it)
  program.comment = readComment(it)
  program.typeId = readProcessCode(it)

  readLineStrict(it, BEGIN_PROGRAM)
  readLineStrict(it, FIRST_COMMAND_NO)

  let receivedLastCommand = false
  let lastStepIndex = -1

  // Read rest of the lines via `for await`
  for (const line of it) {
    if (line === LAST_COMMAND_NO) {
      receivedLastCommand = true
      break
    }

    const match = line.match(COMMAND_PATTERN)
    if (!match)
      throw new Error(`Invalid command defined at program ${program.name}: '${line}'`)

    const commandNo = Number.parseInt(match[1])
    const command = machine.commands.get(commandNo)
    if (!command)
      throw new Error(`unknown command ${commandNo} at machine ${machine.id}`)

    const stepIndex = Number.parseInt(match[2])

    if (stepIndex !== lastStepIndex) {
      lastStepIndex = stepIndex
      program.steps[stepIndex] = {
        stepId: 0,
        mainCommand: {
          commandId: 0,
          commandNo,
          ioList: parseCommandIOList(match[7], command),
          parameters: parseCommandParameters(program.programNo, match[8], command),
        },
        parallelCommands: [],
      }
    } else {
      program.steps[stepIndex].parallelCommands.push({
        commandId: 0,
        commandNo,
        ioList: parseCommandIOList(match[7], command),
        parameters: parseCommandParameters(program.programNo, match[8], command),
      })
    }
  }

  if (!receivedLastCommand)
    throw new Error('Invalid program file, did not receive LAST_COMMAND_NO (999)')

  return program
}

function parseCommandParameters(programNo: number, parameter: string, command: MachineCommand): ParameterItem[] {
  const parameters: ParameterItem[] = []

  if (parameter) {
    const parameterValues = parameter.split(' ')
    console.log('parameter count', parameterValues.length)
    for (let index = 0; index < parameterValues.length; index++) {
      const parameterValue = parameterValues[index]
      console.log('parameter', index, parameterValue)

      const commandParameter = command.parameters.find(p => p.index === index)
      if (!commandParameter)
        throw new PError('MACHINE_PARAMETER_NOT_FOUND', { machineId: command.machineId, programNo, commandNo: command.commandNo, parameterIndex: index })

      parameters.push({
        index: commandParameter.index,
        value: Number.parseInt(parameterValue),
        optimized: false,
      })
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
    const io: ioListItem['value'] = []

    const ioSelectionMatches = [...ioMatch[1].matchAll(IO_SELECTION_RE)]
    for (const ioSelectionMatch of ioSelectionMatches) {
      const [type, physicalId] = ioSelectionMatch[1].split(',').map(v => Number.parseInt(v))
      io.push([type, physicalId])
    }

    const commandIO = command.ioList.find(io => io.index === index)

    if (!commandIO)
      throw new PError('PROGRAM_IO_NOT_FOUND', { machineId: command.machineId, programNo: 0, commandNo: command.commandNo, ioIndex: index })

    ioList.push({
      ioIndex: index,
      ioId: commandIO.physicalId,
      value: io,
    })
  }
  return ioList
}

function createEmptyProgram(): ProgramHeader {
  return {
    programNo: 0,
    duration: 0,
    updatedAtTBB: null,
    programState: 0,
    name: '',
    author: null,
    comment: null,
    typeId: 0,
    createdAt: null,
    updatedAt: null,
    steps: [],
    isChanged: false,
    tbbProgramChangedEvent: 0,
    totalChemReq: 0,
    totalDyeReq: 0,
    manChemReq: 0,
    autoChemReq: 0,
    autoDyeReq: 0,
    manDyeReq: 0,
  }
}
