import type { H3Event } from 'h3'
import { useTranslation } from '#imports'
/**
 * A safe translation function that returns keys as-is if i18n is not present in the event context.
 *
 * `@nuxtjs/i18n` deletes the `event.context.i18n` after request is finished, causing issues when logging after the response.
 * This function ensures that translations are only attempted if i18n is available.
 *
 * @param event - The H3 event object.
 * @param translationFn - An optional translation function to use. If not provided, it will be obtained using `useTranslation`.
 * @returns A translation function that safely handles missing i18n context.
 */
export async function useSafeTranslation(event: H3Event, translationFn?: Awaited<ReturnType<typeof useTranslation>>) {
  const t = translationFn ?? await useTranslation(event)
  return ((...args: [any]) => {
    return event.context.i18n ? t(...args) : (k: string) => k
  }) as (typeof t)
}
