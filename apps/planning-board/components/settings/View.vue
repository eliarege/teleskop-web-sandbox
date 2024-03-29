<script setup lang="ts">
import { color } from 'd3'
import { useSettingStore } from '~/store/settings'

const emits = defineEmits(['updateScheduler'])
const { t } = useI18n()
const store = useSettingStore()
function iconColor(bgColor: string) {
  if (bgColor === '') {
    bgColor = '#FFFFFF'
  }
  const colorToRGB = color(bgColor)!.rgb()
  const sRGB = {
    r: colorToRGB.r / 255,
    g: colorToRGB.g / 255,
    b: colorToRGB.b / 255,
  }
  function sRGBtoLin(colorChannel: number) {
    if (colorChannel <= 0.04045) {
      return colorChannel / 12.92
    } else {
      return ((colorChannel + 0.055) / 1.055) ** 2.4
    }
  }
  return (0.2126 * sRGBtoLin(sRGB.r) + 0.7152 * sRGBtoLin(sRGB.g) + 0.0722 * sRGBtoLin(sRGB.b)) > 0.5 ? 'black' : 'white'
}
</script>

<template>
  <div class="h-80vh">
    <div class="settings-border">
      <div class="ml-3">
        <span>{{ t('plan-area.title') }}</span>
        <div class="ml-5 my-2 settings-border">
          <div class="ml-3">
            <span>{{ t('plan-area.completed.title') }}</span>
            <div class="ml-7 my-2 settings-border p-2 flex flex-col gap-3">
              <div class="flex items-center gap-3">
                <span>{{ t('plan-area.completed.text') }}</span>
                <QSelect
                  v-model="store.settings.completedBatch.batchText"
                  square
                  dense
                  outlined
                  :options="store.settings.batchText"
                  option-value="value"
                  option-label="label"
                  class="w-200px"
                />
              </div>
              <q-separator />
              <div class="flex items-center gap-3">
                <q-checkbox v-model="store.settings.completedBatch.isBatchFabricColor" :label="t('plan-area.completed.is-batch-fabric-color')" />
                <div v-show="!store.settings.completedBatch.isBatchFabricColor" class="flex-center flex-col gap-3">
                  <div class="flex-center gap-2">
                    <q-input
                      v-model="store.settings.completedBatch.actualBatchFabricColor"
                      dense
                      readonly
                      borderless
                      class="border-b-1px border-b-solid"
                      :placeholder="t('plan-area.completed.actual-batch-fabric-color')"
                      clearable
                      :style="{ backgroundColor: store.settings.completedBatch.actualBatchFabricColor }"
                    >
                      <template #append>
                        <q-icon
                          v-if="store.settings.completedBatch.actualBatchFabricColor !== ''"
                          name="cancel"
                          class="cursor-pointer"
                          :color="iconColor(store.settings.completedBatch.actualBatchFabricColor)"
                          @click="store.settings.completedBatch.actualBatchFabricColor = ''"
                        />
                        <q-icon
                          name="colorize"
                          class="cursor-pointer"
                          square
                          :color="iconColor(store.settings.completedBatch.actualBatchFabricColor)"
                        >
                          <q-popup-proxy cover>
                            <q-color
                              v-model="store.settings.completedBatch.actualBatchFabricColor"
                              no-header
                              no-footer
                              @change="emits('updateScheduler')"
                            />
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                    <q-input
                      v-model="store.settings.completedBatch.deviationBatchFabricColor"
                      dense
                      readonly
                      borderless
                      :placeholder="t('plan-area.completed.deviation-batch-fabric-color')"
                      clearable
                      class="border-b-1px border-b-solid"
                      :style="{ backgroundColor: store.settings.completedBatch.deviationBatchFabricColor }"
                    >
                      <template #append>
                        <q-icon
                          v-if="store.settings.completedBatch.deviationBatchFabricColor !== ''"
                          name="cancel"
                          class="cursor-pointer"
                          :color="iconColor(store.settings.completedBatch.deviationBatchFabricColor)"
                          @click="store.settings.completedBatch.deviationBatchFabricColor = ''"
                        />
                        <q-icon
                          name="colorize"
                          class="cursor-pointer"
                          square
                          :color="iconColor(store.settings.completedBatch.deviationBatchFabricColor)"
                        >
                          <q-popup-proxy cover>
                            <q-color
                              v-model="store.settings.completedBatch.deviationBatchFabricColor"
                              no-header
                              no-footer
                              @change="emits('updateScheduler')"
                            />
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="ml-3">
        <div class="ml-5 my-2 settings-border">
          <div class="ml-3">
            <span>{{ t('plan-area.ongoing.title') }}</span>
            <div class="ml-7 my-2 settings-border p-2 flex flex-col gap-3">
              <div class="flex items-center gap-3">
                <span>{{ t('plan-area.ongoing.text') }}</span>
                <QSelect
                  v-model="store.settings.ongoingBatch.batchText"
                  square
                  dense
                  outlined
                  :options="store.settings.batchText"
                  option-value="value"
                  option-label="label"
                  class="w-200px"
                />
              </div>
              <q-separator />
              <div class="flex items-center gap-3">
                <q-checkbox
                  v-model="store.settings.ongoingBatch.isBatchFabricColor"
                  :label="t('plan-area.ongoing.is-batch-fabric-color')"
                />
                <div v-show="!store.settings.ongoingBatch.isBatchFabricColor" class="flex-center flex-col gap-3">
                  <div class="flex-center gap-2">
                    <q-input
                      v-model="store.settings.ongoingBatch.actualBatchFabricColor"
                      dense
                      readonly
                      borderless
                      class="border-b-1px border-b-solid"
                      :placeholder="t('plan-area.ongoing.actual-batch-fabric-color')"
                      clearable
                      :style="{ backgroundColor: store.settings.ongoingBatch.actualBatchFabricColor }"
                    >
                      <template #append>
                        <q-icon
                          v-if="store.settings.ongoingBatch.actualBatchFabricColor !== ''"
                          name="cancel"
                          class="cursor-pointer"
                          :color="iconColor(store.settings.ongoingBatch.actualBatchFabricColor)"
                          @click="store.settings.ongoingBatch.actualBatchFabricColor = ''"
                        />
                        <q-icon
                          name="colorize"
                          class="cursor-pointer"
                          square
                          :color="iconColor(store.settings.ongoingBatch.actualBatchFabricColor)"
                        >
                          <q-popup-proxy cover>
                            <q-color
                              v-model="store.settings.ongoingBatch.actualBatchFabricColor"
                              no-header
                              no-footer
                              @change="emits('updateScheduler')"
                            />
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                    <q-input
                      v-model="store.settings.ongoingBatch.deviationBatchFabricColor"
                      dense
                      readonly
                      borderless
                      :placeholder="t('plan-area.ongoing.deviation-batch-fabric-color')"
                      clearable
                      class="border-b-1px border-b-solid"
                      :style="{ backgroundColor: store.settings.ongoingBatch.deviationBatchFabricColor }"
                    >
                      <template #append>
                        <q-icon
                          v-if="store.settings.ongoingBatch.deviationBatchFabricColor !== ''"
                          name="cancel"
                          class="cursor-pointer"
                          :color="iconColor(store.settings.ongoingBatch.deviationBatchFabricColor)"
                          @click="store.settings.ongoingBatch.deviationBatchFabricColor = ''"
                        />
                        <q-icon
                          name="colorize"
                          class="cursor-pointer"
                          square
                          :color="iconColor(store.settings.ongoingBatch.deviationBatchFabricColor)"
                        >
                          <q-popup-proxy cover>
                            <q-color
                              v-model="store.settings.ongoingBatch.deviationBatchFabricColor"
                              no-header
                              no-footer
                              @change="emits('updateScheduler')"
                            />
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="ml-3">
        <div class="ml-5 my-2 settings-border">
          <div class="ml-3">
            <span>{{ t('plan-area.planned.title') }}</span>
            <div class="ml-7 my-2 settings-border p-2 flex flex-col gap-3">
              <div class="flex items-center gap-3">
                <span>{{ t('plan-area.planned.text') }}</span>
                <QSelect
                  v-model="store.settings.plannedBatch.batchText"
                  square
                  dense
                  outlined
                  :options="store.settings.batchText"
                  option-value="value"
                  option-label="label"
                  class="w-200px"
                />
              </div>
              <q-separator />
              <div class="flex items-center gap-3">
                <q-checkbox v-model="store.settings.plannedBatch.isBatchFabricColor" :label="t('plan-area.planned.is-batch-fabric-color')" />
                <div v-show="!store.settings.plannedBatch.isBatchFabricColor" class="flex-center flex-col gap-3">
                  <div class="flex-center gap-2">
                    <q-input
                      v-model="store.settings.plannedBatch.actualBatchFabricColor"
                      dense
                      readonly
                      borderless
                      class="border-b-1px border-b-solid"
                      :placeholder="t('plan-area.planned.actual-batch-fabric-color')"
                      clearable
                      :style="{ backgroundColor: store.settings.plannedBatch.actualBatchFabricColor }"
                    >
                      <template #append>
                        <q-icon
                          v-if="store.settings.plannedBatch.actualBatchFabricColor !== ''"
                          name="cancel"
                          class="cursor-pointer"
                          :color="iconColor(store.settings.plannedBatch.actualBatchFabricColor)"
                          @click="store.settings.plannedBatch.actualBatchFabricColor = ''"
                        />
                        <q-icon
                          name="colorize"
                          class="cursor-pointer"
                          square
                          :color="iconColor(store.settings.plannedBatch.actualBatchFabricColor)"
                        >
                          <q-popup-proxy cover>
                            <q-color
                              v-model="store.settings.plannedBatch.actualBatchFabricColor"
                              no-header
                              no-footer
                              @change="emits('updateScheduler')"
                            />
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                    <q-input
                      v-model="store.settings.plannedBatch.deviationBatchFabricColor"
                      dense
                      readonly
                      borderless
                      :placeholder="t('plan-area.planned.actual-batch-fabric-color')"
                      clearable
                      class="border-b-1px border-b-solid"
                      :style="{ backgroundColor: store.settings.plannedBatch.deviationBatchFabricColor }"
                    >
                      <template #append>
                        <q-icon
                          v-if="store.settings.plannedBatch.deviationBatchFabricColor !== ''"
                          name="cancel"
                          class="cursor-pointer"
                          :color="iconColor(store.settings.plannedBatch.deviationBatchFabricColor)"
                          @click="store.settings.plannedBatch.deviationBatchFabricColor = ''"
                        />
                        <q-icon
                          name="colorize"
                          class="cursor-pointer"
                          square
                          :color="iconColor(store.settings.plannedBatch.deviationBatchFabricColor)"
                        >
                          <q-popup-proxy cover>
                            <q-color
                              v-model="store.settings.plannedBatch.deviationBatchFabricColor"
                              no-header
                              no-footer
                              @change="emits('updateScheduler')"
                            />
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="settings-border">
      <div class="ml-3">
        <span>{{ t('plan-area.stops.main') }}</span>
        <div class="settings-border ml-5 my-2 flex gap-3">
          <QCheckbox v-model="store.settings.showStops.show" :label="t('plan-area.stops.title')" />
          <q-input
            v-if="store.settings.showStops.show"
            v-model="store.settings.showStops.color"
            dense
            readonly
            borderless
            class="border-b-1px border-b-solid"
            :placeholder="t('plan-area.stops.color')"
            clearable
            :style="{ backgroundColor: store.settings.showStops.color }"
          >
            <template #append>
              <q-icon
                v-if="store.settings.showStops.color !== ''"
                name="cancel"
                class="cursor-pointer"
                :color="iconColor(store.settings.showStops.color)"
                @click="store.settings.showStops.color = ''"
              />
              <q-icon
                name="colorize"
                class="cursor-pointer"
                square
                :color="iconColor(store.settings.showStops.color)"
              >
                <q-popup-proxy cover>
                  <q-color
                    v-model="store.settings.showStops.color"
                    no-header
                    no-footer
                    @change="emits('updateScheduler')"
                  />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
      </div>
    </div>
    <div class="settings-border">
      <div class="ml-3">
        <span>{{ t('plan-area.archive.title') }}</span>
        <div class="settings-border ml-5 my-2 flex items-center gap-3">
          <span>{{ t('plan-area.archive.text') }}</span>
          <q-input
            v-model="store.settings.archiveDays"
            type="number"
            mask="##"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.settings-border {
  border: 1px solid rgba(0, 0, 0, 0.125);
  border-radius: 0.25rem;
}
</style>

<i18n lang="json">
{
  "en": {
    "plan-area": {
      "title": "Planning Area - Job Order Views",
      "completed": {
        "title": "Completed Job Orders",
        "text": "Job Order Text",
        "is-batch-fabric-color": "Show job order on Fabric Color",
        "actual-batch-fabric-color": "Event Color",
        "deviation-batch-fabric-color": "Deviation Event Color"
      },
      "ongoing": {
        "title": "Ongoing Job Orders",
        "text": "Job Order Text",
        "is-batch-fabric-color": "Show job order on Fabric Color",
        "actual-batch-fabric-color": "Event Color",
        "deviation-batch-fabric-color": "Deviation Event Color"
      },
      "planned": {
        "title": "Planned Job Orders",
        "text": "Job Order Text",
        "is-batch-fabric-color": "Show job order on Fabric Color",
        "actual-batch-fabric-color": "Event Color",
        "deviation-batch-fabric-color": "Deviation Event Color"
      },
      "stops": {
        "main": "Stops between Job Orders",
        "title": "Show Stops",
        "color": "Stop Color"
      },
      "archive": {
        "title": "History view in planning field",
        "text": "Number of days to display archive work orders (Day)"
      }
    }
  },
  "tr": {
    "plan-area": {
        "title": "Planlama Alanı - İş Emri Görünümleri",
        "completed": {
          "title": "Tamamlanmış İş Emirleri",
          "text": "İş Emri Metni",
          "is-batch-fabric-color": "İş Emirlerini kumaş renginde göster",
          "actual-batch-fabric-color": "İş Emirlerini kumaş renginde göster",
          "deviation-batch-fabric-color": "Gecikme Kumaş Rengi"
        },
        "ongoing": {
          "title": "Devam Eden İş Emirleri",
          "text": "İş Emri Metni",
          "is-batch-fabric-color": "Show job order on Fabric Color",
          "actual-batch-fabric-color": "İş Emirlerini kumaş renginde göster",
          "deviation-batch-fabric-color": "Gecikme Kumaş Rengi"
        },
        "planned": {
          "title": "Planned Job Orders",
          "text": "İş Emri Metni",
          "is-batch-fabric-color": "Show job order on Fabric Color",
          "actual-batch-fabric-color": "İş Emirlerini kumaş renginde göster",
          "deviation-batch-fabric-color": "Gecikme Kumaş Rengi"
        },
        "stops": {
          "main": "İş Emirleri arasındaki duruşlar",
          "title": "Duruşları Göster",
          "color": "Duruş Rengi"
        },
        "archive": {
          "title": "Planlama Alanında Geçmiş Görünümü",
          "text": "Arşiv iş emri gösterme gün sayısı (Gün)"
        }
      }
  }
}
</i18n>
