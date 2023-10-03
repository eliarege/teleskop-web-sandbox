<script setup lang="ts">

</script>

<template>
  <div class="flex flex-row justify-between">
    <div class="flex flex-row items-center">
      <q-btn label="yeni" color="primary" class="mr-4 ml-2" />
      <q-btn label="proje yükle" color="primary" class="mr-4" />
      <q-btn label="özellikler" color="primary" class="mr-4" />
      <q-btn label="sil" color="primary" class="mr-4" />
      <q-btn label="versiyon bilgisi al" color="primary" class="mr-4" />
    </div>
    <div class="flex flex-row items-end mr-8">
      <q-chip class="mr-4 mb-2">
        DB v3.3.95.0
      </q-chip>
      <q-card class="flex flex row mb-2 h-25 items-center">
        <q-card-section>
          Hoşgeldiniz Barış
        </q-card-section>
        <q-card-section>
          <q-btn>
            çıkış yap
          </q-btn>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<style scoped>
</style>
