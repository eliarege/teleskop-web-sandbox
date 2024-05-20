import { defineStore } from 'pinia'
import type { EditorCommand } from './commands'

export const useInvokerStore = defineStore('invoker', () => {
  const router = useRouter()

  let undoStack: EditorCommand[] = []
  let redoStack: EditorCommand[] = []

  router.afterEach(() => {
    undoStack = []
    redoStack = []
  })

  // Different undo/redo stacks for each context

  function execute(command: EditorCommand) {
    const updated = command.execute()
    if (updated) {
      undoStack.push(command)
      if (redoStack.length > 0)
        redoStack = []
    }
  }

  function undo() {
    if (undoStack.length > 0) {
      const command = undoStack.pop()!
      redoStack.push(command)
      command.undo()
    }
  }

  function redo() {
    if (redoStack.length > 0) {
      const command = redoStack.pop()!
      undoStack.push(command)
      command.execute()
    }
  }

  return {
    execute,
    undo,
    redo,
  }
})
