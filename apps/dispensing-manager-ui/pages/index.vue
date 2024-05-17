<script setup lang="ts">
import { colors } from '~/shared/constants'

const { t } = useI18n()
const about = ref()
about.value = await $fetch('/api/properties')
</script>

<template>
  <span class="header-class">
    Eliar - {{ t('dispensingManager._') }}
    <q-space />
    <span class="h-1 m-1 text-size-5">
      {{ about.version }}
    </span>
    <NavigationButton type="settings" />
  </span>
  <DagitimYonetim />
</template>

<style scoped lang="postcss">
.buttons {
  margin-top: 20vh;
  justify-content: center;
  display: flex;
  flex-direction: row;
  align-items: center;
}
img.invert-colors {
  filter: invert(1);
}
.header-class {
  background-color: rgb(0, 0, 0);
  color: white;
  font-size: x-large;
  width: 100%;
  display: flex;
  align-items: center;
  padding-left: 1rem;
  height: 3rem;
}
</style>
