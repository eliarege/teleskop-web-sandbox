<script lang="ts" setup>
import { useRouter } from '#vue-router'

const route = useRouter()
const { t } = useI18n()
const unavailableRoutes = ['/', '/settings', '/jobOrders/print']

function onClickNavButton() {
  route.back()
}
</script>

<template>
  <QBtn
    v-if="!unavailableRoutes.includes(route.currentRoute.value.path)"
    round
    flat
    icon="arrow_back"
    class="border-1 border-solid"
    style="align-self: flex-start;"
    @click="onClickNavButton"
  >
    <QTooltip
      :offset="[10, 10]"
    >
      {{ t('GoBack') }}
    </QTooltip>
  </QBtn>
</template>
