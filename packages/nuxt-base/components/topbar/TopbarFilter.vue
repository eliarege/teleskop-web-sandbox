<script setup lang="ts">
import { mdiFilterOutline } from '@quasar/extras/mdi-v7'

const { t } = useI18n()
</script>

<template>
  <TopbarButton
    :icon="mdiFilterOutline"
    class="h-unset"
    round
  >
    <QTooltip>
      {{ t('base.filter') }}
    </QTooltip>
    <slot />
  </TopbarButton>
</template>

<style scoped lang="postcss">
</style>
