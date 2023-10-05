<script setup lang="ts">

</script>

<template>
  <div class="topbar">
    <q-btn label="Makine" flat no-caps>
      <q-menu>
        <q-list>
          <q-item>
            <q-item-section>
              Yeni
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              Özellikler
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              Sil
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              Yükle
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              Çıkış
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <q-btn label="Makine Grubu" flat no-caps>
      <q-menu>
        <q-list>
          <q-item>
            <q-item-selection>
              Değiştir
            </q-item-selection>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <q-btn label="Ayarlar" flat no-caps>
      <q-menu>
        <q-list>
          <q-item>
            <q-item-selection>
              Proje görünüm dili
            </q-item-selection>
            <q-item-selection>
              <q-icon name="keyboard_arrow_right" />
            </q-item-selection>
            <q-menu auto-close anchor="top end" self="top start">
              <q-list>
                <q-item>
                  <q-item-selection>
                    Türkçe
                  </q-item-selection>
                </q-item>
                <q-item>
                  <q-item-selection>
                    İngilizce
                  </q-item-selection>
                </q-item>
              </q-list>
            </q-menu>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <q-btn label="Boyahane" flat no-caps>
      <q-menu>
        <q-list>
          <q-item>
            <q-item-selection>
              Cihaz Kullanıcıları
            </q-item-selection>
          </q-item>
          <q-item>
            <q-item-selection>
              Manuele Alma Nedenleri
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              Makine Duruş Nedenleri
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              Adım Atlatma Ayarları
            </q-item-selection>
            <q-item-selection>
              <q-icon name="keyboard_arrow_right" />
            </q-item-selection>
            <q-menu auto-close anchor="top end" self="top start">
              <q-list>
                <q-item>
                  <q-item-selection>
                    Adım Atlatma Nedenleri
                  </q-item-selection>
                </q-item>
                <q-item>
                  <q-item-selection>
                    Adım Atlatmada Sebep Sorulacak Komutlar
                  </q-item-selection>
                </q-item>
                <q-item>
                  <q-item-selection>
                    Adım Atlatma Ayarlarunu Gönder/Sil
                  </q-item-selection>
                </q-item>
              </q-list>
            </q-menu>
          </q-item>
          <q-item>
            <q-item-selection>
              Cihaz Erişim Hataları
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              Cihaz Kapalı Zamanlar
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              Optimizasyon Parametreleri
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              Su Tipleri
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              E-Posta Bildirim Ayarları
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              Komut Tipi Tanımları
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              Diğer Makineler
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              ERP Parametreleri
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              Başlatma Parametresi Tipleri
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              Reçete Tipleri
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              Makine Bitirme Nedenleri
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              Tüketim Sayaç Seçimi
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              Teorik Su Tüketimi Ayarları
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              Akıllı İstek Komut Tanımları
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              Kazan Tanımları
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              Kazan - Materyal Eşleştirme
            </q-item-selection>
          </q-item>

          <q-item>
            <q-item-selection>
              Kazan - Materyal Su Limit Tanımları
            </q-item-selection>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</template>

<style scoped>

</style>
