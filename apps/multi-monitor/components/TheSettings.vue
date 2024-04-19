<script setup lang="ts">
import {
  sharpDashboard,
  sharpFormatColorFill,
  sharpGrid3x3,
  sharpLanguage,
  sharpOfflineBolt,
  sharpSlowMotionVideo,
} from '@quasar/extras/material-icons-sharp'
import { useDataStore } from '~/store/Datas'
import { useColorStore } from '~/store/Colors'

defineProps({
  show: Boolean,
})
defineEmits(['close'])

const { t, locale, setLocale } = useI18n()
const colors = useColorStore()
const store = useDataStore()
const config = useRuntimeConfig()

function setDefaultSettings() {
  colors.cardActiveBg = '#4B5563'
  colors.cardIdleBg = '#D1D5DB'
  colors.cardItemBg = '#000000'
  colors.bgColor = '#FFFFFF'
  colors.textcolor = '#000000'
  store.mode = true
  store.electricity = true
  store.steam = true
  store.salt = true
  store.water = true
  store.scrollSpeed = 3
  store.zoomLevel = 1
}

const machineGroups = computed(() => new Set(store.machines.map(g => g.groupName)))
</script>

<template>
  <div class="modal-mask cursor-pointer" @click.stop="$emit('close')">
    <div class="modal-wrapper cursor-pointer">
      <div class="modal-container cursor-pointer">
        <div class="wrapper cursor-default" @click.stop.prevent>
          <div class="flex flex-col w-full items-center justify-center self-center bg-white overflow-auto">
            <q-list class="w-full pb-8">
              <q-expansion-item
                v-if="JSON.parse(config.public.isDigitalFactory) === false"
                class="text-black"
                expand-separator
                :icon="sharpLanguage"
                :label="t('settings.language-settings')"
                :caption="t('language')"
              >
                <div class="flex justify-center">
                  <q-option-group
                    :model-value="locale"
                    type="radio"
                    :options="[
                      { label: 'Türkçe', value: 'tr' },
                      { label: 'English', value: 'en' },
                    ]"
                    class="flex"
                    @update:model-value="setLocale($event)"
                  />
                </div>
              </q-expansion-item>
              <q-expansion-item
                class="text-black"
                expand-separator
                :icon="sharpGrid3x3"
                :label="t('settings.visual-config')"
              >
                <div class="flex flex-col justify-center items-center">
                  <span>{{ t("settings.sort-by") }}</span>
                  <div>
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
                        { label: 'Alarm', value: 5 },
                      ]"
                      class="grid grid-cols-5"
                    />
                  </div>
                </div>

                <q-separator spaced />
                <div class="label-wrapper text-black px-3">
                  <span>{{ t("settings.options") }}</span>
                  <div>
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
                      v-model="store.group"
                      :label="t('settings.group')"
                      checked-icon="task_alt"
                      unchecked-icon="highlight_off"
                    />
                  </div>
                </div>
                <q-separator spaced />
                <span class="w-full flex-center">
                  {{ t('settings.filter.title') }}
                </span>
                <div class="grid grid-cols-3">
                  <div
                    v-for="item in store.machines"
                    :key="item.id"
                    class="max-h-50"
                  >
                    <q-checkbox
                      :label="item.name"
                      :model-value="!store.filteredMachines.has(item.id)"
                      @update:model-value="(r) => r ? store.filteredMachines.delete(item.id) : store.filteredMachines.add(item.id)"
                    />
                  </div>
                </div>

                <q-separator spaced />
                <span class="w-full flex-center">
                  {{ t('settings.filter.group-title') }}
                </span>
                <div class="grid grid-cols-3">
                  <div v-for="(item, idx) in machineGroups" :key="idx">
                    <q-checkbox
                      :label="item"
                      :model-value="!store.filteredGroups.has(item)"
                      @update:model-value="(r) => r ? store.filteredGroups.delete(item) : store.filteredGroups.add(item)"
                    />
                  </div>
                </div>
              </q-expansion-item>
              <q-expansion-item
                :icon="sharpFormatColorFill"
                class="text-black"
                expand-separator
                :label="t('settings.color-picker')"
              >
                <div class="colorp flex p-2 gap-3">
                  <q-color v-model="colors.cardActiveBg" class="my-picker" />
                  <q-color
                    v-model="colors.cardIdleBg"
                    class="my-picker"
                  />
                </div>
              </q-expansion-item>
              <q-expansion-item
                :icon="sharpDashboard"
                class="text-black"
                expand-separator
                :label="t('settings.layout')"
              >
                <div class="layout">
                  <q-option-group
                    v-model="store.mode"
                    type="radio"
                    checked-icon="task_alt"
                    :options="[
                      { label: t('settings.side'), value: false },
                      { label: t('settings.top'), value: true },
                    ]"
                    class="flex"
                  />
                  <div class="pb-2">
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
              </q-expansion-item>
              <q-expansion-item
                :icon="sharpSlowMotionVideo"
                expand-separator
                class="text-black"
                :label="t('settings.animation')"
              >
                <div class="p-4 flex justify-between">
                  <span> {{ t('settings.scrollSpeed') }}</span>
                  <q-rating
                    v-model="store.scrollSpeed"
                    size="2em"
                    color="black"
                    :icon="sharpOfflineBolt"
                    no-reset
                  />
                </div>
              </q-expansion-item>
            </q-list>
            <div class="btns">
              <ElButton
                color="#0d94fc"
                plain
                @click="setDefaultSettings"
              >
                {{ t("settings.default") }}
              </ElButton>
              <ElButton
                color="#0d94fc"
                plain
                @click="$emit('close')"
              >
                {{
                  t("settings.close")
                }}
              </ElButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
* {
  z-index: 10;
}
.modal-mask {
  background-color: rgba(0, 0, 0, 0.5);
  @apply fixed top-0 left-0 w-full h-screen overflow-auto flex z-100 justify-center items-center self-center m-auto select-none;
  .modal-wrapper {
    @apply absolute;
    top: 3rem;
    .modal-container {
      @apply h-min flex justify-center w-full mb-12;
    }
  }
}
.layout {
  @apply flex flex-col gap-3 font-extrabold justify-center w-full items-center text-center text-black;
}

.wrapper {
  @apply flex flex-col p-5 rounded-2xl border border-gray-300 shadow shadow-gray-500/50 shadow-md border-4px w-125 h-full bg-white gap-5;

  .label-wrapper {
    @apply flex flex-col justify-center items-center;
  }

  .colorp {
    @apply flex items-center text-black font-extrabold justify-center w-full h-full;
  }
  .el-carousel {
   @apply w-full h-full;
  }

  .el-carousel__item h3 {
    color: #475669;
    opacity: 0.75;
    line-height: 200px;
    margin: 0;
    text-align: center;
  }

  .btns {
    @apply relative flex w-full justify-end gap-3 bottom-1 right-2;
  }
}
@media screen and (max-width: 735px) {
  .modal-mask .modal-wrapper .modal-container {
    @apply justify-center overflow-auto;
  }
  .wrapper {
    @apply max-h-90vh overflow-auto;
  }
  .btns {
    @apply justify-center;
  }
}
</style>
