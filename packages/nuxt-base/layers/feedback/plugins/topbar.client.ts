export default defineNuxtPlugin({
  dependsOn: ['nuxt-base:topbar', 'nuxt-base:feedback'],
  setup() {
    const nuxtApp = useNuxtApp()
    const feedback = nuxtApp.$feedback
    const { registerSettingItem } = nuxtApp.$topbar
    const { t } = nuxtApp.$i18n

    registerSettingItem(() => ({
      label: t('feedback.sendFeedback'),
      icon: 'feedback',
      shortcut: 'F9',
      disabled: () => !feedback.isAvailable(),
      disableReason: () => feedback.getUnavailableReason() || '',
      onClick: () => feedback.showDialog(),
    }), (item) => {
      // Put it before `about-app`
      return item.name === 'about-app' ? -1 : 0
    })
  },
})
