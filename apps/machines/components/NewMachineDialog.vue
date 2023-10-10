<script setup lang="ts">
const props = defineProps<{
  show: boolean
}>()
const emit = defineEmits(['close'])

const no = ref()
const name = ref()
const group = ref()
const model = ref()
const ip = ref()
const theoricalCharge = ref()
const theoricalChargeDuration = ref()
const machineCapacity = ref()
const reelCount = ref()
const nozzleCount = ref()
const steamUnit = ref()
const steamKgPerHour = ref()

const additionalTank1 = ref(false)
const additionalTank2 = ref(false)
const additionalTank3 = ref(false)
const additionalTank4 = ref(false)
const reserveTank = ref(false)
const inUse = ref(false)
const MTTempIo = ref([])

const modelOptions = ref(['TBB6500', 'TBB7000', 'T7000/T710-PLC', 'T712', 'T7500', 'T7700', 'T7701ex', 'T711ex', 'Tonello'])
const { data: machineGroupOptions } = await useFetch('/api/machine/machine-group')

const check = ref(false)
</script>

<template>
  <q-dialog
    :model-value="show"
    full-width
    @hide="$emit('close')"
  >
    <q-card>
      <q-card-section>
        <q-form>
          <div class="flex flex-col">
            <div class="flex flex-row">
              <div class="flex flex-row justify-start">
                <div class="flex flex-col mr-8 w-xs input-field">
                  <q-input
                    v-model="no"
                    label="Makine No"
                    filled
                    clearable
                  />
                  <q-input
                    v-model="name"
                    label="Makine Adı"
                    filled
                    clearable
                  />
                  <q-select
                    v-model="group"
                    :options="machineGroupOptions"
                    label="Grup"
                    filled
                  />
                  <q-select
                    v-model="steamUnit"
                    :options="machineGroupOptions"
                    label="Buhar Birimi"
                    filled
                  />
                </div>
                <div class="flex flex-col mr-8 w-xs input-field">
                  <q-select
                    v-model="model"
                    :options="modelOptions"
                    label="Model"
                    filled
                  />
                  <q-input
                    v-model="ip"
                    label="IP Numarası"
                    filled
                    clearable
                  />
                  <q-input
                    v-model="theoricalCharge"
                    label="Teorik Şarj Sayısı"
                    filled
                    clearable
                  />
                  <q-select
                    v-model="group"
                    :options="machineGroupOptions"
                    label="Ana Kazan Sıcaklık Girişi"
                    filled
                  />
                </div>
                <div class="flex flex-col w-xs input-field">
                  <q-input
                    v-model="theoricalChargeDuration"
                    label="Teorik Şarj Süresi (dk)"
                    filled
                    clearable
                  />
                  <q-input
                    v-model="machineCapacity"
                    label="Makine Kapasitesi (kg)"
                    filled
                    clearable
                  />
                  <q-input
                    v-model="reelCount"
                    label="Düze Sayısı"
                    filled
                    clearable
                  />
                  <q-input
                    v-model="nozzleCount"
                    label="Kule Sayısı"
                    filled
                    clearable
                  />
                </div>
              </div>

              <div class="flex flex-row flex-1 justify-around">
                <div class="flex flex-col check-box">
                  <q-checkbox v-model="inUse" label="Kullanımda" />
                  <q-checkbox v-model="check" label="Teorik Su Miktarı Hesaplama Aktif" />
                  <q-checkbox v-model="check" label="Elektrik Sayacı Değerini Artan Olarak Sakla" />
                </div>
                <div class="flex flex-col check-box">
                  <q-checkbox v-model="additionalTank1" label="İlave Kazan 1" />
                  <q-checkbox v-model="additionalTank2" label="İlave Kazan 2" />
                  <q-checkbox v-model="additionalTank3" label="İlave Kazan 3" />
                  <q-checkbox v-model="additionalTank4" label="İlave Kazan 4" />
                  <q-checkbox v-model="reserveTank" label="Rezerve Kazan" />
                </div>
              </div>
            </div>

            <div class="mt-2">
              <div class="flex flex-col">
                <h3>
                  Teorik Buhar Hesabı
                </h3>
                <q-checkbox
                  v-model="check"
                  label="Teorik Buhar Hesabı Aktif"
                  class="mb-4"
                />
              </div>
              <q-input
                v-model="steamKgPerHour"
                label="Buhar Tüketimi (kg/saat)"
                :disable="check"
                filled
                clearable
                class="mb-8"
              />
              <q-select
                v-model="group"
                label="Buhar Vanası"
                :options="machineGroupOptions"
                :disable="check"
                filled
              />
            </div>
          </div>

          <div class="flex flex-row justify-between mt-8">
            <q-btn-group push class="flex flex-row ">
              <q-btn
                label="Ağ Erişim Testi"
                no-caps
              />
              <q-btn
                label="Teleskop Erişim Testi"
                no-caps
              />
              <q-btn label="Mimic" no-caps />
            </q-btn-group>

            <div>
              <q-btn
                label="Kaydet"
                type="submit"
                color="primary"
                no-caps
                @click="$emit('close')"
              />
              <q-btn
                label="Sıfırla"
                type="reset"
                class="q-ml-sm"
                no-caps
                @click="$emit('close')"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.input-field > * {
  margin-bottom: 2em;
}

.check-box > * {
  margin-bottom: 1em;
}
</style>
