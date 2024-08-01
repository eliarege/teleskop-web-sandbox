export interface KeycloakScope {
  scope?: string
  name?: string
  preferred_username?: string
  session_state?: string
  realm_access?: {
    roles: string[]
  }
  resource_access?: Record<string, {
    roles: string[]
  }>
}
