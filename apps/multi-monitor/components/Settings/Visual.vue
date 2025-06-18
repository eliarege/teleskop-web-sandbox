<script setup lang="ts">
import { useDataStore } from '~/store/Datas'

const { t } = useI18n()
const store = useDataStore()
</script>

<template>
  <div class="flex-center flex-col w-full lt-sm:(w-90vw) !overflow-x-hidden">
    <span>{{ t("settings.sort-by") }}</span>
    <div class="flex-center flex-col lt-sm:(text-center)">
      <q-option-group
        v-model="store.sortMachines"
        type="radio"
        checked-icon="task_alt"
        unchecked-icon="highlight_off"
        :options="[
          { label: t('settings.sort-id'), value: 1 },
          { label: t('settings.sort-active'), value: 2 },
          { label: t('settings.sort-idle'), value: 3 },
          { label: t('settings.sort-group'), value: 4 },
        ]"
        class="lg:(flex-center) lt-sm:(text-start)"
      />

      <q-separator spaced />

      <div class="text-black px-3 text-center">
        <span>{{ t("settings.options") }}</span>
        <div class="grid grid-cols-3 justify-items-center">
          <q-checkbox
            v-model="store.electricity"
            :label="t('settings.electricity')"
            checked-icon="task_alt"
            unchecked-icon="highlight_off"
          />
          <q-checkbox
            v-model="store.salt"
            :label="t('settings.salt')"
            checked-icon="task_alt"
            unchecked-icon="highlight_off"
          />
          <q-checkbox
            v-model="store.water"
            :label="t('settings.water')"
            checked-icon="task_alt"
            unchecked-icon="highlight_off"
          />
          <q-checkbox
            v-model="store.steam"
            :label="t('settings.steam')"
            checked-icon="task_alt"
            unchecked-icon="highlight_off"
          />
          <q-checkbox
            v-model="store.production"
            :label="t('settings.production')"
            checked-icon="task_alt"
            unchecked-icon="highlight_off"
          />
          <q-checkbox
            v-model="store.group"
            :label="t('settings.group')"
            checked-icon="task_alt"
            unchecked-icon="highlight_off"
          />
        </div>
      </div>

      <q-separator spaced />

      <div class="px-13 py-2 text-center">
        <span>{{ t("settings.zoom") }}</span>
        <q-input
          :model-value="store.zoomLevel"
          type="number"
          dense
          filled
          label="Zoom"
          step="0.1"
          @update:model-value="store.setZoomLevel($event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
