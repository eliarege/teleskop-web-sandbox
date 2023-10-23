<script setup lang="ts">
import type { Machine } from '~/types'

const machines = ref(await $fetch('/api/machine/machines'))

const selectedMachines: Machine[] = ref([])

function machineSelection(e) {
  if (e.added)
    selectedMachines.value.push(e.rows[0])
  else
    selectedMachines.value = selectedMachines.value.filter((m: Machine) => m.id !== e.rows[0].id)
}

function deleteMachine(machineIds: string[]) {
  machines.value = machines.value.filter((m: Machine) => !machineIds.includes(m.id))
  selectedMachines.value = selectedMachines.value.filter((m: Machine) => !machineIds.includes(m.id))
}

async function addMachine() {
  machines.value = await $fetch('/api/machine/machines')
}

const definitionItems = ref([
  {
    label: 'Makine',
    items: [
      {
        label: 'Yeni',
      },
      {
        label: 'Özellikler',
      },

      {
        label: 'Sil',
      },

      {
        label: 'Yükle',
      },

      {
        label: 'Çıkış',
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
          },
          {
            label: 'Cihaz Erişim Hataları',
          },

          {
            label: 'Cihaz Kapalı Zamanlar',
          },

          {
            label: 'Komut Tipi Tanımları',
          },

          {
            label: 'Manuele Alma Nedenleri',
          },

          {
            label: 'Makine Duruş Nedenleri',
          },

          {
            label: 'Makine Bitirme Nedenleri',
          },

          {
            label: 'Adım Atlatma Ayarları',
          },

          {
            label: 'Akıllı İstek Komut Tanımları',
          },

          {
            label: 'Diğer Makineler',
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
          },
          {
            label: 'Başlatma Parametresi Tipleri',
          },
          {
            label: 'Reçete Tipleri',
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
          },
          {
            label: 'Tüketim Sayaç Seçimi',
          },
          {
            label: 'Teorik Su Tüketimi Ayarları',
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
          },
        ],
      },
    ],

  },

])
</script>

<template>
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
            :class="{ 'bg-light-400 !text-gray-800': active }"
            @click="item.onClick"
          >
            {{ item.label }}
          </div>
          <div v-else class="w-full cursor-pointer select-none bg-white border px-3 py-2 flex items-center gap-3 justify-between whitespace-nowrap hover:(bg-gray-300 shadow-4xl shadow-gray-500)">
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
    <Menubar
      :machines="machines"
      :selected-machines="selectedMachines"
      @delete-machine="deleteMachine"
      @add-machine="addMachine"
    />
    <MachinesTable
      :machines="machines"
      :selected-machines="selectedMachines"
      @machine-selection="machineSelection"
    />
  </div>
</template>

<style scoped>

</style>
