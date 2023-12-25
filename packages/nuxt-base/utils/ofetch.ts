export function setHeader(init: Omit<RequestInit, 'body'>, name: string, value: string): void {
  if (Array.isArray(init.headers)) {
    init.headers.push([name, value])
  } else if (init.headers instanceof Headers) {
    init.headers.set(name, value)
  } else {
    init.headers ||= {}
    init.headers[name] = value
  }
}
