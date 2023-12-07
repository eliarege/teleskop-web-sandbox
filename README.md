# Teleskop Web

## Nuxt Layer

### `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      kcUrl: 'http://keycloak:8080',
      kcRealm: 'teleskop-web',
      kcClientId: 'nuxt-client'
    }
  }
})
```

#### `kcUrl`

Configurable via `NUXT_PUBLIC_KC_URL` environment variable. Keycloak URL.

#### `kcRealm`

Configurable via `NUXT_PUBLIC_KC_REALM` environment variable. Keycloak Realm, default is `teleskop-web`.

#### `kcClientId`

Configurable via `NUXT_PUBLIC_KC_CLIENT_ID` environment variable. Keycloak Client ID, should be same as app name.

### Composables

#### `useAuthFetch`

Wrapper around `useFetch` that sets `Authorization` header for configured keycloak server.

#### `createAuthFetch`

Returns alternate `$fetch` that sets `Authorization` headers for configured keycloak server.

#### `useKeycloak`

Returns keycloak composition API.

```ts
interface KeycloakPlugin {
  ready: Readonly<Ref<boolean>>
  /** Did keycloak initialise? **/
  didInitialise: Readonly<Ref<boolean>>
  /** Access Token **/
  token: Readonly<Ref<string | undefined>>
  /** Is user authenticated **/
  authenticated: Readonly<Ref<boolean>>
  userProfile: Readonly<Ref<KeycloakProfile | undefined>>
  userInfo: Readonly<Ref<Record<string, any> | undefined>>
  /** Redirects to login form. */
  login: () => void
  /** Redirects to logout. */
  logout: () => void
  /** Redirects to registration form. */
  register: () => void
  /** Called when keycloak is initialised */
  onReady: EventHookOn<boolean>
  /** Called when a user is successfully authenticated. */
  onAuthSuccess: EventHookOn
  /** Called if there was an error during authentication. */
  onAuthError: EventHookOn<KeycloakError>
  /** Called when the token is refreshed. */
  onAuthRefreshSuccess: EventHookOn
  /** Called if there was an error while trying to refresh the token. */
  onAuthRefreshError: EventHookOn
  /** Called if the user is logged out (will only be called if the session status iframe is enabled. */
  onAuthLogout: EventHookOn
  /** Called when the access token is expired. If a refresh token is available the token can be refreshed with updateToken, or in cases where it is not (that is, with implicit flow) you can redirect to the login screen to obtain a new access token. */
  onTokenExpired: EventHookOn
  /** Called when a AIA has been requested by the application. */
  onActionUpdate: EventHookOn<'success' | 'cancelled' | 'error'>
  /** Returns true if the token has the given realm role. */
  hasRealmRole: Keycloak['hasRealmRole']
  /** Returns true if the token has the given role for the resource (resource is optional, if not specified clientId is used). */
  hasResourceRole: Keycloak['hasResourceRole']
  /** Returns true if the token has less than minValidity seconds left before it expires (minValidity is optional, if not specified 0 is used). */
  isTokenExpired: Keycloak['isTokenExpired']
  /** If the token expires within minValidity seconds (minValidity is optional, if not specified 5 is used) the token is refreshed. If -1 is passed as the minValidity, the token will be forcibly refreshed. If the session status iframe is enabled, the session status is also checked. */
  updateToken: Keycloak['updateToken']
  /**
   * Clear authentication state, including tokens. This can be useful if application has detected the session was expired, for example if updating token fails.
   *
   * Invoking this results in onAuthLogout callback listener being invoked.
   */
  clearToken: Keycloak['clearToken']
  /** Loads the users info. Updates `userInfo` ref */
  loadUserInfo: () => void
  /** Loads the users profile. Updates `userProfile` ref */
  loadUserProfile: () => void
}
```
