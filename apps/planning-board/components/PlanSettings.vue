<script setup lang="ts">
import { matDisplaySettings, matPreview } from '@quasar/extras/material-icons'
import { useStorage } from '@vueuse/core'
import { color } from 'd3'
import { LoadingSpinner } from 'ui'
import { useI18n } from 'vue-i18n'

const emits = defineEmits(['updateScheduler'])
const { t } = useI18n()
const { data: machines, pending } = await useFetch('/api/machineList')
const splitterModel = ref('view')
const erpParameters = ref([] as any[])
async function getErpParameters(machineId: number) {
  const res = await $fetch('/api/erpParameters', {
    query: { machineId },
  })
  erpParameters.value = res
}

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
const erpParameterColumns = reactive([
  { name: 'id', label: t('erp-param-columns.id'), align: 'center', field: 'id' },
  { name: 'paramName', align: 'center', label: t('erp-param-columns.param-name'), field: 'paramName' },
  { name: 'erpFieldName', align: 'center', label: t('erp-param-columns.field-name'), field: 'erpFieldName' },
])
const settings = useStorage('pt-settings', {
  completedBatch: {
    batchText: '',
    isBatchFabricColor: false,
    actualBatchFabricColor: '',
    deviationBatchFabricColor: '',
  },
  ongoingBatch: {
    batchText: '',
    isBatchFabricColor: false,
    actualBatchFabricColor: '',
    deviationBatchFabricColor: '',
  },
  plannedBatch: {
    batchText: '',
    isBatchFabricColor: false,
    actualBatchFabricColor: '',
    deviationBatchFabricColor: '',
  },
  batchText: [
    { id: 1, label: t('batch-text.job-order'), value: 'jobOrder' },
    { id: 2, label: t('batch-text.party'), value: 'planKey' },
    { id: 3, label: t('batch-text.customer'), value: 'customerName' },
  ],
  archiveDays: 0,
  showStops: { show: false, color: '' },
})
</script>

<template>
  <div class="bg-white w-90vw h-full overflow-hidden e-border rounded-2xl" @click.stop.prevent>
    <q-tabs v-model="splitterModel" class="text-blue">
      <q-tab
        name="view"
        :icon="matDisplaySettings"
        :label="t('settings.main.view')"
      />
      <q-tab
        name="viewOptions"
        :icon="matPreview"
        :label="t('settings.main.options')"
      />
    </q-tabs>
    <q-separator />
    <q-tab-panels v-model="splitterModel" animated>
      <q-tab-panel name="view" class="settings-border flex flex-col gap-3">
        <div class="settings-border">
          <div class="ml-3">
            <span>{{ t('settings.plan-area.title') }}</span>
            <div class="ml-5 my-2 settings-border">
              <div class="ml-3">
                <span>{{ t('settings.plan-area.completed.title') }}</span>
                <div class="ml-7 my-2 settings-border p-2 flex flex-col gap-3">
                  <div class="flex items-center gap-3">
                    <span>{{ t('settings.plan-area.completed.text') }}</span>
                    <QSelect
                      v-model="settings.completedBatch.batchText"
                      square
                      dense
                      outlined
                      :options="settings.batchText"
                      option-value="value"
                      option-label="label"
                      class="w-200px"
                    />
                  </div>
                  <q-separator />
                  <div class="flex items-center gap-3">
                    <q-checkbox v-model="settings.completedBatch.isBatchFabricColor" :label="t('settings.plan-area.completed.is-batch-fabric-color')" />
                    <div v-show="!settings.completedBatch.isBatchFabricColor" class="flex-center flex-col gap-3">
                      <div class="flex-center gap-2">
                        <q-input
                          v-model="settings.completedBatch.actualBatchFabricColor"
                          dense
                          readonly
                          borderless
                          class="border-b-1px border-b-solid"
                          :placeholder="t('settings.plan-area.completed.actual-batch-fabric-color')"
                          clearable
                          :style="{ backgroundColor: settings.completedBatch.actualBatchFabricColor }"
                        >
                          <template #append>
                            <q-icon
                              v-if="settings.completedBatch.actualBatchFabricColor !== ''"
                              name="cancel"
                              class="cursor-pointer"
                              :color="iconColor(settings.completedBatch.actualBatchFabricColor)"
                              @click="settings.completedBatch.actualBatchFabricColor = ''"
                            />
                            <q-icon
                              name="colorize"
                              class="cursor-pointer"
                              square
                              :color="iconColor(settings.completedBatch.actualBatchFabricColor)"
                            >
                              <q-popup-proxy cover>
                                <q-color
                                  v-model="settings.completedBatch.actualBatchFabricColor"
                                  no-header
                                  no-footer
                                  @change="emits('updateScheduler')"
                                />
                              </q-popup-proxy>
                            </q-icon>
                          </template>
                        </q-input>
                        <q-input
                          v-model="settings.completedBatch.deviationBatchFabricColor"
                          dense
                          readonly
                          borderless
                          :placeholder="t('settings.plan-area.completed.deviation-batch-fabric-color')"
                          clearable
                          class="border-b-1px border-b-solid"
                          :style="{ backgroundColor: settings.completedBatch.deviationBatchFabricColor }"
                        >
                          <template #append>
                            <q-icon
                              v-if="settings.completedBatch.deviationBatchFabricColor !== ''"
                              name="cancel"
                              class="cursor-pointer"
                              :color="iconColor(settings.completedBatch.deviationBatchFabricColor)"
                              @click="settings.completedBatch.deviationBatchFabricColor = ''"
                            />
                            <q-icon
                              name="colorize"
                              class="cursor-pointer"
                              square
                              :color="iconColor(settings.completedBatch.deviationBatchFabricColor)"
                            >
                              <q-popup-proxy cover>
                                <q-color
                                  v-model="settings.completedBatch.deviationBatchFabricColor"
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
                <span>{{ t('settings.plan-area.ongoing.title') }}</span>
                <div class="ml-7 my-2 settings-border p-2 flex flex-col gap-3">
                  <div class="flex items-center gap-3">
                    <span>{{ t('settings.plan-area.ongoing.text') }}</span>
                    <QSelect
                      v-model="settings.ongoingBatch.batchText"
                      square
                      dense
                      outlined
                      :options="settings.batchText"
                      option-value="value"
                      option-label="label"
                      class="w-200px"
                    />
                  </div>
                  <q-separator />
                  <div class="flex items-center gap-3">
                    <q-checkbox
                      v-model="settings.ongoingBatch.isBatchFabricColor"
                      :label="t('settings.plan-area.ongoing.is-batch-fabric-color')"
                    />
                    <div v-show="!settings.ongoingBatch.isBatchFabricColor" class="flex-center flex-col gap-3">
                      <div class="flex-center gap-2">
                        <q-input
                          v-model="settings.ongoingBatch.actualBatchFabricColor"
                          dense
                          readonly
                          borderless
                          class="border-b-1px border-b-solid"
                          :placeholder="t('settings.plan-area.ongoing.actual-batch-fabric-color')"
                          clearable
                          :style="{ backgroundColor: settings.ongoingBatch.actualBatchFabricColor }"
                        >
                          <template #append>
                            <q-icon
                              v-if="settings.ongoingBatch.actualBatchFabricColor !== ''"
                              name="cancel"
                              class="cursor-pointer"
                              :color="iconColor(settings.ongoingBatch.actualBatchFabricColor)"
                              @click="settings.ongoingBatch.actualBatchFabricColor = ''"
                            />
                            <q-icon
                              name="colorize"
                              class="cursor-pointer"
                              square
                              :color="iconColor(settings.ongoingBatch.actualBatchFabricColor)"
                            >
                              <q-popup-proxy cover>
                                <q-color
                                  v-model="settings.ongoingBatch.actualBatchFabricColor"
                                  no-header
                                  no-footer
                                  @change="emits('updateScheduler')"
                                />
                              </q-popup-proxy>
                            </q-icon>
                          </template>
                        </q-input>
                        <q-input
                          v-model="settings.ongoingBatch.deviationBatchFabricColor"
                          dense
                          readonly
                          borderless
                          :placeholder="t('settings.plan-area.ongoing.deviation-batch-fabric-color')"
                          clearable
                          class="border-b-1px border-b-solid"
                          :style="{ backgroundColor: settings.ongoingBatch.deviationBatchFabricColor }"
                        >
                          <template #append>
                            <q-icon
                              v-if="settings.ongoingBatch.deviationBatchFabricColor !== ''"
                              name="cancel"
                              class="cursor-pointer"
                              :color="iconColor(settings.ongoingBatch.deviationBatchFabricColor)"
                              @click="settings.ongoingBatch.deviationBatchFabricColor = ''"
                            />
                            <q-icon
                              name="colorize"
                              class="cursor-pointer"
                              square
                              :color="iconColor(settings.ongoingBatch.deviationBatchFabricColor)"
                            >
                              <q-popup-proxy cover>
                                <q-color
                                  v-model="settings.ongoingBatch.deviationBatchFabricColor"
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
                <span>{{ t('settings.plan-area.planned.title') }}</span>
                <div class="ml-7 my-2 settings-border p-2 flex flex-col gap-3">
                  <div class="flex items-center gap-3">
                    <span>{{ t('settings.plan-area.planned.text') }}</span>
                    <QSelect
                      v-model="settings.plannedBatch.batchText"
                      square
                      dense
                      outlined
                      :options="settings.batchText"
                      option-value="value"
                      option-label="label"
                      class="w-200px"
                    />
                  </div>
                  <q-separator />
                  <div class="flex items-center gap-3">
                    <q-checkbox v-model="settings.plannedBatch.isBatchFabricColor" :label="t('settings.plan-area.planned.is-batch-fabric-color')" />
                    <div v-show="!settings.plannedBatch.isBatchFabricColor" class="flex-center flex-col gap-3">
                      <div class="flex-center gap-2">
                        <q-input
                          v-model="settings.plannedBatch.actualBatchFabricColor"
                          dense
                          readonly
                          borderless
                          class="border-b-1px border-b-solid"
                          :placeholder="t('settings.plan-area.planned.actual-batch-fabric-color')"
                          clearable
                          :style="{ backgroundColor: settings.plannedBatch.actualBatchFabricColor }"
                        >
                          <template #append>
                            <q-icon
                              v-if="settings.plannedBatch.actualBatchFabricColor !== ''"
                              name="cancel"
                              class="cursor-pointer"
                              :color="iconColor(settings.plannedBatch.actualBatchFabricColor)"
                              @click="settings.plannedBatch.actualBatchFabricColor = ''"
                            />
                            <q-icon
                              name="colorize"
                              class="cursor-pointer"
                              square
                              :color="iconColor(settings.plannedBatch.actualBatchFabricColor)"
                            >
                              <q-popup-proxy cover>
                                <q-color
                                  v-model="settings.plannedBatch.actualBatchFabricColor"
                                  no-header
                                  no-footer
                                  @change="emits('updateScheduler')"
                                />
                              </q-popup-proxy>
                            </q-icon>
                          </template>
                        </q-input>
                        <q-input
                          v-model="settings.plannedBatch.deviationBatchFabricColor"
                          dense
                          readonly
                          borderless
                          :placeholder="t('settings.plan-area.planned.actual-batch-fabric-color')"
                          clearable
                          class="border-b-1px border-b-solid"
                          :style="{ backgroundColor: settings.plannedBatch.deviationBatchFabricColor }"
                        >
                          <template #append>
                            <q-icon
                              v-if="settings.plannedBatch.deviationBatchFabricColor !== ''"
                              name="cancel"
                              class="cursor-pointer"
                              :color="iconColor(settings.plannedBatch.deviationBatchFabricColor)"
                              @click="settings.plannedBatch.deviationBatchFabricColor = ''"
                            />
                            <q-icon
                              name="colorize"
                              class="cursor-pointer"
                              square
                              :color="iconColor(settings.plannedBatch.deviationBatchFabricColor)"
                            >
                              <q-popup-proxy cover>
                                <q-color
                                  v-model="settings.plannedBatch.deviationBatchFabricColor"
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
            <span>{{ t('settings.plan-area.stops.main') }}</span>
            <div class="settings-border ml-5 my-2 flex gap-3">
              <QCheckbox v-model="settings.showStops.show" :label="t('settings.plan-area.stops.title')" />
              <q-input
                v-if="settings.showStops.show"
                v-model="settings.showStops.color"
                dense
                readonly
                borderless
                class="border-b-1px border-b-solid"
                :placeholder="t('settings.plan-area.stops.color')"
                clearable
                :style="{ backgroundColor: settings.showStops.color }"
              >
                <template #append>
                  <q-icon
                    v-if="settings.showStops.color !== ''"
                    name="cancel"
                    class="cursor-pointer"
                    :color="iconColor(settings.showStops.color)"
                    @click="settings.showStops.color = ''"
                  />
                  <q-icon
                    name="colorize"
                    class="cursor-pointer"
                    square
                    :color="iconColor(settings.showStops.color)"
                  >
                    <q-popup-proxy cover>
                      <q-color
                        v-model="settings.showStops.color"
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
            <span>{{ t('settings.plan-area.archive.title') }}</span>
            <div class="settings-border ml-5 my-2 flex items-center gap-3">
              <span>{{ t('settings.plan-area.archive.text') }}</span>
              <q-input
                v-model="settings.archiveDays"
                type="number"
                mask="##"
              />
            </div>
          </div>
        </div>
      </q-tab-panel>
      <q-tab-panel name="viewOptions">
        <div class="view-options">
          <div class="machine-list relative">
            <LoadingSpinner v-if="pending" />
            <q-list v-else dense>
              <q-item
                v-for="(item, idx) in machines"
                :key="idx"
                v-ripple
                clickable
              >
                <q-item-section @click="getErpParameters(item.id)">
                  {{ item.name }}
                </q-item-section>
              </q-item>
            </q-list>
          </div>
          <div class="erp-parameters">
            <QTable
              dense
              :rows="erpParameters"
              :columns="erpParameterColumns"
              :rows-per-page-options="[0]"
            />
          </div>
          <div class="planned-batch">
            planned-batch
          </div>
          <div class="unplanned-batch">
            unplanned-batch
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<style scoped lang="postcss">
.settings-border {
  border: 1px solid rgba(0, 0, 0, 0.125);
  border-radius: 0.25rem;
}

.view-options {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  @apply grid gap-2;

  .machine-list {
    grid-area: 1 / 1 / 3 / 2;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.25rem;
    @apply max-h-80vh overflow-auto;
  }

  .erp-parameters {
    grid-area: 1 / 2 / 3 / 3;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.25rem;
    @apply max-h-80vh overflow-auto;
  }

  .planned-batch {
    grid-area: 1 / 3 / 2 / 4;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.25rem;
    @apply max-h-80vh overflow-auto;
  }

  .unplanned-batch {
    grid-area: 2 / 3 / 3 / 4;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.25rem;
    @apply max-h-80vh overflow-auto;
  }
}
</style>

<i18n>
  {
  "en": {
    "erp-param-columns": {
      "id": "Queue Number",
      "param-name": "Parameter Name",
      "field-name": "ERP Matching Area"
    },
    "batch-text": {
      "job-order": "Job Order Number",
      "party": "Party Number",
      "customer": "Customer Name"
    },
    "settings": {
      "main": {
        "view": "View",
        "options": "View Options"
      },
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
    }
  },
  "tr": {
    "erp-param-columns": {
      "id": "Sıra Numarası",
      "param-name": "Parametre İsmi",
      "field-name": "ERP Eşleştirme Alanı"
    },
    "batch-text": {
      "job-order": "İş Emri Numarası",
      "party": "Parti Numarası",
      "customer": "Müşteri İsmi"
    },
    "settings": {
      "main": {
        "view": "Görünüm",
        "options": "Görünüm Seçenekleri"
      },
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
}
</i18n>
