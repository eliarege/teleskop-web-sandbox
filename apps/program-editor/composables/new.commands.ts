import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'
import { klona } from 'klona'
import CMDeleteProgramDialog from '~/components/CMDeleteProgramDialog.vue'
import CMChangeProgramNoOnPasteDialog from '~/components/CMChangeProgramNoOnPasteDialog.vue'
import CMMachineListDialog from '~/components/CMMachineListDialog.vue'
import CMProgramOrdersOnConcatenationDialog from '~/components/CMProgramOrdersOnConcatenationDialog.vue'
import { contextMenuStore } from '~/utils/context-menu'
import type { CopyItem, Machine, MachineCommand, MachineInfo, ParameterItem, PasteOptions, Program, ProgramHeader, ProgramItem, ProgramStepCommand, ProgramTableRow } from '~/shared/types'
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
import CMChangeProcessTypeDialog from '~/components/CMChangeProcessTypeDialog.vue'
import { useMachineStatusStore } from '~/composables/machine'
import CMVersionDialog from '~/components/CMVersionDialog.vue'
import CMMachineListCopyAndSendDialog from '~/components/CMMachineListCopyAndSendDialog.vue'
import CopyAndSendResultsDialog from '~/components/CopyAndSendResultsDialog.vue'

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
  copyAndSend: [ctx: any, selectedRows: ProgramTableRow[]]
  showResultsDialog: [ctx: any, sourceMachine: { id: number, name: string }, results: CopyAndSendResult[]]
  getProgram: [ctx: any, machineId: number, selectedRows: ProgramTableRow[]]
  printProgram: [ctx: any]
  printProgramList: [ctx: any]
  editProgramTypes: [ctx: any]
  editProgramIcons: [ctx: any]
  exportToExcel: [ctx: any]
  refresh: [ctx: any, machineId: number]
  tempTimeGraph: [ctx: any, machine: Machine, program: Program, initialTemperature: number]
  stepCommandGraph: [ctx: any, machine: Machine, program: Program]
  newProgram: [ctx: any]
  saveAsProgram: [ctx: any]
  discardChanges: [ctx: any]
  unsavedChanges: [ctx: any, machineId?: number]
  programVersionInfo: [ctx: any, program: { programNo: number, name: string }]
  allCommandsList: [ctx: any]
  commandDetails: [ctx: any, commandNo: number]
  moveParallelStep:
    | [ctx: any, type: 'add', commandNo: number]
    | [ctx: any, type: 'remove', commandNo: number]
    | [ctx: any, type: 'changeParameter', commandNo: number, parameter: ParameterItem, stepIndex: number, oldValue: any]
  machineConstants: [ctx: any, machineId: number]
  writeProgramSettings: [ctx: any]
  checkErrors: [ctx: any, machineId: number, selectedRows: ProgramTableRow[]]
  getAllPrograms: [ctx: any, machine: { id: number, name: string }]
  sendAllPrograms: [ctx: any, machine: { id: number, name: string }]
  selectMachine: [ctx: any, options?: { singleSelection?: boolean }]
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
  const contextMenuStore = useContextMenuStore()

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
          await editor.refreshAllPrograms()
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

  return {
    name: 'deleteProgramFromMultiMachine',
    async execute(ctx: any, selectedRows: ProgramItem[]) {
      await editor.fetchAllMachine()
      await editor.fetchMachineGroups()

      ctx.$q.dialog({
        component: CMMachineListDialog,
        componentProps: {
          type: 'deleteFromMultiMachine',
          currentMachineId: editor.machine.id,
          allMachines: editor.allMachines,
          machineGroups: editor.machineGroups,
          selectedMachineIds: [editor.machine.id],
          disabledMachineIds: [editor.machine.id],
        },
      }).onOk(async (machines: MachineInfo[]) => {
        ctx.$q.dialog({
          component: CMDeleteProgramDialog,
          componentProps: {
            programNos: selectedRows.map(row => row.programNo),
          },
        }).onOk(async (option: string) => {
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
          programType: selectedRows[0].type,
          additionalType: selectedRows[0].additionalType,
          options: editor.allProcessTypes,
        },
      }).onOk(async (result: { type: number, additionalType: number | null }) => {
        await contextMenuStore.changeProcessType(machineId, selectedRows, result)
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
    async execute(ctx: any, selectedRows: ProgramTableRow[], machineId: number) {
      editor.isLoading = true
      try {
        const machineStatusStore = useMachineStatusStore()
        const status = await machineStatusStore.checkMachineStatus(machineId)
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
  const editor = useEditorStore()

  return {
    name: 'copyAndSend',
    async execute(ctx: any, selectedRows: ProgramItem[]) {
      await editor.fetchAllMachine()
      await editor.fetchMachineGroups()

      const sourceMachine = { id: editor.machine.id, name: editor.machine.name }

      ctx.$q.dialog({
        component: CMMachineListCopyAndSendDialog,
        componentProps: {
          type: 'copyAndSend',
          allMachines: editor.allMachines,
          machineGroups: editor.machineGroups,
        },
      }).onOk(async ({ machines: targetMachines, pasteOption }: { machines: MachineInfo[], pasteOption: PasteOptions }) => {
        await contextMenuStore.copyAndSendProgramsToMachines(selectedRows, sourceMachine, targetMachines, pasteOption)
        await editor.refreshAllPrograms()
      }).onCancel(() => false)
      return true
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
      return false
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()

  return {
    name: 'printProgram',
    async execute(ctx: any) {
      ctx.$q.dialog({
        component: TBPrintProgramDialog,
        componentProps: {
          machineName: editor.machine.name,
          programList: editor.allPrograms,
          commandList: Array.from(editor.machine.commands.values()),
        },
      })
      return true
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()

  return {
    name: 'printProgramList',
    async execute(ctx: any) {
      ctx.$q.dialog({
        component: TBPrintProgramListDialog,
        componentProps: {
          machineName: editor.machine.name,
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
    name: 'programVersionInfo',
    async execute(ctx: any, program: { programNo: number, name: string }) {
      try {
        const machine = editor.machine

        editor.isLoading = true
        await contextMenuStore.fetchVersions(machine.id, program.programNo)
        editor.isLoading = false

        ctx.$q.dialog({
          component: CMVersionDialog,
          componentProps: {
            machine,
            program,
            rows: contextMenuStore.programVersions.value,
          },
        }).onOk(async () => {
          // Dialog closed after successful operation, refresh program
          editor.isLoading = true
          try {
            await editor.fetchProgram(machine.id, program.programNo)
          } catch (error) {
            console.error('Error refreshing program:', error)
          } finally {
            editor.isLoading = false
          }
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
      }).onOk((command: MachineCommand) => {
        const { $q, $commandManager } = useNuxtApp()
        $commandManager.executeCommand('commandDetails', { $q }, command.commandNo)
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
  const editor = useEditorStore()

  return {
    name: 'exportToExcel',
    async execute(ctx: any) {
      ctx.$q.dialog({
        component: TBExportExcelDialog,
        componentProps: {
          machineName: editor.machine.name,
        },
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
    async execute(ctx: any, machineId: number) {
      editor.isLoading = true

      try {
        const machineStatusStore = useMachineStatusStore()
        const status = await machineStatusStore.checkMachineStatus(machineId)
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

function moveParallelStepExecute(ctx: any, type: 'add', commandNo: number): boolean
function moveParallelStepExecute(ctx: any, type: 'remove', commandNo: number): boolean
function moveParallelStepExecute(ctx: any, type: 'changeParameter', commandNo: number, parameter: ParameterItem, stepIndex: number, oldValue: any): boolean
function moveParallelStepExecute(
  ctx: any,
  type: 'add' | 'remove' | 'changeParameter',
  commandNo: number,
  parameter?: ParameterItem,
  stepIndex?: number,
  oldValue?: any,
): boolean {
  const editor = useEditorStore()
  const commandName = editor.machine.commands.get(commandNo)?.name
  const currentStepIndex = stepIndex || editor.program.steps.indexOf(editor.selectedSteps[0]) + 1

  ctx.$q.dialog({
    component: CMMoveParallelStepDialog,
    componentProps: {
      type,
      commandNo,
      commandName,
      stepIndex: currentStepIndex,
      stepsLength: editor.program.steps.length,
      parameter,
      oldValue,
    },
  }).onOk(async (command: { type: string, commandNo: number, startIndex: number, endIndex: number }) => {
    if (command.type === 'add') {
      for (let index = command.startIndex; index <= command.endIndex; index++) {
        const step = editor.program.steps[index]

        // Eklenen adıma tekrar ekleme, sadece yoksa ekle
        if (currentStepIndex !== index + 1) {
          const parallelCommands = step.parallelCommands
          const alreadyExists = parallelCommands.some(cmd => cmd.commandNo === command.commandNo)
          if (!alreadyExists) {
            editor.newParallelStepCommand(command.commandNo, index)
          }
        }
      }
    } else if (command.type === 'remove') {
      for (let index = command.startIndex; index <= command.endIndex; index++) {
        const step = editor.program.steps[index]

        step.parallelCommands.forEach((command, parallelIndex) => {
          if (command.commandNo === commandNo)
            step.parallelCommands.splice(parallelIndex, 1)
        })
      }
    } else if (command.type === 'changeParameter') {
      for (let index = command.startIndex; index <= command.endIndex; index++) {
        const step = editor.program.steps[index]

        step.parallelCommands.forEach((parallelCommand) => {
          if (parallelCommand.commandNo === commandNo && parameter) {
            const param = parallelCommand.parameters.find(param => param.index === parameter.index)
            if (param) {
              param.value = parameter.value
            }
          }
        })
      }
    }
  })
  return true
}

registerCommand(() => {
  return {
    name: 'moveParallelStep',
    execute: moveParallelStepExecute,
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

registerCommand(() => {
  const editor = useEditorStore()

  return {
    name: 'sendAllPrograms',
    async execute(ctx: any, machine: { id: number, name: string }) {
      const machineStatusStore = useMachineStatusStore()

      const status = await machineStatusStore.checkMachineStatus(machine.id)
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

      const status = await machineStatusStore.checkMachineStatus(machine.id)
      if (!status) {
        return
      }

      await contextMenuStore.getAllPrograms(machine)
      await editor.refreshAllPrograms()
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()

  return {
    name: 'selectMachine',
    async execute(ctx: any, options: { singleSelection?: boolean } = {}) {
      await editor.fetchAllMachine()
      await editor.fetchMachineGroups()

      ctx.$q.dialog({
        component: CMMachineListDialog,
        componentProps: {
          type: 'selectMachine',
          currentMachineId: editor.machine.id,
          allMachines: editor.allMachines,
          machineGroups: editor.machineGroups,
          selectedMachineIds: editor.selectedMachines.map(m => m.id),
          singleSelection: options.singleSelection,
        },
      }).onOk(async (machines: MachineInfo[]) => {
        editor.selectedMachines = machines
      }).onCancel(() => {
        return false
      })
      return true
    },
  }
})
