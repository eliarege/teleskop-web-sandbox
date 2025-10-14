<script lang="ts" setup>
const { t } = useI18n()

function searchJobOrder() {
  navigateTo({
    path: '/jobOrders',
  })
}
searchJobOrder()
</script>

<template>
  <div v-if="false">
    <h3 class="text-center text-8 opacity-50 px-20">
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
        class="h-50 w-60 pb-15 pt-15 mt-2 opacity-75 border border-solid text-5 b-rd-2"
        no-caps
        icon="add"
        :label="t('AddNew')"
        @click="navigateTo(`/machines`)"
      />
      <QBtn
        class="h-50 w-60 pb-15 pt-15 pl-15 pr-15 mt-2 opacity-75 border border-solid text-5 b-rd-2"
        no-caps
        icon="search"
        :label="t('SearchJob')"
        @click="searchJobOrder"
      />
    </div>
  </div>
</template>
