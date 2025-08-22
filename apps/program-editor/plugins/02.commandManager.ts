import type { AppCommand, RegisteredCommands } from '~/composables/new.commands'
import hooks from '~/utils/hooks'

class CommandManager {
  private undoStack: AppCommand[] = []
  private redoStack: AppCommand[] = []
  commandsMap = new Map<string, AppCommand>()

  registerCommand(command: () => AppCommand) {
    const com = command()
    if (this.commandsMap.has(com.name)) {
      throw new Error(`Command ${com.name} exists`)
    } else {
      this.commandsMap.set(com.name, com)
    }
  }

  executeCommand<T extends keyof RegisteredCommands>(commandId: T, ...args: RegisteredCommands[T]): void {
    const command = this.commandsMap.get(commandId)
    if (!command)
      throw new Error(`Command ${commandId} is not found or not registered`)
    // const context = {} as any
    if (command.execute(...args)) {
      this.undoStack.push(command!)
      this.redoStack = []
    }
  }

  undo(): void {
    const command = this.undoStack.pop()
    if (command && command.undo) {
      if (command.undo()) {
        this.redoStack.push(command)
      }
    }
  }

  redo(): void {
    const command = this.redoStack.pop()
    if (command && command.execute) {
      const ctx: any = {} // You need to maintain or reconstruct context here if needed
      if (command.execute(ctx)) {
        this.undoStack.push(command)
      }
    }
  }
}

export default defineNuxtPlugin(() => {
  const commandManager = new CommandManager()
  hooks.callHook('register', {
    register: (command: () => AppCommand) => {
      commandManager.registerCommand(command)
    },
  })

  return {
    provide: {
      commandManager,
    },
  }
})
