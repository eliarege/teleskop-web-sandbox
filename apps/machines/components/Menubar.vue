<script setup lang="ts">
</script>

<template>
  <q-card class="flex flex-row justify-between" bordered>
    <q-card-section class="flex items-center">
      <q-btn
        label="Yeni"
        no-caps
        icon="note_add"
        color="primary"
        class="mr-4 ml-2"
      />
      <q-btn
        label="Proje Yükle"
        no-caps
        icon="system_update_alt"
        color="primary"
        class="mr-4"
      />
      <q-btn
        label="Özellikler"
        no-caps
        icon="tune"
        color="primary"
        class="mr-4"
      />
      <q-btn
        label="Sil"
        no-caps
        icon="delete"
        color="primary"
        class="mr-4"
      />
      <q-btn
        label="Versiyon Bilgisi Al"
        no-caps
        color="primary"
        class="mr-4"
      />
    </q-card-section>

    <q-card-section class="flex flex-row items-end mr-8">
      <q-chip class="mr-4 mb-2">
        DB v3.3.95.0
      </q-chip>
      <q-card class="flex flex row mb-2 items-center">
        <q-card-section>
          Hoşgeldiniz Barış
        </q-card-section>
        <q-card-section>
          <q-btn no-caps>
            Çıkış Yap
          </q-btn>
        </q-card-section>
      </q-card>
    </q-card-section>
  </q-card>
</template>

<style scoped>
</style>
