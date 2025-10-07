<script setup lang="ts">
export interface IContextMenuOption {
  label: string
  category: string
  icon?: string
  disabled?: boolean
  onClick: (data: any) => void
}

const props = defineProps<{
  options: IContextMenuOption[]
  target?: string | Element
}>()
const emit = defineEmits<{
  click: [option: IContextMenuOption]
}>()
function handleClick(event: Event, option: IContextMenuOption) {
  if (option.disabled)
    event.preventDefault()
  else {
    emit('click', option)
  }
}
</script>

<template>
  <q-menu
    touch-position
    context-menu
    class="whitespace-nowrap"
    :transition-duration="0"
    :target="props.target"
  >
    <q-list>
      <q-item
        v-for="option in props.options"
        :key="option.category"
        v-close-popup="!option.disabled"
        :disable="option.disabled"
        clickable
        dense
        class="q-item-avatar-dense px-2.5 whitespace-nowrap"
        @click="event => handleClick(event, option)"
      >
        <q-item-section avatar class="px-0 mr-2.5 opacity-60">
          <q-icon
            size="1rem"
            dense
            :name="option.icon"
          />
        </q-item-section>
        <q-item-section>
          {{ option.label }}
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>
