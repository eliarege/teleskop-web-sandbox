<script setup lang="ts">
defineProps<{
  disableTheme?: boolean
}>()
const keycloak = useKeycloak()
const { didInitialise, authenticated } = keycloak
</script>

<template>
  <TopbarButton
    v-if="!keycloak.enabled || (didInitialise && !authenticated)"
    icon="more_vert"
    class="h-unset"
    round
  >
    <QMenu
      :transition-duration="0"
      self="top middle"
    >
      <TopbarCommonSettings :disable-theme />
    </QMenu>
  </TopbarButton>
</template>
