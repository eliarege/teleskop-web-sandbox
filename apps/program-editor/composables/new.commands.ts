import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'
import { klona } from 'klona'
import CMDeleteProgramDialog from '~/components/CMDeleteProgramDialog.vue'
import CMChangeProgramNoOnPasteDialog from '~/components/CMChangeProgramNoOnPasteDialog.vue'
import CMMachineListDialog from '~/components/CMMachineListDialog.vue'
import CMProgramOrdersOnConcatenationDialog from '~/components/CMProgramOrdersOnConcatenationDialog.vue'
import CMChangeProcessTypeDialog from '~/components/CMChangeProcessTypeDialog.vue'
import { contextMenuStore } from '~/utils/context-menu'
import type { CopyItem, MachineCommand, MachineInfo, ParameterItem, Program, ProgramHeader, ProgramItem, ProgramStepCommand, ProgramTableRow } from '~/shared/types'
import TBPrintProgramDialog from '~/components/TBPrintProgramDialog.vue'
import TBPrintProgramListDialog from '~/components/TBPrintProgramListDialog.vue'
import TBEditProgramTypes from '~/components/TBEditProgramTypes.vue'
import TBApplicationSettingsDialog from '~/components/TBApplicationSettingsDialog.vue'
import TBExportExcelDialog from '~/components/TBExportExcelDialog.vue'
import hooks from '~/utils/hooks'
import CMTempTimeGraphDialog from '~/components/CMTempTimeGraphDialog.vue'
import CMStepCommandGraphDialog from '~/components/CMStepCommandGraphDialog.vue'
import { ProgramStatus, TeleskopSettingsIds } from '~/shared/constants'
import CMNewProgramDialog from '~/components/CMNewProgramDialog.vue'
import TBDiscardChangesDialog from '~/components/TBDiscardChangesDialog.vue'
import TBAllCommandsDialog from '~/components/TBAllCommandsDialog.vue'
import TBCommandDetailDialog from '~/components/TBCommandDetailDialog.vue'
import CMMoveParallelStepDialog from '~/components/CMMoveParallelStepDialog.vue'
import TBUnsavedChangesDialog from '~/components/TBUnsavedChangesDialog.vue'
import TBMachineConstantsDialog from '~/components/TBMachineConstantsDialog.vue'
import TBWriteProgramSettingsDialog from '~/components/TBWriteProgramSettingsDialog.vue'
import CMProgramExistsDialog from '~/components/CMProgramExistsDialog.vue'

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
  sendProgram: [ctx: any, selectedRows: ProgramTableRow[], machineId: number]
  copyAndSend: [ctx: any, selectedRows: ProgramTableRow[], machineId: number]
  fetchProgram: [ctx: any, selectedRows: ProgramTableRow[], machineId: number]
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
  commandDetails: [ctx: any, commandNo: number]
  moveParallelStep: [ctx: any, type: 'add' | 'remove' | 'changeParameter', commandNo: number, programCommand: ProgramStepCommand, parameter?: ParameterItem]
  machineConstants: [ctx: any, machineId: number]
  writeProgramSettings: [ctx: any]
  checkErrors: [ctx: any, machineId: number, selectedRows: ProgramTableRow[]]
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
          allProgramNos: editor.allPrograms.map(p => p.programNo),
          allProcessTypes: editor.allProcessTypes,
          isTonello: editor.isTonello,
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
          allProgramNos: editor.allPrograms.map(p => p.programNo),
          allProcessTypes: editor.allProcessTypes,
          isTonello: editor.isTonello,
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
    execute(ctx: any, selectedRows: ProgramTableRow[], machineId: number) {
      ctx.$q.dialog({
        component: CMDeleteProgramDialog,
        componentProps: {
          programNos: selectedRows.map(row => row.programNo),
        },
      }).onOk(async (option: string) => {
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

        await editor.fetchAllPrograms()
        return true
      } finally {
        editor.isLoading = false
      }
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
  return {
    name: 'deleteProgramFromMultiMachine',
    async execute(ctx: any, selectedRows: ProgramItem[]) {
      const allMachines = await editor.fetchAllMachine()
      const machineGroups = await editor.fetchMachineGroup()
      ctx.$q.dialog({
        component: CMMachineListDialog,
        componentProps: {
          type: 'deleteFromMultiMachine',
          allMachines,
          machineGroups,
        },
      }).onOk(async (machines: MachineInfo[]) => {
        ctx.$q.dialog({
          component: CMDeleteProgramDialog,
          componentProps: {
            programNos: selectedRows.map(row => row.programNo),
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
    async execute(ctx: any, selectedRows: ProgramTableRow[], machineId: number) {
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

  return new Promise((resolve, reject) => {
    ctx.$q.dialog({
      component: CMNewProgramDialog,
      componentProps: {
        type: 'newProgram',
        program: editor.createEmptyProgram(),
        machineId: editor.machine.id,
        machineName: editor.machine.name,
        allProgramNos: editor.allPrograms.map(p => p.programNo),
        allProcessTypes: editor.allProcessTypes,
        isTonello: editor.isTonello,
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
            machineName: editor.machine.name,
            allProgramNos: [],
            allProcessTypes: editor.allProcessTypes,
            isTonello: editor.isTonello,
          },
        }).onOk(async (program: ProgramHeader) => {
          editor.isLoading = true
          await contextMenuStore.updateProgramHeader(machineId, programNo, program)
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
    async execute(ctx: any, machineId: number, selectedRows: ProgramTableRow[]) {
      ctx.$q.dialog({
        component: CMChangeProcessTypeDialog,
        componentProps: {
          programType: selectedRows[0].type,
          options: editor.allProcessTypes,
        },
      }).onOk(async (newType: number) => {
        await contextMenuStore.changeProcessType(machineId, selectedRows, newType)
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
    async execute(ctx: any, selectedRows: ProgramTableRow[], machineId: number) {
      await contextMenuStore.sendProgram(selectedRows, machineId)
      await editor.fetchAllPrograms()
      return false
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
  return {
    name: 'copyAndSend',
    async execute(ctx: any, selectedRows: ProgramItem[], machineId: number) {
      const allMachines = await editor.fetchAllMachine()
      const machineGroups = await editor.fetchMachineGroup()
      ctx.$q.dialog({
        component: CMMachineListDialog,
        componentProps: {
          type: 'copyAndSend',
          allMachines,
          machineGroups,
        },
      }).onOk(async (machines: MachineInfo[]) => {
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
    async execute(ctx: any, selectedRows: ProgramTableRow[], machineId: number) {
      for (const row of selectedRows) {
        const program = await contextMenuStore.getProgramHeader(machineId, row.programNo)

        const shouldFetch = (
          program.prgState !== ProgramStatus.EXISTS_ONLY_ON_DATABASE
          && program.prgState !== ProgramStatus.EXISTS_ON_BOTH
        )

        if (shouldFetch) {
          await contextMenuStore.getRemoteProgram([row], machineId)
          continue
        }

        const userConfirmed = await new Promise((resolve) => {
          ctx.$q.dialog({
            component: CMProgramExistsDialog,
            componentProps: { program },
          }).onOk(() => resolve(true))
            .onCancel(() => resolve(false))
        })

        if (userConfirmed) {
          await contextMenuStore.getRemoteProgram([row], machineId)
        }
      }

      await editor.fetchAllPrograms()
      return false
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
  const editor = useEditorStore()
  return {
    name: 'commandDetails',
    async execute(ctx: any, commandNo: number) {
      const machineCommand = editor.machine.commands.get(commandNo)

      ctx.$q.dialog({
        component: TBCommandDetailDialog,
        componentProps: {
          machineId: editor.machine.id,
          machineName: editor.machine.name,
          machineCommand,
        },
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
    execute(ctx: any, type: string, commandNo: number, programCommand: ProgramStepCommand, parameter?: ParameterItem) {
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

registerCommand(() => {
  return {
    name: 'checkErrors',
    async execute(ctx: any, machineId: number, selectedRows: ProgramTableRow[]) {
      const editor = useEditorStore()

      editor.isLoading = true
      for (const { programNo } of selectedRows) {
        await editor.fetchProgram(machineId, programNo)
      }
      editor.isLoading = false
    },
  }
})
