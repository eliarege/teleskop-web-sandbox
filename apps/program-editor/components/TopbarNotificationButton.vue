<script setup lang="ts">
const { t } = useI18n()
const notificationState = useNotificationStore()

function getNotificationTime(notificationDate: Date) {
  if (!notificationDate)
    return ''

  return new Intl.DateTimeFormat('default', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(notificationDate)
}

function removeNotification(index: number) {
  notificationState.notifications.splice(index, 1)
}
</script>

<template>
  <TopbarButton
    icon="notifications"
    :color="notificationState.notifications.length ? 'red' : 'gray-6 dark:text-gray-3'"
    round
  >
    <QTooltip class="text-capitalize">
      {{ !notificationState.notifications.length ? t('notification.no_notification') : t('notification.yes_notification', { count: notificationState.notifications.length }) }}
    </QTooltip>

    <QMenu
      v-model="notificationState.showNotificationPopup"
      transition-show="scale"
      transition-hide="scale"
      anchor="bottom right"
      self="top right"
      class="rounded-md select-none"
    >
      <div class="q-pa-sm" style="width: 400px;">
        <div class="text-4 flex items-center">
          <span class="pl-2 text-sm">{{ `${t('notification.notifications')} (${notificationState.notifications.length})` }}</span>
          <QSpace />
          <QBtn
            icon="delete"
            class=" mr-2"
            flat
            round
            size="sm"
            dense
            @click="notificationState.notifications = []"
          >
            <QTooltip> {{ t('notification.delete_all') }} </QTooltip>
          </QBtn>
          <QBtn
            class=""
            icon="close"
            flat
            round
            size="sm"
            dense
            @click="notificationState.showNotificationPopup = false"
          >
            <QTooltip>{{ t('notification.close') }}</QTooltip>
          </QBtn>
        </div>
        <QSeparator />
        <div v-if="notificationState.notifications.length" class="notification-list">
          <div
            v-for="(notification, i) in notificationState.notifications"
            :key="i"
            class="p-1"
          >
            <div
              class="flex flex-nowrap justify-between items-center rounded-lg bg-gray-1 dark:bg-dark-3"
            >
              <span
                class="p-2 text-xs"
                :class="`text-${notification.type}`"
              >{{ notification.message }}</span>
              <div class="flex flex-nowrap items-center">
                <span class="text-gray-6 text-xs">{{ getNotificationTime(notification.date) }}</span>
                <QBtn
                  icon="close"
                  class="m-1"
                  flat
                  round
                  size="xs"
                  dense
                  @click="removeNotification(i)"
                />
              </div>
            </div>
          </div>
        </div>
        <div v-else>
          <span class="flex justify-center items-center p-2 text-gray-6 text-xs">{{ t('notification.no_notification') }}</span>
        </div>
      </div>
    </QMenu>
  </TopbarButton>
</template>

<style lang="postcss" scoped>
.notification-list {
  max-height: 400px;
  overflow-y: auto;
}
</style>
