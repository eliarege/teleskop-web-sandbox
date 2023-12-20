import fs from 'node:fs'
import { download } from './utils/ftp'
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

export class TBB6500FtpClient {
  host: string

  constructor(host: string) {
    this.host = host
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
      const locks = parseLockGeneral(content)

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
      const users = parseUser(content)

      return users
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
      const manualReasons = parseManualReason(content)

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
      const stopReasons = parseStopReason(content)

      return stopReasons
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
  }

  async fetchFinishReasons() {
      const remotePath = '/tbb6500/data/config/bitirmenedenleri'
      const content = await download(remotePath, this.host)
      const data = parseFinishReason(content)
      return data
  }

  async fetchCommandAlarmReasons() {
    try {
      await this.connectClient()

      const sourceFolderPath = './server/data/config'
      const sourcePath = './server/data/config/commandAlarmReasons'
      const remotePath = '/tbb6500/data/config/commandAlarmReasons'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      const content = await fs.promises.readFile(sourcePath, 'utf8')
      const commandAlarmReasons = parseCommandAlarmReasons(content)

      return commandAlarmReasons
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
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
      const machineParameters = parseMachineParameters(content)

      sourcePath = './server/data/config/makinesabitleriDegerler'
      remotePath = '/tbb6500/data/config/makinesabitleriDegerler'

      if (!fs.existsSync(sourceFolderPath)) {
        await fs.promises.mkdir(sourceFolderPath)
      }

      await this.ftpClient.downloadTo(sourcePath, remotePath)

      content = await fs.promises.readFile(sourcePath, 'utf8')
      const currentValues = parseMachineParameterValues(content)

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
      const controllerModel = parseControllerModel(content)

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
      const analogInputs = parseAnalogInput(content).map(input => ({
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
      const analogOutputs = parseAnalogOutput(content).map(input => ({
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
      const digitalInput = parseDigitalInput(content).map(input => ({
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
      const digitalOutputs = parseDigitalOutput(content).map(input => ({
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
      const analogInputs = parseCounter(content).map(input => ({
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
      const commandGroups = parseCommandGroup(content)

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
      const commands = parseCommandsGeneral(content)

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
      const commands = parseCommandsEditing(content)

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
      const commandGroups = parseCommandIO(content)

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
      const commandGroups = parseCommandParams(content)

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
      const commandGroups = parseCommandFeedback(content)

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
      const commandGroups = parseFunctionAlarms(content)

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
      const commandGroups = parseCommandGraphic(content)

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
      const commandGroups = parseCommandAlarms(content)

      return commandGroups
    } catch (err) {
      console.error(err)
    } finally {
      this.ftpClient.close()
    }
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

  async writeFinishReasons(finishReasons: FinishReason[]) {
    try {
      await this.connectClient()
      const sourceFolderPath = './server/data/config'
      const sourcePath = './server/data/config/bitirmenedenleri'
      const remotePath = '/tbb6500/data/config/bitirmenedenleri'

      const content = fileFinishReasonWriter(finishReasons)

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
  } */


}
