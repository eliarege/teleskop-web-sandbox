import { TbbFtpClient } from '@teleskop/tbb-ftp-client'
import type { TonelloProgram } from '@teleskop/core'
import { TonelloApi } from '@teleskop/core'
import { isDef } from '@teleskop/utils'
import { parseProgramString } from '../parse'
import { stringifyProgram } from '../stringify'
import type { ErrorMachineParameterDetail } from '../error'
import { PError } from '../error'
import logger from '../logger'
import type { MachineCommand, Program, ProgramStepCommand } from '~/shared/types'
import { ParameterType, ProgramStatus } from '~/shared/constants'

export interface ProgramClient {
  ping: () => Promise<boolean>
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  downloadProgram: (programNo: number, commands: MachineCommand[]) => Promise<Program | null>
  uploadProgram: (program: Program, commands: MachineCommand[]) => Promise<boolean>
  deleteProgram: (programNo: number) => Promise<void>
  fetchProgramList: () => Promise<number[]>
}

export class T7ProgramClient implements ProgramClient {
  readonly ftp: TbbFtpClient

  constructor(
    readonly id: number,
    readonly host: string,
  ) {
    this.ftp = new TbbFtpClient(host)
  }

  async ping(): Promise<boolean> {
    await this.ftp.connect()
    this.ftp.close()
    return true
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

    if (!programString) {
      throw new PError('PROGRAM_NOT_FOUND', { machineId: this.id, programNo })
    }

    let rawProgram: Program
    try {
      rawProgram = parseProgramString(programString, {
        id: this.id,
        commands: this.commandArrayToMap(commands),
      })
    } catch (error) {
      logger.error(`Parse error for program ${programNo} on machine ${this.id}:`, error)
      logger.error('Program content:', programString)
      throw error
    }

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

  async uploadProgram(program: Program, commands: MachineCommand[]): Promise<boolean> {
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

export class TonelloProgramClient implements ProgramClient {
  private api: TonelloApi

  constructor(
    readonly id: number,
    readonly host: string,
  ) {
    this.api = new TonelloApi(`http://${host}:1234`)
  }

  async ping(): Promise<boolean> {
    await this.api.fetchDatetime()
    return true
  }

  async connect(): Promise<void> {
    // noop
  }

  async disconnect(): Promise<void> {
    // noop
  }

  async downloadProgram(
    id: number,
    commands: MachineCommand[],
  ): Promise<Program | null> {
    const { data: tonelloProgram } = await this.api.fetchProgram(id)
    const teleskopProgram: Program = {
      name: tonelloProgram.name,
      author: '',
      comment: tonelloProgram.description,
      steps: [],
      machineId: this.id,
      programNo: id,
      typeId: 0,
      additionalTypeId: 0,
      duration: 0,
      typeName: '',
      prgState: ProgramStatus.EXISTS_ON_BOTH,
      icon: '',
      isChanged: false,
      createdAt: new Date(), // TODO
      updatedAt: new Date(), // TODO
      updatedAtTBB: null,
      tbbProgramChangedEvent: 0,
      autoChemReq: 0,
      autoDyeReq: 0,
      manChemReq: 0,
      manDyeReq: 0,
      totalChemReq: 0,
      totalDyeReq: 0,
      saltReq: 0,
      genericMat1Req: 0,
      genericMat2Req: 0,
    }
    for (const tonelloStep of tonelloProgram.steps) {
      const cmd: ProgramStepCommand = {
        commandId: 0,
        commandNo: tonelloStep.index,
        parameters: [],
        ioList: [],
      }
      teleskopProgram.steps.push({
        stepId: 0,
        mainCommand: cmd,
        parallelCommands: [],
      })
      const cmdDef = commands.find(cmd => cmd.commandNo === tonelloStep.index)
      if (!cmdDef) {
        continue
      }
      for (let i = 0; i < cmdDef.parameters.length; i++) {
        const paramDef = cmdDef.parameters[i]
        if (!isDef(paramDef.valueIndex)) {
          throw new PError('MACHINE_PARAMETER_INVALID', {
            machineId: this.id,
            programNo: id,
            commandNo: cmd.commandNo,
            parameterIndex: paramDef.index,
            reason: 'Tonello parameters require valueIndex to be set',
          })
        }

        const value = paramDef.type === ParameterType.CHECKBOX
          ? tonelloStep.params.bits[paramDef.valueIndex]
          : tonelloStep.params.values[paramDef.valueIndex]

        cmd.parameters.push({
          index: i,
          value,
          optimized: false,
        })
      }
    }

    return teleskopProgram
  }

  async uploadProgram(
    program: Program,
    commands: MachineCommand[],
  ): Promise<boolean> {
    const tonelloProgram: TonelloProgram = {
      // TODO: Tonnelo'ya sorulacak numara mı olacak bu diye
      code: program.programNo,
      name: program.name,
      description: program.comment || '',
      type: 'program',
      params: [],
      stepsCount: program.steps.length,
      steps: program.steps.map((s, i) => ({
        step: i + 1,
        index: s.mainCommand.commandNo,
        version: 0,
        params: {
          bits: Array.from<0 | 1>({ length: 16 }).fill(0),
          values: Array.from<number>({ length: 64 }).fill(0),
        },
      })),
    }

    for (let i = 0; i < program.steps.length; i++) {
      const step = program.steps[i]
      const tonelloStep = tonelloProgram.steps[i]
      const cmd = step.mainCommand
      const cmdDef = commands.find(c => c.commandNo === cmd.commandNo)
      if (!cmdDef) {
        throw new PError('COMMAND_NOT_FOUND', {
          machineId: program.machineId,
          programNo: program.programNo,
          commandNo: cmd.commandNo,
        })
      }
      for (const param of cmd.parameters) {
        const paramDef = cmdDef.parameters.find(p => p.index === param.index)
        const paramDetails: ErrorMachineParameterDetail = {
          machineId: program.machineId,
          programNo: program.programNo,
          commandNo: cmd.commandNo,
          parameterIndex: param.index,
        }
        if (!paramDef) {
          throw new PError('MACHINE_PARAMETER_NOT_FOUND', paramDetails)
        }
        if (!isDef(paramDef.valueIndex)) {
          throw new PError('MACHINE_PARAMETER_INVALID', {
            ...paramDetails,
            reason: 'Tonello parameters require valueIndex to be set',
          })
        }
        if (paramDef.type !== ParameterType.CHECKBOX) {
          if (typeof param.value !== 'number') {
            throw new PError('MACHINE_PARAMETER_TYPE_ERROR', {
              ...paramDetails,
              expected: 'number',
            })
          }
          tonelloStep.params.values[paramDef.valueIndex] = param.value
        } else {
          tonelloStep.params.bits[paramDef.valueIndex] = param.value ? 1 : 0
        }
      }
    }

    await this.api.updateProgram(tonelloProgram)
    return true
  }

  async fetchProgramList(): Promise<number[]> {
    const list = await this.api.fetchProgramsList()
    return list.programs.map(p => Number(p.code))
  }

  async deleteProgram(_id: number): Promise<void> {
    // NOT IMPLEMENTED
  }
}
