import { TbbFtpClient } from 'tbb-ftp-client'
import type { Knex } from 'knex'
import { getMachineHost, hasMachine } from '../functions'
import { db } from '../database'
import { withFTP, withTransaction } from '../decorators'
import { sql } from '../sql'
import { stringifyProgram } from '../stringify'
import { parseProgramString } from '../parse'
import { PError } from '../error'
import type { BatchParameter, CommandFormula, CommandIO, Machine, MachineCommand, MachineConstant, Program, ProgramHeader, ProgramStep, ProgramStepCommand, SelectionArchiveList, SelectionList, StepArchiveInputOutput, StepArchiveItem, StepArchiveParameter, StepInputOutput, StepItem, StepParameter } from '~/shared/types'
import { ProgramStatus } from '~/shared/constants'
import { calculateProgramDuration } from '~/shared/formula'

export class MachineController {
  readonly id: number
  readonly host: string
  readonly ftp: TbbFtpClient
  readonly trx: Knex.Transaction

  constructor(id: number, host: string) {
    this.id = id
    this.host = host
    this.ftp = new TbbFtpClient(host)
    this.trx = db as Knex.Transaction
  }

  static async create(id: number) {
    await hasMachine(id)
    const host = await getMachineHost(id)
    return new MachineController(id, host)
  }

  /**
   * COMMANDTYPE (0,3)
   * 0 ana
   * 3 parallel
   * analar parallel eklenir
   * paralleller ana olamamaz.
   * DONTUSELIST (liste) - bos olabilir - (-1) ise null getir
   * MOVEPARALLEL (0,1,2) - Program yazarken sonraki adıma taşıma
   *
   *
   * Makine id numarasına göre makinenin komutlarını getirir
   * @returns {Promise<Array<MachineCommand>>} - MachineCommand dizisi
   */
  @withTransaction
  async fetchCommands(editable?: boolean, selectable?: boolean): Promise<MachineCommand[]> {
    const commandsOutput = await this.trx
      .select({
        machineId: 'C.MACHINEID',
        commandNo: 'C.COMMANDNO',
        name: 'C.NAME',
        icon: 'C.ICON',
        adviceList: this.trx.raw(sql`(C.ADVICELIST)`),
        dontUseList: this.trx.raw(sql`(NULLIF (C.DONTUSELIST , '-1'))`),
        isRunManual: 'C.ISRUNMANUAL',
        commandType: 'C.COMMANDTYPE',
        moveParallel: 'C.MOVEPARALLEL',
        x: 'C.X',
        y: 'C.Y',
        a: 'C.A',
        maxA: 'C.MAXA',
        b: 'C.B',
        isTemperature: 'C.ISTEMPERATURE',
        isUnload: 'C.ISUNLOAD',
        parameters: this.trx.raw(sql`
        ISNULL((
          SELECT
            P.PARAMETERINDEX as [index],
            P.PARAMSTRING as name,
            P.PROGRAMEDITING as editable,
            type = ISNULL(
              CASE
                WHEN P.TBBFORMUL = 1 THEN 'MACHINE_FORMULA'
                WHEN P.USEFORMULA = 1 THEN 'SELECTABLE_FORMULA'
                WHEN P.PARAMETERTYPE = 0 THEN 'NUMBER'
                WHEN P.PARAMETERTYPE = 1 THEN 'SELECT'
              END
            ,'[]'),
            format = ISNULL(
              CASE P.TEMPERATURE
                WHEN 0 THEN 'NONE'
                WHEN 1 THEN 'TEMPERATURE'
                ELSE 'DURATION'
              END
            , '[]'),
            P.VALUE as [value],
            P.PARAMLOWLIMIT as minValue,
            P.PARAMHIGHLIMIT as maxValue,
            P.CONTAINSVARIABLE as containsVariable,
            P.USEDEFAULT as useDefault,
            P.USEFORMULA as useFormula,
            selections = ISNULL((
              SELECT
                TRIM(SUBSTRING(l.value, 2, LEN(l.value) - 2)) as name,
                CAST(TRIM(SUBSTRING(v.value, 2, LEN(v.value) - 2)) as int) as value
              FROM (values (1)) t(x)
              JOIN STRING_SPLIT(REPLACE(P.SELECTIONLIST, '" "', '"&"'), '&', 1) l on 1=1
              JOIN STRING_SPLIT(REPLACE(P.SELECTIONVALUES, '" "', '"&"'), '&', 1) v on l.ordinal = v.ordinal
              WHERE P.PARAMETERTYPE = 1 AND P.SELECTIONLIST != '' AND P.SELECTIONVALUES != ''
              FOR JSON AUTO, INCLUDE_NULL_VALUES
            ), '[]')
          FROM BFCOMMANDPARAMETERS P
          WHERE C.COMMANDNO = P.COMMANDNO AND C.MACHINEID = P.MACHINEID
          ${typeof editable === 'boolean' ? `${editable ? 'AND P.PROGRAMEDITING = 1' : ''}` : ''}
          ORDER BY P.PARAMETERINDEX
          FOR JSON AUTO, INCLUDE_NULL_VALUES
        ), '[]')
      `),
        ioList: this.trx.raw(sql`
        ISNULL((
          SELECT
            IO.IOINDEX as [index],
            IO.IOID as [physicalId],
            IO.IOTYPE as [type],
            selectable =
              CAST(
                CASE IO.IOTYPE
                  WHEN 5 THEN 1
                  ELSE 0
                END
              as bit),
            IO.NAME as [name],
            selections = ISNULL((
              SELECT
                SL.SELECTINDEX as [index],
                SL.IOTYPE + 1 as [type],
                SL.NAME as [name],
                SL.ISDEFAULT as [defaultValue],
                SL.IOID as [physicalId]
              FROM BFCOMMANDSELECTIONLIST SL
              WHERE SL.IOINDEX = IO.IOINDEX AND SL.COMMANDNO = IO.COMMANDNO AND SL.MACHINEID = IO.MACHINEID
              FOR JSON AUTO, INCLUDE_NULL_VALUES
            ), '[]')
          FROM BFCOMMANDINPUTOUTPUTS IO
          WHERE C.COMMANDNO = IO.COMMANDNO AND C.MACHINEID = IO.MACHINEID ${selectable ? 'AND IO.IOTYPE = 5' : ''}
          FOR JSON AUTO, INCLUDE_NULL_VALUES
        ), '[]')
      `),
      })
      .from('BFMASTERCOMMANDS AS C')
      .where('C.MACHINEID', this.id)
      .orderBy('C.COMMANDNO')

    for (const cmd of commandsOutput) {
      cmd.dontUseList = cmd.dontUseList?.split(',').map(Number) || []
      cmd.parameters = JSON.parse(cmd.parameters)
      cmd.ioList = JSON.parse(cmd.ioList)
    }

    return commandsOutput as MachineCommand[]
  }

  @withTransaction
  async getCommandsAsList(): Promise<any[]> {
    return await this.trx
      .select({
        value: 'C.COMMANDNO',
        name: 'C.NAME',
      })
      .from('BFMASTERCOMMANDS AS C')
      .where('C.MACHINEID', this.id)
      .orderBy('C.COMMANDNO')
  }

  /**
   * Makinenin tüm programlarının headers'larını getirir
   * @returns {Promise<Array<ProgramHeader>>} - ProgramHeader dizisi
   */
  @withTransaction
  async fetchAllProgramHeaders(query?: any): Promise<ProgramHeader[]> {
    const config = useRuntimeConfig()

    const headers = await this.trx
      .select({
        programNo: 'H.PROGNO',
        name: 'H.NAME',
        duration: 'H.DURATION',
        stepCount: 'H.TOTALSTEP',
        type: 'T.PROCESSNAME',
        operator: 'H.TBBPRGCHANGEDEVENT',
        updatedAt: this.trx.raw(sql`DATEADD(MINUTE, ${config.teleskopTimezoneOffset} , H.CHANGEDATE)`),
        updatedAtTBB: this.trx.raw(sql`DATEADD(MINUTE, ${config.teleskopTimezoneOffset} , H.TBBCHANGEDATE)`),
        programState: 'H.PRGSTATE',
        isChanged: 'H.ISCHANGED',
      })
      .from('BFMASTERPRGHEADER AS H')
      .join('BFPROCESSTYPES AS T', 'T.PROCESSCODE', 'H.PROCESSCODE')
      .where('H.MACHINEID', this.id)
      .andWhere((builder) => {
        if (query?.programNo)
          builder.where('H.PROGNO', Number(query.programNo))
        if (query?.programName)
          builder.whereLike('H.NAME', `%${query.programName}%`)
        if (query?.processType)
          builder.where('H.PROCESSCODE', Number(query.processType))
      })

    return headers
  }

  /**
   * Makinenin tüm programlarının headers'larını getirir
   * @returns {Promise<Array<[string, string]>>} - Header dizisi
   */
  @withTransaction
  async getProgramHeadersAsList(): Promise<Array<[string, string]>[]> {
    return await this.trx
      .select({
        value: 'H.PROGNO',
        name: 'H.NAME',
      })
      .from('BFMASTERPRGHEADER AS H')
      .where('H.MACHINEID', this.id)
  }

  /**
   * Makinenin tüm programlarını makineye yükler
   * @returns {Promise<void>}
   */
  @withTransaction @withFTP
  async uploadAllProgramsToMachine(): Promise<void> {
    const programNoList = await this.getLocalMachineProgramList()
    for (const programNo of programNoList) {
      const program = await this.fetchProgram(programNo)
      await this.uploadProgram(program)
    }
  }

  /**
   * Makinenin tüm programlarının numaralarını getirir
   * @returns {Promise<Array<number>>} - Program numarası dizisi
   */
  @withTransaction
  async getLocalMachineProgramList(): Promise<number[]> {
    const programNoList = await this.trx
      .select('PROGNO as programNo')
      .from('BFMASTERPRGHEADER')
      .where('MACHINEID', this.id)
    const result = programNoList.map(item => item.programNo)
    return result
  }

  /**
   * Makine id numarasına göre makinenin belirli bir programını getirir
   * @param {number} programNo - Program numarası
   * @returns {Promise<Program>} - Program
   */
  @withTransaction
  async fetchProgram(programNo: number): Promise<Program> {
    const exists = await this.hasProgram(programNo)
    if (!exists) {
      throw new PError('PROGRAM_NOT_FOUND', { machineId: this.id, programNo })
    }

    const [program] = await this.trx
      .select({
        name: 'P.NAME',
        icon: this.trx.raw('CASE P.ICONNAME WHEN \'\' THEN \'null\' END'),
        programNo: 'P.PROGNO',
        duration: 'P.DURATION',
        author: 'P.LOCKEDBY',
        comment: 'P.USERCOMMENT',
        typeId: 'T.PROCESSCODE',
        typeName: 'T.PROCESSNAME',
        machineId: 'M.MACHINEID',
        programState: 'P.PRGSTATE',
        createdAt: 'P.CREATIONDATE',
        updatedAt: 'P.CHANGEDATE',
        updatedAtTBB: 'P.TBBCHANGEDATE',
        machineName: 'M.MACHINECODE',
        tbbProgramChangedEvent: this.trx.raw(sql`CASE P.TBBPRGCHANGEDEVENT WHEN 0 THEN 0 ELSE 1 END`),
        steps: this.trx.raw(sql`ISNULL((
        SELECT commands = ISNULL((
          SELECT s2.COMMANDNO AS commandNo,
          parameters = ISNULL((
            SELECT TRY_CAST(REPLACE(sp.VALUE, ',', '.')  AS FLOAT) AS value, sp.PARAMETERINDEX AS [index]
            FROM BFMASTERSTEPPARAMS sp
            WHERE s2.MACHINEID = sp.MACHINEID
              AND s2.PROGNO = sp.PROGNO
              AND s2.MAINSTEP = sp.MAINSTEP
              AND s2.PARALELSTEP = sp.PARALELSTEP
            ORDER BY sp.PARAMETERINDEX
            FOR JSON AUTO, INCLUDE_NULL_VALUES
          ), '[]'),
          ioList = ISNULL((
            SELECT sio.IOID AS ioId, sio.IOINDEX AS ioIndex,
            value = ISNULL((
              SELECT '[' + STRING_AGG('[' + CAST(sel.IOTYPE + 1 AS VARCHAR) + ',' + CAST(sel.SELECTEDIOID AS VARCHAR) + ']', ',') + ']'
                FROM BFMASTERSTEPSELECTIONLIST sel
                WHERE sel.MACHINEID = sio.MACHINEID
                  AND sel.PROGNO = sio.PROGNO
                  AND sel.MAINSTEP = sio.MAINSTEP
                  AND sel.PARALELSTEP = sio.PARALELSTEP
                  AND sel.IOINDEX = sio.IOINDEX
            ), '[]')
            FROM BFMASTERSTEPINPUTOUTPUTS sio
            WHERE s2.MACHINEID = sio.MACHINEID
              AND s2.PROGNO = sio.PROGNO
              AND s2.MAINSTEP = sio.MAINSTEP
              AND s2.PARALELSTEP = sio.PARALELSTEP
            ORDER BY sio.IOINDEX
            FOR JSON AUTO, INCLUDE_NULL_VALUES
          ), '[]')
          FROM BFMASTERSTEPS s2
          WHERE s.MACHINEID = s2.MACHINEID
            AND s.PROGNO = s2.PROGNO
            AND s.MAINSTEP = s2.MAINSTEP
          ORDER BY s2.PARALELSTEP
          FOR JSON AUTO, INCLUDE_NULL_VALUES
        ), '[]')
        FROM BFMASTERSTEPS s
        WHERE P.MACHINEID = s.MACHINEID
          AND P.PROGNO = s.PROGNO
          AND s.PARALELSTEP = 0
        ORDER BY s.MAINSTEP
        FOR JSON AUTO, INCLUDE_NULL_VALUES
        ), '[]')`),
      })
      .from('BFMASTERPRGHEADER AS P')
      .join('BFMACHINES AS M', 'M.MACHINEID', 'P.MACHINEID')
      .join('BFPROCESSTYPES AS T', 'T.PROCESSCODE', 'P.PROCESSCODE')
      .where('P.PROGNO', programNo)
      .andWhere('M.MACHINEID', this.id)

    program.steps = JSON.parse(program.steps)

    for (const step of program.steps)
      for (const command of step.commands)
        for (const io of command.ioList)
          io.value = JSON.parse(io.value)

    // Sets the program as mainCommand and parallelCommand
    for (let i = 0; i < program.steps.length; i++) {
      const step = program.steps[i]
      const [mainCommand, ...parallelCommands] = step.commands as ProgramStepCommand[]
      const newStep: ProgramStep = { stepId: step.stepId, mainCommand, parallelCommands }
      program.steps[i] = newStep
    }

    return program
  }

  /**
   * Program numarası ve versiyon numarasına göre arşivlenmiş programı getirir
   * @param {number} programNo - Program numarası
   * @param {number} versionNo - Program versiyon numarası
   * @returns {Promise<Program>} - Program
   */
  @withTransaction
  async fetchArchivedProgram(programNo: number, versionNo: number): Promise<Program> {
    const exists = await this.hasProgram(programNo)
    if (!exists) {
      throw new PError('PROGRAM_FAILED_TO_LOAD', { machineId: this.id, programNo })
    }

    const [archivedProgram] = await this.trx
      .select({
        name: 'P.NAME',
        icon: this.trx.raw('CASE P.ICONNAME WHEN \'\' THEN \'null\' END'),
        programNo: 'P.PROGNO',
        author: 'P.USERNAME',
        command: 'P.USERCOMMENT',
        typeId: 'T.PROCESSCODE',
        typeName: 'T.PROCESSNAME',
        machineId: 'M.MACHINEID',
        machineName: 'M.MACHINECODE',
        steps: this.trx.raw(sql`ISNULL((
        SELECT commands = ISNULL((
          SELECT s2.COMMANDNO AS commandNo,
          parameters = ISNULL((
            SELECT TRY_CAST(REPLACE(sp.VALUE, ',', '.')  AS FLOAT) AS value, sp.PARAMETERINDEX AS [index]
            FROM BAMASTERSTEPPARAMS sp
            WHERE s2.MACHINEID = sp.MACHINEID
              AND s2.PROGNO = sp.PROGNO
              AND s2.MAINSTEP = sp.MAINSTEP
              AND s2.PARALELSTEP = sp.PARALELSTEP
              AND s2.MACHINEPRGVERSIONNO = sp.MACHINEPRGVERSIONNO
            ORDER BY sp.PARAMETERINDEX
            FOR JSON AUTO, INCLUDE_NULL_VALUES
          ), '[]'),
          ioList = ISNULL((
            SELECT sio.IOID AS ioId, sio.IOINDEX AS ioIndex,
            value = ISNULL((
              SELECT '[' + STRING_AGG('[' + CAST(sel.IOTYPE + 1 AS VARCHAR) + ',' + CAST(sel.SELECTEDIOID AS VARCHAR) + ']', ',') + ']'
              FROM BAMASTERSTEPSELECTIONLIST sel
              WHERE sel.MACHINEID = sio.MACHINEID
                AND sel.PROGNO = sio.PROGNO
                AND sel.MAINSTEP = sio.MAINSTEP
                AND sel.PARALELSTEP = sio.PARALELSTEP
                AND sel.IOINDEX = sio.IOINDEX
                AND sel.MACHINEPRGVERSIONNO = sio.MACHINEPRGVERSIONNO
            ), '[]')
            FROM BAMASTERSTEPINPUTOUTPUTS sio
            WHERE s2.MACHINEID = sio.MACHINEID
              AND s2.PROGNO = sio.PROGNO
              AND s2.MAINSTEP = sio.MAINSTEP
              AND s2.PARALELSTEP = sio.PARALELSTEP
              AND s2.MACHINEPRGVERSIONNO = sio.MACHINEPRGVERSIONNO
            ORDER BY sio.IOINDEX
            FOR JSON AUTO, INCLUDE_NULL_VALUES
          ), '[]')
          FROM BAMASTERSTEPS s2
          WHERE s.MACHINEID = s2.MACHINEID
            AND s.PROGNO = s2.PROGNO
            AND s.MAINSTEP = s2.MAINSTEP
            AND s.MACHINEPRGVERSIONNO = s2.MACHINEPRGVERSIONNO
          ORDER BY s2.PARALELSTEP
          FOR JSON AUTO, INCLUDE_NULL_VALUES
        ), '[]')
        FROM BAMASTERSTEPS s
        WHERE P.MACHINEID = s.MACHINEID
          AND P.PROGNO = s.PROGNO
          AND s.PARALELSTEP = 0
          AND P.MACHINEPRGVERSIONNO = s.MACHINEPRGVERSIONNO
        ORDER BY s.MAINSTEP
        FOR JSON AUTO, INCLUDE_NULL_VALUES
        ), '[]')`),
      })
      .from('BAMASTERPRGHEADER AS P')
      .join('BFMACHINES AS M', 'M.MACHINEID', 'P.MACHINEID')
      .join('BFPROCESSTYPES AS T', 'T.PROCESSCODE', 'P.PROCESSCODE')
      .where('P.PROGNO', programNo)
      .andWhere('M.MACHINEID', this.id)
      .andWhere('P.MACHINEPRGVERSIONNO', versionNo)

    archivedProgram.steps = JSON.parse(archivedProgram.steps)

    for (const step of archivedProgram.steps)
      for (const command of step.commands)
        for (const io of command.ioList)
          io.value = JSON.parse(io.value)

    // Sets the program as mainCommand and parallelCommand
    for (let i = 0; i < archivedProgram.steps.length; i++) {
      const step = archivedProgram.steps[i]
      const [mainCommand, ...parallelCommands] = step.commands as ProgramStepCommand[]
      const newStep: ProgramStep = { stepId: step.stepId, mainCommand, parallelCommands }
      archivedProgram.steps[i] = newStep
    }

    return archivedProgram
  }

  /**
   * Programın veritabanında var olup olmadığını kontrol eder
   * @param {number} programNo - Program numarası
   * @returns {Promise<boolean>} - Programın var olup olmadığını belirten bir Promise
   */
  @withTransaction
  async hasProgram(programNo: number): Promise<boolean> {
    const result = await this.trx
      .first('P.PROGNO')
      .from('BFMASTERPRGHEADER AS P')
      .where('P.PROGNO', programNo)
      .andWhere('P.MACHINEID', this.id)
    return !!result
  }

  /**
   * Kullanımda olan ve teleskop kullanımına izin verilen tüm makinelerin listesini getirir
   * @returns {Promise<MachineInfo[]>} - Makine dizisi içeren bir Promise
   */
  // @withTransaction
  // async fetchAllMachines(): Promise<MachineInfo[]> {
  //   const machines = await this.trx
  //     .select('MACHINEID AS id', 'MACHINECODE AS name')
  //     .from('BFMACHINES')
  //     .where('INUSE', 1)
  //     .andWhere('USEINTELESKOP', 1)

  //   await Promise.all(
  //     machines.map(async (machine) => {
  //       machine.commands = await this.fetchCommands(machine.id)
  //     }),
  //   )

  //   return machines
  // }

  /**
   * Belirtilen programı makineye yükler
   * @param {Program} program - Yüklenmek istenen program
   * @returns {Promise<boolean>} - Yükleme işleminin başarılı olup olmadığını belirten bir Promise
   */
  @withFTP
  async uploadProgram(program: Program): Promise<boolean | Error> {
    try {
      // FIXME:
      // Code below line does not give error in the case that teleskop has not have program but machine has program.
      // It should return false 'cause program already exists on machine so it cannot be uploaded to machine
      const exists = await this.hasProgram(program.programNo)
      if (exists)
        await this.deleteProgramFromDatabase(program.programNo)
      program.programState = ProgramStatus.EXISTS_ON_BOTH
      program.updatedAtTBB = this.getTimezoneDate()
      program.updatedAt = this.getTimezoneDate()
      await this.insertProgram(program)
      // TODO: Look again. hasProgram() not looks that good.
      await this.ftp.upload(`/tbb6500/data/programs/program/${program.programNo}`, stringifyProgram(program))

      return true
    } catch (err) {
      if (isError(err)) {
        if (err.code === 'ECONNREFUSED' || err.code === 'EHOSTUNREACH') {
          return createError({
            statusCode: 502,
            name: err.code,
            statusMessage: 'Failed to connect to FTP server',
          })
        }
      }
      console.log('An error occured during sending program(s) to machine')
      return false
    }
  }

  isError(err: unknown): err is NodeJS.ErrnoException {
    return err instanceof Error
  }

  /**
   * Belirtilen program numarasına sahip programı sunucudan indirir
   * @param {number} programNo - Indirilmek istenen program numarası
   * @returns {Promise<Program | null>} - İndirilen programı içeren bir Promise
   */
  @withFTP
  @withTransaction
  async fetchRemoteProgram(programNo: number): Promise<Program | null> {
    const exists = await this.doesMachineHaveProgram(programNo)
    if (!exists) {
      throw new PError('PROGRAM_NOT_FOUND', { machineId: this.id, programNo })
    }

    const programString = await this.ftp.download(`/tbb6500/data/programs/program/${programNo}`, 'utf-8')
    const machine = await this.getMachineInfo()

    const rawProgram = parseProgramString(programString, machine)
    const program: Program = {
      ...rawProgram,
      machineId: this.id,
      machineName: machine.name,
      programNo,
      duration: 0,
      typeName: '',
      programState: ProgramStatus.EXISTS_ON_BOTH,
      icon: '',
      isChanged: false,
      createdAt: this.getTimezoneDate(),
      updatedAt: this.getTimezoneDate(),
      updatedAtTBB: this.getTimezoneDate(),
      tbbProgramChangedEvent: 0,
    }
    await this.updateProgram(program)
    return program
  }

  /**
   * Belirtilen programın makinede bulunup bulunmadığını kontrol eder
   * @param {number} programNo - Kontrol edilmek istenen program numarası
   * @returns {Promise<boolean>} - Programın var olup olmadığını belirten bir Promise
   */
  @withFTP
  async doesMachineHaveProgram(programNo: number): Promise<boolean> {
    const programList = await this.ftp.fetchProgramList()
    return programList.includes(programNo)
  }

  /**
   * Makine bilgilerini getirir
   * @returns {Promise<Machine>} - Makine bilgilerini içeren bir Promise
   */
  @withTransaction
  async getMachineInfo(_editable?: boolean): Promise<Omit<Machine, 'commands'> & { commands: MachineCommand[] }> {
    await hasMachine(this.id)
    const [{ name }] = await this.trx
      .select('MACHINECODE as name')
      .from('BFMACHINES')
      .where('MACHINEID', this.id)
    const commands = await this.fetchCommands()
    const batchParameters = await this.fetchBatchParameters()
    const constants = await this.fetchMachineConstants()
    const commandFormulas = await this.fetchCommandFormulas()
    return { id: this.id, name, commands, constants, commandFormulas, batchParameters }
  }

  /**
   * Programı günceller
   * @param {Program} program - Güncellenmek istenen program
   */
  @withTransaction
  async updateProgram(program: Program) {
    const isDeleted = await this.deleteProgramFromDatabase(program.programNo)
    if (isDeleted) {
      if (program.programState !== ProgramStatus.EXISTS_ONLY_ON_CONTROLLER)
        program.isChanged = true
      await this.insertProgram(program)
    }
    return isDeleted
  }

  /**
   * Zaman dilimine göre tarih ve saat döndürür
   * @returns {Date} - Zaman dilimine göre tarih ve saat
   */
  getTimezoneDate(): Date {
    return new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
  }

  /**
   * Arsiv programının tarihini günceller
   * @param {number} programNo - Güncellenecek programın program numarası
   * @returns {Promise<number | null>} - Güncellenen programı içeren bir Promise
   */
  @withTransaction
  private async updateLastProgramDate(programNo: number): Promise<number | null> {
    const version = await this.getLastVersion(programNo)

    if (version) {
      await this.trx
        .from('BAMASTERPRGHEADER')
        .where('MACHINEID', this.id)
        .andWhere('PROGNO', programNo)
        .andWhere('MACHINEPRGVERSIONNO', version)
        .update({ RELEASEENDDATE: this.getTimezoneDate() })
      return version
    } else {
      return null
    }
  }

  /**
   * Belirtilen program numarasına ait son versiyonunu döndürür
   * @param {number} programNo - Son versiyonu alınacak programın numarası
   * @returns {Promise<number>} - Belirtilen program numarasına ait son versiyon numarasını içeren bir Promise
   */
  @withTransaction
  async getLastVersion(programNo: number): Promise<number | null> {
    const program = await this.trx
      .from('BAMASTERPRGHEADER')
      .select('MACHINEPRGVERSIONNO as version')
      .where('MACHINEID', this.id)
      .andWhere('PROGNO', programNo)
      .orderBy('MACHINEPRGVERSIONNO', 'desc')
      .first()
    return program?.version
  }

  /**
   * Belirtilen programın belirtilen versiyonunu siler
   * @param {number} programNo - Silinecek programın numarası
   * @param {number} versionNo - Silinecek programın versiyon numarası
   * @returns {Promise<boolean>} - Silinen program
   */
  @withTransaction
  async deleteVersion(programNo: number, versionNo: number): Promise<boolean> {
    return await this.trx
      .from('BAMASTERPRGHEADER')
      .where('MACHINEID', this.id)
      .andWhere('PROGNO', programNo)
      .andWhere('MACHINEPRGVERSIONNO', versionNo)
      .del()
  }

  /**
   * Programı arşiv veritabanına ekler
   * @param program - Program objesi
   * @returns {Promise<void>}
   */
  @withTransaction
  async insertProgramToArchive(program: Program): Promise<void> {
    const lastVersion = await this.updateLastProgramDate(program.programNo)
    const commands: MachineCommand[] = await this.fetchCommands()

    const config = useRuntimeConfig()
    const timezone = Number(config.teleskopTimezoneOffset)
    const date = new Date(new Date().getTime() - timezone * 60000).toISOString()

    const stepsArchive: StepArchiveItem[] = []
    const parametersArchive: StepArchiveParameter[] = []
    const stepIOArchive: StepArchiveInputOutput[] = []
    const ioSelectionArchive: SelectionArchiveList[] = []

    // BAMASTERPRGHEADER
    const headerArchive = [{
      MACHINEID: this.id,
      MACHINEPRGVERSIONNO: lastVersion ? lastVersion + 1 : 1,
      RELEASEDATE: date,
      RELEASEENDDATE: null,
      PROGNO: program.programNo,
      PROCESSCODE: program.typeId,
      NAME: program.name,
      DURATION: program.duration,
      TOTALSTEP: program.steps.length,
      CHANGEDATE: date,
      TBBCHANGESOURCE: '',
      TBBCHANGEDATE: '',
      CREATIONDATE: program.createdAt ? program.createdAt : date,
      USERCOMMENT: program.comment,
      USERNAME: program.author, // ?
      CHANGETIME: date, // ?
      WHATCHANGE: '', // ?
      PRGSOURCE: 0, // ?
      TotalChemReq: 0,
      TotalDyeReq: 0,
      ManChemReq: 0,
      AutoChemReq: 0,
      AutoDyeReq: 0,
      ManDyeReq: 0,
      DefaultRecipeNo: '',
      ICONNAME: program.icon,
      ORDEROFREQUESTS: '',
      TOTALSALTREQ: 0,
      TOTALGM1REQ: 0,
      TOTALGM2REQ: 0,
      PHASEVERSION: 1,
      INTERVENTIONFREEPROGRAM: 0,
    }]

    program.steps.forEach((step, i) => {
      const mainIOList = this.getSelectableIO(step.mainCommand.commandNo, commands)

      // BAMASTERSTEPS
      stepsArchive.push({
        MACHINEID: this.id,
        MACHINEPRGVERSIONNO: lastVersion ? lastVersion + 1 : 1,
        PROGNO: program.programNo,
        MAINSTEP: i,
        PARALELSTEP: 0,
        COMMANDNO: step.mainCommand.commandNo,
        ISCONDITIONAL: 0,
        CONDITIONSTR: '',
        THEORETICDURATION: 0,
      })
      // BAMASTERSTEPPARAMS
      step.mainCommand.parameters.forEach((parameter) => {
        parametersArchive.push({
          MACHINEID: this.id,
          MACHINEPRGVERSIONNO: lastVersion ? lastVersion + 1 : 1,
          PROGNO: program.programNo,
          MAINSTEP: i,
          PARALELSTEP: 0,
          PARAMETERINDEX: parameter.index,
          VALUE: parameter.value,
          CONTAINSVARIABLE: 0,
          ERRORWARNING: 0,
          OPTIMIZED: 0,
        })
      })

      step.mainCommand.ioList.forEach((io, k) => {
        // BAMASTERSTEPINPUTOUTPUTS
        stepIOArchive.push({
          MACHINEID: this.id,
          MACHINEPRGVERSIONNO: lastVersion ? lastVersion + 1 : 1,
          PROGNO: program.programNo,
          MAINSTEP: i,
          PARALELSTEP: 0,
          IOINDEX: mainIOList[k]?.index,
          IOID: mainIOList[k]?.physicalId,
          IOTYPE: 5,
        })
        // BAMASTERSTEPSELECTIONLIST
        io.value.forEach((ioValue: any, n) => {
          ioSelectionArchive.push({
            MACHINEID: this.id,
            MACHINEPRGVERSIONNO: lastVersion ? lastVersion + 1 : 1,
            SELECTIONINDEX: n,
            PROGNO: program.programNo,
            MAINSTEP: i,
            PARALELSTEP: 0,
            IOINDEX: mainIOList[k]?.index,
            SELECTEDIOID: ioValue[1],
            IOTYPE: ioValue[0] - 1,
          })
        })
      })

      step.parallelCommands.forEach((command, j) => {
        // BAMASTERSTEPS
        stepsArchive.push({
          MACHINEID: this.id,
          MACHINEPRGVERSIONNO: lastVersion ? lastVersion + 1 : 1,
          PROGNO: program.programNo,
          MAINSTEP: i,
          PARALELSTEP: j + 1,
          COMMANDNO: command.commandNo,
          ISCONDITIONAL: 0,
          CONDITIONSTR: '',
          THEORETICDURATION: 0,
        })
        // BAMASTERSTEPPARAMS
        command.parameters.forEach((parameter) => {
          parametersArchive.push({
            MACHINEID: this.id,
            MACHINEPRGVERSIONNO: lastVersion ? lastVersion + 1 : 1,
            PROGNO: program.programNo,
            MAINSTEP: i,
            PARALELSTEP: j + 1,
            PARAMETERINDEX: parameter.index,
            VALUE: parameter.value,
            CONTAINSVARIABLE: 0,
            ERRORWARNING: 0,
            OPTIMIZED: 0,
          })
        })

        const paralelIOList = this.getSelectableIO(command.commandNo, commands)
        command.ioList.forEach((io, m) => {
          // BAMASTERSTEPINPUTOUTPUTS
          stepIOArchive.push({
            MACHINEID: this.id,
            MACHINEPRGVERSIONNO: lastVersion ? lastVersion + 1 : 1,
            PROGNO: program.programNo,
            MAINSTEP: i,
            PARALELSTEP: j + 1,
            IOINDEX: paralelIOList[m]?.index,
            IOID: paralelIOList[m]?.physicalId,
            IOTYPE: 5,
          })

          // BAMASTERSTEPSELECTIONLIST
          io.value.forEach((ioValue: any, n) => {
            ioSelectionArchive.push({
              MACHINEID: this.id,
              MACHINEPRGVERSIONNO: lastVersion ? lastVersion + 1 : 1,
              SELECTIONINDEX: n,
              PROGNO: program.programNo,
              MAINSTEP: i,
              PARALELSTEP: j + 1,
              IOINDEX: paralelIOList[m]?.index,
              SELECTEDIOID: ioValue[1],
              IOTYPE: ioValue[0] - 1,
            })
          })
        })
      })
    })

    const chunkSize = 50
    const baTables = [
      ['BAMASTERPRGHEADER', headerArchive],
      ['BAMASTERSTEPS', this.chunkArray(stepsArchive, chunkSize)],
      ['BAMASTERSTEPPARAMS', this.chunkArray(parametersArchive, chunkSize)],
      ['BAMASTERSTEPINPUTOUTPUTS', this.chunkArray(stepIOArchive, chunkSize)],
      ['BAMASTERSTEPSELECTIONLIST', this.chunkArray(ioSelectionArchive, chunkSize)],
    ]

    for (const [table, array] of baTables)
      for (const item of array)
        await this.trx.insert(item).into(table.toString())
  }

  private arrayToMap(commands: MachineCommand[]): Map<number, MachineCommand> {
    const map = new Map<number, MachineCommand>()
    commands.forEach((command) => {
      map.set(command.commandNo, command)
    })
    return map
  }

  /**
   * Programı veritabanına ekler
   * @param program - Program objesi
   * @returns {Promise<void>}
   */
  @withTransaction
  async insertProgram(program: Program): Promise<void> {
    const exists = await this.hasProgram(program.programNo)
    if (exists) {
      throw new PError('PROGRAM_EXISTS', { machineId: this.id, programNo: program.programNo })
    }
    const commands: MachineCommand[] = await this.fetchCommands()
    const config = useRuntimeConfig()
    const timezone = Number(config.teleskopTimezoneOffset)
    const date = new Date(new Date().getTime() - timezone * 60000).toISOString()

    const steps: StepItem[] = []
    const parameters: StepParameter[] = []
    const stepIO: StepInputOutput[] = []
    const ioSelection: SelectionList[] = []

    // BFMASTERPRGHEADER
    const header = [{
      MACHINEID: this.id,
      PROGNO: program.programNo,
      PROCESSCODE: program.typeId,
      NAME: program.name,
      DURATION: program.duration,
      TOTALSTEP: program.steps.length,
      CHANGEDATE: date,
      TBBCHANGESOURCE: '',
      TBBCHANGEDATE: program.updatedAtTBB ? program.updatedAtTBB : '',
      LOCKEDBY: '',
      CREATIONDATE: program.createdAt ? program.createdAt : date,
      USERCOMMENT: program.comment,
      ISDELETED: 0,
      ISCHANGED: program.isChanged ? 1 : 0,
      PRGSTATE: program.programState === undefined ? ProgramStatus.EXISTS_ONLY_ON_DATABASE : program.programState,
      TBBPRGCHANGEDEVENT: program.tbbProgramChangedEvent,
      SOURCEMACHID: 0,
      TotalChemReq: 0,
      TotalDyeReq: 0,
      ManChemReq: 0,
      AutoChemReq: 0,
      AutoDyeReq: 0,
      ManDyeReq: 0,
      DefaultRecipeNo: '',
      ICONNAME: program.icon,
      ORDEROFREQUESTS: '',
      TOTALSALTREQ: 0,
      TOTALGM1REQ: 0,
      TOTALGM2REQ: 0,
      PHASEVERSION: 1,
      INTERVENTIONFREEPROGRAM: 0,
    }]

    program.steps.forEach((step, i) => {
      const mainIOList = this.getSelectableIO(step.mainCommand.commandNo, commands)

      // BFMASTERSTEPS
      steps.push({
        MACHINEID: this.id,
        PROGNO: program.programNo,
        MAINSTEP: i,
        PARALELSTEP: 0,
        COMMANDNO: step.mainCommand.commandNo,
        ISCONDITIONAL: 0,
        CONDITIONSTR: '',
        ERRORS: 0,
        THEORETICDURATION: 0,
      })
      // BFMASTERSTEPPARAMS
      step.mainCommand.parameters.forEach((parameter) => {
        parameters.push({
          PROGNO: program.programNo,
          MAINSTEP: i,
          PARALELSTEP: 0,
          PARAMETERINDEX: parameter.index,
          MACHINEID: this.id,
          VALUE: parameter.value,
          CONTAINSVARIABLE: 0,
          OPTIMIZEDVALUE: '',
          ERRORWARNING: 0,
          OPTIMIZED: 0,
        })
      })

      step.mainCommand.ioList.forEach((io, k) => {
        // BFMASTERSTEPINPUTOUTPUTS
        stepIO.push({
          PROGNO: program.programNo,
          MAINSTEP: i,
          PARALELSTEP: 0,
          IOINDEX: mainIOList[k]?.index,
          MACHINEID: this.id,
          IOID: mainIOList[k]?.physicalId,
          IOTYPE: 5,
          ERRORWARNING: 0,
        })
        // BFMASTERSTEPSELECTIONLIST
        io.value.forEach((ioValue, n) => {
          ioSelection.push({
            SELECTIONINDEX: n,
            PROGNO: program.programNo,
            MAINSTEP: i,
            PARALELSTEP: 0,
            IOINDEX: mainIOList[k]?.index,
            MACHINEID: this.id,
            SELECTEDIOID: ioValue[1],
            IOTYPE: ioValue[0] - 1,
          })
        })
      })

      step.parallelCommands.forEach((command, j) => {
        // BFMASTERSTEPS
        steps.push({
          MACHINEID: this.id,
          PROGNO: program.programNo,
          MAINSTEP: i,
          PARALELSTEP: j + 1,
          COMMANDNO: command.commandNo,
          ISCONDITIONAL: 0,
          CONDITIONSTR: '',
          ERRORS: 0,
          THEORETICDURATION: 0,
        })
        // BFMASTERSTEPPARAMS
        command.parameters.forEach((parameter) => {
          parameters.push({
            PROGNO: program.programNo,
            MAINSTEP: i,
            PARALELSTEP: j + 1,
            PARAMETERINDEX: parameter.index,
            MACHINEID: this.id,
            VALUE: parameter.value,
            CONTAINSVARIABLE: 0,
            OPTIMIZEDVALUE: '',
            ERRORWARNING: 0,
            OPTIMIZED: 0,
          })
        })

        const paralelIOList = this.getSelectableIO(command.commandNo, commands)
        command.ioList.forEach((io, m) => {
          // BFMASTERSTEPINPUTOUTPUTS
          stepIO.push({
            PROGNO: program.programNo,
            MAINSTEP: i,
            PARALELSTEP: j + 1,
            IOINDEX: paralelIOList[m]?.index,
            MACHINEID: this.id,
            IOID: paralelIOList[m]?.physicalId,
            IOTYPE: 5,
            ERRORWARNING: 0,
          })

          // BFMASTERSTEPSELECTIONLIST
          io.value.forEach((ioValue, n) => {
            ioSelection.push({
              SELECTIONINDEX: n,
              PROGNO: program.programNo,
              MAINSTEP: i,
              PARALELSTEP: j + 1,
              IOINDEX: paralelIOList[m]?.index,
              MACHINEID: this.id,
              SELECTEDIOID: ioValue[1],
              IOTYPE: ioValue[0] - 1,
            })
          })
        })
      })
    })

    const chunkSize = 50
    const bfTables = [
      ['BFMASTERPRGHEADER', header],
      ['BFMASTERSTEPS', this.chunkArray(steps, chunkSize)],
      ['BFMASTERSTEPPARAMS', this.chunkArray(parameters, chunkSize)],
      ['BFMASTERSTEPINPUTOUTPUTS', this.chunkArray(stepIO, chunkSize)],
      ['BFMASTERSTEPSELECTIONLIST', this.chunkArray(ioSelection, chunkSize)],
    ]

    for (const [table, array] of bfTables)
      for (const item of array) {
        await this.trx.insert(item).into(table.toString())
      }

    await this.insertProgramToArchive(program)
  }

  /**
   * Belirtilen komut numarasına sahip olan komutun seçilebilir IO listesini getirir.
   * @param commandNo - Komut numarası
   * @param machineCommands - Makine komutları dizisi
   * @returns {CommandIO[]} - Seçilebilir IO dizisi
   */
  private getSelectableIO(commandNo: number, machineCommands: MachineCommand[]): CommandIO[] {
    const command = machineCommands.find(command => command.commandNo === commandNo)
    return command?.ioList.filter(io => io.selectable) || []
  }

  /**
   * Veritabanından belirtilen programı siler.
   * @param programNo - Silinecek programın numarası
   * @returns {Promise<boolean>} - İşlem başarılıysa true döner
   */
  @withTransaction
  async deleteProgramFromDatabase(programNo: number): Promise<boolean> {
    let deletedCount = 0
    const tables = ['BFMASTERPRGHEADER', 'BFMASTERSTEPS', 'BFMASTERSTEPPARAMS', 'BFMASTERSTEPINPUTOUTPUTS', 'BFMASTERSTEPSELECTIONLIST']

    for (const table of tables) {
      deletedCount += await this.trx(table).where('MACHINEID', this.id).andWhere('PROGNO', programNo).del()
    }

    return deletedCount > 0
  }

  /**
   * Arşiv veritabanından belirtilen programı siler.
   * @param programNo - Silinecek programın numarası
   * @returns {Promise<boolean>} - İşlem başarılıysa true döner
   */
  @withTransaction
  async deleteProgramFromArchive(programNo: number, versionNo: number): Promise<boolean> {
    let deletedCount = 0
    const tables = ['BAMASTERPRGHEADER', 'BAMASTERSTEPS', 'BAMASTERSTEPPARAMS', 'BAMASTERSTEPINPUTOUTPUTS', 'BAMASTERSTEPSELECTIONLIST']

    for (const table of tables) {
      deletedCount += await this.trx(table).where('MACHINEID', this.id).andWhere('PROGNO', programNo).andWhere('VERSIONNO', versionNo).del()
    }

    return deletedCount > 0
  }

  /**
   * Makineden belirtilen programı siler.
   * @param programNo - Silinecek programın numarası
   * @returns {Promise<void>}
   */
  @withFTP
  async deleteRemoteProgram(programNo: number): Promise<void> {
    await this.ftp.remove(`/tbb6500/data/programs/program/${programNo}`)
  }

  /**
   * Makineden program numaralarının listesini alır ve döndürür.
   * @returns {Promise<number[]>} - Program listesi
   */
  @withFTP
  async fetchRemoteProgramList(): Promise<number[]> {
    return await this.ftp.fetchProgramList()
  }

  /**
   * Belirtilen program numarasına sahip tüm arşivlenmiş programların header bilgilerini getirir.
   * @param programNo - Program numarası
   * @returns {Promise<ProgramHeader[]>} - Header bilgilerini içeren bir dizi döndürür
   */
  @withTransaction
  async fetchAllHeadersOfArchivedProgram(programNo: number): Promise<ProgramHeader[]> {
    return await this.trx
      .select({
        programNo: 'H.PROGNO',
        name: 'H.NAME',
        version: 'H.MACHINEPRGVERSIONNO',
        stepCount: 'H.TOTALSTEP',
        type: 'T.PROCESSNAME',
        changedDate: 'H.CHANGEDATE',
        // updatedAtTBB: 'H.TBBCHANGEDATE',
        // programState: 'H.PRGSTATE',
        // isChanged: 'H.ISCHANGED',
        // tbbProgramChangedEvent: 'H.TBBPRGCHANGEDEVENT',
      })
      .from('BAMASTERPRGHEADER AS H')
      .join('BFPROCESSTYPES AS T', 'T.PROCESSCODE', 'H.PROCESSCODE')
      .where('H.MACHINEID', this.id)
      .andWhere('H.PROGNO', programNo)
  }

  /**
   * Belirtilen program numarasına ve sürüm numarasına sahip arşivlenmiş programı yükler.
   * @param programNo - Program numarası
   * @param versionNo - Sürüm numarası
   * @returns {Promise<void>}
   */
  @withTransaction
  async loadArchivedProgram(programNo: number, versionNo: number): Promise<void> {
    const program = await this.fetchArchivedProgram(programNo, versionNo)
    await this.deleteProgramFromDatabase(programNo)
    await this.insertProgram(program)
  }

  /**
   * Verilen diziyi belirtilen boyutta parçalara ayırır.
   * @param array - Parçalanacak dizi
   * @param chunkSize - Parça boyutu
   * @returns Parçalara ayrılmış yeni bir dizi
   */
  private chunkArray(array: any[], chunkSize: number): any[][] {
    const result = []
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize))
    }
    return result
  }

  /**
   * İki metin programını (ProgramA ve ProgramB) satır bazında karşılaştırır.
   * @param ProgramA - Karşılaştırılacak ilk metin programı
   * @param ProgramB - Karşılaştırılacak ikinci metin programı
   * @returns {boolean} - Metin programlarının satır bazında eşit olup olmadığını belirtir
   */
  compareProgramString(ProgramA: string, ProgramB: string): boolean {
    const text1Lines: string[] = ProgramA.split('\n')
    const text2Lines: string[] = ProgramB.split('\n')

    const maxLength = Math.max(text1Lines.length, text2Lines.length)

    for (let i = 0; i < maxLength; i++) {
      const line1 = text1Lines[i] || ''
      const line2 = text2Lines[i] || ''

      if (line1 !== line2) {
        return false
      }
    }
    return true
  }

  /**
   * Makine sabitlerini getirir.
   * @param machineId - Makine Id
   * @returns {Promise<MachineConstant[]>} - Makinenin sabitlerinin listesi
   */
  @withTransaction
  async fetchMachineConstants(): Promise<MachineConstant[]> {
    return await this.trx('BFMACHPARAMETERS').select({
      machineParameterId: 'MACHINEPARAMETERID',
      machineId: 'MACHINEID',
      paramString: 'PARAMSTRING',
      paramLowLimit: 'PARAMLOWLIMIT',
      paramHighLimit: 'PARAMHIGHLIMIT',
      paramType: 'PARAMETERTYPE',
      selectionList: 'SELECTIONLIST',
      unitCode: 'UNITCODE',
      selectionValues: 'SELECTIONVALUES',
      isDeleted: 'ISDELETED',
      tbbChangeTime: 'TBBCHANGETIME',
      changeTime: 'CHANGETIME',
      defaultValue: 'DEFAULTVALUE',
      dmArea: 'dmArea',
      consScreen: 'consScreen',
      consFormat: 'consFormat',
      consUnit: 'consUnit',
      currentValue: 'currentValue',
    }).where('MACHINEID', this.id)
  }

  /**
   * Başlatma parametrelerini getirir.
   * @param machineId - Makine Id
   * @returns {Promise<BatchParameter[]>} - Makinenin parametrelerinin listesi
   */
  @withTransaction
  async fetchBatchParameters(): Promise<BatchParameter[]> {
    return await this.trx('BFMACHBATCHPARAMETERS').select({
      batchParameterId: 'BATCHPARAMETERID',
      machineId: 'MACHINEID',
      paramString: 'PARAMSTRING',
      paramLowLimit: 'PARAMLOWLIMIT',
      paramHighLimit: 'PARAMHIGHLIMIT',
      batchPlanning: 'BATCHPLANNING',
      batchStart: 'BATCHSTART',
      recipe: 'RECIPE',
      defaultValue: 'DEFAULTVALUE',
      parameterType: 'PARAMETERTYPE',
      selectionList: 'SELECTIONLIST',
      unitCode: 'UNITCODE',
      selectionValues: 'SELECTIONVALUES',
      isDeleted: 'ISDELETED',
      tbbChangeTime: 'TBBCHANGETIME',
      changeTime: 'CHANGETIME',
      format: 'FORMAT',
      parameterId: 'PARAMETERID',
      unitText: 'UNITTEXT',
      paramStringEn: 'PARAMSTRINGEN',
      selectionListDefault: 'SELECTIONLISTDEFAULT',
    }).where('MACHINEID', this.id)
  }

  /**
   * Komut formüllerini getirir.
   * @param machineId - Makine Id
   * @returns {Promise<CommandFormula[]>} - Komut parametrelerinin listesi
   */
  @withTransaction
  async fetchCommandFormulas(): Promise<CommandFormula[]> {
    return await this.trx('BFCOMMANDFORMULAS').select(
      'machineId',
      'formulaId',
      'formula',
      'commandNo',
      'commandParameterNo',
      'formulaName',
    ).where('machineId', this.id)
  }
}
