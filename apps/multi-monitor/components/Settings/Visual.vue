<script setup lang="ts">
import { useDataStore } from '~/store/Datas'

const { t } = useI18n()
const store = useDataStore()
</script>

<template>
  <div class="bg-gray-100/80 rounded m-1 px-4 py-1">
    <span class="settings-title inline-block mb-3">
      {{ t('settings.visual-config') }}
    </span>
    <div class="">
      <span class="settings-sub-title inline-block mb-2px">
        {{ t("settings.sort-by") }}
      </span>
      <div>
        <q-option-group
          v-model="store.sortMachines"
          type="radio"
          dense
          checked-icon="task_alt"
          unchecked-icon="highlight_off"
          :options="[
            { label: t('settings.sort-id'), value: 1 },
            { label: t('settings.sort-active'), value: 2 },
            { label: t('settings.sort-idle'), value: 3 },
            { label: t('settings.sort-group'), value: 4 },
            { label: t('settings.sort-custom'), value: 5 },
          ]"
        />

        <q-separator class="my-10" />

        <div class="">
          <span class="settings-sub-title inline-block mb-2px">
            {{ t("settings.options") }}
          </span>
          <div class="">
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

        <q-separator class="my-10" />

        <span class="settings-sub-title inline-block mb-2px">
          {{ t("settings.zoom") }} {{ store.zoomLevel }} (0.7 - 1.3)
        </span>
        <div class="px-3 w-min whitespace-nowrap">
          <q-slider
            v-model="store.zoomLevel"
            markers
            :min="0.7"
            :max="1.3"
            :step="0.1"
            class="min-w-20rem"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
