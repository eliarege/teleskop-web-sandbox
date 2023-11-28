import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { fileCommandAlarmReasonsParser } from './fileParsers/fileCommandAlarmReasonsParser'
import { fileMachineParametersParser } from './fileParsers/fileMachineParametersParser'
import { fileMachineParameterValuesParser } from './fileParsers/fileMachineParameterValuesParser'
import { fileFinishReasonWriter } from './fileWriters/fileFinishReasonWriter'
import { fileStopReasonWriter } from './fileWriters/fileStopReasonWriter'
import { fileControllerModelParser } from './fileParsers/fileControllerModelParser'
import { fileUserWriter } from './fileWriters/fileUserWriter'
import { fileAnalogInputParser } from './fileParsers/fileAnalogInputParser'
import { fileAnalogOutputParser } from './fileParsers/fileAnalogOutputParser'
import { fileDigitalInputParser } from './fileParsers/fileDigitalInputParser'
import { fileDigitalOutputParser } from './fileParsers/fileDigitalOutputParser'
import { fileCounterParser } from './fileParsers/fileCounterParser'
import { fileCommandGroupParser } from './fileParsers/fileCommandGroupParser'
import { fileCommandsEditingParser } from './fileParsers/fileCommandsEditingParser'
import { fileCommandsGeneralParser } from './fileParsers/fileCommandsGeneralParser'
import { fileCommandIOParser } from './fileParsers/fileCommandIOParser'
import { fileCommandFeedbackParser } from './fileParsers/fileCommandFeedbackParser'
import { fileFunctionAlarmsParser } from './fileParsers/fileFunctionAlarmsParser'
import { calcIONumber } from '.'
import type { FinishReason, MachineStopReason, User } from '~/types'

export class TBB6500FtpClient {
  host: string
  ftpClient = new ftp.Client()

  constructor(host: string) {
    this.host = host
  }

  async connectClient() {
    await this.ftpClient.access({
      host: this.host,
      user: 'eliar',
      password: 'el1984',
    })
  }

  async fetchLocksGeneral() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/locks'
      const sourcePath = './server/data/locks/locks_general'
      const remotePath = '/tbb6500/data/locks/locks_general'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const locks = fileLockGeneralParser(content)

      const modifiedLocks = locks.map((l) => {
        return {
          MACHINEID: l.machineId,
          LOCKNO: l.lockNo,
          LOCKNAME: l.lockName,
          LOGICTYPE: l.logicType,
          STOPDYEING: l.stopDyeing,
          JUMPSTEP: l.jumpStep,
          ALARM: l.alarm,
          ONDELAY: l.onDelay,
          STEPDELAY: l.stepDelay,
          GIVEMESSAGE: l.giveMessage,
          MESSAGESTRING: l.messageString,
          AINLOGICTYPE: 0,
          DINLOGICTYPE: 0,
          COMMANDLOGICTYPE: 0,
          LOCKLOGICTYPE: 0,
          DOUTLOGICTYPE: 0,
          VINLOGICTYPE: 0,
        }
      })

      return modifiedLocks
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchUsers() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/users'
      const sourcePath = './server/data/users/users'
      const remotePath = '/tbb6500/data/users/users'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }
      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const users = fileUserParser(content)

      return users
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

      /*       if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }
      await fs.promises.writeFile(sourcePath, content)
      await this.ftpClient.uploadFrom(sourcePath, remotePath)
 */
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchManualReasons() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/config'
      const sourcePath = './server/data/config/manuelmodnedenleri'
      const remotePath = '/tbb6500/data/config/manuelmodnedenleri'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const manualReasons = fileManualReasonParser(content)

      const modifiedManualReasons = manualReasons.map((r) => {
        return {
          manualID: r.manualId,
          manualString: r.manualReason,
          ReportToERP: r.reportToERP,
        }
      })

      return modifiedManualReasons
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchStopReasons() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/config'
      const sourcePath = './server/data/config/durusnedenleri'
      const remotePath = '/tbb6500/data/config/durusnedenleri'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const stopReasons = fileStopReasonParser(content)

      return stopReasons
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async writeStopReasons(stopReasons: MachineStopReason[]) {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/config'
      const sourcePath = './server/data/config/durusnedenleri'
      const remotePath = '/tbb6500/data/config/durusnedenleri'

      const content = fileStopReasonWriter(stopReasons)

      /*       if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }
      await fs.promises.writeFile(sourcePath, content)
      await this.ftpClient.uploadFrom(sourcePath, remotePath)
 */
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchFinishReasons() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/config'
      const sourcePath = './server/data/config/bitirmenedenleri'
      const remotePath = '/tbb6500/data/config/bitirmenedenleri'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const finishReasons = fileFinishReasonParser(content)

      return finishReasons
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async writeFinishReasons(finishReasons: FinishReason[]) {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/config'
      const sourcePath = './server/data/config/bitirmenedenleri'
      const remotePath = '/tbb6500/data/config/bitirmenedenleri'

      const content = fileFinishReasonWriter(finishReasons)

      /*       if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }
      await fs.promises.writeFile(sourcePath, content)
      await this.ftpClient.uploadFrom(sourcePath, remotePath)
 */
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchCommandAlarmReasons() {
    try {
      /*       await this.connectClient()
      const sourceFolderPath = './server/data/config'
      const remotePath = '/tbb6500/data/config/commandAlarmReasons'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)
 */

      const sourcePath = './server/data/config/commandAlarmReasons'
      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const commandAlarmReasons = fileCommandAlarmReasonsParser(content)

      return commandAlarmReasons
    } catch (err) {
      console.error(err)
    } finally {
      // this.ftpClient.close()
    }
  }

  async fetchMachineParameters() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/config'
      let sourcePath = './server/data/config/makinesabitleri'
      let remotePath = '/tbb6500/data/config/makinesabitleri'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      let content = await fs.promises.readFile(sourcePath, 'utf8')
      const machineParameters = fileMachineParametersParser(content)

      sourcePath = './server/data/config/makinesabitleriDegerler'
      remotePath = '/tbb6500/data/config/makinesabitleriDegerler'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      content = await fs.promises.readFile(sourcePath, 'utf8')
      const currentValues = fileMachineParameterValuesParser(content)

      const res = machineParameters.map(m => ({
        ...m,
        currentValue: currentValues.find(p => p.id === m.id).currentValue,
        parameterType: 1,
        selectionList: 'YOK',
        unitCode: 1,
        selectionValues: 'YOK',
        isDeleted: 0,
      }))

      return res
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchControllerModel() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/var'
      const sourcePath = './server/data/var/controllerModel'
      const remotePath = '/var/controllerModel'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const controllerModel = fileControllerModelParser(content)

      return controllerModel
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchAnalogInputs() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/io'
      const sourcePath = './server/data/io/analoginput'
      const remotePath = '/tbb6500/data/io/analoginput'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')

      const controllerModel = await this.fetchControllerModel()
      const analogInputs = fileAnalogInputParser(content).map(input => ({
        ...input,
        id: calcIONumber(input, controllerModel),
      }))

      return analogInputs
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchAnalogOutputs() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/io'
      const sourcePath = './server/data/io/analogoutput'
      const remotePath = '/tbb6500/data/io/analogoutput'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const controllerModel = await this.fetchControllerModel()
      const analogOutputs = fileAnalogOutputParser(content).map(input => ({
        ...input,
        id: calcIONumber(input, controllerModel),
      }))

      return analogOutputs
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchDigitalInputs() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/io'
      const sourcePath = './server/data/io/sayisalinput'
      const remotePath = '/tbb6500/data/io/sayisalinput'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const controllerModel = await this.fetchControllerModel()
      const digitalInput = fileDigitalInputParser(content).map(input => ({
        ...input,
        id: calcIONumber(input, controllerModel),
      }))

      return digitalInput
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchDigitalOutputs() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/io'
      const sourcePath = './server/data/io/sayisaloutput'
      const remotePath = '/tbb6500/data/io/sayisaloutput'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')

      const controllerModel = await this.fetchControllerModel()
      const digitalOutputs = fileDigitalOutputParser(content).map(input => ({
        ...input,
        id: calcIONumber(input, controllerModel),
      }))

      return digitalOutputs
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchCounters() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/io'
      const sourcePath = './server/data/io/sayac'
      const remotePath = '/tbb6500/data/io/sayac'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const controllerModel = await this.fetchControllerModel()
      const analogInputs = fileCounterParser(content).map(input => ({
        ...input,
        id: calcIONumber(input, controllerModel),
      }))

      return analogInputs
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchCommandGroups() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/commands'
      const sourcePath = './server/data/commands/commandGroup'
      const remotePath = '/tbb6500/data/commands/commandGroup'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const commandGroups = fileCommandGroupParser(content)

      return commandGroups
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchCommandsGeneral() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/commands'
      const sourcePath = './server/data/commands/general'
      const remotePath = '/tbb6500/data/commands/general'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const commands = fileCommandsGeneralParser(content)

      return commands
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchCommandsEditing() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/commands'
      const sourcePath = './server/data/commands/editing'
      const remotePath = '/tbb6500/data/commands/editing'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const commands = fileCommandsEditingParser(content)

      return commands
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchCommandIO() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/commands'
      const sourcePath = './server/data/commands/io'
      const remotePath = '/tbb6500/data/commands/io'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const commandGroups = fileCommandIOParser(content)

      return commandGroups
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchCommandParams() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/commands'
      const sourcePath = './server/data/commands/params'
      const remotePath = '/tbb6500/data/commands/params'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const commandGroups = fileCommandParamsParser(content)

      return commandGroups
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchCommandFeedback() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/commands'
      const sourcePath = './server/data/commands/feedback'
      const remotePath = '/tbb6500/data/commands/feedback'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const commandGroups = fileCommandFeedbackParser(content)

      return commandGroups
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchFunctionAlarms() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/config'
      const sourcePath = './server/data/config/function_alarms'
      const remotePath = '/tbb6500/data/config/function_alarms'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const commandGroups = fileFunctionAlarmsParser(content)

      return commandGroups
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchCommandGraphic() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/commands'
      const sourcePath = './server/data/commands/graphic'
      const remotePath = '/tbb6500/data/commands/graphic'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const commandGroups = fileCommandGraphicParser(content)

      return commandGroups
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchCommandAlarms() {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/commands'
      const sourcePath = './server/data/commands/alarms'
      const remotePath = '/tbb6500/data/commands/alarms'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const commandGroups = fileCommandAlarmsParser(content)

      return commandGroups
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }
}
