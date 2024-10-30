<script setup lang="ts">
const { t } = useI18n()
const notificationState = useNotificationStore()

function getNoficationTime(notificationDate: Date) {
  return `${notificationDate.getHours()}:${notificationDate.getMinutes() < 10 ? `0${notificationDate.getMinutes()}` : notificationDate.getMinutes()}`
}

function removeNotification(notificationTime: Date) {
  notificationState.notifications = notificationState.notifications.filter(notification => notification.date.getTime() !== notificationTime.getTime())
}
</script>

<template>
  <TopbarButton
    icon="notifications"
    :color="notificationState.notifications.length ? 'red' : 'gray-8'"
    round
  >
    <QTooltip class="text-capitalize">
      {{ !notificationState.notifications.length ? t('notification.no_notification') : t('notification.yes_notification', { count: notificationState.notifications.length }) }}
    </QTooltip>
  </TopbarButton>

  <QPopupProxy
    v-model="notificationState.showNotificationPopup"
    transition-show="scale"
    transition-hide="scale"
    anchor="bottom right"
    self="top right"
    class="rounded-md"
  >
    <div class="q-pa-sm" style="width: 400px;">
      <div class="text-4 flex items-center">
        <span class="pl-2">{{ `${t('notification.notifications')} (${notificationState.notifications.length})` }}</span>
        <QSpace />
        <QBtn
          icon="delete"
          class="text-gray-6 mr-2"
          flat
          round
          size="md"
          dense
          @click="notificationState.notifications = []"
        >
          <QTooltip> {{ t('notification.delete_all') }} </QTooltip>
        </QBtn>
        <QBtn
          icon="close"
          class="text-gray-8"
          flat
          round
          size="md"
          dense
          @click="notificationState.showNotificationPopup = false"
        >
          <QTooltip>{{ t('notification.close') }}</QTooltip>
        </QBtn>
      </div>
      <QSeparator />
      <div v-if="notificationState.notifications.length">
        <div
          v-for="(notification, i) in notificationState.notifications"
          :key="i"
          class="p-1"
        >
          <div
            class="flex flex-nowrap justify-between items-center text-gray-8 p-1 rounded-lg"
            :class="`bg-${notification.type}`"
          >
            <span class="p-2">{{ notification.message }}</span>
            <div class="flex flex-nowrap items-center">
              <span class="pr-2 text-gray-6">{{ getNoficationTime(notification.date) }}</span>
              <QBtn
                icon="close"
                class="text-gray-8"
                flat
                round
                size="sm"
                dense
                @click="removeNotification(notification.date)"
              />
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <span class="p-2 flex justify-center items-center">{{ t('notification.no_notification') }}</span>
      </div>
    </div>
  </QPopupProxy>
</template>
