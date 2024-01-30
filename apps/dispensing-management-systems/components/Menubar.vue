<script setup lang="ts">
import { useDataStore } from '~/store/DataStore'

const dataStore = useDataStore()
const { t } = useI18n()

async function refreshDispensers() {
  const res = await $fetch(`/api/dispensers`)
  dataStore.dispensers = res
}
</script>

<template>
  <QCard
    class="items-center"
    flat
  >
    <QCardSection
      class="flex-center items-center"
    >
      <QBtn
        flex-center
        class="border-rd-10"
        no-caps
        icon="note_add"
        color="primary"
        @click="navigateTo(`/addMachineDispenser`)"
      >
        <QTooltip :offset="[10, 10]">
          {{ t('New') }}
        </QTooltip>
      </QBtn>
      <QBtn
        flex-center
        class="border-rd-10 m-2"
        no-caps
        icon="refresh"
        @click="refreshDispensers"
      >
        <QTooltip :offset="[10, 10]">
          {{ t('Refresh') }}
        </QTooltip>
      </QBtn>
    </QCardSection>
  </QCard>
</template>
