<script lang="ts" setup>
import { useStateStore } from '~/store/State'

const { t } = useI18n()
const stateStore = useStateStore()

function searchJobOrder() {
  navigateTo({
    path: '/jobOrders',
  })
}
async function syncData() {
  try {
    stateStore.isLoading = true
    await $fetch('/api/teleskop/sync')
  } catch (e) {
    console.error(e)
  } finally {
    stateStore.isLoading = false
    onRefresh()
  }
}
function onRefresh() {
  window.location.reload()
}
</script>

<template>
  <div>
    <h3 class="text-center text-8 opacity-50">
      {{ t('SelectDispenser') }}
    </h3>
    <div class="flex-center mt-2">
      <QSeparator class="flex-grow" />
      <p class="mx-4 text-6 opacity-50">
        {{ t('Or') }}
      </p>
      <QSeparator class="flex-grow" />
    </div>
    <div class="flex justify-evenly items-center w-full mt-15 ">
      <QBtn
        class="h-50 w-60 pb-15 pt-15 mt-2 mr-2 opacity-75 border border-solid text-5 b-rd-2"
        no-caps
        icon="add"
        :label="t('AddNew')"
        @click="navigateTo(`/machines`)"
      />
      <QBtn
        class="h-50 w-60 pb-15 pt-15 pl-15 pr-15 mt-2 ml-2 opacity-75 border border-solid text-5 b-rd-2"
        no-caps
        icon="search"
        :label="t('SearchJob')"
        @click="searchJobOrder"
      />
      <QBtn
        class="h-40 w-50 pb-10 pt-10 opacity-75 border border-solid text-5 b-rd-2 hidden"
        no-caps
        icon="sync"
        :label="t('SyncData')"
        @click="syncData"
      />
    </div>
  </div>
</template>
