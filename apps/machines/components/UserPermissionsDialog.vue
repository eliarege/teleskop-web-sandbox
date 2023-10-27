<script setup lang="ts">
const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])
</script>

<template>
  <q-dialog
    :model-value="show"
    full-width
    @hide="$emit('close')"
  >
    <q-card>
      <q-card-section class="flex flex-row">
        <div class="flex flex-col">
          <q-checkbox label="Program Oluşturma" />
          <q-checkbox label="Program Değiştirme" />
          <q-checkbox label="Program Kopyalama" />
          <q-checkbox label="Program Silme" />
          <q-checkbox label="Manuel Komut Çalıştırma" />
          <q-checkbox label="Sistem Menülerine Erişim" />
          <q-checkbox label="Çalışırken Program Değiştirme" />
          <q-checkbox label="Test Yetkisi" />
          <q-checkbox label="İşletme Parametrelerine Erişim" />
          <q-checkbox label="I/O Ayarlama Yetkisi" />
          <q-checkbox label="I/O Güncelleme ve Dil" />
          <q-checkbox label="Cihaz Ayar Yetkisi" />
          <q-checkbox label="Kullanıcı Ayar Yetkisi" />
          <q-checkbox label="Kilitlemeler" />
        </div>
        <div class="flex flex-col">
          <q-checkbox label="Kalibrasyon" />
          <q-checkbox label="Komutlar" />
          <q-checkbox label="İş Emri Başlatma" />
          <q-checkbox label="Teçhizat Bakım" />
          <q-checkbox label="GLG Sayfası Erişim Hakkını Kısıtla" />
          <q-checkbox label="Pompa Kule Düze Plater Ayarları" />
          <q-checkbox label="İş Emri Parametresi Tanımlama" />
          <q-checkbox label="Makine ve Zamanlayıcı Sabiti Tanımlama" />
          <q-checkbox label="Başlatma Parametresi Değiştirme" />
          <q-checkbox label="Uyarı Komutları onaylama yetkisi" />
          <q-checkbox label="Adım Atlatma Yetkisi" />
          <q-checkbox label="Makine Değiştirme Yetkisi" />
          <q-checkbox label="Operatör Müdahalesi Serbest Programlar İçin Yetki" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>

</style>
