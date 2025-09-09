<script setup lang="ts">
import { useProjectTranslations } from '#imports'

const { locale, locales, setLocale } = useProjectTranslations()
const { t } = useI18n()
const debouncedLocale = useDebounce(locale, 10)
</script>

<template>
  <TopbarButton
    icon="translate"
    round
    class="h-unset"
  >
    <QTooltip>
      {{ t('pt.projectLocale') }}
    </QTooltip>
    <QMenu
      :transition-duration="0"
      class="text-left e-login-button__menu"
    >
      <QList>
        <template v-if="locales.length === 0">
          <QItem
            dense
            class="q-item-avatar-dense max-w-70 p-4"
          >
            <QItemSection class="px-0 mr-4 opacity-60" avatar>
              <QIcon size="1rem" name="warning" />
            </QItemSection>
            <QItemSection class="flex-1">
              <QItemLabel>{{ t('pt.noLocale') }}</QItemLabel>
            </QItemSection>
          </QItem>
        </template>
        <template v-else>
          <QItem
            v-for="(lang, index) in locales"
            :key="index"
            v-close-popup
            clickable
            dense
            class="q-item-avatar-dense pl-2.5 pr-8 whitespace-nowrap"
            @click="setLocale(lang.code)"
          >
            <QItemSection class="px-0 mr-2.5 opacity-60" avatar>
              <QIcon size="1rem" :name="lang.code === debouncedLocale ? 'check' : undefined" />
            </QItemSection>
            <QItemSection class="flex-1 text-capitalize">
              <QItemLabel>{{ lang.name }}</QItemLabel>
            </QItemSection>
          </QItem>
        </template>
      </QList>
    </QMenu>
  </TopbarButton>
</template>
