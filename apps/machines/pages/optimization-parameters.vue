<script setup lang="ts">
const selectedOption = ref()
const showAddMachineGroupDialog = ref(false)
const selectedMachineGroup = ref(false)
const options = []
</script>

<template>
  <q-card>
    <q-card-section class="flex flex-col justify-between">
      <div class="flex flex-row justify-around">
        <div>
          <h3>Makine Grupları</h3>
          <q-icon name="add" @click="showAddMachineGroupDialog = true" />
          <q-list>
            <q-item>
              Eliar
            </q-item>
          </q-list>
        </div>
        <div>
          <h3>Parametre Listesi</h3>
          <q-list>
            <q-item>
              Parametre 1
            </q-item>
          </q-list>
        </div>
        <div>
          <q-select
            v-model="selectedOption"
            :options="options"
            label="ERP Eşleştirme Alanı"
            filled
            class="w-xs"
          />
        </div>
      </div>
      <div>
        <q-table />
      </div>
    </q-card-section>
  </q-card>
  <AddMachineGroupDialog
    v-if="showAddMachineGroupDialog"
    :show="showAddMachineGroupDialog"
    :selected="selectedMachineGroup"
    @close="showAddMachineGroupDialog = false"
  />
</template>

<style scoped>

</style>
