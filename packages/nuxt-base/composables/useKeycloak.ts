import type { KeycloakPlugin } from '../plugins/01.keycloak.client'

export function useKeycloak(): KeycloakPlugin {
  const { $keycloak } = useNuxtApp()
  return $keycloak as KeycloakPlugin
}
