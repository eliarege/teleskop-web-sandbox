<script setup lang="ts">
import { notifications, showNotificationPopup } from '~/composables/utils'

const { t } = useI18n()

function getNotificationColor(notificationType: string ) {
  return notificationType === 'positive' ? '#81C784' : '#F2C037'
}

function getNoficationTime(notificationDate: Date) {
 return notificationDate.getHours() + ':' + (notificationDate.getMinutes() < 10 ? '0' + notificationDate.getMinutes() : notificationDate.getMinutes())
}

function removeNotification(notificationTime: Date) {
  notifications.value = notifications.value.filter(notification => notification.date.getTime() !== notificationTime.getTime())
}
</script>

<template>
  <TopbarButton
    icon="notifications"
    :color="notifications.length ? 'red' : 'gray-8'"
    round
  >
    <QTooltip class="text-capitalize">
      {{ !notifications.length ? t('notification.no_notification') : t('notification.yes_notification', { count: notifications.length }) }}
    </QTooltip>
  </TopbarButton>

  <QPopupProxy
    v-model="showNotificationPopup"
    transition-show="scale"
    transition-hide="scale"
    anchor="bottom right"
    self="top right"
    class="rounded-md"
  >
    <div class="q-pa-sm" style="width: 400px;">
      <div class="text-4 flex items-center">
        <span class="pl-2">{{ t('notification.notifications')+ ' (' + notifications.length + ')' }}</span>
        <QSpace />
        <QBtn icon="delete" class="text-gray-6 mr-2" flat round size="md" dense @click="notifications = []" >
          <QTooltip> {{ t('notification.delete_all') }} </QTooltip>
        </QBtn>
        <QBtn icon="close" class="text-gray-8" flat round size="md" dense @click="showNotificationPopup = false" >
          <QTooltip>{{ t('notification.close') }}</QTooltip>
        </QBtn>
      </div>
      <QSeparator />
      <div v-if="notifications.length">
        <div class="p-1" v-for="(notification, i) in notifications" :key="i">
          <div class="flex flex-nowrap justify-between items-center text-gray-8 p-1 rounded-lg" :style="{ background: getNotificationColor(notification.type) }">
            <span class="p-2">{{ notification.message }}</span>
            <div class="flex flex-nowrap items-center">
              <span class="pr-2 text-gray-6">{{ getNoficationTime(notification.date)  }}</span>
              <QBtn icon="close" class="text-gray-8" flat round size="sm" dense @click="removeNotification(notification.date)" />
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
