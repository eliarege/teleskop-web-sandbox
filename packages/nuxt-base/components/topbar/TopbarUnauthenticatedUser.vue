<script setup lang="ts">
import type { TopbarMenuItem } from '~/types'

defineProps<{
  optionalItems?: TopbarMenuItem[]
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
    <QMenu :transition-duration="0">
      <TopbarCommonSettings :disable-theme :optional-items />
    </QMenu>
  </TopbarButton>
</template>
