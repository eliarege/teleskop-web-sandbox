<script setup lang="ts">
import { ref } from 'vue'
import type { User } from '~/types'
import { updateUserPermissions } from '~/utils'

const props = defineProps<{
  show: boolean
  selected: User
}>()

const emit = defineEmits(['close'])

const permissionsGroup1 = ref([
  { label: 'Program Oluşturma', index: 0, value: false },
  { label: 'Program Değiştirme', index: 1, value: false },
  { label: 'Program Kopyalama', index: 2, value: false },
  { label: 'Program Silme', index: 3, value: false },
  { label: 'Manuel Komut Çalıştırma', index: 4, value: false },
  { label: 'Sistem Menülerine Erişim', index: 5, value: false },
  { label: 'Çalışırken Program Değiştirme', index: 6, value: false },
  { label: 'Test Yetkisi', index: 7, value: false },
  { label: 'İşletme Parametrelerine Erişim', index: 8, value: false },
  { label: 'I/O Ayarlama Yetkisi', index: 9, value: false },
  { label: 'I/O Güncelleme ve Dil', index: 10, value: false },
  { label: 'Cihaz Ayar Yetkisi', index: 11, value: false },
  { label: 'Kullanıcı Ayar Yetkisi', index: 12, value: false },
  { label: 'Kilitlemeler', index: 13, value: false },
  { label: 'Kalibrasyon', index: 14, value: false },
  { label: 'Komutlar', index: 15, value: false },
  { label: 'İş Emri Başlatma', index: 16, value: false },
  { label: 'Teçhizat Bakım', index: 17, value: false },
  { label: 'GLG Sayfası Erişim Hakkını Kısıtla', index: 18, value: false },
  { label: 'Pompa Kule Düze Plater Ayarları', index: 20, value: false },
  { label: 'İş Emri Parametresi Tanımlama', index: 24, value: false },
  { label: 'Makine ve Zamanlayıcı Sabiti Tanımlama', index: 25, value: false },
  { label: 'Başlatma Parametresi Değiştirme', index: 28, value: false },
])

const permissionsGroup2 = ref([
  { label: 'Uyarı Komutları onaylama yetkisi', index: 0, value: true },
  { label: 'Adım Atlatma Yetkisi', index: 1, value: true },
  { label: 'Makine Değiştirme Yetkisi', index: 2, value: false },
  { label: 'Operatör Müdahalesi Serbest Programlar İçin Yetki', index: 3, value: false },
])
const user = computed(() => props.selected)
watch(user, (_newValue, _oldValue) => {
  if (props.selected && props.selected.userMode)
    updatePermissionsFromHex(props.selected.userMode, props.selected.userMode2)
})

function updatePermissionsFromHex(hexStringGroup1, hexStringGroup2) {
  const binaryStringGroup1 = Number.parseInt(hexStringGroup1.slice(2), 16).toString(2).padStart(32, '0')
  const binaryStringGroup2 = Number.parseInt(hexStringGroup2.slice(2), 16).toString(2).padStart(32, '0')

  console.log('binaryStringGroup1 = ', binaryStringGroup1)
  console.log('binaryStringGroup2 = ', binaryStringGroup2)
  // Update Group 1 permissions
  permissionsGroup1.value.forEach((permission) => {
    const bitPosition = permission.index
    permission.value = binaryStringGroup1.charAt(31 - bitPosition) === '1'
  })

  // Update Group 2 permissions
  permissionsGroup2.value.forEach((permission) => {
    const bitPosition = permission.index
    permission.value = binaryStringGroup2.charAt(31 - bitPosition) === '1'
  })
}

async function savePermissions() {
  let combinedPermissionValueGroup1 = 0
  let combinedPermissionValueGroup2 = 0

  // Group 1
  permissionsGroup1.value.forEach((permission) => {
    if (permission.value) {
      combinedPermissionValueGroup1 |= 1 << (permission.index)
    }
  })

  // Group 2
  permissionsGroup2.value.forEach((permission) => {
    if (permission.value) {
      combinedPermissionValueGroup2 |= 1 << (permission.index)
    }
  })

  const hexadecimalValueGroup1 = `0x${combinedPermissionValueGroup1.toString(16).padStart(8, '0')}`
  const hexadecimalValueGroup2 = `0x${combinedPermissionValueGroup2.toString(16).padStart(8, '0')}`

  console.log('Group 1 Hexadecimal:', hexadecimalValueGroup1)
  console.log('Group 2 Hexadecimal:', hexadecimalValueGroup2)

  await updateUserPermissions({ userId: user.value.userId, userMode: hexadecimalValueGroup1, userMode2: hexadecimalValueGroup2 })
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
                :disable="!permissionsGroup1.find(d => d.label === 'Sistem Menülerine Erişim')!.value
                  && (permission.label === 'İşletme Parametrelerine Erişim'
                    || permission.label === 'I/O Ayarlama Yetkisi'
                    || permission.label === 'Kilitlemeler'
                    || permission.label === 'Kalibrasyon'
                    || permission.label === 'Komutlar')
                  || !permissionsGroup1.find(d => d.label === 'Cihaz Ayar Yetkisi')!.value
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
