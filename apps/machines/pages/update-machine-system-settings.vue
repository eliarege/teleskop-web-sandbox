<script setup lang="ts">
import type { Machine } from '~/types'

const { t } = useI18n()

const showAddMachineSystemSetting = ref(false)

const tokens = {
  ICONS_ENABLED: 'ICONS_ENABLED',
  SIDETEXT_ENABLED: 'SIDETEXT_ENABLED',
  KILITLEMELER_AKTIF: 'KILITLEMELER_AKTIF',
  TEST_PLC_EKRANINDA_KILITLEMELER_AKTIF: 'TEST_PLC_EKRANINDA_KILITLEMELER_AKTIF',
  BATCH_NO_DIGIT_COUNT: 'BATCH_NO_DIGIT_COUNT',
  KEEP_PROGRAMS: 'KEEP_PROGRAMS',
  PANEL_REEL_PUMP_TUNE: 'PANEL_REEL_PUMP_TUNE',
  BARCODE_READER_ENABLED: 'BARCODE_READER_ENABLED',
  PANEL_KLAPE_TUNE: 'PANEL_KLAPE_TUNE',
  MANUEL_MOD_GECIS_SEBEP_SOR: 'MANUEL_MOD_GECIS_SEBEP_SOR',
  PROGRAM_IZLEME_ADIM_GECIS: 'PROGRAM_IZLEME_ADIM_GECIS',
  PROGRAM_YAZMA_DEFAULT: 'PROGRAM_YAZMA_DEFAULT',
  PROGRAM_YAZARKEN_ONER: 'PROGRAM_YAZARKEN_ONER',
  BATCH_NO_NUMERIK: 'BATCH_NO_NUMERIK',
  HAVALI_MAKINE: 'HAVALI_MAKINE',
  SIKMA_KONTROLLU_MAKINE: 'SIKMA_KONTROLLU_MAKINE',
  DUZE_KONTROL_AKTIF: 'DUZE_KONTROL_AKTIF',
  UZAKTAN_KONTROL_AKTIF: 'UZAKTAN_KONTROL_AKTIF',
  BATCH_NO_OTOMATIK: 'BATCH_NO_OTOMATIK',
  REAKTOR_KONTROL: 'REAKTOR_KONTROL',
  OPERATOR_BATCH_BASLATAMASIN: 'OPERATOR_BATCH_BASLATAMASIN',
  KULLANICI_LOGOFF: 'KULLANICI_LOGOFF',
  OPTIM_AKTIF: 'OPTIM_AKTIF',
  POMPA_KULE_DURMASIN: 'POMPA_KULE_DURMASIN',
  KOMUT_GRUP_AKTIF: 'KOMUT_GRUP_AKTIF',
  MCS_MAKINE: 'MCS_MAKINE',
  BOBIN_BOYAMA_MAKINE: 'BOBIN_BOYAMA_MAKINE',
  JIGGER_MAKINE: 'JIGGER_MAKINE',
  PROJE_LOGOSU_KULLAN: 'PROJE_LOGOSU_KULLAN',
  MODBUS_MODE: 'MODBUS_MODE',
  DURUS_SEBEBI_ZORUNLU: 'DURUS_SEBEBI_ZORUNLU',
  HAVALI_MAKINE_CMS: 'HAVALI_MAKINE_CMS',
  ILAVEDE_SADECE_ILAVE_PROSESLER: 'ILAVEDE_SADECE_ILAVE_PROSESLER',
  PROJE_DIL_HAVUZUNU_KULLAN: 'PROJE_DIL_HAVUZUNU_KULLAN',
  DOKUNMATIK_EKRAN: 'DOKUNMATIK_EKRAN',
  KULLANICI_LOGOFF_PASSWORD: 'KULLANICI_LOGOFF_PASSWORD',
  PLC_BAUD_RATE_57600: 'PLC_BAUD_RATE_57600',
  HAZIR_IS_EMRI_BASLATMA_PARAMETRESI_SOR: 'HAZIR_IS_EMRI_BASLATMA_PARAMETRESI_SOR',
  PLC_COUNTER_TYPE: 'PLC_COUNTER_TYPE',
  ASK_BATCH_PARAMETERS_COUPLED_MODE: 'ASK_BATCH_PARAMETERS_COUPLED_MODE',
  DO_NOT_RESTART_RUNNING_STEP: 'DO_NOT_RESTART_RUNNING_STEP',
  PREVENT_DISABLED_COMMAND: 'PREVENT_DISABLED_COMMAND',
  MAX_REMOTE_BATCH_COUNT: 'MAX_REMOTE_BATCH_COUNT',
  DURUS_SEBEBI_SURESI: 'DURUS_SEBEBI_SURESI',
  DURUS_ALARM_GOREVLERI: 'DURUS_ALARM_GOREVLERI',
  OTOMATIK_GUNCELLEME: 'OTOMATIK_GUNCELLEME',
  IS_EMRI_BASLATILIRKEN_TUM_PARAMETRELERI_SOR: 'IS_EMRI_BASLATILIRKEN_TUM_PARAMETRELERI_SOR',
  TELESKOP_IS_EMRI_BASLATMA_ONAYI: 'TELESKOP_IS_EMRI_BASLATMA_ONAYI',
  CODESYS_V32: 'CODESYS_V32',
  TELESKOP_HAZIR_IS_EMRI_INDIREBILME: 'TELESKOP_HAZIR_IS_EMRI_INDIREBILME',
  IO_SIRA_NUMARASI_GOSTERILSIN: 'IO_SIRA_NUMARASI_GOSTERILSIN',
  FONKSIYON_HAVUZU: 'FONKSIYON_HAVUZU',
  KULE_DEGERI_YUZDELIK_GOSTERILSIN: 'KULE_DEGERI_YUZDELIK_GOSTERILSIN',
  FARK_BASINC_FONKSIYONU: 'FARK_BASINC_FONKSIYONU',
  KIMYASAL_ISTEK_FONKSIYONU: 'KIMYASAL_ISTEK_FONKSIYONU',
  IS_EMRI_BITISINDE_DURUS_SEBEBI_GOSTERILSIN: 'IS_EMRI_BITISINDE_DURUS_SEBEBI_GOSTERILSIN',
  ISLEM_DURDURULDU_SEBEP_SOR: 'ISLEM_DURDURULDU_SEBEP_SOR',
  ISEMRI_IPTAL_EDILDIGINDE_SEBEP_SOR: 'ISEMRI_IPTAL_EDILDIGINDE_SEBEP_SOR',
  KIMYASAL_BOYA_BILGILERINI_GOSTER: 'KIMYASAL_BOYA_BILGILERINI_GOSTER',
  DIGITAL_IO_EVENT_TIME: 'DIGITAL_IO_EVENT_TIME',
  DIGITAL_IO_EVENT_TIME_MIN: 5,
  DIGITAL_IO_EVENT_TIME_MAX: 60,
  DIGITAL_IO_EVENT_TIME_DEFAULT: 60,
  T7_RIO_SLOT: 'T7_RIO_SLOT',
  ALARM_REPEAT_TIME: 'ALARM_REPEAT_TIME',
  SECOND_PLC_ACTIVE: 'SECOND_PLC_ACTIVE',
  SONLANDIRMA_SECENEGI_SORULSUN: 'SONLANDIRMA_SECENEGI_SORULSUN',
  MIMIK_ANIMASYON_AKTIF: 'MIMIK_ANIMASYON_AKTIF',
  PARCA_KURUTMA_MAKINASI: 'PARCA_KURUTMA_MAKINASI',
  SMARTEX_MANUEL_SCADA: 'SMARTEX_MANUEL_SCADA',
  YIKAMA_FAZ_BILGISI_AKTIF: 'YIKAMA_FAZ_BILGISI_AKTIF',
  MENU_DILI_KISAYOL_AKTIF: 'MENU_DILI_KISAYOL_AKTIF',
  SOFT_PANO_BUTON_AKTIF: 'SOFT_PANO_BUTON_AKTIF',
  KULLANICI_ISLEMLERINI_YONET: 'KULLANICI_ISLEMLERINI_YONET',
  KIMYASAL_ISTEK_FONKSIYONU_DURUM_PARAMETRESI: 'KIMYASAL_ISTEK_FONKSIYONU_DURUM_PARAMETRESI',
  ALARM_KALKINCA_BATCH_OTOMATIK_BASLAMASIN: 'ALARM_KALKINCA_BATCH_OTOMATIK_BASLAMASIN',
  OTOMATIK_BATCH_BASLATMA: 'OTOMATIK_BATCH_BASLATMA',
  WEBVISU_AKTIF: 'WEBVISU_AKTIF',
  HAZIR_IS_EMRINI_MANUEL_YUKLE: 'HAZIR_IS_EMRINI_MANUEL_YUKLE',
  KULLANICI_ALARMI_KALKINCA_BATCH_BASLAMASIN: 'KULLANICI_ALARMI_KALKINCA_BATCH_BASLAMASIN',
  ILK_ADIMDAN_BASLATMA_ZORUNLU: 'ILK_ADIMDAN_BASLATMA_ZORUNLU',
  KILITLEME_KALKINCA_BATCH_BASLAMASIN: 'KILITLEME_KALKINCA_BATCH_BASLAMASIN',
  DURUS_SEBEBINI_BATCH_BASLARKEN_SOR: 'DURUS_SEBEBINI_BATCH_BASLARKEN_SOR',
  KIMYASAL_ISTEKLER_ISEMRI_BAZINDA: 'KIMYASAL_ISTEKLER_ISEMRI_BAZINDA',
  ADIM_ATLAMA_SEBEBI_AKTIF: 'ADIM_ATLAMA_SEBEBI_AKTIF',
  VERITABANI_ISLEMLERI_AKTIF: 'VERITABANI_ISLEMLERI_AKTIF',
  ISEMRI_NUMARASI_ILLEGAL_KARAKTER_KULLANIMI_AKTIF: 'ISEMRI_NUMARASI_ILLEGAL_KARAKTER_KULLANIMI_AKTIF',
  KOMUT_ZAMAN_ASILDI_SEBEPLERI_AKTIF: 'KOMUT_ZAMAN_ASILDI_SEBEPLERI_AKTIF',
}

const settings = [
  { caption: 'ICONS_ENABLED', token: tokens.ICONS_ENABLED },
  { caption: 'SIDETEXT_ENABLED', token: tokens.SIDETEXT_ENABLED },
  { caption: 'KILITLEMELER_AKTIF', token: tokens.KILITLEMELER_AKTIF },
  { caption: 'TEST_PLC_EKRANINDA_KILITLEMELER_AKTIF', token: tokens.TEST_PLC_EKRANINDA_KILITLEMELER_AKTIF },
  { caption: 'BATCH_NO_DIGIT_COUNT', token: tokens.BATCH_NO_DIGIT_COUNT },
  { caption: 'KEEP_PROGRAMS', token: tokens.KEEP_PROGRAMS },
  { caption: 'PANEL_REEL_PUMP_TUNE', token: tokens.PANEL_REEL_PUMP_TUNE },
  { caption: 'BARCODE_READER_ENABLED', token: tokens.BARCODE_READER_ENABLED },
  { caption: 'PANEL_KLAPE_TUNE', token: tokens.PANEL_KLAPE_TUNE },
  { caption: 'MANUEL_MOD_GECIS_SEBEP_SOR', token: tokens.MANUEL_MOD_GECIS_SEBEP_SOR },
  { caption: 'PROGRAM_IZLEME_ADIM_GECIS', token: tokens.PROGRAM_IZLEME_ADIM_GECIS },
  { caption: 'PROGRAM_YAZMA_DEFAULT', token: tokens.PROGRAM_YAZMA_DEFAULT },
  { caption: 'PROGRAM_YAZARKEN_ONER', token: tokens.PROGRAM_YAZARKEN_ONER },
  { caption: 'BATCH_NO_NUMERIK', token: tokens.BATCH_NO_NUMERIK },
  { caption: 'HAVALI_MAKINE', token: tokens.HAVALI_MAKINE },
  { caption: 'SIKMA_KONTROLLU_MAKINE', token: tokens.SIKMA_KONTROLLU_MAKINE },
  { caption: 'DUZE_KONTROL_AKTIF', token: tokens.DUZE_KONTROL_AKTIF },
  { caption: 'UZAKTAN_KONTROL_AKTIF', token: tokens.UZAKTAN_KONTROL_AKTIF },
  { caption: 'BATCH_NO_OTOMATIK', token: tokens.BATCH_NO_OTOMATIK },
  { caption: 'REAKTOR_KONTROL', token: tokens.REAKTOR_KONTROL },
  { caption: 'OPERATOR_BATCH_BASLATAMASIN', token: tokens.OPERATOR_BATCH_BASLATAMASIN },
  { caption: 'KULLANICI_LOGOFF', token: tokens.KULLANICI_LOGOFF },
  { caption: 'OPTIM_AKTIF', token: tokens.OPTIM_AKTIF },
  { caption: 'POMPA_KULE_DURMASIN', token: tokens.POMPA_KULE_DURMASIN },
  { caption: 'KOMUT_GRUP_AKTIF', token: tokens.KOMUT_GRUP_AKTIF },
  { caption: 'MCS_MAKINE', token: tokens.MCS_MAKINE },
  { caption: 'BOBIN_BOYAMA_MAKINE', token: tokens.BOBIN_BOYAMA_MAKINE },
  { caption: 'JIGGER_MAKINE', token: tokens.JIGGER_MAKINE },
  { caption: 'PROJE_LOGOSU_KULLAN', token: tokens.PROJE_LOGOSU_KULLAN },
  { caption: 'MODBUS_MODE', token: tokens.MODBUS_MODE },
  { caption: 'DURUS_SEBEBI_ZORUNLU', token: tokens.DURUS_SEBEBI_ZORUNLU },
  { caption: 'HAVALI_MAKINE_CMS', token: tokens.HAVALI_MAKINE_CMS },
  { caption: 'ILAVEDE_SADECE_ILAVE_PROSESLER', token: tokens.ILAVEDE_SADECE_ILAVE_PROSESLER },
  { caption: 'PROJE_DIL_HAVUZUNU_KULLAN', token: tokens.PROJE_DIL_HAVUZUNU_KULLAN },
  { caption: 'DOKUNMATIK_EKRAN', token: tokens.DOKUNMATIK_EKRAN },
  { caption: 'KULLANICI_LOGOFF_PASSWORD', token: tokens.KULLANICI_LOGOFF_PASSWORD },
  { caption: 'HAZIR_IS_EMRI_BASLATMA_PARAMETRESI_SOR', token: tokens.HAZIR_IS_EMRI_BASLATMA_PARAMETRESI_SOR },
  { caption: 'PLC_COUNTER_TYPE', token: tokens.PLC_COUNTER_TYPE },
  { caption: 'ASK_BATCH_PARAMETERS_COUPLED_MODE', token: tokens.ASK_BATCH_PARAMETERS_COUPLED_MODE },
  { caption: 'DO_NOT_RESTART_RUNNING_STEP', token: tokens.DO_NOT_RESTART_RUNNING_STEP },
  { caption: 'PREVENT_DISABLED_COMMAND', token: tokens.PREVENT_DISABLED_COMMAND },
  { caption: 'IS_EMRI_BITISINDE_DURUS_SEBEBI_GOSTERILSIN', token: tokens.IS_EMRI_BITISINDE_DURUS_SEBEBI_GOSTERILSIN },
  { caption: 'IO_SIRA_NUMARASI_GOSTERILSIN', token: tokens.IO_SIRA_NUMARASI_GOSTERILSIN },
  { caption: 'TELESKOP_HAZIR_IS_EMRI_INDIREBILME', token: tokens.TELESKOP_HAZIR_IS_EMRI_INDIREBILME },
  { caption: 'OTOMATIK_GUNCELLEME', token: tokens.OTOMATIK_GUNCELLEME },
  { caption: 'IS_EMRI_BASLATILIRKEN_TUM_PARAMETRELERI_SOR', token: tokens.IS_EMRI_BASLATILIRKEN_TUM_PARAMETRELERI_SOR },
  { caption: 'KULE_DEGERI_YUZDELIK_GOSTERILSIN', token: tokens.KULE_DEGERI_YUZDELIK_GOSTERILSIN },
  { caption: 'CODESYS_V32', token: tokens.CODESYS_V32 },
  { caption: 'ISLEM_DURDURULDU_SEBEP_SOR', token: tokens.ISLEM_DURDURULDU_SEBEP_SOR },
  { caption: 'ISEMRI_IPTAL_EDILDIGINDE_SEBEP_SOR', token: tokens.ISEMRI_IPTAL_EDILDIGINDE_SEBEP_SOR },
  { caption: 'KIMYASAL_BOYA_BILGILERINI_GOSTER', token: tokens.KIMYASAL_BOYA_BILGILERINI_GOSTER },
  { caption: 'TELESKOP_IS_EMRI_BASLATMA_ONAYI', token: tokens.TELESKOP_IS_EMRI_BASLATMA_ONAYI },
  { caption: 'SECOND_PLC_ACTIVE', token: tokens.SECOND_PLC_ACTIVE },
  { caption: 'SONLANDIRMA_SECENEGI_SORULSUN', token: tokens.SONLANDIRMA_SECENEGI_SORULSUN },
  { caption: 'YIKAMA_FAZ_BILGISI_AKTIF', token: tokens.YIKAMA_FAZ_BILGISI_AKTIF },
  { caption: 'SOFT_PANO_BUTON_AKTIF', token: tokens.SOFT_PANO_BUTON_AKTIF },
  { caption: 'ALARM_KALKINCA_BATCH_OTOMATIK_BASLAMASIN', token: tokens.ALARM_KALKINCA_BATCH_OTOMATIK_BASLAMASIN },
  { caption: 'MIMIK_ANIMASYON_AKTIF', token: tokens.MIMIK_ANIMASYON_AKTIF },
  { caption: 'KIMYASAL_ISTEK_FONKSIYONU_DURUM_PARAMETRESI', token: tokens.KIMYASAL_ISTEK_FONKSIYONU_DURUM_PARAMETRESI },
  { caption: 'OTOMATIK_BATCH_BASLATMA', token: tokens.OTOMATIK_BATCH_BASLATMA },
  { caption: 'MENU_DILI_KISAYOL_AKTIF', token: tokens.MENU_DILI_KISAYOL_AKTIF },
  { caption: 'KULLANICI_ISLEMLERINI_YONET', token: tokens.KULLANICI_ISLEMLERINI_YONET },
  { caption: 'HAZIR_IS_EMRINI_MANUEL_YUKLE', token: tokens.HAZIR_IS_EMRINI_MANUEL_YUKLE },
  { caption: 'KULLANICI_ALARMI_KALKINCA_BATCH_BASLAMASIN', token: tokens.KULLANICI_ALARMI_KALKINCA_BATCH_BASLAMASIN },
  { caption: 'ILK_ADIMDAN_BASLATMA_ZORUNLU', token: tokens.ILK_ADIMDAN_BASLATMA_ZORUNLU },
  { caption: 'KILITLEME_KALKINCA_BATCH_BASLAMASIN', token: tokens.KILITLEME_KALKINCA_BATCH_BASLAMASIN },
  { caption: 'WEBVISU_AKTIF', token: tokens.WEBVISU_AKTIF },
  { caption: 'DURUS_SEBEBINI_BATCH_BASLARKEN_SOR', token: tokens.DURUS_SEBEBINI_BATCH_BASLARKEN_SOR },
  { caption: 'KIMYASAL_ISTEKLER_ISEMRI_BAZINDA', token: tokens.KIMYASAL_ISTEKLER_ISEMRI_BAZINDA },
  { caption: 'ADIM_ATLAMA_SEBEBI_AKTIF', token: tokens.ADIM_ATLAMA_SEBEBI_AKTIF },
  { caption: 'VERITABANI_ISLEMLERI_AKTIF', token: tokens.VERITABANI_ISLEMLERI_AKTIF },
  { caption: 'ISEMRI_NUMARASI_ILLEGAL_KARAKTER_KULLANIMI_AKTIF', token: tokens.ISEMRI_NUMARASI_ILLEGAL_KARAKTER_KULLANIMI_AKTIF },
  { caption: 'PLCbaudRate57600', token: tokens.PLC_BAUD_RATE_57600 },
  { caption: 'KOMUT_ZAMAN_ASILDI_SEBEPLERI_AKTIF', token: tokens.KOMUT_ZAMAN_ASILDI_SEBEPLERI_AKTIF },
]

const { data: machines } = useLazyFetch<Machine[]>('/api/machines/machines', {
  method: 'POST',
  body: {},
  transform: machines => (
    machines.map(machine => ({
      ...machine,
      check: ref(false),
    }))
  ),
})

const selectedSettings = ref([])
const selected = ref()

function handleAdd(selectedSetting) {
  showAddMachineSystemSetting.value = false
  selectedSettings.value.push(selectedSetting)
}

function handleDelete() {
  selectedSettings.value = selectedSettings.value.filter(setting => setting !== selected.value)
  selected.value = null
}

async function handleSend() {
  await $fetch('/api/sync/machine-settings', {
    method: 'POST',
    body: {
      settings: selectedSettings.value,
      machines: machines.value.filter(machine => machine.check).map(machine => machine.machineId),
    },
  })
}

function selectAll() {
  machines.value.forEach(machine => machine.check = true)
}

function deselectAll() {
  machines.value.forEach(machine => machine.check = false)
}
</script>

<template>
  <div>
    <q-card>
      <q-card-section>
        <div class="flex flex-row justify-around items-center">
          <div>
            <h3>{{ t('settingsToUpdate') }}</h3>
            <div class="flex gap-4 my-4">
              <q-btn :label="t('add')" no-caps @click="showAddMachineSystemSetting = true" />
              <q-btn :label="t('delete')" no-caps :disable="!selected" @click="handleDelete" />
            </div>
            <q-list separator bordered class="h-160 overflow-y-auto w-sm">
              <q-item
                v-for="setting in selectedSettings" :key="setting.caption"
                v-ripple
                clickable
                :active="selected === setting"
                @click="selected = setting"
              >
                <q-item-section>
                  {{ `${t(`updateMachineSettings.${setting.caption}`)} ${setting.isActive ? t('active') : t('passive')}` }}
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <div>
            <h3>{{ t('machinesToUpdate') }}</h3>
            <div class="flex gap-4 my-4">
              <q-btn :label="t('selectAll')" no-caps @click="selectAll" />
              <q-btn :label="t('deselectAll')" no-caps @click="deselectAll" />
            </div>
            <q-list bordered separator class="h-160 overflow-y-auto w-sm">
              <q-item
                v-for="machine in machines"
                :key="machine.machineId"
              >
                <q-checkbox v-model="machine.check" :label="machine.machineCode" />
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right" class="flex gap-2 m-4">
        <q-btn :label="t('cancel')" no-caps />
        <q-btn :label="t('submit')" color="primary" no-caps @click="handleSend" />
      </q-card-actions>
    </q-card>

    <AddMachineSystemSettingDialog
      v-if="showAddMachineSystemSetting"
      :show="showAddMachineSystemSetting"
      :settings="settings"
      :tokens="tokens"
      @close="showAddMachineSystemSetting = false"
      @add="handleAdd"
    />
  </div>
</template>

<style scoped>

</style>
