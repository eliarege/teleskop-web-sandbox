import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'
import { klona } from 'klona'
import hooks from '~/utils/hooks'
import { contextMenuStore } from '~/utils/context-menu'
import { useMachineStatusStore } from '~/composables/machine'
import { ProgramStatus, TeleskopSettingsIds } from '~/shared/constants'
import type { BulkDeletionResponse, CopyItem, Machine, MachineCommand, MachineInfo, ParameterItem, PasteOptions, Program, ProgramDeletionSource, ProgramHeader, ProgramItem, ProgramTableRow } from '~/shared/types'
import CMDeleteProgramDialog from '~/components/CMDeleteProgramDialog.vue'
import CMChangeProgramNoOnPasteDialog from '~/components/CMChangeProgramNoOnPasteDialog.vue'
import CMMachineListDialog from '~/components/CMMachineListDialog.vue'
import CMProgramOrdersOnConcatenationDialog from '~/components/CMProgramOrdersOnConcatenationDialog.vue'
import TBPrintProgramDialog from '~/components/TBPrintProgramDialog.vue'
import TBPrintProgramListDialog from '~/components/TBPrintProgramListDialog.vue'
import TBEditProgramTypes from '~/components/TBEditProgramTypes.vue'
import TBApplicationSettingsDialog from '~/components/TBApplicationSettingsDialog.vue'
import TBExportExcelDialog from '~/components/TBExportExcelDialog.vue'
import CMTempTimeGraphDialog from '~/components/CMTempTimeGraphDialog.vue'
import CMStepCommandGraphDialog from '~/components/CMStepCommandGraphDialog.vue'
import CMNewProgramDialog from '~/components/CMNewProgramDialog.vue'
import TBDiscardChangesDialog from '~/components/TBDiscardChangesDialog.vue'
import TBAllCommandsDialog from '~/components/TBAllCommandsDialog.vue'
import TBCommandDetailDialog from '~/components/TBCommandDetailDialog.vue'
import CMMoveParallelStepDialog from '~/components/CMMoveParallelStepDialog.vue'
import TBMachineConstantsDialog from '~/components/TBMachineConstantsDialog.vue'
import TBWriteProgramSettingsDialog from '~/components/TBWriteProgramSettingsDialog.vue'
import CMProgramExistsDialog from '~/components/CMProgramExistsDialog.vue'
import CMChangeProcessTypeDialog from '~/components/CMChangeProcessTypeDialog.vue'
import CMVersionDialog from '~/components/CMVersionDialog.vue'
import CopyAndSendResultsDialog from '~/components/CopyAndSendResultsDialog.vue'
import DeleteResultsDialog from '~/components/DeleteResultsDialog.vue'
import TBFindAndReplaceDialog from '~/components/TBFindAndReplaceDialog.vue'
import type { CopyAndSendResult } from '~/server/utils/JobManager'

type CommandFunction = (ctx?: Function, ...args: any) => Promise<boolean | void> | boolean | void

// const { $commandManager } = useNuxtApp()
export interface AppCommand {
  name: string
  keybind?: string
  label?: MaybeRefOrGetter<string>
  category?: MaybeRefOrGetter<string>
  description?: MaybeRefOrGetter<string>
  icon?: MaybeRefOrGetter<string>
  disabled?: MaybeRefOrGetter<boolean>
  visible?: MaybeRefOrGetter<boolean>
  execute: CommandFunction
  undo?: CommandFunction
}

export function defineAppCommand(setup: () => AppCommand): AppCommand {
  const command = setup()
  return command
}
export function registerCommand(command: () => AppCommand) {
  hooks.hook('register', (ctx: any) => {
    ctx.register(command)
  })
}
export interface RegisteredCommands {
  deleteProgram: [ctx: any, selectedRows: ProgramTableRow[], machineId: number]
  pasteProgram: [ctx: any, machineId: number, remains?: CopyItem]
  deleteProgramFromMultiMachine: [ctx: any, selectedRows: ProgramTableRow[]]
  concatenatePrograms: [ctx: any, selectedRows: ProgramTableRow[], machineId: number]
  renameProgram: [ctx: any, machineId: number, programNo: number]
  changeProcessType: [ctx: any, machineId: number, selectedRows: ProgramTableRow[]]
  sendProgram: [ctx: any, selectedRows: ProgramTableRow[], machineId: number, machineName: string]
  copyAndSend: [ctx: any, selectedRows: ProgramTableRow[]]
  showResultsDialog: [ctx: any, sourceMachine: { id: number, name: string }, results: CopyAndSendResult[]]
  getProgram: [ctx: any, machineId: number, selectedRows: ProgramTableRow[]]
  printProgram: [ctx: any]
  printProgramList: [ctx: any]
  editProgramTypes: [ctx: any]
  editProgramIcons: [ctx: any]
  exportToExcel: [ctx: any]
  refresh: [ctx: any, machineId: number, machineName: string]
  tempTimeGraph: [ctx: any, machine: Machine, program: Program, initialTemperature: number]
  stepCommandGraph: [ctx: any, machine: Machine, program: Program]
  newProgram: [ctx: any]
  saveAsProgram: [ctx: any]
  discardChanges: [ctx: any]
  unsavedChanges: [ctx: any, targetRoute: string]
  programVersionInfo: [ctx: any, program: { programNo: number, name: string }]
  allCommandsList: [ctx: any]
  commandDetails: [ctx: any, commandNo: number]
  applyParallelCommand:
    | [ctx: any, type: 'add', commandNo: number, stepIndex: number]
    | [ctx: any, type: 'remove', commandNo: number, stepIndex: number]
    | [ctx: any, type: 'changeParameter', commandNo: number, stepIndex: number, parameter: ParameterItem, oldValue: number | string]
  machineConstants: [ctx: any, machineId: number]
  writeProgramSettings: [ctx: any]
  checkErrors: [ctx: any, machineId: number, selectedRows: ProgramTableRow[]]
  getAllPrograms: [ctx: any, machine: { id: number, name: string }]
  sendAllPrograms: [ctx: any, machine: { id: number, name: string }]
  selectMachine: [ctx: any, options?: { singleSelection?: boolean }]
  findAndReplace: [ctx: any, machineId: number, machineName: string]
}

registerCommand(() => {
  const editor = useEditorStore()
  const machine = useMachineStore()

  return {
    name: 'newProgram',
    execute(ctx: any) {
      const program = editor.createEmptyProgram()

      ctx.$q.dialog({
        component: CMNewProgramDialog,
        componentProps: {
          type: 'newProgram',
          program,
          machineId: machine.currentMachine.id,
          machineName: machine.currentMachine.name,
          allProgramNos: editor.allPrograms.map(p => p.programNo),
          allProcessTypes: editor.allProcessTypes,
          isTonello: machine.isTonello,
        },
      }).onOk(async (newProgram: Program) => {
        const result = await editor.onSubmit(newProgram)
        if (!result)
          return false
        setTimeout(() => {
          editor.addStepToEnd(null)
        }, 1000)
        return true
      }).onCancel(() => {
        return false
      })

      return true
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
  const machine = useMachineStore()

  return {
    name: 'saveAsProgram',
    execute(ctx: any) {
      ctx.$q.dialog({
        component: CMNewProgramDialog,
        componentProps: {
          type: 'saveAs',
          program: editor.program,
          machineId: machine.currentMachine.id,
          machineName: machine.currentMachine.name,
          allProgramNos: editor.allPrograms.map(p => p.programNo),
          allProcessTypes: editor.allProcessTypes,
          isTonello: machine.isTonello,
        },
      }).onOk(async (newProgram: Program) => {
        await editor.onSubmit(newProgram)
        await editor.refreshAllPrograms()
        return true
      }).onCancel(() => {
        return false
      })

      return true
    },
  }
})

registerCommand(() => {
  return {
    name: 'tempTimeGraph',
    execute(ctx: any, machine: Machine, program: Program, initialTemperature: number) {
      ctx.$q.dialog({
        component: CMTempTimeGraphDialog,
        componentProps: {
          machine,
          program,
          initialTemperature,
        },
      })
      return true
    },
  }
})

registerCommand(() => {
  return {
    name: 'stepCommandGraph',
    execute(ctx: any, machine: Machine, program: Program) {
      ctx.$q.dialog({
        component: CMStepCommandGraphDialog,
        componentProps: {
          machine,
          program,
        },
      })
      return true
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
  const machine = useMachineStore()
  const contextMenuStore = useContextMenuStore()

  return {
    name: 'deleteProgram',
    execute(ctx: any, selectedRows: ProgramTableRow[], machineId: number) {
      ctx.$q.dialog({
        component: CMDeleteProgramDialog,
        componentProps: {
          programNos: selectedRows.map(row => row.programNo),
        },
      }).onOk(async (option: ProgramDeletionSource) => {
        editor.isLoading = true
        try {
          const response = await contextMenuStore.deleteProgram(selectedRows, option, machineId)
          ctx.$q.dialog({
            component: DeleteResultsDialog,
            componentProps: {
              machine: machine.currentMachine,
              results: response,
            },
          })
          await editor.refreshAllPrograms()
        } catch (error) {
          console.error('Error during program deletion:', error)
        } finally {
          editor.isLoading = false
        }

        editor.selectedPrograms = []
        return true
      }).onCancel(() => {
        return false
      })
      return true
    },
  }
})

async function openDialogonPaste(ctx: any, conflicts: CopyItem): Promise<CopyItem | null> {
  const resolvedItems = await new Promise<CopyItem | null>((resolve) => {
    ctx.$q.dialog({
      component: CMChangeProgramNoOnPasteDialog,
      componentProps: {
        remains: conflicts,
      },
    }).onOk((newIds: CopyItem) => {
      resolve(newIds)
    }).onCancel(() => {
      resolve(null)
    })
  })

  return resolvedItems
}

registerCommand(() => {
  const editor = useEditorStore()
  return {
    name: 'pasteProgram',
    async execute(ctx: any, toMachineId: number) {
      editor.isLoading = true
      try {
        const conflicts = await contextMenuStore.paste(toMachineId)

        if (conflicts.program.length) {
          // Çakışan programlar için kullanıcıdan yeni numaralar al
          const resolvedItems = await openDialogonPaste(ctx, conflicts)

          // Kullanıcı iptal etmediyse yeni numaralarla tekrar yapıştır
          if (resolvedItems && resolvedItems.program.length) {
            await contextMenuStore.paste(toMachineId, resolvedItems)
          }
        }

        await editor.refreshAllPrograms()
        return true
      } finally {
        editor.isLoading = false
      }
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
  const machine = useMachineStore()

  return {
    name: 'deleteProgramFromMultiMachine',
    async execute(ctx: any, selectedRows: ProgramItem[]) {
      ctx.$q.dialog({
        component: CMMachineListDialog,
        componentProps: {
          type: 'deleteFromMultiMachine',
          currentMachineId: machine.currentMachine.id,
          allMachines: machine.allMachines,
          machineGroups: machine.machineGroups,
          selectedMachineIds: [machine.currentMachine.id],
          disabledMachineIds: [machine.currentMachine.id],
        },
      }).onOk(async (machines: MachineInfo[]) => {
        ctx.$q.dialog({
          component: CMDeleteProgramDialog,
          componentProps: {
            programNos: selectedRows.map(row => row.programNo),
          },
        }).onOk(async (option: ProgramDeletionSource) => {
          await contextMenuStore.deleteProgramFromMachine(selectedRows, machines, option)
          await editor.refreshAllPrograms()
          return true
        }).onCancel(() => {
          return false
        })
      }).onCancel(() => {
        return false
      })
      return true
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()

  return {
    name: 'concatenatePrograms',
    async execute(ctx: any, selectedRows: ProgramTableRow[], machineId: number) {
      try {
        // Kullanıcıdan program sıralaması al
        const programsOrder = await getProgramsOrder(ctx, selectedRows)

        // Yeni program detaylarını al
        const programDetails = await getNewProgramDetails(ctx)

        // Programları birleştir
        await contextMenuStore.concatenatePrograms(programsOrder, programDetails, machineId)
        await editor.refreshAllPrograms()

        return true
      } catch (error) {
        console.error('Error during program concatenation:', error)
        return false
      }
    },
  }
})

async function getProgramsOrder(ctx: any, selectedRows: ProgramTableRow[]): Promise<ProgramTableRow[]> {
  return new Promise((resolve, reject) => {
    ctx.$q.dialog({
      component: CMProgramOrdersOnConcatenationDialog,
      componentProps: {
        programs: selectedRows,
      },
    }).onOk((programsOrder: ProgramTableRow[]) => {
      resolve(programsOrder)
    }).onCancel(() => {
      reject(new Error('Program order selection cancelled'))
    })
  })
}

async function getNewProgramDetails(ctx: any): Promise<ProgramHeader> {
  const editor = useEditorStore()
  const machine = useMachineStore()

  return new Promise((resolve, reject) => {
    ctx.$q.dialog({
      component: CMNewProgramDialog,
      componentProps: {
        type: 'newProgram',
        program: editor.createEmptyProgram(),
        machineId: machine.currentMachine.id,
        machineName: machine.currentMachine.name,
        allProgramNos: editor.allPrograms.map(p => p.programNo),
        allProcessTypes: editor.allProcessTypes,
        isTonello: machine.isTonello,
      },
    }).onOk((program: ProgramHeader) => {
      resolve(program)
    }).onCancel(() => {
      reject(new Error('New program details input cancelled'))
    })
  })
}

registerCommand(() => {
  const editor = useEditorStore()
  const machine = useMachineStore()

  return {
    name: 'renameProgram',
    async execute(ctx: any, machineId: number, programNo: number) {
      try {
        editor.isLoading = true
        const program = await contextMenuStore.getProgramHeader(machineId, programNo)
        editor.isLoading = false

        ctx.$q.dialog({
          component: CMNewProgramDialog,
          componentProps: {
            type: 'rename',
            program,
            machineId,
            machineName: machine.currentMachine.name,
            allProgramNos: [],
            allProcessTypes: editor.allProcessTypes,
            isTonello: machine.isTonello,
          },
        }).onOk(async (program: ProgramHeader) => {
          editor.isLoading = true
          await contextMenuStore.updateProgramHeader(machineId, programNo, program)
          await editor.refreshAllPrograms()
          editor.isLoading = false
          return true
        }).onCancel(() => {
          return false
        })
        return true
      } catch (error) {
        console.error('Program not found:', error)
      }
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
  return {
    name: 'changeProcessType',
    async execute(ctx: any, machineId: number, selectedRows: ProgramTableRow[]) {
      ctx.$q.dialog({
        component: CMChangeProcessTypeDialog,
        componentProps: {
          typeId: selectedRows[0].typeId,
          additionalTypeId: selectedRows[0].additionalTypeId,
          options: editor.allProcessTypes,
        },
      }).onOk(async (result: { type: number, additionalType: number | null }) => {
        await contextMenuStore.changeProcessType(machineId, selectedRows, { typeId: result.type, additionalTypeId: result.additionalType })
        await editor.refreshAllPrograms()
        return true
      }).onCancel(() => {
        return false
      })
      return true
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
  return {
    name: 'sendProgram',
    async execute(ctx: any, selectedRows: ProgramTableRow[], machineId: number, machineName: string) {
      editor.isLoading = true
      try {
        const machineStatusStore = useMachineStatusStore()
        const status = await machineStatusStore.checkMachineStatus(machineId, machineName)
        if (status) {
          await contextMenuStore.sendProgram(selectedRows, machineId)
          await editor.refreshAllPrograms()

          return true
        }
        return false
      } finally {
        editor.isLoading = false
      }
    },
  }
})

registerCommand(() => {
  return {
    name: 'showResultsDialog',
    async execute(ctx: any, machine: { id: number, name: string }, results: CopyAndSendResult[]) {
      ctx.$q.dialog({
        component: CopyAndSendResultsDialog,
        componentProps: {
          machine,
          results,
        },
      })
      return true
    },
  }
})

registerCommand(() => {
  return {
    name: 'showDeleteResultsDialog',
    async execute(ctx: any, machine: { id: number, name: string }, results: BulkDeletionResponse) {
      ctx.$q.dialog({
        component: DeleteResultsDialog,
        componentProps: {
          machine,
          results,
        },
      })
      return true
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()

  return {
    name: 'getProgram',
    async execute(ctx: any, machineId: number, selectedRows: ProgramTableRow[]) {
      let userChoice: 'ask' | 'yesToAll' | 'noToAll' = 'ask'

      for (const row of selectedRows) {
        const shouldFetch = row.prgState !== ProgramStatus.EXISTS_ONLY_ON_DATABASE
          && row.prgState !== ProgramStatus.EXISTS_ON_BOTH

        if (shouldFetch) {
          await contextMenuStore.getRemoteProgram([row], machineId)
          continue
        }

        if (userChoice === 'yesToAll') {
          await contextMenuStore.getRemoteProgram([row], machineId)
          continue
        }

        if (userChoice === 'noToAll') {
          continue
        }

        const response = await new Promise<string | false>(resolve =>
          ctx.$q.dialog({
            component: CMProgramExistsDialog,
            componentProps: {
              program: row,
              showBulkActions: selectedRows.length > 1,
            },
          }).onOk((value: string) => resolve(value))
            .onCancel(() => resolve(false)),
        )

        if (response === 'yes') {
          await contextMenuStore.getRemoteProgram([row], machineId)
        } else if (response === 'yesToAll') {
          userChoice = 'yesToAll'
          await contextMenuStore.getRemoteProgram([row], machineId)
        } else if (response === 'noToAll') {
          userChoice = 'noToAll'
        }
      }

      await editor.refreshAllPrograms()
      return true
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
  const machine = useMachineStore()

  return {
    name: 'printProgram',
    async execute(ctx: any) {
      ctx.$q.dialog({
        component: TBPrintProgramDialog,
        componentProps: {
          machineId: machine.currentMachine.id,
          machineName: machine.currentMachine.name,

          allMachines: machine.allMachines,
          machineGroups: machine.machineGroups,

          selectedMachines: machine.selectedMachines,

          programList: editor.allPrograms,
          commandList: Array.from(machine.currentMachine.commands.values()),
        },
      })
      return true
    },
  }
})

registerCommand(() => {
  const machine = useMachineStore()

  return {
    name: 'printProgramList',
    async execute(ctx: any) {
      ctx.$q.dialog({
        component: TBPrintProgramListDialog,
        componentProps: {
          machineId: machine.currentMachine.id,
          machineName: machine.currentMachine.name,

          allMachines: machine.allMachines,
          machineGroups: machine.machineGroups,

          selectedMachines: machine.selectedMachines,
        },
      })
      return true
    },
  }
})

registerCommand(() => {
  return {
    name: 'editProgramTypes',
    execute(ctx: any) {
      ctx.$q.dialog({
        component: TBEditProgramTypes,
      })
      return true
    },
  }
})

registerCommand(() => {
  const teleskopSettings = useTeleskopSettingsStore()

  return {
    name: 'editProgramIcons',
    async execute(ctx: any) {
      ctx.$q.dialog({
        component: TBApplicationSettingsDialog,
        componentProps: {
          selectedIcons: teleskopSettings.selectedIcons,
        },
      }).onOk(async (value: string) => {
        await teleskopSettings.updateTeleskopSettings(TeleskopSettingsIds.SELECTED_ICONS, value)
      })
      return true
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
  const machine = useMachineStore()

  return {
    name: 'programVersionInfo',
    async execute(ctx: any, program: { programNo: number, name: string }) {
      try {
        editor.isLoading = true
        await contextMenuStore.fetchVersions(machine.currentMachine.id, program.programNo)
        editor.isLoading = false

        ctx.$q.dialog({
          component: CMVersionDialog,
          componentProps: {
            machine: machine.currentMachine,
            program,
            rows: contextMenuStore.programVersions.value,
          },
        }).onOk(async () => {
          editor.isLoading = true

          // TODO: İleride sadece ilgili programı yenileyecek bir yapı kurulabilir
          // Şimdilik en garanti yöntem olan hard reload atıyoruz
          window.location.reload()
        })
        return true
      } catch (error) {
        console.error('Error fetching version info:', error)
        editor.isLoading = false
        return false
      }
    },
  }
})

registerCommand(() => {
  const machine = useMachineStore()

  return {
    name: 'allCommandsList',
    async execute(ctx: any) {
      ctx.$q.dialog({
        component: TBAllCommandsDialog,
        componentProps: {
          machineId: machine.currentMachine.id,
          machineName: machine.currentMachine.name,
          machineCommands: machine.currentMachine.commands,
        },
      }).onOk((command: MachineCommand) => {
        const { $q, $commandManager } = useNuxtApp()
        $commandManager.executeCommand('commandDetails', { $q }, command.commandNo)
      })

      return true
    },
  }
})

registerCommand(() => {
  const machine = useMachineStore()

  return {
    name: 'commandDetails',
    async execute(ctx: any, commandNo: number) {
      const machineCommand = machine.currentMachine.commands.get(commandNo)

      ctx.$q.dialog({
        component: TBCommandDetailDialog,
        componentProps: {
          machineId: machine.currentMachine.id,
          machineName: machine.currentMachine.name,
          machineCommand,
        },
      })
      return true
    },
  }
})

registerCommand(() => {
  return {
    name: 'exportToExcel',
    async execute(ctx: any) {
      ctx.$q.dialog({
        component: TBExportExcelDialog,
      })
      return true
    },
  }
})

registerCommand(() => {
  const { fetch } = useKeycloak()
  const editor = useEditorStore()

  return {
    name: 'refresh',
    async execute(ctx: any, machineId: number, machineName: string) {
      editor.isLoading = true

      try {
        const machineStatusStore = useMachineStatusStore()
        const status = await machineStatusStore.checkMachineStatus(machineId, machineName)
        if (!status) {
          return false
        }

        await fetch(`/api/machine/${machineId}/refresh`, {
          method: 'POST',
        })

        await editor.refreshAllPrograms()
        return true
      } finally {
        editor.isLoading = false
      }
    },
  }
})

registerCommand(() => {
  return {
    name: 'discardChanges',
    execute(ctx: any) {
      ctx.$q.dialog({
        component: TBDiscardChangesDialog,
      }).onOk(async () => {
        const editor = useEditorStore()
        editor.program = editor.createEmptyProgram()
        await nextTick()
        editor.program = klona(editor.originalProgram)
        editor.selectedSteps = []
      })
      return true
    },
  }
})

function applyParallelCommandExecute(ctx: any, type: 'add', commandNo: number, stepIndex: number): boolean
function applyParallelCommandExecute(ctx: any, type: 'remove', commandNo: number, stepIndex: number): boolean
function applyParallelCommandExecute(ctx: any, type: 'changeParameter', commandNo: number, stepIndex: number, parameter: ParameterItem, oldValue: any): boolean
function applyParallelCommandExecute(
  ctx: any,
  type: 'add' | 'remove' | 'changeParameter',
  commandNo: number,
  stepIndex: number,
  parameter?: ParameterItem,
  oldValue?: any,
): boolean {
  const editor = useEditorStore()
  const machine = useMachineStore()

  const machineCommand = machine.currentMachine.commands.get(commandNo)
  if (!machineCommand) {
    console.warn(`Command not found: commandNo=${commandNo}`)
    return false
  }

  const stepsLength = editor.program.steps.length

  // Son adımda ekleme işlemi yapılamaz (sonraki adım yok)
  if (type === 'add' && stepIndex >= stepsLength - 1) {
    return false
  }

  ctx.$q.dialog({
    component: CMMoveParallelStepDialog,
    componentProps: {
      machineId: machine.currentMachine.id,
      commands: machine.currentMachine.commands,
      commandTypes: machine.currentMachine.commandTypes,
      type,
      commandNo,
      commandName: machineCommand.name,
      stepIndex,
      stepsLength,
      parameter,
      oldValue,
    },
  }).onOk((result: { type: string, commandNo: number, startIndex: number, endIndex: number }) => {
    const { startIndex, endIndex } = result

    if (result.type === 'add') {
      // Paralel komutu belirtilen aralıktaki adımlara ekle
      for (let index = startIndex; index <= endIndex; index++) {
        const step = editor.program.steps[index]
        if (!step)
          continue

        // Aynı komut zaten varsa ekleme
        const alreadyExists = step.parallelCommands.some(cmd => cmd.commandNo === commandNo)
        if (!alreadyExists) {
          editor.newParallelStepCommand(commandNo, index)
        }
      }
    } else if (result.type === 'remove') {
      // Paralel komutu belirtilen aralıktaki adımlardan sil
      for (let index = startIndex; index <= endIndex; index++) {
        const step = editor.program.steps[index]
        if (!step)
          continue

        step.parallelCommands = step.parallelCommands.filter(
          cmd => cmd.commandNo !== commandNo,
        )
      }
    } else if (result.type === 'changeParameter' && parameter) {
      // Paralel komutun parametresini belirtilen aralıkta değiştir
      for (let index = startIndex; index <= endIndex; index++) {
        const step = editor.program.steps[index]
        if (!step)
          continue

        for (const parallelCommand of step.parallelCommands) {
          if (parallelCommand.commandNo === commandNo) {
            const param = parallelCommand.parameters.find(p => p.index === parameter.index)
            if (param) {
              param.value = parameter.value
            }
          }
        }
      }
    }
  })

  return true
}

registerCommand(() => {
  return {
    name: 'applyParallelCommand',
    execute: applyParallelCommandExecute,
  }
})

registerCommand(() => {
  const kc = useKeycloak()

  return {
    name: 'machineConstants',
    async execute(ctx: any, machineId: number) {
      const machineInfo = await kc.fetch(`/api/machine/${machineId}`)
      ctx.$q.dialog({
        component: TBMachineConstantsDialog,
        componentProps: {
          machineId,
          machineName: machineInfo.name,
          machineConstants: machineInfo.constants,
        },
      })
      return true
    },
  }
})

registerCommand(() => {
  return {
    name: 'writeProgramSettings',
    async execute(ctx: any) {
      ctx.$q.dialog({
        component: TBWriteProgramSettingsDialog,
      })
      return true
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()

  return {
    name: 'checkErrors',
    async execute(ctx: any, machineId: number, selectedRows: ProgramTableRow[]) {
      editor.isLoading = true
      try {
        const programNos = selectedRows.map(p => p.programNo)
        await editor.fetchPrograms(machineId, programNos)
      } finally {
        editor.isLoading = false
      }
    },
  }
})

registerCommand(() => {
  const machine = useMachineStore()

  return {
    name: 'findAndReplace',
    async execute(ctx: any, machineId: number, machineName: string) {
      ctx.$q.dialog({
        component: TBFindAndReplaceDialog,
        componentProps: {
          machineId,
          machineName,
          machineCommands: machine.currentMachine?.commands,
        },
      })
      return true
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()

  return {
    name: 'sendAllPrograms',
    async execute(ctx: any, machine: { id: number, name: string }) {
      const machineStatusStore = useMachineStatusStore()

      const status = await machineStatusStore.checkMachineStatus(machine.id, machine.name)
      if (!status) {
        return
      }

      await contextMenuStore.sendAllPrograms(machine)
      await editor.refreshAllPrograms()
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()

  return {
    name: 'getAllPrograms',
    async execute(ctx: any, machine: { id: number, name: string }) {
      const machineStatusStore = useMachineStatusStore()

      const status = await machineStatusStore.checkMachineStatus(machine.id, machine.name)
      if (!status) {
        return
      }

      await contextMenuStore.getAllPrograms(machine)
      await editor.refreshAllPrograms()
    },
  }
})

registerCommand(() => {
  const machine = useMachineStore()

  return {
    name: 'selectMachine',
    async execute(ctx: any, options: { singleSelection?: boolean } = {}) {
      ctx.$q.dialog({
        component: CMMachineListDialog,
        componentProps: {
          type: 'selectMachine',
          currentMachineId: machine.currentMachine.id,
          allMachines: machine.allMachines,
          machineGroups: machine.machineGroups,
          selectedMachineIds: machine.selectedMachines.map(m => m.id),
          singleSelection: options.singleSelection,
        },
      }).onOk(async (machines: MachineInfo[]) => {
        machine.selectedMachines = machines
      }).onCancel(() => {
        return false
      })
      return true
    },
  }
})
