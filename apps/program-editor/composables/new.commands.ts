import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'
import { klona } from 'klona'
import CMDeleteProgramDialog from '~/components/CMDeleteProgramDialog.vue'
import CMChangeProgramNoOnPasteDialog from '~/components/CMChangeProgramNoOnPasteDialog.vue'
import CMMachineListDialog from '~/components/CMMachineListDialog.vue'
import CMProgramOrdersOnConcatenationDialog from '~/components/CMProgramOrdersOnConcatenationDialog.vue'
import CMChangeProcessTypeDialog from '~/components/CMChangeProcessTypeDialog.vue'
import { contextMenuStore } from '~/utils/context-menu'
import type { MachineCommand, ParameterItem, Program, ProgramHeader, ProgramStepCommand, ProgramTable } from '~/shared/types'
import TBPrintProgramDialog from '~/components/TBPrintProgramDialog.vue'
import TBPrintProgramListDialog from '~/components/TBPrintProgramListDialog.vue'
import TBEditProgramTypes from '~/components/TBEditProgramTypes.vue'
import TBApplicationSettingsDialog from '~/components/TBApplicationSettingsDialog.vue'
import TBExportExcelDialog from '~/components/TBExportExcelDialog.vue'
import hooks from '~/utils/hooks'
import CMTempTimeGraphDialog from '~/components/CMTempTimeGraphDialog.vue'
import CMStepCommandGraphDialog from '~/components/CMStepCommandGraphDialog.vue'
import { TeleskopSettingsIds } from '~/shared/constants'
import CMNewProgramDialog from '~/components/CMNewProgramDialog.vue'
import TBDiscardChangesDialog from '~/components/TBDiscardChangesDialog.vue'
import TBAllCommandsDialog from '~/components/TBAllCommandsDialog.vue'
import TBCommandDetailDialog from '~/components/TBCommandDetailDialog.vue'
import CMMoveParallelStepDialog from '~/components/CMMoveParallelStepDialog.vue'
import TBUnsavedChangesDialog from '~/components/TBUnsavedChangesDialog.vue'
import TBMachineConstantsDialog from '~/components/TBMachineConstantsDialog.vue'
import TBWriteProgramSettingsDialog from '~/components/TBWriteProgramSettingsDialog.vue'

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
  deleteProgram: [ctx: any, selectedRows: ProgramTable[], machineId: number]
  pasteProgram: [ctx: any, machineId: number, remains?: any]
  deleteProgramFromMultiMachine: [ctx: any, selectedRows: Array<any>]
  concatenatePrograms: [ctx: any, selectedRows: ProgramTable[], machineId: number]
  changeName: [ctx: any, machineId: number, programNo: number]
  changeProcessType: [ctx: any, selectedRows: Array<any>, machineId: number]
  sendProgram: [ctx: any, selectedRows: Array<any>, machineId: number]
  copyAndSend: [ctx: any, selectedRows: Array<any>, machineId: number]
  fetchProgram: [ctx: any, selectedRows: Array<any>, machineId: number]
  printProgram: [ctx: any]
  printProgramList: [ctx: any]
  editProgramTypes: [ctx: any]
  editProgramIcons: [ctx: any]
  exportToExcel: [ctx: any]
  refresh: [ctx: any, machineId: number]
  tempTimeGraph: [ctx: any]
  stepCommandGraph: [ctx: any]
  newProgram: [ctx: any]
  saveAsProgram: [ctx: any]
  discardChanges: [ctx: any]
  unsavedChanges: [ctx: any, machineId?: number]
  allCommandsList: [ctx: any]
  commandDetails: [ctx: any, machineId: number, commandNo: number]
  moveParallelStep: [ctx: any, type: 'add' | 'remove' | 'changeParameter', commandNo: number, programCommand: ProgramStepCommand, parameter: ParameterItem]
  machineConstants: [ctx: any, machineId: number]
  writeProgramSettings: [ctx: any]
}

registerCommand(() => {
  const editor = useEditorStore()
  return {
    name: 'newProgram',
    execute(ctx: any) {
      const program = editor.createEmptyProgram()

      ctx.$q.dialog({
        component: CMNewProgramDialog,
        componentProps: {
          type: 'newProgram',
          program,
          machineId: editor.machine.id,
          machineName: editor.machine.name,
          allProcessTypes: editor.allProcessTypes,
        },
      }).onOk(async (newProgram: Program) => {
        const result = await editor.onSubmit(newProgram)
        if (!result)
          return false
        setTimeout(() => {
          editor.addStep()
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
  return {
    name: 'saveAsProgram',
    execute(ctx: any) {
      ctx.$q.dialog({
        component: CMNewProgramDialog,
        componentProps: {
          type: 'saveAs',
          program: editor.program,
          machineId: editor.machine.id,
          machineName: editor.machine.name,
          allProcessTypes: editor.allProcessTypes,
        },
      }).onOk(async (newProgram: Program) => {
        await editor.onSubmit(newProgram)
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
    execute(ctx: any) {
      ctx.$q.dialog({
        component: CMTempTimeGraphDialog,
      })
      return true
    },
  }
})

registerCommand(() => {
  return {
    name: 'stepCommandGraph',
    execute(ctx: any) {
      ctx.$q.dialog({
        component: CMStepCommandGraphDialog,
      })
      return true
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
  return {
    name: 'deleteProgram',
    execute(ctx: any, selectedRows: ProgramTable[], machineId: number) {
      ctx.$q.dialog({
        component: CMDeleteProgramDialog,
        componentProps: {
          programNames: selectedRows.map(r => r.name),
        },
      }).onOk(async (option: number) => {
        editor.isLoading = true
        try {
          await contextMenuStore.deleteProgram(selectedRows, option, machineId)
          await editor.fetchAllPrograms()
        } catch (error) {
          console.error('Error during program deletion:', error)
        }
        editor.isLoading = false
        editor.selectedPrograms = []
        return true
      }).onCancel(() => {
        return false
      })
      return true
    },
  }
})

async function openDialogonPaste(ctx: any, remainsFromPaste: any, machineId: number) {
  const editor = useEditorStore()
  let remains = remainsFromPaste
  if (remains.length) {
    ctx.$q.dialog({
      component: CMChangeProgramNoOnPasteDialog,
      componentProps: {
        remains,
      },
    }).onOk(async (newIds) => {
      remains.forEach((val, index: number) => {
        val.newProgramNo = newIds[index]
      })
      remains = await contextMenuStore.paste(machineId, remains)
      await openDialogonPaste(ctx, remains, machineId)
      await editor.fetchAllPrograms()
      /**
     TODO: This has to be done through commandManager.executeCommand 'cause
      commandManager will handle undo redo operations and paste is not a single paste operation
      it can be done in multiple steps and each ctrl+z should go back to previous step
      not cancel the whole paste operation
      // $commandManager.executeCommand('pasteProgram', ctx, machineId, remainsFromPaste)
       */
      return true
    }).onCancel(() => {
      return false
    })
  }
}

registerCommand(() => {
  const editor = useEditorStore()
  let remainsFromPaste = [] as Array<any>

  return {
    name: 'pasteProgram',
    async execute(ctx: any, machineId: number, remains?) {
      if (!remains) {
        remainsFromPaste = await contextMenuStore.paste(machineId)
        await editor.fetchAllPrograms()
      }
      if (remainsFromPaste.length)
        await openDialogonPaste(ctx, remainsFromPaste, machineId)
      return true
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
  return {
    name: 'deleteProgramFromMultiMachine',
    execute(ctx: any, selectedRows) {
      ctx.$q.dialog({
        component: CMMachineListDialog,
        componentProps: {
          type: 'deleteFromMultiMachine',
        },
      }).onOk(async (machines) => {
        ctx.$q.dialog({
          component: CMDeleteProgramDialog,
          componentProps: {
            programNames: selectedRows.map(r => r.name),
          },
        }).onOk(async (option: string) => {
          await contextMenuStore.deleteProgramFromMachine(selectedRows, machines, option)
          await editor.fetchAllPrograms()
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
    async execute(ctx: any, selectedRows: ProgramTable[], machineId: number) {
      try {
        // Kullanıcıdan program sıralaması al
        const programsOrder = await getProgramsOrder(ctx, selectedRows)

        // Yeni program detaylarını al
        const programDetails = await getNewProgramDetails(ctx)

        // Programları birleştir
        await contextMenuStore.concatenatePrograms(programsOrder, programDetails, machineId)
        await editor.fetchAllPrograms()

        return true
      } catch (error) {
        console.error('Error during program concatenation:', error)
        return false
      }
    },
  }
})

async function getProgramsOrder(ctx: any, selectedRows: ProgramTable[]): Promise<ProgramTable[]> {
  return new Promise((resolve, reject) => {
    ctx.$q.dialog({
      component: CMProgramOrdersOnConcatenationDialog,
      componentProps: {
        programs: selectedRows,
      },
    }).onOk((programsOrder) => {
      resolve(programsOrder)
    }).onCancel(() => {
      reject(new Error('Program order selection cancelled'))
    })
  })
}

async function getNewProgramDetails(ctx: any): Promise<ProgramHeader> {
  return new Promise((resolve, reject) => {
    ctx.$q.dialog({
      component: CMNewProgramDialog,
      componentProps: {
        type: 'newProgram',
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
  return {
    name: 'changeName',
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
            machineName: editor.machine.name,
            allProcessTypes: editor.allProcessTypes,
          },
        }).onOk(async (program: ProgramHeader) => {
          editor.isLoading = true
          await contextMenuStore.updateProgramHeader(machineId, program)
          await editor.fetchAllPrograms()
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
    async execute(ctx: any, selectedRows, machineId) {
      const processTypes = await contextMenuStore.getProcessTypes()
      ctx.$q.dialog({
        component: CMChangeProcessTypeDialog,
        componentProps: {
          options: processTypes,
        },
      }).onOk(async (newType) => {
        await contextMenuStore.changeProcessType(selectedRows, newType, machineId)
        await editor.fetchAllPrograms()
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
    async execute(ctx: any, selectedRows, machineId) {
      await contextMenuStore.sendProgram(selectedRows, machineId)
      await editor.fetchAllPrograms()
      return false // Dont want to add uno redo stack 'cause it cannot be reversible'
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
  return {
    name: 'copyAndSend',
    execute(ctx: any, selectedRows, machineId) {
      ctx.$q.dialog({
        component: CMMachineListDialog,
        componentProps: {
          type: 'copyAndSend',
        },
      }).onOk(async (machines: string[]) => {
        // FIXME: steps null check for on backend
        await contextMenuStore.sendProgramToMachines(selectedRows, machines, machineId)
        await editor.fetchAllPrograms()
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
    name: 'fetchProgram',
    async execute(ctx: any, selectedRows, machineId) {
      await contextMenuStore.getRemoteProgram(selectedRows, machineId)
      await editor.fetchAllPrograms()
      return false // Dont want to add uno redo stack 'cause it cannot be reversible'
    },
  }
})

registerCommand(() => {
  const { fetch } = useKeycloak()
  return {
    name: 'printProgram',
    async execute(ctx: any) {
      const machines = await fetch('/api/machine')
      ctx.$q.dialog({
        component: TBPrintProgramDialog,
        componentProps: {
          machines,
        },
      })
      return true
    },
  }
})

registerCommand(() => {
  const { fetch } = useKeycloak()
  return {
    name: 'printProgramList',
    async execute(ctx: any) {
      const machines = await fetch('/api/machine')
      ctx.$q.dialog({
        component: TBPrintProgramListDialog,
        componentProps: {
          machines,
        },
      })
      return true
    },
  }
})

registerCommand(() => {
  return {
    name: 'editProgramTypes',
    async execute(ctx: any) {
      ctx.$q.dialog({
        component: TBEditProgramTypes,
      })
      return true
    },
  }
})

registerCommand(() => {
  return {
    name: 'editProgramIcons',
    async execute(ctx: any) {
      const editor = useEditorStore()
      ctx.$q.dialog({
        component: TBApplicationSettingsDialog,
      }).onOk(async (value: string) => {
        await editor.updateTeleskopSettings(TeleskopSettingsIds.SELECTED_ICONS, value)
      })
      return true
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
  return {
    name: 'allCommandsList',
    async execute(ctx: any) {
      ctx.$q.dialog({
        component: TBAllCommandsDialog,
        componentProps: {
          machineId: editor.machine.id,
          machineName: editor.machine.name,
          machineCommands: Array.from(editor.machine.commands.values()),
        },
      }).onOk(async (command: MachineCommand) => {
        ctx.$q.dialog({
          component: TBCommandDetailDialog,
          componentProps: {
            machineId: editor.machine.id,
            machineName: editor.machine.name,
            machineCommand: command,
          },
        })
      })
      return true
    },
  }
})

registerCommand(() => {
  return {
    name: 'commandDetails',
    async execute(ctx: any) {
      ctx.$q.dialog({
        component: TBCommandDetailDialog,
      })
      return true
    },
  }
})

registerCommand(() => {
  const { fetch } = useKeycloak()
  return {
    name: 'exportToExcel',
    async execute(ctx: any) {
      const machineGroups = await fetch('/api/machine-group')
      ctx.$q.dialog({
        component: TBExportExcelDialog,
        componentProps: {
          machineGroups,
        },
      })
      return true
    },
  }
})

registerCommand(() => {
  const { fetch } = useKeycloak()
  return {
    name: 'refresh',
    async execute(ctx: any, machineId: number) {
      const editor = useEditorStore()

      editor.isLoading = true
      await fetch(`/api/machine/${machineId}/refresh`, {
        method: 'POST',
      })
      await editor.fetchAllPrograms()
      editor.isLoading = false
      return true
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

registerCommand(() => {
  return {
    name: 'unsavedChanges',
    execute(ctx: any, machineId: number) {
      ctx.$q.dialog({
        component: TBUnsavedChangesDialog,
      }).onOk(async (type: string) => {
        const editor = useEditorStore()

        if (type === 'save') {
          const saved = await editor.onSubmit()

          if (saved)
            if (machineId) {
              await editor.changeMachine(machineId)
            }
        } else if (type === 'discard') {
          editor.program = editor.createEmptyProgram()
          await nextTick()
          editor.program = klona(editor.originalProgram)
          editor.selectedSteps = []

          if (machineId) {
            await editor.changeMachine(machineId)
          }
        }
      })
      return true
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
  return {
    name: 'moveParallelStep',
    execute(ctx: any, type: string, commandNo: number, programCommand: ProgramStepCommand, parameter?: { name: string, value: number | string }) {
      const commandName = editor.machine.commands.get(commandNo)?.name
      const stepIndex = editor.program.steps.indexOf(editor.selectedSteps[0]) + 1
      ctx.$q.dialog({
        component: CMMoveParallelStepDialog,
        componentProps: {
          type,
          commandNo,
          commandName,
          programCommand,
          stepIndex,
          stepsLength: editor.program.steps.length,
          parameter,
        },
      }).onOk(async (command: { type: string, commandNo: number, startIndex: number, endIndex: number }) => {
        if (command.type === 'add') {
          for (let index = command.startIndex; index <= command.endIndex; index++) {
            // Eklenen adıma tekrar ekleme
            if (stepIndex !== index + 1) {
              editor.newParallelStepCommand(command.commandNo, index)
            }
          }
        } else if (command.type === 'remove') {
          for (let index = command.startIndex; index <= command.endIndex; index++) {
            editor.program.steps[index].parallelCommands.forEach((command, parallelIndex) => {
              if (command.commandNo === commandNo)
                editor.program.steps[index].parallelCommands.splice(parallelIndex, 1)
            })
          }
        } else if (command.type === 'changeParameter') {
          for (let index = command.startIndex; index <= command.endIndex; index++) {
            editor.program.steps[index].parallelCommands.forEach((command, parallelIndex) => {
              if (command.commandNo === commandNo)
                editor.program.steps[index].parallelCommands[parallelIndex].parameters.find(parameter =>
                  parameter.index === programCommand.parameters[0].index)!.value = programCommand.parameters[0].value
            })
          }
        }
      })
      return true
    },
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
