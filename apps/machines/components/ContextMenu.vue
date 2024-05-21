<script setup lang="ts">
export interface IContextMenuOption {
  label: string
  category: string
  keybind: string
  icon: string
  disabled: boolean
  onClick: (data: any) => void
}

const props = defineProps<{
  contextMenuOptions: IContextMenuOption[]
  target: string | boolean | Element | undefined
}>()

const emit = defineEmits(['click'])

function handleClick(event, option: IContextMenuOption) {
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
    class="whitespace-nowrap w-fit pr-12"
    :target="target ?? true"
  >
    <q-list>
      <template
        v-for="option in props.contextMenuOptions"
        :key="option.category"
      >
        <q-item
          v-close-popup="!option.disabled"
          clickable
          dense
          :class="option.disabled ? 'text-gray cursor-not-allowed' : ''"
          @click="event => handleClick(event, option)"
        >
          <q-item-section class="flex w-8 justify-center items-center">
            <q-icon :name="option.icon" />
          </q-item-section>
          <q-item-section>
            {{ option.label }}
          </q-item-section>
          <q-space />
          <q-item-section class="mr-5">
            {{ option.keybind }}
          </q-item-section>
        </q-item>
      </template>
    </q-list>
  </q-menu>
</template>
