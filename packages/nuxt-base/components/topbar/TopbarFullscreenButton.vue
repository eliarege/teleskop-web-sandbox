<script setup lang="ts">
const { t } = useI18n()
const { isFullscreen, isSupported, toggle } = useFullscreen()
</script>

<template>
  <TopbarButton
    v-if="isSupported"
    :icon="!isFullscreen ? 'fullscreen' : 'fullscreen_exit'"
    round
    @click="toggle"
  >
    <QTooltip class="text-capitalize">
      {{ !isFullscreen ? t('base.fullscreen.enter') : t('base.fullscreen.exit') }}
    </QTooltip>
  </TopbarButton>
</template>
