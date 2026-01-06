import { Dialog } from 'quasar'
import TaskStreamDialog, { type TaskStreamResult } from '../components/TaskStreamDialog.vue'
import type { TaskStreamFetchOptions } from '../composables/useTaskStream'

type TaskStreamOptions = {
  title?: string
  statusTitles?: {
    running?: string
    success?: string
    failed?: string
  }
  body?: any
  width?: string | number
  fetchOptions?: TaskStreamFetchOptions
}

export function startTaskStream(
  url: string,
  options?: TaskStreamOptions,
): Promise<TaskStreamResult> {
  return new Promise(((resolve) => {
    Dialog.create({
      component: TaskStreamDialog,
      componentProps: {
        url,
        options: options?.fetchOptions,
        title: options?.title,
        statusTitles: options?.statusTitles,
        width: options?.width,
      },
    }).onOk((result) => {
      resolve(result)
    })
  }))
}
