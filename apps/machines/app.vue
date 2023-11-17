<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const definitionItems = [
  {
    label: t('machine'),
    to: '/',
    items: [
      {
        label: t('new'),
      },
      {
        label: t('properties'),
      },

      {
        label: t('delete'),
      },

      {
        label: t('load'),
      },

      {
        label: t('exit'),
      },
    ],
  },
  {
    label: 'Makine Grubu',
    items: [
      {
        label: 'Değiştir',
      },
    ],
  },
  {
    label: 'Ayarlar',
    items: [
      {
        label: 'Cihaz Ayarları',
        items: [
          {
            label: 'Cihaz Kullanıcıları',
            to: '/user-definitions',
          },
          {
            label: 'Cihaz Erişim Hataları',
            to: '/machine-access-fails',
          },

          {
            label: 'Cihaz Kapalı Zamanlar',
            to: '/controller-closed-times',
          },

          {
            label: 'Komut Tipi Tanımları',
            to: '/command-type-definitions',
          },

          {
            label: 'Manuele Alma Nedenleri',
            to: '/manual-reasons',
          },

          {
            label: 'Makine Duruş Nedenleri',
            to: '/machine-stop-reasons',
          },

          {
            label: 'Makine Bitirme Nedenleri',
            to: '/machine-finish-reasons',
          },

          {
            label: 'Adım Atlatma Ayarları',
            to: '/step-skipping-reasons',
          },
          {
            label: 'Adım Atlatmada Sebep Sorulacak Komutlar',
            to: '/step-skipping-reason-commands',
          },

          {
            label: 'Akıllı İstek Komut Tanımları',
            to: 'smart-request-command-definitions',
          },

          {
            label: 'Komut Zaman Aşımı Sebepleri',
            to: 'command-timeout-reasons',
          },

          {
            label: 'Diğer Makineler',
            to: '/data-collection-devices',
          },
        ],
      },
      {
        label: 'İlave Kabı Ayarları',
        items: [
          {
            label: 'Kazan Tanımları',
          },
          {
            label: 'Kazan-Materyal Eşleştirme',
          },
          {
            label: 'Kazan-Materyal Su Limit Tanımları',
          },
        ],
      },
      {
        label: 'Entegrasyon Ayarları',
        items: [
          {
            label: 'ERP Parametreleri',
            to: '/erp-parameter-definitions',
          },
          {
            label: 'Başlatma Parametresi Tipleri',
            to: '/starting-parameter-types',
          },
          {
            label: 'Reçete Tipleri',
            to: '/recipe-types',
          },
          {
            label: 'Optimizasyon Parametreleri',
          },
        ],
      },
      {
        label: 'Tüketim Ayarları',
        items: [
          {
            label: 'Su Tipleri',
            to: '/water-type-definitions',
          },
          {
            label: 'Tüketim Sayaç Seçimi',
            to: '/consumption-counter-select',
          },
          {
            label: 'Teorik Su Tüketimi Ayarları',
            to: '/theoretical-water-consumptions',
          },
        ],
      },
      {
        label: 'Uygulama Ayarları',
        items: [
          {
            label: 'Teleskop Ayarları',
          },
          {
            label: 'Proje Görünüm Dili',
          },
        ],
      },
      {
        label: 'Bildirim',
        items: [
          {
            label: 'E-posta Bildirim Ayarları',
            to: 'email-notification-settings',
          },
        ],
      },
    ],

  },

]
</script>

<template>
  <div>
    <NuxtLayout>
      <div class="relative">
        <q-chip outline color="teal">
          Teleskop Basic - Makineler 4.19
        </q-chip>
        <div class="flex flex-row">
          <DropdownMenu
            v-for="(item, idx) in definitionItems"
            :key="idx"
            :model="item"
            strategy="fixed"
            placement="bottom"
            second-placement="right-start"
            class="z-10"
          >
            <template #default="{ item, depth, active }">
              <div
                v-if="depth === 0"
                class="cursor-pointer whitespace-nowrap select-none text-black text-center gap-1 hover:(bg-light-400 text-gray-800) rounded p-2 lg:px-3 xl:px-4  transition-all"
                @click="item.onClick"
              >
                {{ item.label }}
              </div>
              <div v-else class="w-full cursor-pointer bg-white text-black border px-3 py-2 flex items-center gap-3 justify-between whitespace-nowrap hover:(important-bg-light-400 important-text-gray-800)">
                {{ item.label }}
                <i v-if="item.items" class="fa fa-chevron-right" />
                <q-btn
                  v-if="item.items"
                  class="text-xs"
                  flat
                  no-caps
                  icon-right="chevron_right"
                />
              </div>
            </template>
          </DropdownMenu>
        </div>
        <NuxtPage />
      </div>
    </NuxtLayout>
  </div>
</template>
