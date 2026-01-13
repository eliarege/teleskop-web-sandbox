<script setup lang="ts">
import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { PROGRAM_STATUS_COLORS } from '~/shared/constants'

const $q = useQuasar()
const { t } = useI18n()
const app = useAppProps()

const isDark = computed(() => $q.dark.isActive)

const showStatusColorPopup = useLocalStorage(`${app.name}.showPopup`, true)

function togglePopup() {
  showStatusColorPopup.value = !showStatusColorPopup.value
}

const programStatusList = computed(() => [
  {
    label: t('programStatusInfo.noChanges'),
    color: isDark.value
      ? PROGRAM_STATUS_COLORS.NO_CHANGES.dark
      : PROGRAM_STATUS_COLORS.NO_CHANGES.light,
  },
  {
    label: t('programStatusInfo.onlyOnTeleskop'),
    color: isDark.value
      ? PROGRAM_STATUS_COLORS.EXISTS_ONLY_ON_DATABASE.dark
      : PROGRAM_STATUS_COLORS.EXISTS_ONLY_ON_DATABASE.light,
  },
  {
    label: t('programStatusInfo.onlyOnController'),
    color: isDark.value
      ? PROGRAM_STATUS_COLORS.EXISTS_ONLY_ON_CONTROLLER.dark
      : PROGRAM_STATUS_COLORS.EXISTS_ONLY_ON_CONTROLLER.light,
  },
  {
    label: t('programStatusInfo.changedOnTeleskop'),
    color: isDark.value
      ? PROGRAM_STATUS_COLORS.CHANGED_ON_TELESKOP.dark
      : PROGRAM_STATUS_COLORS.CHANGED_ON_TELESKOP.light,
  },
  {
    label: t('programStatusInfo.changedOnMachine'),
    color: isDark.value
      ? PROGRAM_STATUS_COLORS.CHANGED_ON_MACHINE.dark
      : PROGRAM_STATUS_COLORS.CHANGED_ON_MACHINE.light,
  },
])
</script>

<template>
  <div class="status-popup">
    <div class="status-header" @click="togglePopup()">
      <span class="font-size-4">
        {{ t('programStatusInfo._') }}
      </span>
      <QIcon
        v-if="showStatusColorPopup"
        name="close"
        class="q-mx-sm text-gray-5 dark:text-gray-4"
        size="1rem"
      />
    </div>

    <div v-show="showStatusColorPopup" class="status-body">
      <div class="flex flex-col">
        <div
          v-for="status in programStatusList"
          :key="status.label"
        >
          <span :style="{ color: status.color }">
            {{ status.label }}
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
