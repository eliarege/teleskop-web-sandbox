import type { KeycloakPlugin } from '../plugins/01.keycloak.client'

export function useKeycloak() {
  const { $keycloak } = useNuxtApp()
  return $keycloak as KeycloakPlugin
}
