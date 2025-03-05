import type { KeycloakPlugin } from '../modules/keycloak/plugin'

export function useKeycloak(): KeycloakPlugin {
  const { $keycloak } = useNuxtApp()
  return $keycloak as KeycloakPlugin
}
