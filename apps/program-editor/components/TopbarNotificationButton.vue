<script setup lang="ts">
const { t, d } = useI18n()
const notificationState = useNotificationStore()

function getNoficationTime(notificationDate: Date) {
  return d(notificationDate, { hour: '2-digit', minute: '2-digit', hour12: false })
}

function removeNotification(index: number) {
  notificationState.notifications.splice(index, 1)
}
</script>

<template>
  <TopbarButton
    icon="notifications"
    :color="notificationState.notifications.length ? 'red' : 'gray-6 dark:text-gray-4'"
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
      <div class="q-pa-sm " style="width: 400px;">
        <div class="text-4 flex items-center">
          <span class="pl-2 text-sm">{{ `${t('notification.notifications')} (${notificationState.notifications.length})` }}</span>
          <QSpace />
          <QBtn
            icon="delete"
            class="text-gray-6 mr-2"
            flat
            round
            size="sm"
            dense
            @click="notificationState.notifications = []"
          >
            <QTooltip> {{ t('notification.delete_all') }} </QTooltip>
          </QBtn>
          <QBtn
            class="text-gray-4 dark:text-gray-6"
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
              class="flex flex-nowrap justify-between items-center text-gray-1 rounded-lg"
              :class="`bg-${notification.type}`"
            >
              <span class="p-2">{{ notification.message }}</span>
              <div class="flex flex-nowrap items-center">
                <span class="text-gray-2 text-xs">{{ getNoficationTime(notification.date) }}</span>
                <QBtn
                  icon="close"
                  class="text-gray-2 m-1"
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
