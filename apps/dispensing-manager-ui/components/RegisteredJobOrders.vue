<script setup lang="ts">
const props = defineProps({
  rows: Array,
  columns: Array,
})

const rows = ref(props.rows)
const columns = ref(props.columns)

const a = ref()
const b = ref()
const date = ref({ from: '2020/07/08', to: '2020/07/17' })
</script>

<template>
  <div class="flex flex-col gap-5 e-border">
    <div class="ml-5">
      <div class="flex flex-row items-center gap-5">
        İş Emir Numarası:
        <q-input v-model="a" clearable />
        <q-btn label="Sorgula" />
        <q-btn label="Tüm İş Emirlerini Göster" />
      </div>
      <div class="flex flex-row gap-5 mt-5 items-center">
        Makine:
        <q-select
          v-model="b"
          class="w-50"
          label="Tüm Makineler"
          filled
          :options="b"
        />
        <div class="gap-0 flex flex-row items-center justify-center">
          <q-input
            v-model="date.from"
            filled
            mask="date"
            label="Başlangıç Tarihi"
            stack-label
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-date
                    v-model="date"
                    range
                    minimal
                  >
                    <div class="row items-center justify-end">
                      <q-btn
                        v-close-popup
                        label="Close"
                        color="primary"
                        flat
                      />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-input
            v-model="date.to"
            filled
            mask="date"
            label="Bitiş Tarihi"
            stack-label
          />
        </div>
        (If no date specified date filter text message display!!!)
      </div>
    </div>
    <span class="header-class">
      Tüm İş Emirleri
    </span>
    <q-table
      flat
      bordered
      :rows="rows"
      :columns="columns"
      row-key="recIndex"
    />
    <!-- <div class="footer-buttons gap-5">
      <span class="absolute flex left-15">
        İş emri reçetesi görmek için rowa tıkla message show
      </span>
      <q-btn
        class="e-border absolute flex right-15"
        outline color="primary"
        label="close"
        icon="close"
      />

    </div> -->
  </div>
</template>

<style scoped>
.header-class {
  background-color: gray;
  color: white;
  font-size: large;
  width: 100%;
  padding-left: 1%;
}

.footer-buttons {
  background-color: rgb(236, 236, 236);
  height: 10vh;
  width: 100vw;
  position: absolute;
  bottom: 0px;
  right: 0px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
