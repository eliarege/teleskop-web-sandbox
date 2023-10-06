<script setup lang="ts">

</script>

<template>
  <div class="topbar">
    <q-btn
      label="Makine"
      flat
      no-caps
    >
      <q-menu>
        <q-list>
          <q-item>
            <q-item-section>
              <NuxtLink to="/new-machine">
                Yeni
              </NuxtLink>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Özellikler"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Sil"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Yükle"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Çıkış"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <q-btn
      label="Makine Grubu"
      flat
      no-caps
    >
      <q-menu>
        <q-list>
          <q-item>
            <q-item-section>
              <q-btn
                label="Değiştir"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <q-btn
      label="Ayarlar"
      flat
      no-caps
    >
      <q-menu>
        <q-list>
          <q-item>
            <q-item-section>
              <q-btn
                label="Proje görünüm dili"
                flat
                no-caps
                icon-right="chevron_right"
              />
            </q-item-section>
            <q-menu
              auto-close
              anchor="top end"
              self="top start"
            >
              <q-list>
                <q-item>
                  <q-item-section>
                    <q-btn
                      label="Türkçe"
                      flat
                      no-caps
                    />
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-btn
                      label="İngilizce"
                      flat
                      no-caps
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <q-btn
      label="Boyahane"
      flat
      no-caps
    >
      <q-menu>
        <q-list>
          <q-item>
            <q-item-section>
              <q-btn
                label="Cihaz Kullanıcıları"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Manuele Alma Nedenleri"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Makine Duruş Nedenleri"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Adım Atlatma Ayarları"
                flat
                no-caps
                icon-right="chevron_right"
              />
            </q-item-section>
            <q-menu
              auto-close
              anchor="top end"
              self="top start"
            >
              <q-list>
                <q-item>
                  <q-item-section>
                    <q-btn
                      label="Adım Atlatma Nedenleri"
                      flat
                      no-caps
                    />
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-btn
                      label="Adım Atlatmada Sebep Sorulacak Komutlar"
                      flat
                      no-caps
                    />
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-btn
                      label="Adım Atlatma Ayarlarunu Gönder/Sil"
                      flat
                      no-caps
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Cihaz Erişim Hataları"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Cihaz Kapalı Zamanlar"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Optimizasyon Parametreleri"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Su Tipleri"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="E-Posta Bildirim Ayarları"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Komut Tipi Tanımları"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Diğer Makineler"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="ERP Parametreleri"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Başlatma Parametresi Tipleri"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Reçete Tipleri"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Makine Bitirme Nedenleri"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Tüketim Sayaç Seçimi"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Teorik Su Tüketimi Ayarları"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Akıllı İstek Komut Tanımları"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Kazan Tanımları"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Kazan - Materyal Eşleştirme"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-btn
                label="Kazan - Materyal Su Limit Tanımları"
                flat
                no-caps
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</template>

<style scoped>

</style>
