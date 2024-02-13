<script setup lang="ts">
const { t } = useI18n()

const showAddMachineSystemSetting = ref(false)
const check = ref(false)
</script>

<template>
  <q-card>
    <q-card-section>
      <h3>Settings will be updated on machines</h3>
      <q-btn label="add" @click="showAddMachineSystemSetting = true" />
      <q-btn label="delete" />
      <q-list>
        <q-list-item>
          example setting
        </q-list-item>
      </q-list>

      <h3>machines that will be updated</h3>
      <q-btn label="select all" />
      <q-btn label="deselect all" />
      <q-list>
        <q-list-item>
          <q-checkbox v-model="check" label="example machine" />
        </q-list-item>
      </q-list>

      <div>
        <q-btn label="Send" />
        <q-btn label="Cancel" />
      </div>
    </q-card-section>
  </q-card>

  <AddMachineSystemSettingDialog
    v-if="showAddMachineSystemSetting"
    :show="showAddMachineSystemSetting"
    @close="showAddMachineSystemSetting = false"
  />
</template>

<style scoped>

</style>
