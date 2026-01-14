import type { FeedbackPlugin } from '../plugins/feedback.client'

export function useFeedback(): FeedbackPlugin {
  const nuxtApp = useNuxtApp()
  return nuxtApp.$feedback
}
