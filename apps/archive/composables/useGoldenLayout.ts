import type { ComponentContainer, ComponentItem, ComponentItemConfig, JsonValue, LayoutConfig, ResolvedComponentItemConfig, ResolvedStackItemConfig, RowOrColumn, RowOrColumnItemConfig, StackItemConfig } from 'golden-layout'
import { ContentItem, GoldenLayout } from 'golden-layout'
import { onMounted, ref, shallowRef } from 'vue'

export const isClient = typeof window !== 'undefined'
export const isDocumentReady = () => isClient && document.readyState === 'complete' && document.body != null

export function useDocumentReady(func: () => void) {
  onMounted(() => {
    if (isDocumentReady())
      func()
    else
      document.addEventListener('readystatechange', () => isDocumentReady() && func(), {
        passive: true,
      })
  })
}

export function useGoldenLayout(
  createComponent: (type: string, container: HTMLElement, props?: JsonValue) => ComponentContainer.Component,
  destroyComponent: (container: HTMLElement) => void,
  config?: LayoutConfig,
) {
  const { t, locale } = useI18n()
  const element = shallowRef<HTMLElement | null>(null)
  const layout = shallowRef<GoldenLayout | null>(null)
  const initialized = ref(false)

  const getI18nKey = (config: ResolvedComponentItemConfig) => {
    return (config.componentState as any)?.i18nKey as string | undefined
  }

  const translateComponentTitles = (layout: GoldenLayout) => {
    const recurse = (item: ContentItem) => {
      if (ContentItem.isComponentItem(item)) {
        const config = item.toConfig()
        const i18nKey = getI18nKey(config)
        if (i18nKey)
          item.setTitle(t(i18nKey))
      } else {
        item.contentItems.forEach(recurse)
      }
    }
    if (layout.rootItem) {
      layout.rootItem.contentItems.forEach(recurse)
    }
  }

  let goldenLayout: GoldenLayout | undefined

  watch(locale, () => {
    if (goldenLayout) {
      translateComponentTitles(goldenLayout)
    }
  })

  useDocumentReady(() => {
    if (element.value == null)
      throw new Error('Element must be set.')
    goldenLayout = new GoldenLayout(element.value)
    goldenLayout.resizeWithContainerAutomatically = true
    goldenLayout.resizeDebounceExtendedWhenPossible = true
    goldenLayout.resizeDebounceInterval = 200

    goldenLayout.bindComponentEvent = (container, itemConfig) => {
      const { componentType } = itemConfig
      if (typeof componentType !== 'string')
        throw new Error('Invalid component type.')
      const component = createComponent(componentType, container.element)
      return {
        component,
        virtual: false,
      }
    }
    goldenLayout.unbindComponentEvent = (container) => {
      destroyComponent(container.element)
    }

    if (config != null)
      goldenLayout.loadLayout(config)

    layout.value = goldenLayout

    initialized.value = true
  })

  return { element, initialized, layout }
}
