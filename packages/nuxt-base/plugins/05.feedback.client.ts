import type { DialogChainObject } from 'quasar'
import FeedbackDialog from '~/components/feedback/FeedbackDialog.vue'

export default defineNuxtPlugin(() => {
  const { dialog, notify } = useQuasar()
  const keycloak = useKeycloak()
  const nuxt = useNuxtApp()

  let dialogObject: DialogChainObject | null = null
  let dialogVisible = false

  /**
   * - If feedback is enabled, returns true.
   * - If feedback is disabled, returns localised reason.
   */
  function isFeedbackEnabled(): string | true {
    const t = nuxt.$i18n.t
    if (!keycloak.enabled)
      return t('feedback.response.no-auth')
    if (!keycloak.authenticated.value)
      return t('feedback.response.auth-required')
    if (keycloak.tokenParsed.value?.email_verified === false)
      return t('feedback.response.email-not-verified')
    return true
  }

  function showDialog() {
    const enabledOrReason = isFeedbackEnabled()
    if (typeof enabledOrReason === 'string') {
      notify({
        message: enabledOrReason,
        type: 'negative',
        position: 'top',
      })
    } else {
      dialogVisible = true
      dialogObject = dialog({
        component: FeedbackDialog,
      }).onDismiss(() => {
        dialogVisible = false
        dialogObject = null
      })
    }
  }

  onKeyStroke('F9', (event: Event) => {
    event.preventDefault()
    if (!dialogVisible) {
      showDialog()
    } else {
      dialogObject?.hide()
    }
  })

  function showFeedbackDialog() {
    if (!dialogVisible) {
      showDialog()
    }
  }

  return {
    provide: {
      feedback: {
        isEnabled: isFeedbackEnabled,
        showDialog: showFeedbackDialog,
      },
    },
  }
})
