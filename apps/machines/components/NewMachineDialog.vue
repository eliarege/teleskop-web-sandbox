<script setup lang="ts">
import type { Machine } from '~/types'

const props = defineProps<{
  show: boolean
}>()
const emit = defineEmits(['close', 'add-machine'])

const modelOptions = ['TBB6500', 'TBB7000', 'T7000/T710-PLC', 'T712', 'T7500', 'T7700', 'T7701ex', 'T711ex', 'Tonello']
const { data: machineGroups } = await useFetch('/api/machine/machine-group')

const check = (false)

const machine: Machine = ref({})

async function handleFormSubmit() {
  // add machine
  await $fetch('/api/machine/machine-add', { method: 'POST', body: machine.value })
  emit('close')
  emit('add-machine')
}
</script>

<template>
  <q-dialog
    :model-value="show"
    full-width
    @hide="$emit('close')"
  >
    <q-card>
      <q-card-section>
        <q-form @submit.prevent>
          <div class="flex flex-col">
            <div class="flex flex-row">
              <div class="flex flex-row justify-start">
                <div class="flex flex-col mr-8 w-xs input-field">
                  <q-input
                    v-model="machine.no"
                    label="Makine No"
                    filled
                    clearable
                  />
                  <q-input
                    v-model="machine.name"
                    label="Makine Adı"
                    filled
                    clearable
                  />
                  <q-select
                    v-model="machine.group"
                    :options="machineGroups"
                    :option-label="(m) => m.GROUPNAME"
                    :option-value="(m) => m.GROUPID"
                    label="Grup"
                    filled
                  />
                  <q-select
                    v-model="machine.steamUnit"
                    :options="machineGroups"
                    label="Buhar Birimi"
                    filled
                  />
                </div>
                <div class="flex flex-col mr-8 w-xs input-field">
                  <q-select
                    v-model="machine.model"
                    :options="modelOptions"
                    label="Model"
                    filled
                  />
                  <q-input
                    v-model="machine.ip"
                    label="IP Numarası"
                    filled
                    clearable
                  />
                  <q-input
                    v-model="machine.theoricalCharge"
                    label="Teorik Şarj Sayısı"
                    filled
                    clearable
                  />
                  <q-select
                    v-model="machine.group"
                    :options="machineGroups"
                    label="Ana Kazan Sıcaklık Girişi"
                    filled
                  />
                </div>
                <div class="flex flex-col w-xs input-field">
                  <q-input
                    v-model="machine.theoricalChargeDuration"
                    label="Teorik Şarj Süresi (dk)"
                    filled
                    clearable
                  />
                  <q-input
                    v-model="machine.machineCapacity"
                    label="Makine Kapasitesi (kg)"
                    filled
                    clearable
                  />
                  <q-input
                    v-model="machine.reelCount"
                    label="Düze Sayısı"
                    filled
                    clearable
                  />
                  <q-input
                    v-model="machine.nozzleCount"
                    label="Kule Sayısı"
                    filled
                    clearable
                  />
                </div>
              </div>

              <div class="flex flex-row flex-1 justify-around">
                <div class="flex flex-col check-box">
                  <q-checkbox v-model="machine.inUse" label="Kullanımda" />
                  <q-checkbox v-model="check" label="Teorik Su Miktarı Hesaplama Aktif" />
                  <q-checkbox v-model="check" label="Elektrik Sayacı Değerini Artan Olarak Sakla" />
                </div>
                <div class="flex flex-col check-box">
                  <q-checkbox v-model="machine.additionalTank1" label="İlave Kazan 1" />
                  <q-checkbox v-model="machine.additionalTank2" label="İlave Kazan 2" />
                  <q-checkbox v-model="machine.additionalTank3" label="İlave Kazan 3" />
                  <q-checkbox v-model="machine.additionalTank4" label="İlave Kazan 4" />
                  <q-checkbox v-model="machine.reserveTank" label="Rezerve Kazan" />
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
                v-model="machine.steamKgPerHour"
                label="Buhar Tüketimi (kg/saat)"
                :disable="check"
                filled
                clearable
                class="mb-8"
              />
              <q-select
                v-model="machine.group"
                label="Buhar Vanası"
                :options="machineGroups"
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
                @click="handleFormSubmit()"
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
