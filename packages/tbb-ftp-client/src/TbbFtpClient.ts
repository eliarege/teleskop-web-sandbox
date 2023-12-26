import { Client } from 'basic-ftp'
import { download, upload } from './utils/ftp'
import { parseLockGeneral } from './parsers/parseLockGeneral'
import { parseUser } from './parsers/parseUser'
import { parseManualReason } from './parsers/parseManualReason'
import { parseStopReason } from './parsers/parseStopReason'
import { parseFinishReason } from './parsers/parseFinishReason'
import { parseCommandAlarmReasons } from './parsers/parseCommandAlarmReasons'
import { parseMachineParameters } from './parsers/parseMachineParameters'
import { parseMachineParameterValues } from './parsers/parseMachineParameterValues'
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
import { writeFinishReason } from './writers/writeFinishReason'
import { FinishReason } from './types'
import { parseConsumption } from './parsers/parseConsumption'
import { parseGlobalCommandFormulas } from './parsers/parseGlobalCommandFormulas'

export class TbbFtpClient {
  private host: string
  private client: Client

  constructor(host: string, timeout?: number) {
    this.host = host
    this.client = new Client(timeout)
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
   * Close the client and all open socket connections.
   *
   * Close the client and all open socket connections. The client can’t be used anymore after calling this method,
   * you have to either reconnect with `connect` or instantiate a new instance to continue any work.
   * A client is also closed automatically if any timeout or connection error occurs.
   */
  close(): void {
    this.client.close()
  }

  async fetchLocksGeneral() {
    const remotePath = '/tbb6500/data/locks/locks_general'
    const content = await download(this.client, remotePath)
    const locks = parseLockGeneral(content)
    return locks
  }

  async fetchUsers() {
    const remotePath = '/tbb6500/data/users/users'
    const content = await download(this.client, remotePath)
    const users = parseUser(content)
    return users
  }

  async fetchManualReasons() {
    const remotePath = '/tbb6500/data/config/manuelmodnedenleri'
    const content = await download(this.client, remotePath)
    const manualReasons = parseManualReason(content)
    return manualReasons
  }

  async fetchStopReasons() {
    const remotePath = '/tbb6500/data/config/durusnedenleri'
    const content = await download(this.client, remotePath)
    const stopReasons = parseStopReason(content)
    return stopReasons
  }

  async fetchFinishReasons() {
    const remotePath = '/tbb6500/data/config/bitirmenedenleri'
    const content = await download(this.client, remotePath)
    const data = parseFinishReason(content)
    return data
  }

  async fetchCommandAlarmReasons() {
    const remotePath = '/tbb6500/data/config/commandAlarmReasons'
    const content = await download(this.client, remotePath)
    const commandAlarmReasons = parseCommandAlarmReasons(content)
    return commandAlarmReasons
  }

  async fetchMachineParameters() {
    const remotePath = '/tbb6500/data/config/makinesabitleri'
    const content = await download(this.client, remotePath)
    const machineParameters = parseMachineParameters(content)
    return machineParameters
  }

  async fetchMachineParameterValues() {
    const remotePath = '/tbb6500/data/config/makinesabitleriDegerler'
    const content = await download(this.client, remotePath)
    const values = parseMachineParameterValues(content)
    return values
  }

  async fetchControllerModel() {
    const remotePath = '/var/controllerModel'
    const content = await download(this.client, remotePath)
    const controllerModel = parseControllerModel(content)
    return controllerModel
  }

  async fetchAnalogInputs() {
    const remotePath = '/tbb6500/data/io/analoginput'
    const content = await download(this.client, remotePath)
    const analogInputs = parseAnalogInput(content)
    return analogInputs
  }

  async fetchAnalogOutputs() {
    const remotePath = '/tbb6500/data/io/analogoutput'
    const content = await download(this.client, remotePath)
    const analogOutputs = parseAnalogOutput(content)
    return analogOutputs
  }

  async fetchDigitalInputs() {
    const remotePath = '/tbb6500/data/io/sayisalinput'
    const content = await download(this.client, remotePath)
    const digitalInput = parseDigitalInput(content)
    return digitalInput
  }

  async fetchDigitalOutputs() {
    const remotePath = '/tbb6500/data/io/sayisaloutput'
    const content = await download(this.client, remotePath)
    const digitalOutputs = parseDigitalOutput(content)
    return digitalOutputs
  }

  async fetchCounters() {
    const remotePath = '/tbb6500/data/io/sayac'
    const content = await download(this.client, remotePath)
    const analogInputs = parseCounter(content)
    return analogInputs
  }

  async fetchCommandGroups() {
    const remotePath = '/tbb6500/data/commands/commandGroup'
    const content = await download(this.client, remotePath)
    const commandGroups = parseCommandGroup(content)
    return commandGroups
  }

  async fetchCommandsGeneral() {
    const remotePath = '/tbb6500/data/commands/general'
    const content = await download(this.client, remotePath)
    const commands = parseCommandsGeneral(content)
    return commands
  }

  async fetchCommandsEditing() {
    const remotePath = '/tbb6500/data/commands/editing'
    const content = await download(this.client, remotePath)
    const commands = parseCommandsEditing(content)
    return commands
  }

  async fetchCommandIO() {
    const remotePath = '/tbb6500/data/commands/io'
    const content = await download(this.client, remotePath)
    const commandGroups = parseCommandIO(content)
    return commandGroups
  }

  async fetchCommandParams() {
    const remotePath = '/tbb6500/data/commands/params'
    const content = await download(this.client, remotePath)
    const commandGroups = parseCommandParams(content)
    return commandGroups
  }

  async fetchCommandFeedback() {
    const remotePath = '/tbb6500/data/commands/feedback'
    const content = await download(this.client, remotePath)
    const commandGroups = parseCommandFeedback(content)
    return commandGroups
  }

  async fetchFunctionAlarms() {
    const remotePath = '/tbb6500/data/config/function_alarms'
    const content = await download(this.client, remotePath)
    const commandGroups = parseFunctionAlarms(content)
    return commandGroups
  }

  async fetchCommandGraphic() {
    const remotePath = '/tbb6500/data/commands/graphic'
    const content = await download(this.client, remotePath)
    const commandGroups = parseCommandGraphic(content)
    return commandGroups
  }

  async fetchCommandAlarms() {
    const remotePath = '/tbb6500/data/commands/alarms'
    const content = await download(this.client, remotePath)
    const commandGroups = parseCommandAlarms(content)
    return commandGroups
  }

  async fetchConsumption() {
    const remotePath = '/tbb6500/data/config/consumption'
    const content = await download(remotePath, this.host)
    const consumption = parseConsumption(content)
    return consumption
  }

  async fetchGlobalCommandFormulas() {
    const remotePath = '/tbb6500/yedek/data/config/globalCommandFormulas'
    const content = await download(remotePath, this.host)
    const formulas = parseGlobalCommandFormulas(content)
    return formulas
  }

  /*   async writeMachineParameterValues(values) {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/config'
      const sourcePath = './server/data/config/makinesabitleriDegerler'
      const remotePath = '/tbb6500/data/config/makinesabitleriDegerler'

      const content = fileMachineParameterValuesWriter(values)

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }
      await fs.promises.writeFile(sourcePath, content)
      await this.ftpClient.uploadFrom(sourcePath, remotePath)
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async writeUsers(users: User[]) {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/users'
      const sourcePath = './server/data/users/users'
      const remotePath = '/tbb6500/data/users/users'

      const content = fileUserWriter(users)

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }
      await fs.promises.writeFile(sourcePath, content)
      await this.ftpClient.uploadFrom(sourcePath, remotePath)
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async writeStopReasons(stopReasons: StopReason[]) {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/config'
      const sourcePath = './server/data/config/durusnedenleri'
      const remotePath = '/tbb6500/data/config/durusnedenleri'

      const content = fileStopReasonWriter(stopReasons)

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }
      await fs.promises.writeFile(sourcePath, content)
      await this.ftpClient.uploadFrom(sourcePath, remotePath)
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }
*/
  /*   async uploadFinishReasons(finishReasons: FinishReason[]) {
      const remotePath = '/tbb6500/data/config/bitirmenedenleri'
      const content = writeFinishReason(finishReasons)
      await upload(remotePath, this.host, content)
  }
 */
}
