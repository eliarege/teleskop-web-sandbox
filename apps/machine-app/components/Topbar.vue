<script setup lang="ts">

</script>

<template>
  <div class="topbar">
    <q-btn label="Makine" flat>
      <q-menu>
        <q-list>
          <q-item>
            <q-item-section>
              yeni
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              özellikler
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              sil
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              yükle
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              çıkış
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <q-btn label="makine grubu" flat>
      <q-menu>
        <q-list>
          <q-item>
            <q-item-selection>
              değiştir
            </q-item-selection>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <q-btn label="ayarlar" flat>
      <q-menu>
        <q-list>
          <q-item>
            <q-item-selection>
              proje görünüm dili
            </q-item-selection>
            <q-item-selection>
              <q-icon name="keyboard_arrow_right" />
            </q-item-selection>
            <q-menu auto-close anchor="top end" self="top start">
              <q-list>
                <q-item>
                  <q-item-selection>
                    türkçe
                  </q-item-selection>
                </q-item>
                <q-item>
                  <q-item-selection>
                    ingilizce
                  </q-item-selection>
                </q-item>
              </q-list>
            </q-menu>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <q-btn label="boyahane" flat>
      <q-menu>
        <q-list>
          <q-item>
            <q-item-selection>
              cihaz kullanıcıları
            </q-item-selection>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</template>

<style scoped>

</style>
