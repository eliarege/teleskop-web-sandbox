<script setup lang="ts">
import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  statuses: Readonly<Record<number, { light: string, dark: string }>>
}>()

const $q = useQuasar()
const { t } = useI18n()
const app = useAppProps()

const isDark = computed(() => $q.dark.isActive)

const showStatusColorPopup = useLocalStorage(`${app.name}.showPopup`, true)

function togglePopup() {
  showStatusColorPopup.value = !showStatusColorPopup.value
}
</script>

<template>
  <div class="status-popup">
    <div class="status-header" @click="togglePopup()">
      <span class="font-size-4">
        {{ t('programStatusInfo.title') }}
      </span>
      <QIcon
        v-if="showStatusColorPopup"
        name="close"
        class="q-mx-sm text-gray-5 dark:text-gray-4"
        size="1rem"
      />
    </div>

    <div v-show="showStatusColorPopup" class="status-body">
      <div class="flex flex-col gap-1">
        <div
          v-for="(status, key) in props.statuses"
          :key="key"
        >
          <span
            class="inline-flex items-center"
            :style="{ color: isDark ? status.dark : status.light }"
          >
            {{ t(`programStatusInfo.statuses.${key}`) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.status-popup {
  @apply absolute bottom-0 right-10 select-none;
}

.status-header {
  @apply bg-gray-2 dark:bg-dark-1 text-black dark:text-gray-1 rounded-t-lg shadow-lg p-3 flex justify-between items-center cursor-pointer;
}

.status-body {
  @apply dark:bg-dark-2 dark:text-gray-1 flex flex-col p-3 bg-gray-1;
}
</style>
