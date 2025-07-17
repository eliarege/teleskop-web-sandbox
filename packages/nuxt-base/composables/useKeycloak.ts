import type { KeycloakPlugin } from '../modules/keycloak/runtime/plugin'

export function useKeycloak(): KeycloakPlugin {
  const { $keycloak } = useNuxtApp()
  return $keycloak as KeycloakPlugin
}
