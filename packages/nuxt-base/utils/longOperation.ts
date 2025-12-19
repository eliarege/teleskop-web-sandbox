import { Dialog } from 'quasar'
import LongOperationDialog, { type LongOperationResult } from '../components/LongOperationDialog.vue'

export function startLongOperation(
  url: string,
  options?: Omit<RequestInit, 'body'> & { title?: string, body?: any },
): Promise<LongOperationResult> {
  return new Promise(((resolve) => {
    Dialog.create({
      component: LongOperationDialog,
      componentProps: {
        url,
        options,
        title: options?.title,
      },
    }).onOk((result) => {
      resolve(result)
    })
  }))
}
