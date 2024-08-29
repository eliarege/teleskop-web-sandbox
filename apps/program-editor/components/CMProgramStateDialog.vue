<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useLocalStorage } from '@vueuse/core'
import { ProgramStateColors } from '~/shared/constants'

const useStatusColorStore = useLocalStorage('statusColor', {
  showPopup: false,
})

function togglePopup() {
  useStatusColorStore.value.showPopup = !useStatusColorStore.value.showPopup
}

const { dark } = useQuasar()
const { t } = useI18n()

const programStatus = computed(() => [
  { label: t('programStatusInfo.noChanges'), color: dark.isActive ? ProgramStateColors.NO_CHANGES_DARK : ProgramStateColors.NO_CHANGES },
  { label: t('programStatusInfo.onlyOnTeleskop'), color: dark.isActive ? ProgramStateColors.EXISTS_ONLY_ON_DATABASE_DARK : ProgramStateColors.EXISTS_ONLY_ON_DATABASE },
  { label: t('programStatusInfo.onlyOnController'), color: dark.isActive ? ProgramStateColors.EXISTS_ONLY_ON_CONTROLLER_DARK : ProgramStateColors.EXISTS_ONLY_ON_CONTROLLER },
  { label: t('programStatusInfo.changedOnTeleskop'), color: dark.isActive ? ProgramStateColors.CHANGED_ON_TELESKOP_DARK : ProgramStateColors.CHANGED_ON_TELESKOP },
  { label: t('programStatusInfo.changedOnMachine'), color: dark.isActive ? ProgramStateColors.CHANGED_ON_MACHINE_DARK : ProgramStateColors.CHANGED_ON_MACHINE },
])
</script>

<template>
  <div class="status-popup">
    <div class="status-header" @click="togglePopup()">
      <span class="font-size-4">
        {{ t('programStatusInfo._') }}
      </span>
      <QIcon
        v-if="useStatusColorStore.showPopup"
        name="close"
        size="1rem"
      />
    </div>

    <div v-show="useStatusColorStore.showPopup" class="status-body">
      <div
        v-for="status in programStatus"
        :key="status.label"
      >
        <span :style="{ color: status.color }"> {{ status.label }} </span>
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
