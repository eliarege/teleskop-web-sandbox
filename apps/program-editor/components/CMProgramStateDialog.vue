<script setup lang="ts">
import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const app = useAppProps()
const showStatusColorPopup = useLocalStorage(`${app.name}.showPopup`, true)

function togglePopup() {
  showStatusColorPopup.value = !showStatusColorPopup.value
}

const programStatus = computed(() => [
  { label: t('programStatusInfo.noChanges'), className: 'no-changes' },
  { label: t('programStatusInfo.onlyOnTeleskop'), className: 'only-on-teleskop' },
  { label: t('programStatusInfo.onlyOnController'), className: 'only-on-controller' },
  { label: t('programStatusInfo.changedOnTeleskop'), className: 'changed-on-teleskop' },
  { label: t('programStatusInfo.changedOnMachine'), className: 'changed-on-machine' },
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
          v-for="status in programStatus"
          :key="status.label"
        >
          <span :class="status.className">
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
