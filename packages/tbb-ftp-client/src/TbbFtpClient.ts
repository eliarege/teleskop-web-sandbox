import type { Buffer } from 'node:buffer'
import path from 'node:path'
import type { FileInfo } from 'basic-ftp'
import { Client } from 'basic-ftp'
import type { DownloadOptions, DownloadOptionsWithEncoding, DownloadOptionsWithoutEncoding } from './utils/ftp'
import { download, upload } from './utils/ftp'
import { parseLockGeneral } from './parsers/parseLockGeneral'
import { parseUser, serializeUser } from './parsers/parseUser'
import { parseManualReason, serializeManualReason } from './parsers/parseManualReason'
import { parseStopReason, serializeStopReason } from './parsers/parseStopReason'
import { parseFinishReason, serializeFinishReason } from './parsers/parseFinishReason'
import { parseCommandAlarmReasons, serializeCommandAlarmReasons } from './parsers/parseCommandAlarmReasons'
import { parseMachineParameters } from './parsers/parseMachineParameters'
import { parseMachineParameterValues, serializeMachineParameterValues } from './parsers/parseMachineParameterValues'
import { parseControllerModel } from './parsers/parseControllerModel'
import { parseAnalogInput } from './parsers/parseAnalogInput'
import { parseAnalogOutput } from './parsers/parseAnalogOutput'
import { parseDigitalInput } from './parsers/parseDigitalInput'
import { parseDigitalOutput } from './parsers/parseDigitalOutput'
import { parseCounter } from './parsers/parseCounter'
import { parseCommandGroup } from './parsers/parseCommandGroup'
import { parseCommandsGeneral } from './parsers/parseCommandsGeneral'
import { parseCommandsEditing } from './parsers/parseCommandsEditing'
import { parseCommandIO } from './parsers/parseCommandIO'
import { parseCommandParams } from './parsers/parseCommandParams'
import { parseCommandFeedback } from './parsers/parseCommandFeedback'
import { parseFunctionAlarms } from './parsers/parseFunctionAlarms'
import { parseCommandGraphic } from './parsers/parseCommandGraphic'
import { parseCommandAlarms } from './parsers/parseCommandAlarms'
import type { CommandAlarmReason, FinishReason, GlobalCommandFormula, Icon, MachineParameter, ManualReason, StopReason, User } from './types'
import { parseConsumption } from './parsers/parseConsumption'
import { parseGlobalCommandFormulas, serializeGlobalCommandFormulas } from './parsers/parseGlobalCommandFormulas'
import { parseSeperatedLocks } from './parsers/parseLocksInput'
import { parseBatchParameters } from './parsers/parseBatchParameters'
import { parseCycleControl } from './parsers/parseCycleControl'
import { parseSystem, serializeSystem } from './parsers/parseSystem'
import { parseLocksOutput } from './parsers/parseLocksOutput'
import { parseCalibrationCounter } from './parsers/parseCalibrationCounter'
import { parseCalibrationAnalogInput } from './parsers/parseCalibrationAnalogInput'
import { parseIOChangedEvent } from './parsers/parseIOChangedEvent'
import { parseMachineTranslations } from './parsers/parseMachineTranslations'

export interface TbbFtpClientOptions {
  timeout?: number
}

export class TbbFtpClient {
  private host: string
  private client: Client

  constructor(host: string, options?: TbbFtpClientOptions) {
    this.host = host
    this.client = new Client(options?.timeout)
  }

  /**
   * Connect (or reconnect) to the TBB FTP server.
   *
   * This is an instance method and thus can be called multiple times during the lifecycle of a `Client`
   * instance. Whenever you do, the client is reset with a new control connection. This also implies that
   * you can reopen a `Client` instance that has been closed due to an error when reconnecting with this
   * method. In fact, reconnecting is the only way to continue using a closed `Client`.
   */
  async connect(): Promise<void> {
    await this.client.access({
      host: this.host,
      user: 'eliar',
      password: 'el1984',
    })
  }

  /**
   * Alias for `connect`
   */
  reconnect(): Promise<void> {
    return this.connect()
  }

  /**
   * Close the client and all open socket connections.
   *
   * Close the client and all open socket connections. The client can’t be used anymore after calling this method,
   * you have to either reconnect with `connect` or instantiate a new instance to continue any work.
   * A client is also closed automatically if any timeout or connection error occurs.
   */
  close(): void {
    this.client.close()
  }

  /**
   * Download file at path via FTP
   *
   * @param path
   */
  download(path: string, options?: DownloadOptionsWithoutEncoding): Promise<Buffer>
  download(path: string, options: DownloadOptionsWithEncoding | BufferEncoding): Promise<string>
  download(path: string, options?: DownloadOptions | BufferEncoding): Promise<string | Buffer>
  download(path: string, options?: DownloadOptions | BufferEncoding): Promise<string | Buffer> {
    return download(this.client, path, options)
  }

  /** Download with defaults */
  private _download(path: string) {
    return download(this.client, path, {
      encoding: 'utf8',
      emptyWhenNotFound: true,
    })
  }

  /**
   * Upload file to path via FTP
   *
   * @param path
   */
  upload(path: string, data: string | Uint8Array | Buffer, mode?: string | number) {
    return upload(this.client, path, data, mode)
  }

  /**
   * Delete file at path via FTP
   */
  async remove(remotePath: string): Promise<void> {
    await this.client.remove(remotePath)
  }

  /**
   * Fetch directory contents via FTP
   * @param path
   */
  async list(path: string): Promise<FileInfo[]> {
    return await this.client.list(path)
  }

  /**
   * Fetch program list on path via FTP
   */
  async fetchProgramList(): Promise<number[]> {
    const programFiles = await this.client.list('/tbb6500/data/programs/program')
    const programNoList = programFiles.map(item => Number.parseInt(item.name))
    return programNoList
  }

  async fetchLocksGeneral() {
    const remotePath = '/tbb6500/data/locks/locks_general'
    const content = await this._download(remotePath)
    const locks = parseLockGeneral(content)
    return locks
  }

  async fetchUsers() {
    const remotePath = '/tbb6500/data/users/users'
    const content = await this._download(remotePath)
    const users = parseUser(content)
    return users
  }

  async fetchManualReasons() {
    const remotePath = '/tbb6500/data/config/manuelmodnedenleri'
    const content = await this._download(remotePath)
    const manualReasons = parseManualReason(content)
    return manualReasons
  }

  async fetchStopReasons() {
    const remotePath = '/tbb6500/data/config/durusnedenleri'
    const content = await this._download(remotePath)
    const stopReasons = parseStopReason(content)
    return stopReasons
  }

  async fetchFinishReasons() {
    const remotePath = '/tbb6500/data/config/bitirmenedenleri'
    const content = await this._download(remotePath)
    const data = parseFinishReason(content)
    return data
  }

  async fetchCommandAlarmReasons() {
    const remotePath = '/tbb6500/data/config/commandAlarmReasons'
    const content = await this._download(remotePath)
    const commandAlarmReasons = parseCommandAlarmReasons(content)
    return commandAlarmReasons
  }

  async fetchMachineParameters() {
    const remotePath = '/tbb6500/data/config/makinesabitleri'
    const content = await this._download(remotePath)
    const machineParameters = parseMachineParameters(content)
    return machineParameters
  }

  async fetchMachineParameterValues() {
    const remotePath = '/tbb6500/data/config/makinesabitleriDegerler'
    const content = await this._download(remotePath)
    const values = parseMachineParameterValues(content)
    return values
  }

  async fetchControllerModel() {
    const remotePath = '/var/controllerModel'
    const content = await this._download(remotePath)
    const controllerModel = parseControllerModel(content)
    return controllerModel
  }

  async fetchAnalogInputs() {
    const remotePath = '/tbb6500/data/io/analoginput'
    const content = await this._download(remotePath)
    const analogInputs = parseAnalogInput(content)
    return analogInputs
  }

  async fetchAnalogOutputs() {
    const remotePath = '/tbb6500/data/io/analogoutput'
    const content = await this._download(remotePath)
    const analogOutputs = parseAnalogOutput(content)
    return analogOutputs
  }

  async fetchDigitalInputs() {
    const remotePath = '/tbb6500/data/io/sayisalinput'
    const content = await this._download(remotePath)
    const digitalInput = parseDigitalInput(content)
    return digitalInput
  }

  async fetchDigitalOutputs() {
    const remotePath = '/tbb6500/data/io/sayisaloutput'
    const content = await this._download(remotePath)
    const digitalOutputs = parseDigitalOutput(content)
    return digitalOutputs
  }

  async fetchCounters() {
    const remotePath = '/tbb6500/data/io/sayac'
    const content = await this._download(remotePath)
    const counters = parseCounter(content)
    return counters
  }

  async fetchCalibrationCounters() {
    const remotePath = '/tbb6500/data/kalibrasyon/sayackalibrasyon'
    const content = await this._download(remotePath)
    const calibrationCounters = parseCalibrationCounter(content)
    return calibrationCounters
  }

  async fetchCalibrationAnalogInput() {
    const remotePath = '/tbb6500/data/kalibrasyon/aikalibrasyon'
    const content = await this._download(remotePath)
    const calibrations = parseCalibrationAnalogInput(content)
    return calibrations
  }

  async fetchCommandGroups() {
    const remotePath = '/tbb6500/data/commands/commandGroup'
    const content = await this._download(remotePath)
    const commandGroups = parseCommandGroup(content)
    return commandGroups
  }

  async fetchCommandsGeneral() {
    const remotePath = '/tbb6500/data/commands/general'
    const content = await this._download(remotePath)
    const commands = parseCommandsGeneral(content)
    return commands
  }

  async fetchIOChangedEvent() {
    const remotePath = '/tbb6500/data/config/io_changed_event'
    const content = await this._download(remotePath)
    const inputs = parseIOChangedEvent(content)
    return inputs
  }

  async fetchCommandsEditing() {
    const remotePath = '/tbb6500/data/commands/editing'
    const content = await this._download(remotePath)
    const commands = parseCommandsEditing(content)
    return commands
  }

  async fetchCommandIO() {
    const remotePath = '/tbb6500/data/commands/io'
    const content = await this._download(remotePath)
    const commandGroups = parseCommandIO(content)
    return commandGroups
  }

  async fetchCommandParams() {
    const remotePath = '/tbb6500/data/commands/params'
    const content = await this._download(remotePath)
    const commandGroups = parseCommandParams(content)
    return commandGroups
  }

  async fetchCommandFeedback() {
    const remotePath = '/tbb6500/data/commands/feedback'
    const content = await this._download(remotePath)
    const commandGroups = parseCommandFeedback(content)
    return commandGroups
  }

  async fetchFunctionAlarms() {
    const remotePath = '/tbb6500/data/config/function_alarms'
    const content = await this._download(remotePath)
    const commandGroups = parseFunctionAlarms(content)
    return commandGroups
  }

  async fetchCommandGraphic() {
    const remotePath = '/tbb6500/data/commands/graphic'
    const content = await this._download(remotePath)
    const commandGroups = parseCommandGraphic(content)
    return commandGroups
  }

  async fetchCommandAlarms() {
    const remotePath = '/tbb6500/data/commands/alarms'
    const content = await this._download(remotePath)
    const commandGroups = parseCommandAlarms(content)
    return commandGroups
  }

  async fetchConsumption() {
    const remotePath = '/tbb6500/data/config/consumption'
    const content = await this._download(remotePath)
    const consumption = parseConsumption(content)
    return consumption
  }

  async fetchGlobalCommandFormulas() {
    const remotePath = '/tbb6500/data/config/globalCommandFormulas'
    const content = await this._download(remotePath)
    const formulas = parseGlobalCommandFormulas(content)
    return formulas
  }

  async fetchLocksInput() {
    const remotePath = '/tbb6500/data/locks/locks_inputs'
    const content = await this._download(remotePath)
    const lines = content.split('\n').filter(line => line.length > 0)
    const parsedData = lines.map(parseSeperatedLocks)

    return parsedData
  }

  async fetchLocksOutput() {
    const remotePath = '/tbb6500/data/locks/locks_outputs'
    const content = await this._download(remotePath)
    const locks = parseLocksOutput(content)
    return locks
  }

  async fetchBatchParameters() {
    const remotePath = '/tbb6500/data/config/baslatmaParametreleri'
    const content = await this._download(remotePath)
    const batchParameters = parseBatchParameters(content)
    return batchParameters
  }

  async fetchCycleControl() {
    const remotePath = '/tbb6500/data/config/manuel/cycle_kontrol'
    const content = await this._download(remotePath)
    const cycleControl = parseCycleControl(content)
    return cycleControl
  }

  async fetchSystemParams() {
    const remotePath = '/tbb6500/data/config/sistem'
    const content = await this._download(remotePath)
    const system = parseSystem(content)
    return system
  }

  async fetchIcons() {
    const iconPaths = [
      { type: 1, path: '/tbb6500/data/pics/function_icons_big' },
      { type: 2, path: '/tbb6500/data/pics/function_icons_big/paralel' },
      { type: 3, path: '/tbb6500/data/pics/function_disable_icons_big' },
      { type: 4, path: '/tbb6500/data/pics/function_disable_icons_big/paralel' },
    ]
    const icons: Icon[] = []

    for (const iconPath of iconPaths) {
      const files = await this.list(iconPath.path)
      for (const file of files) {
        if (file.isFile) {
          icons.push({
            name: file.name,
            type: iconPath.type,
            data: await this.download(path.posix.join(iconPath.path, file.name)),
          })
        }
      }
    }

    return icons
  }

  async uploadSystemParams(system: Record<string, any>) {
    const remotePath = '/tbb6500/data/config/sistem'
    const content = serializeSystem(system)
    await upload(this.client, remotePath, content)
  }

  async uploadMachineParameterValues(values: MachineParameter[]) {
    const remotePath = '/tbb6500/data/config/makinesabitleriDegerler'
    const content = serializeMachineParameterValues(values)
    await upload(this.client, remotePath, content)
  }

  async uploadUsers(users: User[]) {
    const remotePath = '/tbb6500/data/users/users'
    const content = serializeUser(users)
    await upload(this.client, remotePath, content)
  }

  async uploadStopReasons(stopReasons: StopReason[]) {
    const remotePath = '/tbb6500/data/config/durusnedenleri'
    const content = serializeStopReason(stopReasons)
    await upload(this.client, remotePath, content)
  }

  async uploadFinishReasons(finishReasons: FinishReason[]) {
    const remotePath = '/tbb6500/data/config/bitirmenedenleri'
    const content = serializeFinishReason(finishReasons)
    await upload(this.client, remotePath, content)
  }

  async uploadGlobalCommandFormulas(formulas: GlobalCommandFormula[]) {
    const remotePath = '/tbb6500/data/config/globalCommandFormulas'
    const content = serializeGlobalCommandFormulas(formulas)
    await upload(this.client, remotePath, content)
  }

  async uploadManualReasons(reasons: ManualReason[]) {
    const remotePath = '/tbb6500/data/config/manuelmodnedenleri'
    const content = serializeManualReason(reasons)
    await upload(this.client, remotePath, content)
  }

  async uploadCommandAlarmReasons(reasons: CommandAlarmReason[]) {
    const remotePath = '/tbb6500/data/config/commandAlarmReasons'
    const content = serializeCommandAlarmReasons(reasons)
    await upload(this.client, remotePath, content)
  }

  async readTranslationFiles(machineId: number, fromLocale: number) {
    const translationsPerLocale: {
      machine_id: number
      from_locale: number
      to_locale: number
      messages: Record<string, string>
    }[] = []

    const paths = [
      '/tbb6500/data/config/translationsProject20.txt',
      '/tbb6500/data/config/translationsProject50.txt',
      '/tbb6500/data/config/translationsProject100.txt',
    ]

    const tempMap = new Map<number, Record<string, string>>()

    for (const path of paths) {
      const content = (await this.download(path)).toString()
      const parsedList = parseMachineTranslations(fromLocale, content, machineId)

      for (const item of parsedList) {
        if (!tempMap.has(item.to_locale)) {
          tempMap.set(item.to_locale, {})
        }
        Object.assign(tempMap.get(item.to_locale)!, item.messages)
      }
    }

    for (const [toLocale, messages] of tempMap.entries()) {
      translationsPerLocale.push({
        machine_id: machineId,
        from_locale: fromLocale,
        to_locale: toLocale,
        messages,
      })
    }
    return translationsPerLocale
  }
}
