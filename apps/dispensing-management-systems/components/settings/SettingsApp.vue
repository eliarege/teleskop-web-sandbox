<script lang="ts" setup>
import { useStateStore } from '~/store/State'

const stateStore = useStateStore()
const { t, locales, setLocale } = useI18n()
const { dark } = useQuasar()

const themes = ref([
  { value: false, label: t('Light') },
  { value: true, label: t('Dark') },
])

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
    <QSeparator
      class="w-full mt-10"
    />
    <div class="flex-center flex-col gap-5 text-size-4 mt-10 w-full ">
      <div class="row-item">
        {{ t('Language') }}
        <QSelect
          v-model="stateStore.locale"
          :options="locales"
          class="w-100"
          filled
          dense
          emit-value
          map-options
          option-value="code"
          option-label="name"
          @update:model-value="setLocale($event)"
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
