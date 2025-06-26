<script setup lang="ts">
import { useColorStore } from '~/store/Colors'

const { t } = useI18n()
const colors = useColorStore()
</script>

<template>
  <Suspense>
    <div :style="{ background: colors.bgColor }">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
    <template #fallback>
      <LoadingScreen
        image="/eliarkurumsal.png"
        :first-message="t('load-message')"
        :second-message="t('wait-message')"
      />
    </template>
  </Suspense>
</template>

<style lang="postcss">
:root {
  --el-border-color-lighter: rgba(50, 50, 50, 0.2);
}

.q-btn {
  background-color: transparent;
  height: auto !important;
  min-height: 0px !important;
}

html {
  font-family: 'Roboto', sans-serif;
  /* @apply text-light-600; */
}

::-webkit-scrollbar {
  width: 0.55rem;
  height: 100%;
}

::-webkit-scrollbar-thumb {
  background-color: #0d94fc;
  opacity: 50%;
  border-radius: 10px;
}

#__nuxt {
  width: 100%;
  height: 100%;
}

.el-dropdown {
  line-height: unset !important;
  color: white !important;
  font-size: inherit !important;
}

.el-table .cell {
  white-space: nowrap;
}

.cell {
  @apply text-gray-900 font-bold;
}

.el-table__empty-text {
  @apply opacity-80;
}

.el-backtop {
  @apply bg-white border border-cool-gray-400 shadow shadow-2xl;
}

#app {
  @apply m-0 p-0;

  .btn-default {
    border: 1px solid rgba(19, 18, 18, 0.5);
    border-radius: 7px;
    background: rgb(6, 2, 33);
    background: linear-gradient(30deg, rgb(14, 2, 94) 0%, rgb(65, 2, 107) 100%);
    @apply w-35 text-light-100;
  }

  .btn-default:hover {
    box-shadow:
      0 4px 4px 0 #9b9a9a,
      0 4px 5px 0 #6e6e6e;
  }
}
</style>
