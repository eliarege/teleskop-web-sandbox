<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])

const permissionsGroup1 = ref([
  { label: 'Program Oluşturma', index: 1, value: false },
  { label: 'Program Değiştirme', index: 2, value: false },
  { label: 'Program Kopyalama', index: 3, value: false },
  { label: 'Program Silme', index: 4, value: false },
  { label: 'Manuel Komut Çalıştırma', index: 5, value: false },
  { label: 'Sistem Menülerine Erişim', index: 6, value: false },
  { label: 'Çalışırken Program Değiştirme', index: 7, value: false },
  { label: 'Test Yetkisi', index: 8, value: false },
  { label: 'İşletme Parametrelerine Erişim', index: 9, value: false },
  { label: 'I/O Ayarlama Yetkisi', index: 10, value: false },
  { label: 'I/O Güncelleme ve Dil', index: 11, value: false },
  { label: 'Cihaz Ayar Yetkisi', index: 12, value: false },
  { label: 'Kullanıcı Ayar Yetkisi', index: 13, value: false },
  { label: 'Kilitlemeler', index: 14, value: false },
  { label: 'Kalibrasyon', index: 15, value: false },
  { label: 'Komutlar', index: 16, value: false },
  { label: 'İş Emri Başlatma', index: 17, value: false },
  { label: 'Teçhizat Bakım', index: 18, value: false },
  { label: 'GLG Sayfası Erişim Hakkını Kısıtla', index: 19, value: false },
  { label: 'Pompa Kule Düze Plater Ayarları', index: 21, value: false },
  { label: 'İş Emri Parametresi Tanımlama', index: 25, value: false },
  { label: 'Makine ve Zamanlayıcı Sabiti Tanımlama', index: 26, value: false },
  { label: 'Başlatma Parametresi Değiştirme', index: 29, value: false },
])

const permissionsGroup2 = [
  { label: 'Uyarı Komutları onaylama yetkisi', index: 1, value: false },
  { label: 'Adım Atlatma Yetkisi', index: 2, value: false },
  { label: 'Makine Değiştirme Yetkisi', index: 3, value: false },
  { label: 'Operatör Müdahalesi Serbest Programlar İçin Yetki', index: 4, value: false },
]

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
              <q-checkbox
                v-model="permission.value"
                :label="permission.label"
                :disable="!permissionsGroup1.find(d => d.label === 'Sistem Menülerine Erişim').value
                  && (permission.label === 'İşletme Parametrelerine Erişim'
                    || permission.label === 'I/O Ayarlama Yetkisi'
                    || permission.label === 'Kilitlemeler'
                    || permission.label === 'Kalibrasyon'
                    || permission.label === 'Komutlar')
                  || !permissionsGroup1.find(d => d.label === 'Cihaz Ayar Yetkisi').value
                  && (permission.label === 'Kullanıcı Ayar Yetkisi'
                    || permission.label === 'Teçhizat Bakım')
                "
              />
            </div>
          </div>
          <div class="flex flex-col">
            <!-- Group 2 -->
            <div v-for="(permission, key) in permissionsGroup2" :key="key">
              <q-checkbox v-model="permission.value" :label="permission.label" />
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
</style>
