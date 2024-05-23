<script setup lang="ts">
import { useI18n } from '#imports'

const { locale, locales, setLocale } = useI18n()
const debouncedLocale = useDebounce(locale, 10)
</script>

<template>
  <TopbarButton icon="translate">
    <QMenu
      :transition-duration="0"
      class="text-left e-login-button__menu"
    >
      <QList>
        <QItem
          v-for="(lang, index) in locales"
          :key="index"
          v-close-popup
          clickable
          class="opacity-"
          dense
          :class="{ 'text-black/60': lang.code === debouncedLocale }"
          @click="setLocale(lang.code)"
        >
          <QItemSection>
            {{ lang.name }}
          </QItemSection>
        </QItem>
      </QList>
    </QMenu>
  </TopbarButton>
</template>
