import type { DialogChainObject } from 'quasar'
import FeedbackDialog from '~/components/feedback/FeedbackDialog.vue'

export default defineNuxtPlugin(() => {
  const { dialog } = useQuasar()

  let dialogObject: DialogChainObject | null = null
  let dialogVisible = false

  function showDialog() {
    dialogVisible = true
    dialogObject = dialog({
      component: FeedbackDialog,
    }).onOk(hideDialog)
      .onCancel(hideDialog)
      .onDismiss(hideDialog)
  }

  function hideDialog() {
    dialogVisible = false
    dialogObject?.hide()
    dialogObject = null
  }

  onKeyStroke('F9', (event: Event) => {
    event.preventDefault()
    if (!dialogVisible) {
      showDialog()
    } else {
      hideDialog()
    }
  })

  function showFeedbackDialog() {
    if (!dialogVisible) {
      showDialog()
    }
  }

  return {
    provide: {
      showFeedbackDialog,
    },
  }
})
