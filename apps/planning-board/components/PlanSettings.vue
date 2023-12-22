<script setup lang="ts">
import { matDisplaySettings, matEditCalendar, matPendingActions, matPreview } from '@quasar/extras/material-icons'
import { color } from 'd3'
import { LoadingSpinner } from 'ui'

const selectedMachine = ref()
const { data: machines, pending } = await useFetch('/api/machineList')
const { data: erpParameters, refresh: erpParameterRefresh } = await useFetch('api/erpParameters', {
  query: {
    machineId: selectedMachine.value,
  },
})

const splitterModel = ref('view')
const completedBatch = reactive({
  batchText: '',
  isBatchFabricColor: false,
  actualBatchFabricColor: '',
  deviationBatchFabricColor: '',
})
const ongoingBatch = reactive({
  batchText: '',
  isBatchFabricColor: false,
  actualBatchFabricColor: '',
  deviationBatchFabricColor: '',
})
const plannedBatch = reactive({
  batchText: '',
  isBatchFabricColor: false,
  actualBatchFabricColor: '',
  deviationBatchFabricColor: '',
})
const batchText = reactive([
  { id: 1, label: 'İş Emri Numarası', value: 'jobOrder' },
  { id: 2, label: 'Parti Numarası', value: 'planKey' },
  { id: 3, label: 'Müşteri İsmi', value: 'customerName' },
])
const showStops = ref({ show: false, color: '' })
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
const archiveDays = ref(0)
const erpParameterColumns = reactive([
  { name: 'id', label: 'Sıra No', align: 'center', field: 'id' },
  { name: 'paramName', align: 'center', label: 'Parametre İsmi', field: 'paramName' },
  { name: 'erpFieldName', align: 'center', label: 'ERP Eşleştirme Alanı', field: 'erpFieldName' },
])
</script>

<template>
  <div class="bg-white w-90vw h-full overflow-hidden e-border rounded-2xl" @click.stop.prevent>
    <q-tabs v-model="splitterModel" class="text-blue">
      <q-tab
        name="view"
        :icon="matDisplaySettings"
        label="View"
      />
      <q-tab
        name="common"
        :icon="matEditCalendar"
        label="common"
      />
      <q-tab
        name="viewOptions"
        :icon="matPreview"
        label="View Options"
      />
      <q-tab
        name="batchQueue"
        :icon="matPendingActions"
        label="Batch Queue"
      />
    </q-tabs>
    <q-separator />
    <q-tab-panels v-model="splitterModel" animated>
      <q-tab-panel name="view" class="settings-border flex flex-col gap-3">
        <div class="settings-border">
          <div class="ml-3">
            <span>Planlama Alanı - İş Emri Görünümleri</span>
            <div class="ml-5 my-2 settings-border">
              <div class="ml-3">
                <span>Tamamlanmış İş Emirleri</span>
                <div class="ml-7 my-2 settings-border p-2 flex flex-col gap-3">
                  <div class="flex items-center gap-3">
                    <span>İş Emri Metni</span>
                    <QSelect
                      v-model="completedBatch.batchText"
                      square
                      dense
                      outlined
                      :options="batchText"
                      option-value="value"
                      option-label="label"
                      class="w-200px"
                    />
                  </div>
                  <q-separator />
                  <div class="flex items-center gap-3">
                    <q-checkbox v-model="completedBatch.isBatchFabricColor" label="İş Emrini Kumaş Renginde Göster" />
                    <div v-show="!completedBatch.isBatchFabricColor" class="flex-center flex-col gap-3">
                      <div class="flex-center gap-2">
                        <q-input
                          v-model="completedBatch.actualBatchFabricColor"
                          dense
                          readonly
                          borderless
                          class="border-b-1px border-b-solid"
                          placeholder="Gerçek Kumaş Rengi"
                          clearable
                          :style="{ backgroundColor: completedBatch.actualBatchFabricColor }"
                        >
                          <template #append>
                            <q-icon
                              v-if="completedBatch.actualBatchFabricColor !== ''"
                              name="cancel"
                              class="cursor-pointer"
                              :color="iconColor(completedBatch.actualBatchFabricColor)"
                              @click="completedBatch.actualBatchFabricColor = ''"
                            />
                            <q-icon
                              name="colorize"
                              class="cursor-pointer"
                              square
                              :color="iconColor(completedBatch.actualBatchFabricColor)"
                            >
                              <q-popup-proxy cover>
                                <q-color
                                  v-model="completedBatch.actualBatchFabricColor"
                                  no-header
                                  no-footer
                                />
                              </q-popup-proxy>
                            </q-icon>
                          </template>
                        </q-input>
                        <q-input
                          v-model="completedBatch.deviationBatchFabricColor"
                          dense
                          readonly
                          borderless
                          placeholder="Gecikme Rengi"
                          clearable
                          class="border-b-1px border-b-solid"
                          :style="{ backgroundColor: completedBatch.deviationBatchFabricColor }"
                        >
                          <template #append>
                            <q-icon
                              v-if="completedBatch.deviationBatchFabricColor !== ''"
                              name="cancel"
                              class="cursor-pointer"
                              :color="iconColor(completedBatch.deviationBatchFabricColor)"
                              @click="completedBatch.deviationBatchFabricColor = ''"
                            />
                            <q-icon
                              name="colorize"
                              class="cursor-pointer"
                              square
                              :color="iconColor(completedBatch.deviationBatchFabricColor)"
                            >
                              <q-popup-proxy cover>
                                <q-color
                                  v-model="completedBatch.deviationBatchFabricColor"
                                  no-header
                                  no-footer
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
                <span>Devam eden İş Emirleri</span>
                <div class="ml-7 my-2 settings-border p-2 flex flex-col gap-3">
                  <div class="flex items-center gap-3">
                    <span>Çalışan İş Emri Metni</span>
                    <QSelect
                      v-model="ongoingBatch.batchText"
                      square
                      dense
                      outlined
                      :options="batchText"
                      option-value="value"
                      option-label="label"
                      class="w-200px"
                    />
                  </div>
                  <q-separator />
                  <div class="flex items-center gap-3">
                    <q-checkbox v-model="ongoingBatch.isBatchFabricColor" label="İş Emrini Kumaş Renginde Göster" />
                    <div v-show="!ongoingBatch.isBatchFabricColor" class="flex-center flex-col gap-3">
                      <div class="flex-center gap-2">
                        <q-input
                          v-model="ongoingBatch.actualBatchFabricColor"
                          dense
                          readonly
                          borderless
                          class="border-b-1px border-b-solid"
                          placeholder="Gerçek Kumaş Rengi"
                          clearable
                          :style="{ backgroundColor: ongoingBatch.actualBatchFabricColor }"
                        >
                          <template #append>
                            <q-icon
                              v-if="ongoingBatch.actualBatchFabricColor !== ''"
                              name="cancel"
                              class="cursor-pointer"
                              :color="iconColor(ongoingBatch.actualBatchFabricColor)"
                              @click="ongoingBatch.actualBatchFabricColor = ''"
                            />
                            <q-icon
                              name="colorize"
                              class="cursor-pointer"
                              square
                              :color="iconColor(ongoingBatch.actualBatchFabricColor)"
                            >
                              <q-popup-proxy cover>
                                <q-color
                                  v-model="ongoingBatch.actualBatchFabricColor"
                                  no-header
                                  no-footer
                                />
                              </q-popup-proxy>
                            </q-icon>
                          </template>
                        </q-input>
                        <q-input
                          v-model="ongoingBatch.deviationBatchFabricColor"
                          dense
                          readonly
                          borderless
                          placeholder="Gecikme Rengi"
                          clearable
                          class="border-b-1px border-b-solid"
                          :style="{ backgroundColor: ongoingBatch.deviationBatchFabricColor }"
                        >
                          <template #append>
                            <q-icon
                              v-if="ongoingBatch.deviationBatchFabricColor !== ''"
                              name="cancel"
                              class="cursor-pointer"
                              :color="iconColor(ongoingBatch.deviationBatchFabricColor)"
                              @click="ongoingBatch.deviationBatchFabricColor = ''"
                            />
                            <q-icon
                              name="colorize"
                              class="cursor-pointer"
                              square
                              :color="iconColor(ongoingBatch.deviationBatchFabricColor)"
                            >
                              <q-popup-proxy cover>
                                <q-color
                                  v-model="ongoingBatch.deviationBatchFabricColor"
                                  no-header
                                  no-footer
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
                <span>Planlanmış İş Emirleri</span>
                <div class="ml-7 my-2 settings-border p-2 flex flex-col gap-3">
                  <div class="flex items-center gap-3">
                    <span>Planlanmış İş Emri Metni</span>
                    <QSelect
                      v-model="plannedBatch.batchText"
                      square
                      dense
                      outlined
                      :options="batchText"
                      option-value="value"
                      option-label="label"
                      class="w-200px"
                    />
                  </div>
                  <q-separator />
                  <div class="flex items-center gap-3">
                    <q-checkbox v-model="plannedBatch.isBatchFabricColor" label="İş Emrini Kumaş Renginde Göster" />
                    <div v-show="!plannedBatch.isBatchFabricColor" class="flex-center flex-col gap-3">
                      <div class="flex-center gap-2">
                        <q-input
                          v-model="plannedBatch.actualBatchFabricColor"
                          dense
                          readonly
                          borderless
                          class="border-b-1px border-b-solid"
                          placeholder="Gerçek Kumaş Rengi"
                          clearable
                          :style="{ backgroundColor: plannedBatch.actualBatchFabricColor }"
                        >
                          <template #append>
                            <q-icon
                              v-if="plannedBatch.actualBatchFabricColor !== ''"
                              name="cancel"
                              class="cursor-pointer"
                              :color="iconColor(plannedBatch.actualBatchFabricColor)"
                              @click="plannedBatch.actualBatchFabricColor = ''"
                            />
                            <q-icon
                              name="colorize"
                              class="cursor-pointer"
                              square
                              :color="iconColor(plannedBatch.actualBatchFabricColor)"
                            >
                              <q-popup-proxy cover>
                                <q-color
                                  v-model="plannedBatch.actualBatchFabricColor"
                                  no-header
                                  no-footer
                                />
                              </q-popup-proxy>
                            </q-icon>
                          </template>
                        </q-input>
                        <q-input
                          v-model="plannedBatch.deviationBatchFabricColor"
                          dense
                          readonly
                          borderless
                          placeholder="Gecikme Rengi"
                          clearable
                          class="border-b-1px border-b-solid"
                          :style="{ backgroundColor: plannedBatch.deviationBatchFabricColor }"
                        >
                          <template #append>
                            <q-icon
                              v-if="plannedBatch.deviationBatchFabricColor !== ''"
                              name="cancel"
                              class="cursor-pointer"
                              :color="iconColor(plannedBatch.deviationBatchFabricColor)"
                              @click="plannedBatch.deviationBatchFabricColor = ''"
                            />
                            <q-icon
                              name="colorize"
                              class="cursor-pointer"
                              square
                              :color="iconColor(plannedBatch.deviationBatchFabricColor)"
                            >
                              <q-popup-proxy cover>
                                <q-color
                                  v-model="plannedBatch.deviationBatchFabricColor"
                                  no-header
                                  no-footer
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
            <span>İş Emirleri Arası Duruşlar</span>
            <div class="settings-border ml-5 my-2 flex gap-3">
              <QCheckbox v-model="showStops.show" label="Duruşları Göster" />
              <q-input
                v-if="showStops.show"
                v-model="showStops.color"
                dense
                readonly
                borderless
                class="border-b-1px border-b-solid"
                placeholder="Duruş Rengi"
                clearable
                :style="{ backgroundColor: showStops.color }"
              >
                <template #append>
                  <q-icon
                    v-if="showStops.color !== ''"
                    name="cancel"
                    class="cursor-pointer"
                    :color="iconColor(showStops.color)"
                    @click="showStops.color = ''"
                  />
                  <q-icon
                    name="colorize"
                    class="cursor-pointer"
                    square
                    :color="iconColor(showStops.color)"
                  >
                    <q-popup-proxy cover>
                      <q-color
                        v-model="showStops.color"
                        no-header
                        no-footer
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
            <span>Planlama Alanında Geçmiş Görünümü</span>
            <div class="settings-border ml-5 my-2 flex items-center gap-3">
              <span>Arşiv iş emri gösterme gün sayısı (Gün)</span>
              <q-input
                v-model="archiveDays"
                type="number"
                mask="##"
              />
            </div>
          </div>
        </div>
      </q-tab-panel>
      <q-tab-panel name="common">
        Lorem ipsum dolor sit amet.
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
                <q-item-section @click="selectedMachine = item.id">
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
      <q-tab-panel name="batchQueue">
        Lorem ipsum dolor sit amet.
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
