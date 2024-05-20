import { set as setTimestamp } from 'date-fns'
import { BEGIN_HEADER, BEGIN_PROGRAM, FIRST_COMMAND_NO, LAST_COMMAND_NO } from './constants'
import { readLineStrict, skipLine } from './utils'
import type { Machine, MachineCommand, ParameterItem, ProgramHeader, ioListItem } from './types'

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

export function parseProgramString(programString: string, machine: Machine): ProgramHeader {
  const program: ProgramHeader = {
    name: '',
    author: null,
    comment: null,
    typeId: 0,
    createdAt: null,
    updatedAt: null,
    steps: [],
  }
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
    const command = machine.commands.find(cmd => cmd.commandNo === commandNo)
    if (!command)
      throw new Error(`unknown command ${commandNo} at machine ${machine.id}`)

    const stepIndex = Number.parseInt(match[2])

    if (stepIndex !== lastStepIndex) {
      lastStepIndex = stepIndex
      program.steps[stepIndex] = {
        mainCommand: {
          commandNo,
          ioList: parseCommandIOList(match[7], command),
          parameters: parseCommandParameters(match[8]),
        },
        parallelCommands: [],
      }
    } else {
      program.steps[stepIndex].parallelCommands.push({
        commandNo,
        ioList: parseCommandIOList(match[7], command),
        parameters: parseCommandParameters(match[8]),
      })
    }
  }

  if (!receivedLastCommand)
    throw new Error('Invalid program file, did not receive LAST_COMMAND_NO (999)')

  return program
}

function parseCommandParameters(parameter: string): ParameterItem[] {
  return parameter ? parameter.split(' ').map(item => ({ value: Number.parseFloat(item) })) : []
}

function parseCommandIOList(list: string, command: MachineCommand): ioListItem[] {
  const IO_OUTER_RE = /\[(.+?)\]/g
  const IO_SELECTION_RE = /\((\d+?,\d+?)\)/g

  const ioList: ioListItem[] = []

  for (const [index, ioMatch] of [...list.matchAll(IO_OUTER_RE)].entries()) {
    if (command.ioList[index]?.selectable) {
      const io: [number, number][] = []
      for (const ioSelectionMatch of ioMatch[1].matchAll(IO_SELECTION_RE)) {
        const [type, physicalId] = ioSelectionMatch[1].split(',').map(v => Number.parseInt(v))
        io.push([type, physicalId])
      }
    }
  }
  return ioList
}
