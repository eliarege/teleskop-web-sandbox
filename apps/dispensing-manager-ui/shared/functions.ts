export async function navigateToPage(page: string) {
  await navigateTo(`/${page}`)
}

export function textAlignOverride(pos: string) {
  if (pos === 'center')
    return 'text-override-center'
  if (pos === 'left')
    return 'text-override-left'
  if (pos === 'right')
    return 'text-override-right'
}
