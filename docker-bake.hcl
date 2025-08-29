variable "CI_REGISTRY_IMAGE" {
  default = "registry.gitlab.com/eliarelektronik/dijital_boyahane/teleskop-web"
}
variable "CI_COMMIT_TAG" {
  default = ""
  validation {
    condition = CI_COMMIT_TAG == "" || length(regexall("^v[0-9]+\\.[0-9]+\\.[0-9]+(-rc\\.[0-9]+)?$", CI_COMMIT_TAG)) > 0
    error_message = "CI_COMMIT_TAG should match pattern ^v[0-9]+\\.[0-9]+\\.[0-9]+(-rc\\.[0-9]+)?$"
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
    "com.eliar.manifest.name" = APP_NAME,
    "com.eliar.manifest.version" = CI_COMMIT_TAG,
    "com.eliar.manifest.roles" = APP_ROLES,
    "com.eliar.manifest.build.commit_hash" = CI_COMMIT_SHA,
    "com.eliar.manifest.build.date" = BUILD_DATE
  }
  secret = [
    "type=env,id=TURBO_TOKEN"
  ]
  tags = concat(
    CI_COMMIT_TAG != "" ? ["${CI_REGISTRY_IMAGE}/${APP_NAME}:${CI_COMMIT_TAG}"] : [],
    CI_COMMIT_SHA != "" ? ["${CI_REGISTRY_IMAGE}/${APP_NAME}:${CI_COMMIT_SHA}"] : [],
    length(regexall("^v[0-9]+.[0-9]+.[0-9]+$", CI_COMMIT_TAG)) > 0
      ? ["${CI_REGISTRY_IMAGE}/${APP_NAME}:latest"]
      : []
  )
}

# Applications

target "archive" {
  inherits = ["_common"]
  target = "nuxt-app"
}

target "dispensing-management-systems" {
  inherits = ["_common"]
  target = "nuxt-app"
  args = {
    APP_DEPENDENCIES = "samba"
  }
}

target "dispensing-manager-ui" {
  inherits = ["_common"]
  target = "nuxt-app"
  args = {
    APP_DEPENDENCIES = "samba"
  }
}

target "machine-status" {
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
