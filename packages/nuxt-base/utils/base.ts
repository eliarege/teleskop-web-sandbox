export function sleep(duration = 300) {
  return new Promise((r) => {
    setTimeout(r, duration)
  })
}
