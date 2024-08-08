<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { ProgramStateColors } from '~/shared/constants'

const { dark } = useQuasar()
const { t } = useI18n()
const showPopup = ref(true)

function togglePopup() {
  showPopup.value = !showPopup.value
}

const programStatus = computed(() => [
  { label: t('programStatusInfo.noChanges'), color: dark.isActive ? ProgramStateColors.NO_CHANGES_DARK : ProgramStateColors.NO_CHANGES },
  { label: t('programStatusInfo.onlyOnTeleskop'), color: ProgramStateColors.EXISTS_ONLY_ON_DATABASE },
  { label: t('programStatusInfo.onlyOnController'), color: ProgramStateColors.EXISTS_ONLY_ON_CONTROLLER },
  { label: t('programStatusInfo.changedOnTeleskop'), color: ProgramStateColors.CHANGED_ON_TELESKOP },
  { label: t('programStatusInfo.changedOnMachine'), color: ProgramStateColors.CHANGED_ON_MACHINE },
])
</script>

<template>
  <div class="absolute bottom-0 right-10">
    <div class="rounded-t-lg p-2 text-center bg-gray-2 cursor-pointer" @click="togglePopup">
      <span class="font-size-4">
        {{ t('programStatusInfo._') }}
      </span>
    </div>

    <div v-if="showPopup" class="flex flex-col p-3 bg-gray-1">
      <div
        v-for="status in programStatus"
        :key="status.label"
      >
        <span :style="{ color: status.color }"> {{ status.label }} </span>
      </div>
    </div>
  </div>
</template>
