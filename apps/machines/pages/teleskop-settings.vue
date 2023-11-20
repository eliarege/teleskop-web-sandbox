<script setup lang="ts">
const checked = ref(false)
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="flex flex-col">
        <q-checkbox v-model="checked" label="Kullanıcı Kontrol Aktif" />
        <h3>
          Boyahane / Yıkamahane Numarası
        </h3>
      </div>

      <div>
        <q-btn label="Kaydet" />
        <q-btn label="İptal" />
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>

</style>
