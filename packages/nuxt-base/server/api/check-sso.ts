export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/html')
  return `<!doctype html><html><body><script>parent.postMessage(location.href, location.origin);</script></body></html>`
})
