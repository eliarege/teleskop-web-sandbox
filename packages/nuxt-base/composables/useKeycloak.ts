export function useKeycloak() {
  const { $keycloak } = useNuxtApp()
  return $keycloak
}
