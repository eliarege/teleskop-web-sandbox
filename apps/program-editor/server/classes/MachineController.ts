import { TbbFtpClient } from 'tbb-ftp-client'
import type { Knex } from 'knex'
import type { MachineCommand, Program, ProgramHeader } from '../types'
import { PError } from '../error'
import { getMachineHost } from '../functions'
import { db } from '../database'

export class MachineController {
  readonly id: number
  private host: string
  private ftp: TbbFtpClient
  private trx: Knex.Transaction

  constructor(id: number, host: string) {
    this.id = id
    this.host = host
    this.ftp = new TbbFtpClient(host)
    this.trx = db as Knex.Transaction
  }

  static async create(id: number) {
    const host = await getMachineHost(id)
    return new MachineController(id, host)
  }

  async fetchCommands(): Promise<MachineCommand[]> {
    return []
  }

  async fetchAllProgramHeaders() {

  }

  async fetchProgram(programNo: number) {

  }

  async fetchRemoteProgram(programNo: number) {

  }

  async updateProgram(programNo: number, program: Program) {

  }

  async updateRemoteProgram(programNo: number, program: Program) {

  }

  async deleteProgram(programNo: number): Promise<void> {

  }

  async deleteRemoteProgram(programNo: number): Promise<void> {

  }

  async fetchRemoteProgramList(): Promise<number[]> {
    return []
  }

  async insertProgramToArchive(program: Program): Promise<void> {

  }

  async fetchAllArchivedProgramHeaders(): Promise<ProgramHeader[]> {
    return []
  }

  async loadArchivedProgram(programNo: number, versionNo: number): Promise<void> {

  }

  async getLatestProgramVersion(programNo: number): Promise<number> {

  }
}
