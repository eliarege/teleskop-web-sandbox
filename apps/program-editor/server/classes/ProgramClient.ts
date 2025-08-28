import { TbbFtpClient } from '@teleskop/tbb-ftp-client'
import { parseProgramString } from '../parse'
import { stringifyProgram } from '../stringify'
import { PError } from '../error'
import { MachineController } from './MachineController'
import type { MachineCommand, Program } from '~/shared/types'
import { ProgramStatus } from '~/shared/constants'

export interface ProgramClient {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  downloadProgram: (programNo: number) => Promise<Program | null>
  uploadProgram: (program: Program) => Promise<boolean>
  deleteProgram: (programNo: number) => Promise<void>
  fetchProgramList: () => Promise<number[]>
}

export class T7ProgramClient implements ProgramClient {
  readonly id: number
  readonly host: string
  readonly ftp: TbbFtpClient

  constructor(id: number, host: string) {
    this.id = id
    this.host = host
    this.ftp = new TbbFtpClient(host)
  }

  async connect(): Promise<void> {
    await this.ftp.connect()
  }

  async disconnect(): Promise<void> {
    this.ftp.close()
  }

  async fetchProgramList(): Promise<number[]> {
    const files = await this.ftp.list('/tbb6500/data/programs/program/')
    return files
      .map((f: any) => Number(f.name.split('.')[0]))
      .filter((n: number) => !Number.isNaN(n))
  }

  async downloadProgram(programNo: number): Promise<Program | null> {
    const remoteFile = `/tbb6500/data/programs/program/${programNo}`
    const programString = await this.ftp.download(remoteFile, 'utf-8')

    const client = new T7ProgramClient(this.id, this.host)
    const machine = new MachineController(this.id, client)
    const commands = await machine.fetchCommands()
    if (!commands.length)
      throw new PError('NO_COMMANDS_FOUND', { machineId: this.id })

    const rawProgram = parseProgramString(programString, {
      id: this.id,
      commands: this.commandArrayToMap(commands),
    })
    const program: Program = {
      ...rawProgram,
      machineId: this.id,
      programNo,
      duration: 0,
      typeName: '',
      prgState: ProgramStatus.EXISTS_ON_BOTH,
      icon: '',
      isChanged: false,
      tbbProgramChangedEvent: 0,
    }

    return program
  }

  private commandArrayToMap(commands: MachineCommand[]): Map<number, MachineCommand> {
    return new Map(commands.map(cmd => [cmd.commandNo, cmd]))
  }

  async uploadProgram(program: Program): Promise<boolean> {
    const machine = new MachineController(this.id, this)

    const commands = await machine.fetchCommands()
    if (!commands.length) {
      throw new PError('NO_COMMANDS_FOUND', { machineId: this.id })
    }

    const programPath = `/tbb6500/data/programs/program/${program.programNo}`
    const programData = stringifyProgram(program, {
      commands: this.commandArrayToMap(commands),
    })

    await this.ftp.upload(programPath, programData)

    return true
  }

  async deleteProgram(programNo: number): Promise<void> {
    const remoteFile = `/tbb6500/data/programs/program/${programNo}`
    await this.ftp.remove(remoteFile)
  }
}
