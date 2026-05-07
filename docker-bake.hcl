variable "CI_REGISTRY_IMAGE" {
  default = "registry.gitlab.com/eliarelektronik/dijital_boyahane/teleskop-web"
}
variable "CI_COMMIT_TAG" {
  default = ""
  validation {
    condition = (
    CI_COMMIT_TAG == ""
      # Stable and RC releases
      || length(regexall("^v[0-9]+\\.[0-9]+\\.[0-9]+(-rc\\.[0-9]+)?$", CI_COMMIT_TAG)) > 0
      # Hotfix releases
      || length(regexall("^[a-z._-]+@[0-9]+\\.[0-9]+\\.[0-9]+-hotfix[0-9]+$", CI_COMMIT_TAG)) > 0
    )
    error_message = <<EOF
      CI_COMMIT_TAG should match pattern ^v[0-9]+\\.[0-9]+\\.[0-9]+(-rc\\.[0-9]+)?$"
      or ^[a-z._-]+@[0-9]+\\.[0-9]+\\.[0-9]+-hotfix[0-9]+$
    EOF
  }
}
variable "CI_COMMIT_SHA" {
  default = ""
}
variable "TURBO_CONFIG" {
  default = "{}"
}
variable "TURBO_FORCE" {
  default = false
}
variable "APP_NAME" {
  validation {
    condition = APP_NAME != ""
    error_message = "APP_NAME should be set. Should be same as target"
  }
}
# Maybe we should include manifests with apps
variable "APP_ROLES" {
  default = "[]"
  validation {
    condition = can(length(jsondecode(APP_ROLES)))
    error_message = "APP_ROLES should be JSON array"
  }
}

# Whether the Keycloak client for this app is a public (browser) client.
variable "APP_PUBLIC" {
  default = "true"
}

# Whether this app acts as a service that authenticates via client_credentials flow.
# Service apps get ServiceAccountsEnabled on their Keycloak client and their secret
# is written to env/service-secrets.env during setup-keycloak.
variable "APP_SERVICE" {
  default = "false"
}

variable "BUILD_DATE" {
  default = timestamp()
}

target "_common" {
  args = {
    APP_NAME = APP_NAME,
    APP_VERSION = CI_COMMIT_TAG,
    APP_COMMIT_HASH = CI_COMMIT_SHA,
    APP_BUILD_DATE = BUILD_DATE
    APP_DEPENDENCIES = ""
  }
  cache-from = ["${CI_REGISTRY_IMAGE}/${APP_NAME}:latest"]
  labels = {
    "com.eliar.manifest.name"             = APP_NAME,
    "com.eliar.manifest.version"          = CI_COMMIT_TAG,
    "com.eliar.manifest.roles"            = APP_ROLES,
    "com.eliar.manifest.public"           = APP_PUBLIC,
    "com.eliar.manifest.service"          = APP_SERVICE,
    "com.eliar.manifest.build.commit_hash" = CI_COMMIT_SHA,
    "com.eliar.manifest.build.date"       = BUILD_DATE
  }
  secret = [
    "type=env,id=TURBO_TOKEN"
  ]
  tags = concat(
    CI_COMMIT_TAG != ""
      ? length(regexall("@", CI_COMMIT_TAG)) > 0
        ? ["${CI_REGISTRY_IMAGE}/${APP_NAME}:${regex_replace(CI_COMMIT_TAG, "^.*@", "")}"]
        : ["${CI_REGISTRY_IMAGE}/${APP_NAME}:${CI_COMMIT_TAG}"]
      : [],
    CI_COMMIT_SHA != "" ? ["${CI_REGISTRY_IMAGE}/${APP_NAME}:${CI_COMMIT_SHA}"] : [],
    # Stable releases get latest tag
    length(regexall("^v[0-9]+\\.[0-9]+\\.[0-9]+$", CI_COMMIT_TAG)) > 0
      ? ["${CI_REGISTRY_IMAGE}/${APP_NAME}:latest"]
      : [],
    # Hotfix releases also get latest tag
    length(regexall("^${APP_NAME}@[0-9]+\\.[0-9]+\\.[0-9]+-hotfix[0-9]+$", CI_COMMIT_TAG)) > 0
      ? ["${CI_REGISTRY_IMAGE}/${APP_NAME}:latest"]
      : []
  )
}

# Applications

target "archive" {
  inherits = ["_common"]
  target = "nuxt-app"
}

target "recipes" {
  inherits = ["_common"]
  target = "nuxt-app"
}

target "dispensing-manager-ui" {
  inherits = ["_common"]
  target = "nuxt-app"
  args = {
    APP_DEPENDENCIES = "samba"
  }
}

target "iovalues-server" {
  inherits = ["_common"]
  target = "node-app"
  args = {
    APP_BUILD_DIR = "dist"
  }
}

target "machine-status" {
  inherits = ["_common"]
  target = "node-app"
  args = {
    APP_BUILD_DIR = "dist"
  }
  variables = {
    APP_PUBLIC  = "false"
    APP_SERVICE = "true"
  }
}

target "communication-driver" {
  inherits = ["_common"]
  target = "node-app"
  args = {
    APP_BUILD_DIR = "dist"
  }
}

target "machines" {
  inherits = ["_common"]
  target = "nuxt-app"
}

target "migration-service" {
  inherits = ["_common"]
  target = "node-app"
  args = {
    APP_BUILD_DIR = "dist"
  }
}

target "multi-monitor" {
  inherits = ["_common"]
  target = "nuxt-app"
}

target "planning-board" {
  inherits = ["_common"]
  target = "nuxt-app"
}

target "planning-board-engine" {
  inherits = ["_common"]
  target = "node-app"
  variables = {
    APP_PUBLIC  = "false"
    APP_SERVICE = "true"
  }
}

target "program-editor" {
  inherits = ["_common"]
  target = "nuxt-app"
}

target "root" {
  inherits = ["_common"]
  target = "nuxt-app"
}

target "websockify" {
  inherits = ["_common"]
  target = "node-app"
  args = {
    APP_BUILD_DIR = "dist"
  }
}
