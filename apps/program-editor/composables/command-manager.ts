export interface CommandManagerType {
  executeCommand: (command: AppCommand, ctx?: any, ...args: any[]) => void
  undo: () => void
  redo: () => void
}
export default class CommandManager implements CommandManagerType {
  private undoStack: AppCommand[] = []
  private redoStack: AppCommand[] = []

  executeCommand(command: AppCommand, ctx?: any, ...args: any[]): void {
    if (command.execute(ctx, ...args)) {
      this.undoStack.push(command)
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
      const ctx = {} // You need to maintain or reconstruct context here if needed
      if (command.execute(ctx)) {
        this.undoStack.push(command)
      }
    }
  }
}
