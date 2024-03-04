APP_NAME=dispensing-manager-ui
PROJECT_ROOT=$(realpath $(dirname $0)/../..)
APP_ROOT=$PROJECT_ROOT/apps/$APP_NAME
PKG_PATH=$APP_ROOT/package.json
MANIFEST_PATH=$APP_ROOT/manifest.json

rm -rf out
pnpm dlx turbo prune --scope=$APP_NAME --docker

docker build \
  --build-arg APP_NAME="$APP_NAME" \
  --build-arg APP_VERSION="1.0.0" \
  --build-arg APP_PORT=$(jq -r .eliar.port $PKG_PATH) \
  --build-arg APP_OUT_DIR=$(jq -r .eliar.outDir $PKG_PATH) \
  --build-arg APP_DEPENDENCIES="$(jq -r '.envDependencies | join(" ")' $MANIFEST_PATH 2> /dev/null | echo '')" \
  --secret id=NPM_TOKEN \
  --secret id=TURBO_TOKEN \
  --progress plain \
  -t registry.gitlab.com/eliarelektronik/dijital_boyahane/teleskop-web/$APP_NAME:test $PROJECT_ROOT
