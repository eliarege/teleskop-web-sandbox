<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])

const permissionsGroup1 = [
  'Program Oluşturma',
  'Program Değiştirme',
  'Program Kopyalama',
  'Program Silme',
  'Manuel Komut Çalıştırma',
  'Sistem Menülerine Erişim',
  'Çalışırken Program Değiştirme',
  'Test Yetkisi',
  'İşletme Parametrelerine Erişim',
  'I/O Ayarlama Yetkisi',
  'I/O Güncelleme ve Dil',
  'Cihaz Ayar Yetkisi',
  'Kullanıcı Ayar Yetkisi',
  'Kilitlemeler',
]

const permissionsGroup2 = [
  'Kalibrasyon',
  'Komutlar',
  'İş Emri Başlatma',
  'Teçhizat Bakım',
  'GLG Sayfası Erişim Hakkını Kısıtla',
  'Pompa Kule Düze Plater Ayarları',
  'İş Emri Parametresi Tanımlama',
  'Makine ve Zamanlayıcı Sabiti Tanımlama',
  'Başlatma Parametresi Değiştirme',
  'Uyarı Komutları onaylama yetkisi',
  'Adım Atlatma Yetkisi',
  'Makine Değiştirme Yetkisi',
  'Operatör Müdahalesi Serbest Programlar İçin Yetki',
]

const selectedPermissions = ref(Array(permissionsGroup1.length + permissionsGroup2.length).fill(false))

function savePermissions() {
  const selectedPermissionsArray = selectedPermissions.value

  let combinedPermissionValue = 0
  for (let i = 0; i < selectedPermissionsArray.length; i++) {
    if (selectedPermissionsArray[i]) {
      combinedPermissionValue |= 1 << i
    }
  }

  const hexadecimalValue = combinedPermissionValue.toString(16)

  console.log(hexadecimalValue)
}
</script>

<template>
  <div>
    <q-dialog
      :model-value="show"
      full-width
      @hide="$emit('close')"
    >
      <q-card>
        <q-card-section class="flex flex-row">
          <div class="flex flex-col">
            <!-- Group 1 -->
            <div v-for="(permission, key) in permissionsGroup1" :key="key">
              <q-checkbox v-model="selectedPermissions[key]" :label="permission" />
            </div>
          </div>
          <div class="flex flex-col">
            <!-- Group 2 -->
            <div v-for="(permission, key) in permissionsGroup2" :key="key">
              <q-checkbox v-model="selectedPermissions[key + permissionsGroup1.length]" :label="permission" />
            </div>
          </div>
        </q-card-section>
        <q-btn
          label="Kaydet"
          no-caps
          filled
          @click="savePermissions"
        />
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped>
/* Add your CSS styles here if needed */
</style>
