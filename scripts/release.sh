#!/bin/sh
# This script:
#  - assumes 'out' directory contains the build output
#  - expects to be run in gitlab ci environment
#  - uses busybox date function

set -e

throw() {
  echo "ERROR: $1" >&2
  exit 1
}

APP_NAME=$1

if [ -z "$APP_NAME" ]; then
  throw "App name is not defined"
fi

if [ ! -e "apps/$APP_NAME" ]; then
  throw "App \"$APP_NAME\" does not exist"
fi

if [ -z "$CI_REGISTRY_IMAGE" ]; then
  throw "Should be run via gitlab-ci"
fi

IMAGE_TAG=$CI_REGISTRY_IMAGE/$APP_NAME:$CI_COMMIT_TAG
IMAGE_SHA=$CI_REGISTRY_IMAGE/$APP_NAME:$CI_COMMIT_SHA
IMAGE_LATEST=$CI_REGISTRY_IMAGE/$APP_NAME:latest

BUILD_DATE=$(date -u -Iseconds)
PKG_PATH=apps/$APP_NAME/package.json
MANIFEST_PATH=apps/$APP_NAME/manifest.json

echo "Building $APP_NAME"

docker pull $IMAGE_LATEST || true
docker build \
  --cache-from $IMAGE_LATEST \
  --build-arg APP_NAME="$APP_NAME" \
  --build-arg APP_VERSION="$CI_COMMIT_TAG" \
  --build-arg APP_COMMIT_HASH="$CI_COMMIT_SHA" \
  --build-arg APP_BUILD_DATE="$BUILD_DATE" \
  --build-arg APP_PORT="$(jq -r .eliar.port $PKG_PATH)" \
  --build-arg APP_OUT_DIR="$(jq -r .eliar.outDir $PKG_PATH)" \
  --build-arg APP_DEPENDENCIES="$(jq -r '.envDependencies | join(" ")' $MANIFEST_PATH 2> /dev/null || echo '')" \
  --build-arg TURBO_CONFIG="$TURBO_CONFIG" \
  --build-arg TURBO_FORCE="$TURBO_FORCE" \
  --label com.eliar.manifest.name="$APP_NAME" \
  --label com.eliar.manifest.version="$CI_COMMIT_TAG" \
  --label com.eliar.manifest.roles="$(jq -Mc .roles $MANIFEST_PATH 2> /dev/null || echo '[]')" \
  --label com.eliar.manifest.build.commit_hash="$CI_COMMIT_SHA" \
  --label com.eliar.manifest.build.date="$BUILD_DATE" \
  --secret id=NPM_TOKEN \
  --secret id=TURBO_TOKEN \
  -t $IMAGE_TAG -t $IMAGE_SHA .

docker push $IMAGE_TAG
docker push $IMAGE_SHA

LATEST_PATTERN="^v[0-9]+\.[0-9]+\.[0-9]+$"

# If tag complies with the standard, tag it as latest
if [ $(echo $CI_COMMIT_TAG | grep -E $LATEST_PATTERN) ]; then
  docker tag $IMAGE_TAG $IMAGE_LATEST
  docker push $IMAGE_LATEST
fi
