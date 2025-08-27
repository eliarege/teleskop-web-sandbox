import { TbbFtpClient } from '@teleskop/tbb-ftp-client'
import { parseProgramString } from '../parse'
import { stringifyProgram } from '../stringify'
import type { MachineCommand, Program } from '~/shared/types'

export interface ProgramClient {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  downloadProgram: (id: number, commands: MachineCommand[]) => Promise<Program | null>
  uploadProgram: (program: Program, commands: MachineCommand[]) => Promise<boolean>
  deleteProgram: (id: number) => Promise<void>
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

  async downloadProgram(programNo: number, commands: MachineCommand[]): Promise<Program | null> {
    const remoteFile = `/tbb6500/data/programs/program/${programNo}`
    const programString = await this.ftp.download(remoteFile, 'utf-8')

    return parseProgramString(programString, { id: this.id, commands: this.commandArrayToMap(commands) })
  }

  private commandArrayToMap(commands: MachineCommand[]): Map<number, MachineCommand> {
    return new Map(commands.map(cmd => [cmd.commandNo, cmd]))
  }

  async uploadProgram(program: Program, commands: MachineCommand[]): Promise<boolean> {
    const remoteFile = `/tbb6500/data/programs/program/${program.programNo}`
    const programData = stringifyProgram(program, {
      commands: this.commandArrayToMap(commands),
    })

    await this.ftp.upload(remoteFile, programData)
    return true
  }

  async deleteProgram(id: number): Promise<void> {
    const remoteFile = `/tbb6500/data/programs/program/${id}`
    await this.ftp.remove(remoteFile)
  }
}
