import { Dialog } from 'quasar'
import LongOperationDialog, { type LongOperationResult } from '../components/LongOperationDialog.vue'
import type { FetchOptions } from '../composables/useLongOperation'

type LongOperationOptions = {
  title?: string
  statusTitles?: {
    running?: string
    success?: string
    failed?: string
  }
  body?: any
  width?: string | number
  fetchOptions?: FetchOptions
}

export function startLongOperation(
  url: string,
  options?: LongOperationOptions,
): Promise<LongOperationResult> {
  return new Promise(((resolve) => {
    Dialog.create({
      component: LongOperationDialog,
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
