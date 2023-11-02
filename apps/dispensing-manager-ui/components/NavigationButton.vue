<script setup lang="ts">
import { defineProps, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const props = defineProps(['type'])
const { t } = useI18n()
const router = useRouter()
function handleClick() {
  if (props.type === 'home') {
    router.push('/')
  } else if (props.type === 'back') {
    router.back()
  }
}
</script>

<template>
  <button class="custom-btn" @click="handleClick">
    <q-icon
      v-if="props.type === 'home'"
      name="home"
      class="btn-icon"
    />
    <q-icon
      v-else-if="props.type === 'back'"
      name="arrow_back"
      class="btn-icon"
    />
  </button>
</template>

<style scoped>
.custom-btn {
  background: none;
  padding: 0.7rem 0.7rem;
  cursor: pointer;
  align-items: center;
  justify-content: center;

}

.btn-icon {
  font-size: 2.5rem;
  color: white;
}
</style>
