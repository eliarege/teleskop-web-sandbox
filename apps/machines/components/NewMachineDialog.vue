<script setup lang="ts">
const props = defineProps<{
  show: boolean
}>()
const emit = defineEmits(['close'])

const no = ref()
const name = ref()
const group = ref()
const options = [1, 2, 3]
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
                    :options="options"
                    label="Grup"
                    filled
                  />
                  <q-select
                    v-model="group"
                    :options="options"
                    label="Buhar Birimi"
                    filled
                  />
                </div>
                <div class="flex flex-col mr-8 w-xs input-field">
                  <q-select
                    v-model="name"
                    :options="options"
                    label="Model"
                    filled
                  />
                  <q-input
                    v-model="name"
                    label="IP Numarası"
                    filled
                    clearable
                  />
                  <q-input
                    v-model="name"
                    label="Teorik Şarj Sayısı"
                    filled
                    clearable
                  />
                  <q-select
                    v-model="group"
                    :options="options"
                    label="Ana Kazan Sıcaklık Girişi"
                    filled
                  />
                </div>
                <div class="flex flex-col w-xs input-field">
                  <q-input
                    v-model="name"
                    label="Teorik Şarj Süresi (dk)"
                    filled
                    clearable
                  />
                  <q-input
                    v-model="name"
                    label="Makine Kapasitesi (kg)"
                    filled
                    clearable
                  />
                  <q-input
                    v-model="name"
                    label="Düze Sayısı"
                    filled
                    clearable
                  />
                  <q-input
                    v-model="name"
                    label="Kule Sayısı"
                    filled
                    clearable
                  />
                </div>
              </div>

              <div class="flex flex-row flex-1 justify-around">
                <div class="flex flex-col check-box">
                  <q-checkbox v-model="check" label="Kullanımda" />
                  <q-checkbox v-model="check" label="Teorik Su Miktarı Hesaplama Aktif" />
                  <q-checkbox v-model="check" label="Elektrik Sayacı Değerini Artan Olarak Sakla" />
                </div>
                <div class="flex flex-col check-box">
                  <q-checkbox v-model="check" label="İlave Kazan 1" />
                  <q-checkbox v-model="check" label="İlave Kazan 2" />
                  <q-checkbox v-model="check" label="İlave Kazan 3" />
                  <q-checkbox v-model="check" label="İlave Kazan 4" />
                  <q-checkbox v-model="check" label="Rezerve Kazan" />
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
                v-model="name"
                label="Buhar Tüketimi (kg/saat)"
                :disable="check"
                filled
                clearable
                class="mb-8"
              />
              <q-select
                v-model="group"
                label="Buhar Vanası"
                :options="options"
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
