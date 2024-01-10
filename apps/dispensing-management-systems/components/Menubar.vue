<script setup lang="ts">
import type { TeleskopData } from '~/shared/types'
import { convertTeleskopData } from '~/shared/utils'
import { useStateStore } from '~/store/State'

const emit = defineEmits(['refresh'])
const { t } = useI18n()
const stateStore = useStateStore()
async function syncData() {
  try {
    stateStore.isLoading = true
    const teleskopData = await $fetch<TeleskopData[]>('/api/teleskop/sync')
    const data = convertTeleskopData(teleskopData)
    await $fetch('/api/teleskop/sync', { method: 'POST', body: data })
  } catch (e) {
    console.error(e)
  } finally {
    stateStore.isLoading = false
    emit('refresh')
  }
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
        @click="{}"
      >
        <QTooltip :offset="[10, 10]">
          {{ t('New') }}
        </QTooltip>
      </QBtn>
      <QBtn
        flex-center
        class="border-rd-10 m-2"
        no-caps
        icon="sync"
        @click="syncData()"
      >
        <QTooltip :offset="[10, 10]">
          {{ t('SyncData') }}
        </QTooltip>
      </QBtn>
    </QCardSection>
  </QCard>
</template>
