export function isActiveElementEditable(): boolean {
  const activeElement = document.activeElement as HTMLElement | null;
  if (!activeElement)
      return false

  return activeElement.tagName === "INPUT"
    || activeElement.tagName === "TEXTAREA" 
    || activeElement.isContentEditable
}
