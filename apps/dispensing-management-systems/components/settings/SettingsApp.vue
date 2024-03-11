<script lang="ts" setup>
import languageTR from 'quasar/lang/tr'
import languageEN from 'quasar/lang/en-US'
import { useStateStore } from '~/store/State'

const stateStore = useStateStore()
const q = useQuasar()
const { t, locale } = useI18n()
const { dark } = useQuasar()

const langs = [
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'English' },
]
const themes = ref([
  { value: false, label: t('Light') },
  { value: true, label: t('Dark') },
])
watch(locale, () => {
  if (locale.value === 'tr')
    q.lang.set(languageTR)
  else if (locale.value === 'en') {
    q.lang.set(languageEN)
  }
  themes.value = [
    { value: false, label: t('Light') },
    { value: true, label: t('Dark') },
  ]
})

const cookie = useCookie<'auto' | boolean>('dark')
watch(
  () => dark.mode,
  mode => cookie.value = mode,
)
</script>

<template>
  <div class="flex flex-row align-start justify-center">
    <div class="text-xl">
      {{ t('settings.App') }}
    </div>
    <div class="flex-center flex-col gap-5 text-size-4 mt-10 w-full ">
      <div class="row-item">
        {{ t('Language') }}
        <QSelect
          v-model="stateStore.locale"
          :options="langs"
          class="w-100"
          filled
          dense
          emit-value
          map-options
        />
      </div>
      <QSeparator
        class="w-full "
      />
      <div class="row-item">
        {{ t('Theme') }}
        <QOptionGroup
          v-model="dark.isActive"
          type="radio"
          :options="themes"
          class="flex"
          @update:model-value="dark.set($event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.row-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  width: 50%;
  margin: 1.25rem;
}
</style>
