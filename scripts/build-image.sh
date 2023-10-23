APP_NAME=root
PKG_PATH=apps/$APP_NAME/package.json

rm -rf out
npx turbo prune --scope=$APP_NAME --docker

docker build \
  --target $(jq -r .eliar.type $PKG_PATH) \
  --build-arg APP_NAME="$APP_NAME" \
  --build-arg APP_VERSION="1.0.0" \
  --build-arg APP_PORT=$(jq -r .eliar.port $PKG_PATH) \
  --build-arg APP_OUT_DIR=$(jq -r .eliar.outDir $PKG_PATH) \
  --secret id=NPM_TOKEN \
  --secret id=TURBO_TOKEN \
  --progress plain \
  -t registry.gitlab.com/eliarelektronik/dijital_boyahane/teleskop-web/$APP_NAME:test .
