export interface KeycloakScope {
  scope?: string
  // profile scope
  name?: string
  preferred_username?: string
  full_name?: string
  birthdate?: string
  gender?: string
  profile?: string
  picture?: string
  website?: string
  username?: string
  zoneinfo?: string
  nickname?: string
  updated_at?: number
  family_name?: string
  given_name?: string
  locale?: string
  middle_name?: string
  // email scope
  email?: string
  email_verified?: boolean
  session_state?: string
  realm_access?: {
    roles: string[]
  }
  resource_access?: Record<string, {
    roles: string[]
  }>

}
