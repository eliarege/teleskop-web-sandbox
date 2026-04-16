import type { Knex } from 'knex'
import { isDef } from '@teleskop/utils'
import { fetchTeleskopSettings, getTeleskopSettings, logEditorOperation, upsertTreatments } from '../functions'
import { db } from '../database'
import { withDmTransaction, withProgramClient, withTransaction } from '../decorators'
import { sql } from '../sql'
import { PError } from '../error'
import { ProgramEditorActivityCodes } from '../constants'
import logger from '../logger'
import { mapObject } from '../utils/map'
import type { ProgramClient } from './ProgramClient'
import type { BatchParameter, CommandFormula, CommandIO, CommandIOSelection, CommandTypes, FindInProgramsParams, Machine, MachineCommand, MachineConstant, ParameterItem, Program, ProgramHeader, ProgramHeaderArchive, ProgramHeaderUpdate, ProgramStep, ProgramStepCommand, ProgramTableRow, ProgramWithErrors, SelectionArchiveList, SelectionList, StepArchiveInputOutput, StepArchiveItem, StepArchiveParameter, StepInputOutput, StepItem, StepParameter, TreatmentParameter } from '~/shared/types'
import { AdditiveType, CommandType, ParameterType, ParameterTypeRaw, ProgramStatus } from '~/shared/constants'
import { calculateProgramDuration } from '~/shared/formula'
import { validateProgram } from '~/shared/utils'

export class MachineController {
  trx: Knex.Transaction
  dmTrx: Knex.Transaction | null

  constructor(
    public readonly id: number,
    public readonly client: ProgramClient,
  ) {
    this.trx = db as Knex.Transaction
    this.dmTrx = null
  }

  @withTransaction
  async withTransaction(callback: (controller: MachineController) => Promise<void> | void) {
    await callback(this)
  }

  /**
   * Mevcut makinenin komutlarını getirir
   * @param {boolean} editable - Editable parametreler
   * @param {boolean} selectable - Selectable io'lar
   * @returns {Promise<MachineCommand[]>} - Komutlar
   */
  @withTransaction
  async fetchCommands(editable?: boolean, selectable?: boolean): Promise<MachineCommand[]> {
    const commands = await db
      .from('BFMASTERCOMMANDS')
      .select({
        machineId: 'MACHINEID',
        commandNo: 'COMMANDNO',
        name: 'NAME',
        icon: 'ICON',
        activated: 'ACTIVATED',
        adviceList: 'ADVICELIST',
        dontUseList: 'DONTUSELIST',
        isRunManual: 'ISRUNMANUAL',
        commandType: 'COMMANDTYPE',
        moveParallel: 'MOVEPARALLEL',
        x: 'X',
        y: 'Y',
        a: 'A',
        maxA: 'MAXA',
        b: 'B',
        isTemperature: 'ISTEMPERATURE',
        isUnload: 'ISUNLOAD',
      })
      .where('MACHINEID', this.id)
      .andWhere('ACTIVATED', 1)
      .orderBy('COMMANDNO') as MachineCommand[]

    const parameters = await db
      .from('BFCOMMANDPARAMETERS as P')
      .join('BFMASTERCOMMANDS as C', function () {
        this.on('P.MACHINEID', '=', 'C.MACHINEID')
          .andOn('P.COMMANDNO', '=', 'C.COMMANDNO')
      })
      .select({
        commandNo: 'P.COMMANDNO',
        index: 'P.PARAMETERINDEX',
        name: 'P.PARAMSTRING',
        group: 'P.PARAMETERGROUP',
        editable: 'P.PROGRAMEDITING',
        type: db.raw(`
          CASE
            WHEN TBBFORMUL = 1 THEN 'MACHINE_FORMULA'
            WHEN USEFORMULA = 1 THEN 'SELECTABLE_FORMULA'
            WHEN PARAMETERTYPE = 0 THEN 'NUMBER'
            WHEN PARAMETERTYPE = 1 THEN 'SELECT'
            WHEN PARAMETERTYPE = 2 THEN 'CHECKBOX'
            WHEN PARAMETERTYPE = 3 THEN 'SELECT_ADDITIVE'
          END
        `),
        format: db.raw(`
          CASE TEMPERATURE
            WHEN 0 THEN 'NONE'
            WHEN 1 THEN 'TEMPERATURE'
            ELSE 'DURATION'
          END
        `),
        value: 'P.VALUE',
        valueIndex: 'P.VALUEINDEX',
        minValue: 'P.PARAMLOWLIMIT',
        maxValue: 'P.PARAMHIGHLIMIT',
        containsVariable: 'P.CONTAINSVARIABLE',
        useDefault: 'P.USEDEFAULT',
        useFormula: 'P.USEFORMULA',
        selectionLabels: db.raw(`NULLIF(P.SELECTIONLIST, '')`),
        selectionValues: db.raw(`NULLIF(P.SELECTIONVALUES, '')`),
      })
      .where('P.MACHINEID', this.id)
      .andWhere('C.ACTIVATED', 1)
      .modify((queryBuilder) => {
        if (editable) {
          queryBuilder.where('P.PROGRAMEDITING', 1)
        }
      })
      .orderBy(['P.COMMANDNO', 'P.PARAMETERINDEX'])

    const ioList = await db
      .from('BFCOMMANDINPUTOUTPUTS as IO')
      .join('BFMASTERCOMMANDS as C', function () {
        this.on('IO.MACHINEID', '=', 'C.MACHINEID')
          .andOn('IO.COMMANDNO', '=', 'C.COMMANDNO')
      })
      .select({
        commandNo: 'IO.COMMANDNO',
        index: 'IO.IOINDEX',
        physicalId: 'IO.IOID',
        type: db.raw('IO.IOTYPE'),
        selectable: db.raw(`CAST(CASE IO.IOTYPE WHEN 5 THEN 1 ELSE 0 END as bit)`),
        name: 'IO.NAME',
      })
      .where('IO.MACHINEID', this.id)
      .andWhere('C.ACTIVATED', 1)
      .orderBy(['IO.COMMANDNO', 'IO.IOINDEX'])

    const ioListSelections = await db
      .from('BFCOMMANDSELECTIONLIST as S')
      .join('BFCOMMANDINPUTOUTPUTS as IO', function () {
        this.on('S.MACHINEID', '=', 'IO.MACHINEID')
          .andOn('S.COMMANDNO', '=', 'IO.COMMANDNO')
          .andOn('S.IOINDEX', '=', 'IO.IOINDEX')
      })
      .join('BFMASTERCOMMANDS as C', function () {
        this.on('IO.MACHINEID', '=', 'C.MACHINEID')
          .andOn('IO.COMMANDNO', '=', 'C.COMMANDNO')
      })
      .select({
        commandNo: 'S.COMMANDNO',
        ioIndex: 'S.IOINDEX',
        index: 'S.SELECTINDEX',
        type: db.raw('S.IOTYPE + 1'),
        name: 'S.NAME',
        defaultValue: 'S.ISDEFAULT',
        physicalId: 'S.IOID',
      })
      .where('S.MACHINEID', this.id)
      .andWhere('C.ACTIVATED', 1)
      .modify((queryBuilder) => {
        if (selectable) {
          queryBuilder.where('IO.IOTYPE', 5)
        }
      })
      .orderBy(['S.COMMANDNO', 'S.IOINDEX', 'S.SELECTINDEX'])

    let parCursor = 0
    let iosCursor = 0
    let selCursor = 0

    for (const command of commands) {
      command.parameters = []
      command.ioList = []

      command.dontUseList = String(command.dontUseList)
        .split(',')
        .map(num => Number(num.trim()))
        .filter(Number.isFinite)

      for (; parCursor < parameters.length; parCursor++) {
        const rawParameter = parameters[parCursor]
        if (rawParameter.commandNo !== command.commandNo) {
          break
        }
        const selectionLabels = rawParameter.selectionLabels?.trim().slice(1, -1).split('" "') || [] as string[]
        const selectionValues = rawParameter.selectionValues?.trim().slice(1, -1).split('" "').map(Number) || [] as number[]
        const selectionLength = Math.min(selectionLabels.length, selectionValues.length)
        const selections = Array.from({ length: selectionLength }, (_, i) => {
          return {
            name: selectionLabels[i],
            value: selectionValues[i],
          }
        })

        command.parameters.push({
          index: rawParameter.index,
          name: rawParameter.name,
          group: rawParameter.group,
          editable: rawParameter.editable,
          type: rawParameter.type,
          format: rawParameter.format,
          value: rawParameter.value,
          valueIndex: rawParameter.valueIndex,
          minValue: rawParameter.minValue,
          maxValue: rawParameter.maxValue,
          containsVariable: rawParameter.containsVariable,
          useDefault: rawParameter.useDefault,
          useFormula: rawParameter.useFormula,
          selections,
        })
      }
      for (; iosCursor < ioList.length; iosCursor++) {
        const rawIo = ioList[iosCursor]
        if (rawIo.commandNo !== command.commandNo) {
          break
        }
        const currentIo: CommandIO = {
          index: rawIo.index,
          physicalId: rawIo.physicalId,
          type: rawIo.type,
          selectable: rawIo.selectable,
          name: rawIo.name,
          selections: [],
        }
        command.ioList.push(currentIo)
        for (; selCursor < ioListSelections.length; selCursor++) {
          const rawIoSelection = ioListSelections[selCursor]
          if (rawIoSelection.ioIndex !== rawIo.index || rawIoSelection.commandNo !== rawIo.commandNo) {
            break
          }
          currentIo.selections.push({
            index: rawIoSelection.index,
            type: rawIoSelection.type,
            name: rawIoSelection.name,
            defaultValue: rawIoSelection.defaultValue,
            physicalId: rawIoSelection.physicalId,
          })
        }
      }
    }

    return commands
  }

  @withTransaction
  async getCommandsAsList(): Promise<Pick<MachineCommand, 'commandNo' | 'name'>[]> {
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
   * Makinenin tüm programlarının headers'ını getirir
   * @param query - Sorgu parametreleri
   * @returns {Promise<ProgramTableRow[]>} - Makinenin tüm programlarının dizisi
   */
  @withTransaction
  async fetchAllProgramHeaders(query?: any): Promise<ProgramTableRow[]> {
    const config = useRuntimeConfig()

    return await this.trx
      .select({
        programNo: 'H.PROGNO',
        name: 'H.NAME',
        duration: 'H.DURATION',
        stepCount: 'H.TOTALSTEP',
        typeId: 'H.PROCESSCODE',
        additionalTypeId: 'H.ADDITIONALPROCESSCODE',
        operator: 'H.TBBPRGCHANGEDEVENT',
        updatedAt: this.trx.raw(sql`DATEADD(MINUTE, ${config.teleskopTimezoneOffset}, H.CHANGEDATE)`),
        createdAt: this.trx.raw(sql`DATEADD(MINUTE, ${config.teleskopTimezoneOffset}, H.CREATIONDATE)`),
        updatedAtTBB: this.trx.raw(sql`DATEADD(MINUTE, ${config.teleskopTimezoneOffset}, H.TBBCHANGEDATE)`),
        prgState: 'H.PRGSTATE',
        isChanged: 'H.ISCHANGED',
        totalChemReq: 'H.TotalChemReq',
        totalDyeReq: 'H.TotalDyeReq',
        manChemReq: 'H.ManChemReq',
        autoChemReq: 'H.AutoChemReq',
        autoDyeReq: 'H.AutoDyeReq',
        manDyeReq: 'H.ManDyeReq',
        saltReq: 'H.TOTALSALTREQ',
        genericMat1Req: 'H.TOTALGM1REQ',
        genericMat2Req: 'H.TOTALGM2REQ',
        versionNo: 'AH.MACHINEPRGVERSIONNO',
      })
      .from('BFMASTERPRGHEADER AS H')
      .joinRaw(`
          OUTER APPLY (
            SELECT TOP 1 MACHINEPRGVERSIONNO
            FROM BAMASTERPRGHEADER
            WHERE MACHINEID = H.MACHINEID
              AND PROGNO = H.PROGNO
            ORDER BY MACHINEPRGVERSIONNO DESC
          ) AS AH
      `)
      .where('H.MACHINEID', this.id)
      .andWhere((builder) => {
        if (query?.programNo)
          builder.where('H.PROGNO', Number(query.programNo))
        if (query?.programName)
          builder.whereLike('H.NAME', `%${query.programName}%`)
        if (query?.processType)
          builder.where('H.PROCESSCODE', Number(query.processType))
      })
      .orderBy('H.PROGNO')
  }

  /**
   * Makine id numarasına göre makinenin belirli bir programını getirir
   * @param {number} programNo - Program numarası
   * @returns {Promise<ProgramWithErrors>} - Program ve hata bilgileri
   */
  @withTransaction
  async fetchProgram(programNo: number): Promise<ProgramWithErrors> {
    const program = await this.trx
      .first({
        name: 'P.NAME',
        icon: this.trx.raw('CASE P.ICONNAME WHEN \'\' THEN \'null\' END'),
        programNo: 'P.PROGNO',
        duration: 'P.DURATION',
        author: 'P.LOCKEDBY',
        comment: 'P.USERCOMMENT',
        typeId: 'P.PROCESSCODE',
        typeName: 'PT.PROCESSNAME',
        additionalTypeId: 'P.ADDITIONALPROCESSCODE',
        additionalTypeName: 'APT.PROCESSNAME',
        machineId: 'M.MACHINEID',
        prgState: 'P.PRGSTATE',
        isChanged: 'P.ISCHANGED',
        createdAt: 'P.CREATIONDATE',
        updatedAt: 'P.CHANGEDATE',
        updatedAtTBB: 'P.TBBCHANGEDATE',
        machineName: 'M.MACHINECODE',
        tbbProgramChangedEvent: this.trx.raw(sql`CASE P.TBBPRGCHANGEDEVENT WHEN 0 THEN 0 ELSE 1 END`),
        totalChemReq: 'P.TotalChemReq',
        totalDyeReq: 'P.TotalDyeReq',
        manChemReq: 'P.ManChemReq',
        autoChemReq: 'P.AutoChemReq',
        autoDyeReq: 'P.AutoDyeReq',
        manDyeReq: 'P.ManDyeReq',
        saltReq: 'P.TOTALSALTREQ',
        genericMat1Req: 'P.TOTALGM1REQ',
        genericMat2Req: 'P.TOTALGM2REQ',
      })
      .from('BFMASTERPRGHEADER AS P')
      .join('BFMACHINES AS M', 'M.MACHINEID', 'P.MACHINEID')
      .join('BFPROCESSTYPES AS PT', 'PT.PROCESSCODE', 'P.PROCESSCODE')
      .leftJoin('BFPROCESSTYPES AS APT', 'APT.PROCESSCODE', 'P.ADDITIONALPROCESSCODE')
      .where('P.PROGNO', programNo)
      .andWhere('M.MACHINEID', this.id)

    if (!program) {
      throw new PError('PROGRAM_NOT_FOUND', { machineId: this.id, programNo })
    }

    const rawCommands = await db
      .from('BFMASTERSTEPS as P')
      .select({
        mainStep: 'P.MAINSTEP',
        parallelStep: 'P.PARALELSTEP',
        commandNo: 'P.COMMANDNO',
      })
      .where('P.MACHINEID', this.id)
      .andWhere('P.PROGNO', programNo)
      .orderBy(['P.MAINSTEP', 'P.PARALELSTEP']) as {
      mainStep: number
      parallelStep: number
      commandNo: number
    }[]

    const rawParameters = await db
      .from('BFMASTERSTEPPARAMS as P')
      .select({
        mainStep: 'P.MAINSTEP',
        parallelStep: 'P.PARALELSTEP',
        value: db.raw(`TRY_CAST(REPLACE(P.VALUE, ',', '.')  AS FLOAT)`),
        index: 'P.PARAMETERINDEX',
        optimized: 'P.OPTIMIZED',
      })
      .where('P.MACHINEID', this.id)
      .andWhere('P.PROGNO', programNo)
      .orderBy(['P.MAINSTEP', 'P.PARALELSTEP', 'P.PARAMETERINDEX']) as {
      mainStep: number
      parallelStep: number
      value: number
      index: number
      optimized: boolean
    }[]

    const rawIos = await db
      .from('BFMASTERSTEPINPUTOUTPUTS as P')
      .select({
        mainStep: 'P.MAINSTEP',
        parallelStep: 'P.PARALELSTEP',
        ioIndex: 'P.IOINDEX',
        ioId: 'P.IOID',
      })
      .where('P.MACHINEID', this.id)
      .andWhere('P.PROGNO', programNo)
      .orderBy(['P.MAINSTEP', 'P.PARALELSTEP', 'P.IOINDEX']) as {
      mainStep: number
      parallelStep: number
      ioIndex: number
      ioId: number
    }[]

    const rawIoSelections = await db
      .from('BFMASTERSTEPSELECTIONLIST as P')
      .select({
        mainStep: 'P.MAINSTEP',
        parallelStep: 'P.PARALELSTEP',
        ioIndex: 'P.IOINDEX',
        ioType: db.raw('P.IOTYPE + 1'),
        ioId: 'P.SELECTEDIOID',
      })
      .where('P.MACHINEID', this.id)
      .andWhere('P.PROGNO', programNo)
      .orderBy(['P.MAINSTEP', 'P.PARALELSTEP', 'P.IOINDEX', 'P.SELECTIONINDEX']) as {
      mainStep: number
      parallelStep: number
      ioIndex: number
      ioType: number
      ioId: number
    }[]

    let parCursor = 0
    let iosCursor = 0
    let selCursor = 0

    program.steps = []

    let currentStepIndex = 0
    let commandIdCounter = 0
    let currentStep: ProgramStep = {
      stepId: 0,
      mainCommand: null!,
      parallelCommands: [],
    }
    for (let i = 0; i < rawCommands.length; i++) {
      const rawCommand = rawCommands[i]
      // Push current step, proceed to next one
      if (rawCommand.mainStep !== currentStepIndex) {
        // If mainCommand is not initialised for some reason, skip
        if (currentStep.mainCommand) {
          program.steps.push(currentStep as ProgramStep)
        }
        currentStepIndex = rawCommand.mainStep
        commandIdCounter = 0
        currentStep = {
          stepId: currentStepIndex,
          mainCommand: null!,
          parallelCommands: [],
        }
      }
      const currentCommand: ProgramStepCommand = {
        commandId: commandIdCounter++,
        commandNo: rawCommand.commandNo,
        parameters: [],
        ioList: [],
      }
      if (!currentStep.mainCommand) {
        currentStep.mainCommand = currentCommand
      } else {
        currentStep.parallelCommands.push(currentCommand)
      }
      for (;parCursor < rawParameters.length; parCursor++) {
        const rawParameter = rawParameters[parCursor]
        if (rawParameter.parallelStep !== rawCommand.parallelStep || rawParameter.mainStep !== rawCommand.mainStep) {
          break
        }
        currentCommand.parameters.push({
          value: rawParameter.value,
          index: rawParameter.index,
          optimized: rawParameter.optimized,
        })
      }
      for (;iosCursor < rawIos.length; iosCursor++) {
        const rawIo = rawIos[iosCursor]
        if (rawIo.parallelStep !== rawCommand.parallelStep || rawIo.mainStep !== rawCommand.mainStep) {
          break
        }
        const currentIo: ProgramStepCommand['ioList'][0] = {
          ioId: rawIo.ioId,
          ioIndex: rawIo.ioIndex,
          value: [],
        }
        currentCommand.ioList.push(currentIo)
        for (;selCursor < rawIoSelections.length; selCursor++) {
          const rawIoSelection = rawIoSelections[selCursor]
          if (rawIoSelection.ioIndex !== rawIo.ioIndex || rawIoSelection.parallelStep !== rawIo.parallelStep || rawIoSelection.mainStep !== rawIo.mainStep) {
            break
          }
          currentIo.value.push([
            rawIoSelection.ioType,
            rawIoSelection.ioId,
          ])
        }
      }
    }
    // If mainCommand is not initialised for some reason, skip
    if (currentStep.mainCommand) {
      program.steps.push(currentStep as ProgramStep)
    }

    const commands = await this.fetchCommands()
    const programError = validateProgram(program, commands)

    return { program, programError }
  }

  /**
   * Program numarası ve versiyon numarasına göre arşivlenmiş programı getirir
   * @param {number} programNo - Program numarası
   * @param {number} versionNo - Program versiyon numarası
   * @returns {Promise<{ program: Program }>} - Program
   */
  @withTransaction
  async fetchArchivedProgram(programNo: number, versionNo: number): Promise<{ program: Program }> {
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
        typeId: 'P.PROCESSCODE',
        typeName: 'PT.PROCESSNAME',
        additionalTypeId: 'P.ADDITIONALPROCESSCODE',
        additionalTypeName: 'APT.PROCESSNAME',
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
      .join('BFPROCESSTYPES AS PT', 'PT.PROCESSCODE', 'P.PROCESSCODE')
      .leftJoin('BFPROCESSTYPES AS APT', 'APT.PROCESSCODE', 'P.ADDITIONALPROCESSCODE')
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

    return { program: archivedProgram }
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
   * Bir programı makineye yükler.
   *
   * @param {Program} program - Yüklenecek program
   * @returns {Promise<boolean>} Program başarıyla yüklendiğinde true döner.
   *
   * @throws {PError} Hata durumunda bir `PError` nesnesi fırlatılır.
   */
  @withProgramClient
  async uploadProgram(program: Program): Promise<boolean> {
    try {
      const commands = await this.fetchCommands()
      if (!commands.length) {
        throw new PError('NO_COMMANDS_FOUND', { machineId: this.id })
      }

      await this.client.uploadProgram(program, commands)

      await logEditorOperation(ProgramEditorActivityCodes.PROGRAMSENT, `Makine ${this.id}`, `Program ${program.programNo}`)

      return true
    } catch (err) {
      logger.error({ error: err }, 'An error occured during sending program(s) to machine.')
      throw new PError('PROGRAM_FAILED_TO_LOAD', { machineId: this.id, programNo: program.programNo })
    }
  }

  /**
   * Belirtilen program numarasına sahip programı machineden indirir
   * @param {number} programNo - Indirilmek istenen program numarası
   * @returns {Promise<Program | null>} - İndirilen programı içeren bir Promise
   */
  @withProgramClient
  @withTransaction
  async downloadProgram(programNo: number): Promise<Program | null> {
    try {
      const commands = await this.fetchCommands()
      if (!commands.length) {
        throw new PError('NO_COMMANDS_FOUND', { machineId: this.id })
      }

      const program = await this.client.downloadProgram(programNo, commands)
      if (program) {
        await this.ensureProcessTypesExistBulk([program.typeId, program.additionalTypeId])
      }
      await logEditorOperation(ProgramEditorActivityCodes.PROGRAMRECEIVED, `Makine ${this.id}`, `Program ${programNo}`)

      return program
    } catch (err) {
      logger.error({ error: err }, 'An error occured during downloading program(s) from machine.')
      throw new PError('PROGRAM_FAILED_TO_DOWNLOAD', { machineId: this.id, programNo })
    }
  }

  /**
   * Belirtilen programın makinede bulunup bulunmadığını kontrol eder
   * @param {number} programNo - Kontrol edilmek istenen program numarası
   * @returns {Promise<boolean>} - Programın var olup olmadığını belirten bir Promise
   */
  async doesMachineHaveProgram(programNo: number): Promise<boolean> {
    const programList = await this.fetchRemoteProgramList()
    return programList.includes(programNo)
  }

  /**
   * Makine bilgilerini getirir
   * @returns {Promise<Machine>} - Makine bilgilerini içeren bir Promise
   */
  @withTransaction
  async getMachineInfo(_editable?: boolean): Promise<Omit<Machine, 'commands'> & { commands: MachineCommand[] }> {
    const machine = await this.trx
      .first('MACHINECODE as name', 'GRUPNO as groupId', 'TBBMODEL as tbbModel')
      .from('BFMACHINES')
      .where('MACHINEID', this.id)
      .andWhere('USEINTELESKOP', 1)

    if (!machine) {
      throw new PError('MACHINE_NOT_FOUND', { machineId: this.id })
    }

    const { name, groupId, tbbModel } = machine
    const commands = await this.fetchCommands()
    const batchParameters = await this.fetchBatchParameters()
    const constants = await this.fetchMachineConstants()
    const commandFormulas = await this.fetchCommandFormulas()
    const treatmentParameters = await this.fetchTreatmentParameters()
    const commandTypes = await this.fetchCommandTypeMappings()
    return {
      id: this.id,
      name,
      groupId,
      tbbModel,
      commands,
      constants,
      commandFormulas,
      batchParameters,
      treatmentParameters,
      commandTypes,
    }
  }

  /**
   * Programı günceller
   * @param {Program} program - Güncellenmek istenen program
   * @returns {Promise<boolean>} - Programın silinip yeniden eklendiğine dair sonuç
   */
  @withDmTransaction
  @withTransaction
  async updateProgram(program: Program, isNewVersion: boolean = true): Promise<boolean> {
    const isDeleted = await this.deleteProgramFromDatabase(program.programNo)
    if (!isDeleted)
      return false

    if (program.prgState === ProgramStatus.EXISTS_ONLY_ON_DATABASE
      || program.prgState === ProgramStatus.EXISTS_ON_BOTH) {
      program.isChanged = true
    }

    await this.insertProgram(program, isNewVersion)

    await logEditorOperation(
      ProgramEditorActivityCodes.PROGRAMCHANGED,
      `Makine ${this.id}`,
      program.name,
    )

    return true
  }

  /**
   * Programın header bilgilerini getirir
   * @param {number} machineId - Makine numarası
   * @param {number} programNo - Program numarası
   * @returns {Promise<ProgramHeader>} - Programın header bilgilerini içeren bir Promise
   */
  @withTransaction
  async fetchProgramHeader(machineId: number, programNo: number): Promise<ProgramHeader> {
    const program: ProgramHeader = await this.trx
      .select({
        programNo: 'H.PROGNO',
        name: 'H.NAME',
        duration: 'H.DURATION',
        stepCount: 'H.TOTALSTEP',
        author: 'H.LOCKEDBY',
        comment: 'H.USERCOMMENT',
        typeId: 'H.PROCESSCODE',
        additionalTypeId: 'H.ADDITIONALPROCESSCODE',
        createdAt: 'H.CREATIONDATE',
        updatedAt: 'H.CHANGEDATE',
        updatedAtTBB: 'H.TBBCHANGEDATE',
        prgState: 'H.PRGSTATE',
        isChanged: 'H.ISCHANGED',
        tbbProgramChangedEvent: this.trx.raw(sql`CASE H.TBBPRGCHANGEDEVENT WHEN 0 THEN 0 ELSE 1 END`),
        totalChemReq: 'H.TotalChemReq',
        totalDyeReq: 'H.TotalDyeReq',
        manChemReq: 'H.ManChemReq',
        autoChemReq: 'H.AutoChemReq',
        autoDyeReq: 'H.AutoDyeReq',
        manDyeReq: 'H.ManDyeReq',
        saltReq: 'H.TOTALSALTREQ',
        genericMat1Req: 'H.TOTALGM1REQ',
        genericMat2Req: 'H.TOTALGM2REQ',
      })
      .from('BFMASTERPRGHEADER AS H')
      .where('PROGNO', programNo)
      .andWhere('MACHINEID', machineId)
      .first()

    return program
  }

  /**
   * Programın header bilgilerini günceller
   * @param {ProgramHeader} program - Güncellenmek istenen program
   * @returns {Promise<boolean>} - Güncellenme durumu icin boolean
   */
  @withTransaction
  async updateProgramHeader(program: ProgramHeaderUpdate): Promise<boolean> {
    const programObject = mapObject(program, {
      name: 'NAME',
      isChanged: 'ISCHANGED',
      typeId: 'PROCESSCODE',
      additionalTypeId: 'ADDITIONALPROCESSCODE',
      prgState: 'PRGSTATE',
      updatedAtTBB: 'TBBCHANGEDATE',
      tbbProgramChangedEvent: 'TBBPRGCHANGEDEVENT',
    // ...
    })

    programObject.CHANGEDATE = program.updatedAt ?? this.getCurrentTimestamp()
    program.updatedAt = programObject.CHANGEDATE

    return !!await this.trx('BFMASTERPRGHEADER')
      .update(programObject)
      .where('PROGNO', program.programNo)
      .andWhere('MACHINEID', this.id)
  }

  /**
   * Zaman dilimine göre tarih ve saat döndürür
   * @returns {Date} - Zaman dilimine göre tarih ve saat
   */
  private getCurrentTimestamp(): Date {
    const config = useRuntimeConfig()
    const timezone = Number(config.teleskopTimezoneOffset) || 0

    return new Date(Date.now() - timezone * 60000)
  }

  /**
   * Arsiv programının tarihini günceller
   * @param {number} programNo - Güncellenecek programın program numarası
   * @returns {Promise<number | null>} - Güncellenen programı içeren bir Promise
   */
  @withTransaction
  private async updateLastProgramDate(programNo: number, version: number): Promise<boolean> {
    const result = await this.trx
      .from('BAMASTERPRGHEADER')
      .where('MACHINEID', this.id)
      .andWhere('PROGNO', programNo)
      .andWhere('MACHINEPRGVERSIONNO', version)
      .update({ RELEASEENDDATE: this.getCurrentTimestamp() })

    return !!result
  }

  /**
   * Belirtilen program numarasına ait son versiyon numarasını döndürür.
   *
   * @param programNo - Versiyonu alınacak programın numarası
   * @returns Belirtilen programın son versiyon numarasını döndüren Promise (yoksa null)
   */
  @withTransaction
  async getLastVersion(programNo: number): Promise<number | null> {
    const result = await this.trx('BAMASTERPRGHEADER')
      .first('MACHINEPRGVERSIONNO as version')
      .where({
        MACHINEID: this.id,
        PROGNO: programNo,
      })
      .orderBy('MACHINEPRGVERSIONNO', 'desc')

    return result ? Number(result.version) : null
  }

  /**
   * Belirtilen programın belirtilen versiyonlarını siler
   * @param {number} programNo - Silinecek programın numarası
   * @param {number[]} versionNos - Silinecek versiyon numaraları
   * @returns {Promise<number>} - Silinen satır sayısı
   */
  @withTransaction
  async deleteVersions(programNo: number, versionNos: number[]): Promise<number> {
    if (!versionNos.length)
      return 0

    const lastVersion = await this.getLastVersion(programNo)
    const versionsToDelete = versionNos.filter(v => v !== lastVersion)

    if (!versionsToDelete.length)
      return 0

    return await this.trx('BAMASTERPRGHEADER')
      .where('MACHINEID', this.id)
      .andWhere('PROGNO', programNo)
      .whereIn('MACHINEPRGVERSIONNO', versionsToDelete)
      .del()
  }

  /**
   * Programı arşiv veritabanına ekler
   * @param program - Program objesi
   * @param isNewVersion - Yeni versiyon mu?
   * @returns {Promise<void>}
   */
  @withTransaction
  async insertProgramToArchive(program: Program, isNewVersion: boolean = true, commands?: MachineCommand[]): Promise<void> {
    const lastVersion: number | null = await this.getLastVersion(program.programNo)

    // Son versiyon varsa, tarihini güncelle
    if (isDef(lastVersion)) {
      await this.updateLastProgramDate(program.programNo, lastVersion)
    }

    // Yeni versiyon değilse, eski versiyonu sil
    if (!isNewVersion && isDef(lastVersion)) {
      await this.deleteProgramFromArchive(program.programNo, lastVersion)
    }

    commands ??= await this.fetchCommands()
    const timestamp = this.getCurrentTimestamp()

    const stepsArchive: StepArchiveItem[] = []
    const parametersArchive: StepArchiveParameter[] = []
    const stepIOArchive: StepArchiveInputOutput[] = []
    const ioSelectionArchive: SelectionArchiveList[] = []

    // Versiyon numarasını belirle
    const versionNo = isNewVersion
      ? (lastVersion ?? 0) + 1
      : lastVersion ?? 1

    // BAMASTERPRGHEADER
    const headerArchive = [{
      MACHINEID: this.id,
      MACHINEPRGVERSIONNO: versionNo,
      RELEASEDATE: timestamp,
      RELEASEENDDATE: null,
      PROGNO: program.programNo,
      PROCESSCODE: program.typeId,
      ADDITIONALPROCESSCODE: program.additionalTypeId,
      NAME: program.name,
      DURATION: program.duration,
      TOTALSTEP: program.steps.length,
      CHANGEDATE: timestamp,
      TBBCHANGESOURCE: '',
      TBBCHANGEDATE: '',
      CREATIONDATE: program.createdAt ?? timestamp,
      USERCOMMENT: program.comment,
      USERNAME: program.author,
      CHANGETIME: timestamp,
      WHATCHANGE: '',
      PRGSOURCE: 0,
      TotalChemReq: program.totalChemReq || 0,
      TotalDyeReq: program.totalDyeReq || 0,
      ManChemReq: program.manChemReq || 0,
      AutoChemReq: program.autoChemReq || 0,
      AutoDyeReq: program.autoDyeReq || 0,
      ManDyeReq: program.manDyeReq || 0,
      DefaultRecipeNo: '',
      ICONNAME: program.icon,
      ORDEROFREQUESTS: '',
      TOTALSALTREQ: program.saltReq || 0,
      TOTALGM1REQ: program.genericMat1Req || 0,
      TOTALGM2REQ: program.genericMat2Req || 0,
      PHASEVERSION: 1,
      INTERVENTIONFREEPROGRAM: 0,
    }]

    program.steps.forEach((step, i) => {
    // BAMASTERSTEPS
      stepsArchive.push({
        MACHINEID: this.id,
        MACHINEPRGVERSIONNO: versionNo,
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
          MACHINEPRGVERSIONNO: versionNo,
          PROGNO: program.programNo,
          MAINSTEP: i,
          PARALELSTEP: 0,
          PARAMETERINDEX: parameter.index,
          VALUE: `${parameter.value}`.replace('.', ','),
          CONTAINSVARIABLE: 0,
          ERRORWARNING: 0,
          OPTIMIZED: parameter.optimized ? 1 : 0,
        })
      })

      const mainIOList = this.getSelectableIO(step.mainCommand.commandNo, commands)
      step.mainCommand.ioList.forEach((io) => {
        const mainIO = mainIOList.find(m => m.index === io.ioIndex)
        if (!mainIO)
          return

        // BAMASTERSTEPINPUTOUTPUTS
        stepIOArchive.push({
          MACHINEID: this.id,
          MACHINEPRGVERSIONNO: versionNo,
          PROGNO: program.programNo,
          MAINSTEP: i,
          PARALELSTEP: 0,
          IOINDEX: mainIO.index,
          IOID: mainIO.physicalId,
          IOTYPE: 5,
        })

        const ioDefs = commands
          .find(c => c.commandNo === step.mainCommand.commandNo)?.ioList
          .find(i => i.index === io.ioIndex)?.selections || []

        // BAMASTERSTEPSELECTIONLIST
        this.rankAndSortIOSelections(io.value, ioDefs).forEach((selection) => {
          ioSelectionArchive.push({
            MACHINEID: this.id,
            MACHINEPRGVERSIONNO: versionNo,
            SELECTIONINDEX: selection.index,
            PROGNO: program.programNo,
            MAINSTEP: i,
            PARALELSTEP: 0,
            IOINDEX: mainIO.index,
            SELECTEDIOID: selection.value[1],
            IOTYPE: selection.value[0] - 1,
          })
        })
      })

      step.parallelCommands.forEach((parallelCommand, j) => {
        // BAMASTERSTEPS
        stepsArchive.push({
          MACHINEID: this.id,
          MACHINEPRGVERSIONNO: versionNo,
          PROGNO: program.programNo,
          MAINSTEP: i,
          PARALELSTEP: j + 1,
          COMMANDNO: parallelCommand.commandNo,
          ISCONDITIONAL: 0,
          CONDITIONSTR: '',
          THEORETICDURATION: 0,
        })

        // BAMASTERSTEPPARAMS
        parallelCommand.parameters.forEach((parameter) => {
          parametersArchive.push({
            MACHINEID: this.id,
            MACHINEPRGVERSIONNO: versionNo,
            PROGNO: program.programNo,
            MAINSTEP: i,
            PARALELSTEP: j + 1,
            PARAMETERINDEX: parameter.index,
            VALUE: `${parameter.value}`.replace('.', ','),
            CONTAINSVARIABLE: 0,
            ERRORWARNING: 0,
            OPTIMIZED: parameter.optimized ? 1 : 0,
          })
        })

        const paralelIOList = this.getSelectableIO(parallelCommand.commandNo, commands)
        parallelCommand.ioList.forEach((io) => {
          const paralelIO = paralelIOList.find(p => p.index === io.ioIndex)
          if (!paralelIO)
            return

          // BAMASTERSTEPINPUTOUTPUTS
          stepIOArchive.push({
            MACHINEID: this.id,
            MACHINEPRGVERSIONNO: versionNo,
            PROGNO: program.programNo,
            MAINSTEP: i,
            PARALELSTEP: j + 1,
            IOINDEX: paralelIO.index,
            IOID: paralelIO.physicalId,
            IOTYPE: 5,
          })

          const ioDefs = commands
            .find(c => c.commandNo === parallelCommand.commandNo)?.ioList
            .find(i => i.index === io.ioIndex)?.selections || []

          // BAMASTERSTEPSELECTIONLIST
          this.rankAndSortIOSelections(io.value, ioDefs).forEach((selection) => {
            ioSelectionArchive.push({
              MACHINEID: this.id,
              MACHINEPRGVERSIONNO: versionNo,
              SELECTIONINDEX: selection.index,
              PROGNO: program.programNo,
              MAINSTEP: i,
              PARALELSTEP: j + 1,
              IOINDEX: paralelIO.index,
              SELECTEDIOID: selection.value[1],
              IOTYPE: selection.value[0] - 1,
            })
          })
        })
      })
    })

    const chunkSize = 50
    const baTables: [string, any[][]][] = [
      ['BAMASTERPRGHEADER', [headerArchive]],
      ['BAMASTERSTEPS', this.chunkArray(stepsArchive, chunkSize)],
      ['BAMASTERSTEPPARAMS', this.chunkArray(parametersArchive, chunkSize)],
      ['BAMASTERSTEPINPUTOUTPUTS', this.chunkArray(stepIOArchive, chunkSize)],
      ['BAMASTERSTEPSELECTIONLIST', this.chunkArray(ioSelectionArchive, chunkSize)],
    ]

    for (const [table, array] of baTables) {
      for (const item of array) {
        if (item.length) {
          await this.trx.insert(item).into(table)
        }
      }
    }
  }

  private commandArrayToMap(commands: MachineCommand[]): Map<number, MachineCommand> {
    const map = new Map<number, MachineCommand>()
    commands.forEach((command) => {
      map.set(command.commandNo, command)
    })
    return map
  }

  /**
   * Programın typeId ve additionalTypeId değerlerinin BFPROCESSTYPES tablosunda var olmasını sağlar.
   * Yoksa otomatik olarak oluşturur.
   */
  @withTransaction
  private async ensureProcessTypesExistBulk(codes: number[]): Promise<void> {
    const PROCESS_TYPE_NAMES: Record<number, string> = {
      0: 'Standart Boyama',
      1: 'Sentetik/Özel Boyama',
      2: 'Kasar(Ön İşlem)',
      3: 'Hazırlık/Yağ Sökümü',
      4: 'Yıkama(Haslık)',
      5: 'Yumuşatma',
      6: 'Durulama/Söküm',
      7: 'İlave Program',
    }

    const uniqueCodes = [...new Set(codes.filter(code => code != null))]
    if (!uniqueCodes.length)
      return

    const existing = await this.trx('BFPROCESSTYPES')
      .whereIn('PROCESSCODE', uniqueCodes)
      .pluck('PROCESSCODE') as number[]

    const existingSet = new Set(existing.map(Number))
    const missing = uniqueCodes.filter(code => !existingSet.has(Number(code)))

    if (missing.length) {
      await this.trx('BFPROCESSTYPES').insert(
        missing.map((code) => {
          const numericCode = Number(code)
          return {
            PROCESSCODE: code,
            PROCESSNAME: PROCESS_TYPE_NAMES[numericCode] ?? `Process ${code}`,
            NOTE: '',
            BOYAPRGMI: 1,
          }
        }),
      )
    }
  }

  /**
   * Programı veritabanına ekler
   * @param program - Program objesi
   * @returns {Promise<void>}
   */
  @withDmTransaction
  @withTransaction
  async insertProgram(program: Program, isNewVersion: boolean = true): Promise<void> {
    const exists = await this.hasProgram(program.programNo)
    if (exists) {
      throw new PError('PROGRAM_EXISTS', { machineId: this.id, programNo: program.programNo })
    }

    const { initialTemperature = 25 } = await getTeleskopSettings()

    const machine = await this.getMachineInfo()
    const commands = machine.commands
    const timestamp = this.getCurrentTimestamp()

    program.duration = calculateProgramDuration(program, {
      ...machine,
      commands: this.commandArrayToMap(machine.commands),
    }, initialTemperature).duration

    const chemRequests = machine.tbbModel === 'Tonello'
      ? await this.countTonelloChemicalRequests(program)
      : await this.countChemicalRequests(program)

    program.manChemReq = chemRequests.get(CommandType.ManChem) ?? 0
    program.autoChemReq = chemRequests.get(CommandType.AutoChem) ?? 0
    program.autoDyeReq = chemRequests.get(CommandType.AutoDye) ?? 0
    program.manDyeReq = chemRequests.get(CommandType.ManDye) ?? 0
    program.saltReq = chemRequests.get(CommandType.SaltRequest) ?? 0
    program.genericMat1Req = chemRequests.get(CommandType.GenericMaterial1) ?? 0
    program.genericMat2Req = chemRequests.get(CommandType.GenericMaterial2) ?? 0

    const steps: StepItem[] = []
    const parameters: StepParameter[] = []
    const stepIO: StepInputOutput[] = []
    const ioSelection: SelectionList[] = []

    // BFMASTERPRGHEADER
    const header = [{
      MACHINEID: this.id,
      PROGNO: program.programNo,
      PROCESSCODE: program.typeId,
      ADDITIONALPROCESSCODE: program.additionalTypeId,
      NAME: program.name,
      DURATION: program.duration,
      TOTALSTEP: program.steps.length,
      CHANGEDATE: program.updatedAt ?? timestamp,
      TBBCHANGESOURCE: '',
      TBBCHANGEDATE: program.updatedAtTBB ?? null,
      LOCKEDBY: program.author ? program.author : '',
      CREATIONDATE: program.createdAt ?? timestamp,
      USERCOMMENT: program.comment,
      ISDELETED: 0,
      ISCHANGED: program.isChanged ? 1 : 0,
      PRGSTATE: Math.min(program.prgState ?? ProgramStatus.EXISTS_ONLY_ON_DATABASE, 2),
      TBBPRGCHANGEDEVENT: program.tbbProgramChangedEvent,
      SOURCEMACHID: 0,
      TotalChemReq: program.manChemReq + program.autoChemReq + program.saltReq + program.genericMat1Req + program.genericMat2Req,
      TotalDyeReq: program.manDyeReq + program.autoDyeReq,
      ManChemReq: program.manChemReq,
      AutoChemReq: program.autoChemReq,
      AutoDyeReq: program.autoDyeReq,
      ManDyeReq: program.manDyeReq,
      DefaultRecipeNo: '',
      ICONNAME: program.icon,
      ORDEROFREQUESTS: '',
      TOTALSALTREQ: program.saltReq,
      TOTALGM1REQ: program.genericMat1Req,
      TOTALGM2REQ: program.genericMat2Req,
      PHASEVERSION: 1,
      INTERVENTIONFREEPROGRAM: 0,
    }]

    const programDuration = calculateProgramDuration(program, {
      ...machine,
      commands: this.commandArrayToMap(machine.commands),
    }, initialTemperature)

    program.steps.forEach((step, i) => {
      const stepDuration = programDuration.stepDuration[i].duration

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
        THEORETICDURATION: stepDuration,
      })
      // BFMASTERSTEPPARAMS
      step.mainCommand.parameters.forEach((parameter) => {
        parameters.push({
          PROGNO: program.programNo,
          MAINSTEP: i,
          PARALELSTEP: 0,
          PARAMETERINDEX: parameter.index,
          MACHINEID: this.id,
          VALUE: `${parameter.value}`.replace('.', ','),
          CONTAINSVARIABLE: 0,
          OPTIMIZEDVALUE: '',
          ERRORWARNING: 0,
          OPTIMIZED: parameter.optimized ? 1 : 0,
        })
      })

      const mainIOList = this.getSelectableIO(step.mainCommand.commandNo, commands)
      step.mainCommand.ioList.forEach((io) => {
        const mainIO = mainIOList.find(m => m.index === io.ioIndex)
        if (!mainIO)
          return

        // BFMASTERSTEPINPUTOUTPUTS
        stepIO.push({
          PROGNO: program.programNo,
          MAINSTEP: i,
          PARALELSTEP: 0,
          IOINDEX: mainIO.index,
          MACHINEID: this.id,
          IOID: mainIO.physicalId,
          IOTYPE: 5,
          ERRORWARNING: 0,
        })

        const ioDefs = commands
          .find(c => c.commandNo === step.mainCommand.commandNo)?.ioList
          .find(i => i.index === io.ioIndex)?.selections || []

        // BFMASTERSTEPSELECTIONLIST
        this.rankAndSortIOSelections(io.value, ioDefs).forEach((selection) => {
          ioSelection.push({
            SELECTIONINDEX: selection.index,
            PROGNO: program.programNo,
            MAINSTEP: i,
            PARALELSTEP: 0,
            IOINDEX: mainIO.index,
            MACHINEID: this.id,
            SELECTEDIOID: selection.value[1],
            IOTYPE: selection.value[0] - 1,
          })
        })
      })

      step.parallelCommands.forEach((parallelCommand, j) => {
        // BFMASTERSTEPS
        steps.push({
          MACHINEID: this.id,
          PROGNO: program.programNo,
          MAINSTEP: i,
          PARALELSTEP: j + 1,
          COMMANDNO: parallelCommand.commandNo,
          ISCONDITIONAL: 0,
          CONDITIONSTR: '',
          ERRORS: 0,
          THEORETICDURATION: 0,
        })
        // BFMASTERSTEPPARAMS
        parallelCommand.parameters.forEach((parameter) => {
          parameters.push({
            PROGNO: program.programNo,
            MAINSTEP: i,
            PARALELSTEP: j + 1,
            PARAMETERINDEX: parameter.index,
            MACHINEID: this.id,
            VALUE: `${parameter.value}`.replace('.', ','),
            CONTAINSVARIABLE: 0,
            OPTIMIZEDVALUE: '',
            ERRORWARNING: 0,
            OPTIMIZED: parameter.optimized ? 1 : 0,
          })
        })

        const paralelIOList = this.getSelectableIO(parallelCommand.commandNo, commands)
        parallelCommand.ioList.forEach((io) => {
          const paralelIO = paralelIOList.find(p => p.index === io.ioIndex)
          if (!paralelIO)
            return

          // BFMASTERSTEPINPUTOUTPUTS
          stepIO.push({
            PROGNO: program.programNo,
            MAINSTEP: i,
            PARALELSTEP: j + 1,
            IOINDEX: paralelIO.index,
            MACHINEID: this.id,
            IOID: paralelIO.physicalId,
            IOTYPE: 5,
            ERRORWARNING: 0,
          })

          const ioDefs = commands
            .find(c => c.commandNo === parallelCommand.commandNo)?.ioList
            .find(i => i.index === io.ioIndex)?.selections || []

          // BFMASTERSTEPSELECTIONLIST
          this.rankAndSortIOSelections(io.value, ioDefs).forEach((selection) => {
            ioSelection.push({
              SELECTIONINDEX: selection.index,
              PROGNO: program.programNo,
              MAINSTEP: i,
              PARALELSTEP: j + 1,
              IOINDEX: paralelIO.index,
              MACHINEID: this.id,
              SELECTEDIOID: selection.value[1],
              IOTYPE: selection.value[0] - 1,
            })
          })
        })
      })
    })

    const chunkSize = 50
    const bfTables = [
      ['BFMASTERPRGHEADER', [header]],
      ['BFMASTERSTEPS', this.chunkArray(steps, chunkSize)],
      ['BFMASTERSTEPPARAMS', this.chunkArray(parameters, chunkSize)],
      ['BFMASTERSTEPINPUTOUTPUTS', this.chunkArray(stepIO, chunkSize)],
      ['BFMASTERSTEPSELECTIONLIST', this.chunkArray(ioSelection, chunkSize)],
    ] as [string, any[][]][]

    for (const [table, array] of bfTables) {
      for (const item of array) {
        if (item.length) {
          await this.trx.insert(item).into(table.toString())
        }
      }
    }

    await this.insertProgramToArchive(program, isNewVersion, commands)
    await this.upsertTreatments(program)
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
   * Veritabanından belirtilen program(lar)ı siler.
   * @param programNos - Silinecek programın numarası veya numaraları (tekli veya array)
   * @returns {Promise<boolean>} - İşlem başarılıysa true döner
   */
  @withDmTransaction
  @withTransaction
  async deleteProgramFromDatabase(programNos: number | number[]): Promise<boolean> {
    const programNumbers = Array.isArray(programNos) ? programNos : [programNos]

    if (programNumbers.length === 0) {
      return false
    }

    let deletedCount = 0
    const tables = [
      'BFMASTERPRGHEADER',
      'BFMASTERSTEPS',
      'BFMASTERSTEPPARAMS',
      'BFMASTERSTEPINPUTOUTPUTS',
      'BFMASTERSTEPSELECTIONLIST',
    ]

    for (const table of tables) {
      deletedCount += await this.trx(table)
        .where('MACHINEID', this.id)
        .whereIn('PROGNO', programNumbers)
        .del()
    }

    // Başarılı bir silme olduysa Treatment temizliğini tetikle
    if (deletedCount > 0) {
      for (const programNo of programNumbers) {
        await this.deleteTreatments(programNo)
      }
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
      deletedCount += await this.trx(table).where('MACHINEID', this.id).andWhere('PROGNO', programNo).andWhere('MACHINEPRGVERSIONNO', versionNo).del()
    }

    return deletedCount > 0
  }

  /**
   * Makineden belirtilen programı siler.
   * @param programNo - Silinecek programın numarası
   * @returns {Promise<void>}
   */
  @withProgramClient
  async deleteRemoteProgram(programNo: number): Promise<void> {
    try {
      await this.client.deleteProgram(programNo)
      await logEditorOperation(ProgramEditorActivityCodes.PROGRAMDELETED_CONTROLLER, `Makine ${this.id}`, `Program No ${programNo}`)
    } catch (error) {
      logger.error({ error }, 'An error occured during deleting program(s) from machine.')
    }
  }

  /**
   * Makineden program numaralarının listesini alır ve döndürür.
   * @returns {Promise<number[]>} - Program listesi
   */
  @withProgramClient
  async fetchRemoteProgramList(): Promise<number[]> {
    try {
      return await this.client.fetchProgramList()
    } catch (error) {
      logger.error({ error }, 'An error occured during fetching program list from machine.')
      return []
    }
  }

  /**
   * Makineden tüm programları çeker ve yerel veritabanına kaydeder.
   * @returns Başarı durumu, indirilen program sayısı ve mesaj içeren nesne
   */
  @withProgramClient
  @withTransaction
  async downloadAllPrograms(): Promise<{ success: boolean, count: number, message: string }> {
    try {
      // Önce program listesini al
      const programNumbers = await this.client.fetchProgramList()

      if (programNumbers.length === 0) {
        return { success: true, count: 0, message: 'No programs found on machine' }
      }

      // Machine commands listesini al
      const commands = await this.fetchCommands()
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      // 1. Geçiş: tüm programları makineden indir
      const downloadedPrograms: { programNo: number, program: Program }[] = []
      for (const programNo of programNumbers) {
        try {
          const program = await this.client.downloadProgram(programNo, commands)
          if (!program) {
            throw new Error(`Program ${programNo} not found on machine`)
          }
          downloadedPrograms.push({ programNo, program })
        } catch (error) {
          errorCount++
          const errorMsg = `Program ${programNo}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
          logger.error({ error, programNo }, `Failed to download program ${programNo}`)
        }
      }

      // Tüm process type kodlarını tek seferde kontrol et ve eksikleri ekle
      const allTypeCodes = downloadedPrograms.flatMap(({ program }) => [program.typeId, program.additionalTypeId])
      await this.ensureProcessTypesExistBulk(allTypeCodes)

      // 2. Geçiş: programları veritabanına kaydet
      for (const { programNo, program } of downloadedPrograms) {
        try {
          const exists = await this.hasProgram(programNo)

          if (exists) {
            await this.deleteProgramFromDatabase(programNo)
            await this.insertProgram(program, true)
            logger.info(`Program ${programNo} updated (replaced existing program)`)
          } else {
            await this.insertProgram(program, true)
            logger.info(`Program ${programNo} created (new program)`)
          }

          program.isChanged = false
          program.prgState = ProgramStatus.EXISTS_ON_BOTH
          program.updatedAtTBB = program.updatedAt
          await this.updateProgramHeader(program)

          successCount++
        } catch (error) {
          errorCount++
          const errorMsg = `Program ${programNo}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
          logger.error({ error, programNo }, `Failed to insert program ${programNo}`)
        }
      }

      const message = `Downloaded ${successCount}/${programNumbers.length} programs successfully`
      if (errors.length > 0) {
        logger.warn({ errors }, 'Some programs failed to download')
      }

      return {
        success: errorCount === 0,
        count: successCount,
        message: errors.length > 0 ? `${message}. Errors: ${errors.join(', ')}` : message,
      }
    } catch (error) {
      logger.error({ error }, 'Failed to download all programs from machine')
      return {
        success: false,
        count: 0,
        message: `Failed to download programs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Yerel veritabanındaki tüm programları makineye yükler.
   * @returns Başarı durumu, yüklenen program sayısı ve mesaj içeren nesne
   */
  @withProgramClient
  @withTransaction
  async uploadAllPrograms(): Promise<{ success: boolean, count: number, message: string }> {
    try {
      // Yerel veritabanından tüm program header'larını al
      const programHeaders = await this.fetchAllProgramHeaders()

      if (programHeaders.length === 0) {
        return { success: true, count: 0, message: 'No programs found in database' }
      }

      // Machine commands listesini al
      const commands = await this.fetchCommands()
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      // Her program için upload işlemi yap
      for (const programHeader of programHeaders) {
        try {
          // Programın tam detaylarını al
          const { program } = await this.fetchProgram(programHeader.programNo)

          // Makineye yükle
          const isUploaded = await this.client.uploadProgram(program, commands)
          if (isUploaded) {
            program.isChanged = false
            program.prgState = ProgramStatus.EXISTS_ON_BOTH
            program.updatedAtTBB = program.updatedAt
            await this.updateProgramHeader(program)
          }

          successCount++

          logger.info(`Program ${program.programNo} successfully uploaded to machine`)
        } catch (error) {
          errorCount++
          const errorMsg = `Program ${programHeader.programNo}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
          logger.error({ error, programNo: programHeader.programNo }, `Failed to upload program ${programHeader.programNo}`)
        }
      }

      // Başarılı yüklemeler için log
      await logEditorOperation(ProgramEditorActivityCodes.PROGRAMSENT, `Makine ${this.id}`, `${successCount} programs uploaded`)

      const message = `Uploaded ${successCount}/${programHeaders.length} programs successfully`
      if (errors.length > 0) {
        logger.warn({ errors }, 'Some programs failed to upload')
      }

      return {
        success: errorCount === 0,
        count: successCount,
        message: errors.length > 0 ? `${message}. Errors: ${errors.join(', ')}` : message,
      }
    } catch (error) {
      logger.error({ error }, 'Failed to upload all programs to machine')
      return {
        success: false,
        count: 0,
        message: `Failed to upload programs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Belirtilen program numarasına sahip tüm arşivlenmiş programların header bilgilerini getirir.
   * @param programNo - Program numarası
   * @returns {Promise<ProgramHeader[]>} - Header bilgilerini içeren bir dizi döndürür
   */
  @withTransaction
  async fetchAllHeadersOfArchivedProgram(programNo: number): Promise<ProgramHeaderArchive[]> {
    return await this.trx
      .select({
        name: 'H.NAME',
        version: 'H.MACHINEPRGVERSIONNO',
        stepCount: 'H.TOTALSTEP',
        updatedAt: 'H.CHANGEDATE',
      })
      .from('BAMASTERPRGHEADER AS H')
      .join('BFPROCESSTYPES AS PT', 'PT.PROCESSCODE', 'H.PROCESSCODE')
      .leftJoin('BFPROCESSTYPES AS APT', 'APT.PROCESSCODE', 'H.ADDITIONALPROCESSCODE')
      .where('H.MACHINEID', this.id)
      .andWhere('H.PROGNO', programNo)
      .orderBy('H.MACHINEPRGVERSIONNO', 'asc')
  }

  /**
   * Belirtilen program numarasına ve sürüm numarasına sahip arşivlenmiş programı yükler.
   * @param programNo - Program numarası
   * @param versionNo - Sürüm numarası
   * @returns {Promise<void>}
   */
  @withTransaction
  async loadArchivedProgram(programNo: number, versionNo: number): Promise<void> {
    const { program } = await this.fetchArchivedProgram(programNo, versionNo)
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
   * Makine sabitlerini getirir.
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

  /**
   * Programı Treatments tablosuna ekler ve varsa optimizasyon parametrelerini günceller.
   * @param program - Program
   * @returns {Promise<void>}
   */
  @withDmTransaction
  async upsertTreatments(program: Program): Promise<void> {
    const dmTrx = this.dmTrx
    if (!dmTrx)
      return

    const groupNo = await this.getMachineGroupNo()
    if (!isDef(groupNo)) {
      throw new Error(`Machine ${this.id} not found`)
    }

    await upsertTreatments([{
      programNo: program.programNo,
      programName: program.name,
      groupNo,
    }], dmTrx)

    const settings = await fetchTeleskopSettings()
    if (settings.treatmentSettings.optimizedEnable) {
      await this.upsertTreatmentParameters(program)
    }
  }

  /**
   * Programın optimizasyon parametrelerini Treatment_Parameter_Ref tablosuna ekler
   * ve Treatments tablosundaki TreatmentParaCount değerini günceller.
   * Yalnızca optimizedEnable aktif olduğunda çağrılmalıdır.
   * @param program - Program
   * @returns {Promise<void>}
   */
  private async upsertTreatmentParameters(program: Program): Promise<void> {
    const dmTrx = this.dmTrx!
    const settings = await fetchTeleskopSettings()

    let totalOptimizeCount = 0
    const treatmentRefs = [] as { counter: number, parameterNo: number }[]
    const teleskopTreatmentParameters = await this.fetchTreatmentParameters()
    const treatmentParameters = teleskopTreatmentParameters.map((parameter) => {
      return { ...parameter, counter: 0 }
    })

    const erpTreatmentParameters = await dmTrx('Treatment_Parameter')
      .select({
        paramNo: 'TreatmentParaNo',
        paramName: 'TreatmentParaName',
      }) as { paramNo: number, paramName: string }[]

    const handleParameter = (command: ProgramStepCommand, parameter: ParameterItem) => {
      const tp = treatmentParameters.find((tp) => {
        return tp.commandNo === command.commandNo && tp.parameterIndex === parameter.index
      })
      if (tp) {
        tp.counter++
        if (tp.counter >= settings.treatmentSettings.optimizedLimit) {
          throw new PError('PROGRAM_TREATMENT_COMMAND_LIMIT', {
            machineId: this.id,
            programNo: program.programNo,
            commandNo: command.commandNo!,
            limit: settings.treatmentSettings.optimizedLimit,
          })
        }
        totalOptimizeCount++
        treatmentRefs.push({
          counter: tp.counter,
          parameterNo: erpTreatmentParameters.find(etp => `${tp.paramName}_${tp.counter}` === etp.paramName)?.paramNo || 0,
        })
      }
    }

    for (const step of program.steps) {
      for (const parameter of step.mainCommand.parameters) {
        handleParameter(step.mainCommand, parameter)
      }
      for (const parallelCommand of step.parallelCommands) {
        for (const parameter of parallelCommand.parameters) {
          handleParameter(parallelCommand, parameter)
        }
      }
    }

    await dmTrx('Treatments')
      .update({ TreatmentParaCount: totalOptimizeCount })
      .where('TreatmentNo', program.programNo)
      .andWhere('TreatmentType', 0)

    if (treatmentRefs.length) {
      await dmTrx('Treatment_Parameter_Ref').insert(
        treatmentRefs.map((ref, index) => ({
          TreatmentNo: program.programNo,
          TreatmentParaCounter: index + 1,
          TreatmentParaNo: ref.parameterNo,
          ImportState: 1,
          TreatmentType: 0,
        })),
      )
    }
  }

  private async getMachineGroupNo(): Promise<number | undefined> {
    const row = await db('BFMACHINES')
      .where('MACHINEID', this.id)
      .first({ groupNo: 'GRUPNO' })

    return row?.groupNo
  }

  @withDmTransaction
  @withTransaction
  async deleteTreatments(programNo: number): Promise<void> {
    const dmTrx = this.dmTrx
    if (!dmTrx)
      return

    // Use this.trx so we see within-transaction BF deletions
    const remainingAnywhere = await this.trx('BFMASTERPRGHEADER')
      .where('PROGNO', programNo)
      .first('PROGNO')

    const groupNo = await this.getMachineGroupNo()

    const remainingInGroup = isDef(groupNo)
      ? await this.trx('BFMASTERPRGHEADER as H')
        .join('BFMACHINES as M', 'M.MACHINEID', 'H.MACHINEID')
        .where('H.PROGNO', programNo)
        .andWhere('M.GRUPNO', groupNo)
        .first('H.PROGNO')
      : null

    // Only delete Treatment_MGroups entry for this group when no machine in the group has this program
    if (!remainingInGroup && isDef(groupNo)) {
      await dmTrx('Treatment_MGroups')
        .where('TreatmentNo', programNo)
        .andWhere('MGroupNo', groupNo)
        .andWhere('TreatmentType', 0)
        .del()
    }

    // Only delete Treatment_Parameter_Ref and Treatments when no machine has this program
    if (!remainingAnywhere) {
      await dmTrx('Treatment_Parameter_Ref')
        .where('TreatmentNo', programNo)
        .andWhere('TreatmentType', 0)
        .del()

      await dmTrx('Treatments')
        .where('TreatmentNo', programNo)
        .andWhere('TreatmentType', 0)
        .del()
    }
  }

  async fetchTreatmentParameters(): Promise<TreatmentParameter[]> {
    return await db('BFTREATMENTPARAMGROUPMAP as PGM')
      .select({
        paramId: 'PGM.PARAMID',
        paramName: 'PT.TREATMENTPARAMETER',
        groupId: 'PGM.GROUPID',
        commandNo: 'PGM.COMMANDNO',
        parameterIndex: 'PGM.PARAMETERINDEX',
      })
      .join('BFTREATMENTPARAMETERGROUPMACHINES as MG', 'PGM.GROUPID', 'MG.GROUPID')
      .join('BFTREATMENTPARAMETERS as PT', 'PT.ID', 'PGM.PARAMID')
      .where('MG.MACHINEID', this.id)
  }

  async fetchCommandTypeMappings(): Promise<CommandTypes[]> {
    return await db('BFCOMMANDTYPES as CT')
      .select({
        commandType: 'CT.commandType',
        commandNo: 'CT.commandNo',
      })
      .where('CT.machineId', this.id)
  }

  async fetchCommandsWithSelectableAdditive(): Promise<{ commandNo: number, parameterIndex: number }[]> {
    return await db
      .from('BFCOMMANDPARAMETERS')
      .select({
        commandNo: 'COMMANDNO',
        parameterIndex: 'PARAMETERINDEX',
      })
      .where('PARAMETERTYPE', ParameterTypeRaw.SELECT_ADDITIVE)
      .andWhere('MACHINEID', this.id)
  }

  async insertEmptyProgramHeader(machineId: number, programNo: number): Promise<void> {
    const timestamp = this.getCurrentTimestamp()

    await db('BFMASTERPRGHEADER')
      .insert({
        MACHINEID: machineId,
        PROGNO: programNo,
        PROCESSCODE: '',
        ADDITIONALPROCESSCODE: '',
        NAME: '',
        PRGSTATE: ProgramStatus.EXISTS_ONLY_ON_CONTROLLER,
        ISDELETED: 0,
        ISCHANGED: 0,
        CREATIONDATE: timestamp,
        CHANGEDATE: timestamp,
        DURATION: 0,
        TOTALSTEP: 0,
      })
  }

  private createChemicalRequestCountMap(): Map<CommandType, number> {
    return new Map<CommandType, number>([
      [CommandType.ManChem, 0],
      [CommandType.AutoChem, 0],
      [CommandType.ManDye, 0],
      [CommandType.AutoDye, 0],
      [CommandType.SaltRequest, 0],
      [CommandType.GenericMaterial1, 0],
      [CommandType.GenericMaterial2, 0],
    ])
  }

  /**
   * Programdaki toplam kimyasal ve boya istek sayısını hesaplar
   *
   * @param {Program} program - Program
   * @returns {Promise<Map<CommandType, number>>} - Toplam istek sayılarını döndürür
   */
  async countChemicalRequests(program: Program): Promise<Map<CommandType, number>> {
    const chemRequestCounters = this.createChemicalRequestCountMap()

    if (!program.steps.length)
      return chemRequestCounters

    const mappings = await this.fetchCommandTypeMappings()

    let activeRequests: number[] = []

    const handleCommand = (command: ProgramStepCommand) => {
      const { commandNo } = command
      const { commandType } = mappings.find(ct => ct.commandNo === commandNo) || {}
      if (commandType && !activeRequests.includes(commandNo)) {
        activeRequests.push(commandNo)
        chemRequestCounters.set(commandType, (chemRequestCounters.get(commandType) || 0) + 1)
      }
    }

    for (const step of program.steps) {
      const stepCommandNos: number[] = []

      handleCommand(step.mainCommand)
      stepCommandNos.push(step.mainCommand.commandNo)

      for (const parallelCommand of step.parallelCommands || []) {
        handleCommand(parallelCommand)
        stepCommandNos.push(parallelCommand.commandNo)
      }
      activeRequests = activeRequests.filter(cmdNo => stepCommandNos.includes(cmdNo))
    }

    return chemRequestCounters
  }

  async countTonelloChemicalRequests(program: Program): Promise<Map<CommandType, number>> {
    const chemRequestCounters = this.createChemicalRequestCountMap()

    if (!program.steps.length)
      return chemRequestCounters

    const commandsWithSelectableAdditives = await this.fetchCommandsWithSelectableAdditive()

    const incCounter = (type: CommandType) => {
      chemRequestCounters.set(type, (chemRequestCounters.get(type) || 0) + 1)
    }

    for (const step of program.steps) {
      const command = step.mainCommand
      const commandWithAdditive = commandsWithSelectableAdditives.find(c => c.commandNo === command.commandNo)
      if (commandWithAdditive) {
        let additionType = command.parameters[commandWithAdditive.parameterIndex].value
        additionType = typeof additionType === 'string' ? Number.parseInt(additionType) : additionType
        incCounter(additionType === AdditiveType.Chemical ? CommandType.AutoChem : CommandType.AutoDye)
      }
    }

    return chemRequestCounters
  }

  private rankAndSortIOSelections(ioValues: [number, number][], ioDefs: CommandIOSelection[]) {
    const ioDefMap = new Map(ioDefs.map((def, idx) => [
      `${def.type}-${def.physicalId}`,
      {
        rank: idx,
        index: def.index,
      },
    ]))

    return ioValues
      .map((io) => {
        const ioDefEntry = ioDefMap.get(`${io[0]}-${io[1]}`)
        if (ioDefEntry) {
          return {
            value: io,
            rank: ioDefEntry.rank,
            index: ioDefEntry.index,
          }
        } else {
          return null
        }
      })
      .filter(isDef)
      .toSorted((ioA, ioB) => {
        return ioA.rank - ioB.rank
      })
  }

  /**
   * Makinenin durumunu kontrol eder (ping)
   * @param {number} machineId - Makine ID'si (opsiyonel, this.id kullanılır)
   * @returns {Promise<boolean>} - Makine erişilebilirse true, değilse false
   */
  async getMachineStatus(machineId?: number): Promise<boolean> {
    const targetMachineId = machineId || this.id

    try {
      const machine: { ip: string, name: string } = await this
        .trx('BFMACHINES')
        .first({
          ip: 'IP',
          name: 'MACHINECODE',
        })
        .where('MACHINEID', targetMachineId)

      if (!machine || !machine.ip) {
        logger.warn(`Machine ${targetMachineId} not found or has no IP`)
        return false
      }

      const isOnline = await this.client.ping()
      return isOnline
    } catch (error) {
      return false
    }
  }

  /**
   * Belirtilen kriterlere göre program adımlarını arar
   * @param {FindInProgramsParams} params - Arama parametreleri
   * @returns {Promise<any>} - Arama sonuçları
   */
  @withTransaction
  async findInPrograms(params: FindInProgramsParams): Promise<any> {
    const { machineIds, commandNo, searchCriteria, stepRange } = params

    try {
      if (!searchCriteria || searchCriteria.length === 0) {
        let query = this.trx
          .distinct()
          .select({
            machineId: 'M.MACHINEID',
            machineName: 'M.MACHINECODE',
            programNo: 'H.PROGNO',
            programName: 'H.NAME',
            stepNo: 'S.MAINSTEP',
            parallelStep: 'S.PARALELSTEP',
            currentCommandNo: 'S.COMMANDNO',
          })
          .from('BFMACHINES as M')
          .join('BFMASTERPRGHEADER as H', 'M.MACHINEID', 'H.MACHINEID')
          .join('BFMASTERSTEPS as S', function () {
            this.on('H.MACHINEID', '=', 'S.MACHINEID')
              .andOn('H.PROGNO', '=', 'S.PROGNO')
          })
          .whereIn('M.MACHINEID', machineIds)
          .andWhere('S.COMMANDNO', commandNo)
          .andWhere('M.USEINTELESKOP', 1)
          .andWhere('M.INUSE', 1)

        if (stepRange) {
          query = query.andWhereBetween('S.MAINSTEP', [stepRange.start, stepRange.end])
        }

        const results = await query

        return {
          success: true,
          operation: 'find',
          count: results.length,
          results: results.map(row => ({
            machineId: row.machineId,
            machineName: row.machineName,
            programNo: row.programNo,
            programName: row.programName,
            stepNo: row.stepNo,
            parallelStep: row.parallelStep,
            currentCommandNo: row.currentCommandNo,
            matchedParameter: null,
            matchedIO: null,
          })),
        }
      }

      let query = this.trx
        .distinct()
        .select({
          machineId: 'M.MACHINEID',
          machineName: 'M.MACHINECODE',
          programNo: 'H.PROGNO',
          programName: 'H.NAME',
          stepNo: 'S.MAINSTEP',
          parallelStep: 'S.PARALELSTEP',
          currentCommandNo: 'S.COMMANDNO',
        })
        .from('BFMACHINES as M')
        .join('BFMASTERPRGHEADER as H', 'M.MACHINEID', 'H.MACHINEID')
        .join('BFMASTERSTEPS as S', function () {
          this.on('H.MACHINEID', '=', 'S.MACHINEID')
            .andOn('H.PROGNO', '=', 'S.PROGNO')
        })
        .whereIn('M.MACHINEID', machineIds)
        .andWhere('S.COMMANDNO', commandNo)
        .andWhere('M.USEINTELESKOP', 1)
        .andWhere('M.INUSE', 1)

      // Apply step range filter
      if (stepRange) {
        query = query.andWhereBetween('S.MAINSTEP', [stepRange.start, stepRange.end])
      }

      // Apply search criteria filters using EXISTS subqueries
      searchCriteria.forEach((criteria) => {
        if (criteria.type === 'parameter' && isDef(criteria.parameterIndex)) {
          // Use EXISTS subquery to check if parameter exists with criteria
          query = query.whereExists(function (this: any) {
            this.select(1)
              .from('BFMASTERSTEPPARAMS as P')
              .whereRaw('P.MACHINEID = S.MACHINEID')
              .andWhereRaw('P.PROGNO = S.PROGNO')
              .andWhereRaw('P.MAINSTEP = S.MAINSTEP')
              .andWhereRaw('P.PARALELSTEP = S.PARALELSTEP')
              .andWhere('P.PARAMETERINDEX', criteria.parameterIndex!)

            if (criteria.parameterType === ParameterType.NUMBER) {
              if (criteria.comparison === 'EQUALS') {
                this.andWhere('P.VALUE', String(criteria.parameterValue))
              } else if (criteria.comparison === 'GREATER_THAN') {
                this.andWhereRaw('CAST(REPLACE(P.VALUE, \',\', \'.\') AS FLOAT) > ?', [Number(criteria.parameterValue)])
              } else if (criteria.comparison === 'LESS_THAN') {
                this.andWhereRaw('CAST(REPLACE(P.VALUE, \',\', \'.\') AS FLOAT) < ?', [Number(criteria.parameterValue)])
              } else if (criteria.comparison === 'BETWEEN' && typeof criteria.parameterValue === 'string') {
                const [min, max] = criteria.parameterValue.split('-').map(Number)
                this.andWhereRaw('CAST(REPLACE(P.VALUE, \',\', \'.\') AS FLOAT) BETWEEN ? AND ?', [min, max])
              }
            } else if (criteria.parameterType === ParameterType.SELECT) {
              this.andWhere('P.VALUE', String(criteria.parameterValue))
            }
          })
        } else if (criteria.type === 'io' && isDef(criteria.ioIndex)) {
          if (criteria.ioValues && criteria.ioValues.length > 0) {
            query = query.whereExists(function (this: any) {
              this.select(1)
                .from('BFMASTERSTEPSELECTIONLIST as SL')
                .whereRaw('SL.MACHINEID = S.MACHINEID')
                .andWhereRaw('SL.PROGNO = S.PROGNO')
                .andWhereRaw('SL.MAINSTEP = S.MAINSTEP')
                .andWhereRaw('SL.PARALELSTEP = S.PARALELSTEP')
                .andWhere('SL.IOINDEX', criteria.ioIndex!)
                .groupBy('SL.MACHINEID', 'SL.PROGNO', 'SL.MAINSTEP', 'SL.PARALELSTEP')
                .havingRaw(`
                  COUNT(*) = ? AND
                  ${criteria.ioValues.map((ioValue: any) => {
                    const dbType = ioValue.type - 1
                    return `COUNT(CASE WHEN SL.IOTYPE = ${dbType} AND SL.SELECTEDIOID = ${ioValue.physicalId} THEN 1 END) = 1`
                  }).join(' AND ')}
                `, [criteria.ioValues.length])
            })
          }
        }
      })

      const results = await query

      return {
        success: true,
        operation: 'find',
        count: results.length,
        results: results.map(row => ({
          machineId: row.machineId,
          machineName: row.machineName,
          programNo: row.programNo,
          programName: row.programName,
          stepNo: row.stepNo,
          parallelStep: row.parallelStep,
          currentCommandNo: row.currentCommandNo,
        })),
      }
    } catch (error) {
      console.error('Error in findInPrograms:', error)
      throw new Error('Failed to search in programs', { cause: error })
    }
  }
}
