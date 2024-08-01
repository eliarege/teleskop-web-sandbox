const BEARER_RE = /^[Bb]earer$/

export function isBearer(token: string): boolean {
  return BEARER_RE.test(token)
}
