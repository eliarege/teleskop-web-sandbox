<script setup lang="ts">
const columns = [
  {
    name: 'name',
    label: 'Bildirim İsmi',
    field: row => row.name,
    align: 'left',
  },
  {
    name: 'action',
    label: 'Olay',
    field: row => row.action,
    align: 'left',
  },
  {
    name: 'parameter',
    label: 'Parametre',
    field: row => row.parameter,
    align: 'left',
  },
]
</script>

<template>
  <q-card>
    <q-card-section class="flex flex-col">
      <div
        class="flex flex-row"
      >
        <q-table
          title="Kayıtlı Bildirimler"
          :columns="columns"
          hide-pagination
          :pagination="{ rowsPerPage: 0 }"
          row-key="reasonId"
          separator="cell"
          bordered
          selection="single"
          table-header-class="table-header"
        />
        <div class="buttons flex flex-col">
          <q-btn label="Yeni Bildirim" />
          <q-btn label="Düzenle" />
          <q-btn label="Sil" />
        </div>
      </div>

      <div class="flex flex-row">
        <q-table
          title="Seçili Bildirim İçin Mail Listesi"
          hide-pagination
          :pagination="{ rowsPerPage: 0 }"
          row-key="reasonId"
          separator="cell"
          bordered
          selection="single"
          table-header-class="table-header"
        />
        <div class="buttons flex flex-col">
          <q-btn label="Kişi Ekle" />
          <q-btn label="Kişi Çıkar" />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>

</style>
