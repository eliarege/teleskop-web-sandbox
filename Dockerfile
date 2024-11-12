###############
## Base Image
###############
FROM node:22.11-alpine AS base

RUN apk add --no-cache gcompat

##########################
## Standard Build Stage
##########################
FROM base AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /opt/build

COPY out/json/pnpm-*.yaml out/json/.npmrc ./

RUN \
  --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm fetch --frozen-lockfile

COPY out/json/ ./

RUN \
  --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --offline --frozen-lockfile --ignore-scripts=false

COPY out/full ./

ARG TURBO_CONFIG={}
ARG TURBO_FORCE=false

ENV TURBO_FORCE=${TURBO_FORCE}

RUN mkdir -p .turbo && echo "$TURBO_CONFIG" > .turbo/config.json

ARG APP_NAME

RUN \
  --mount=type=secret,id=TURBO_TOKEN \
  TURBO_TOKEN=$(cat /run/secrets/TURBO_TOKEN) \
  pnpm exec turbo build --filter ${APP_NAME} --remote-only

##########################
## Nuxt Apps
##########################
FROM base AS nuxt

WORKDIR /opt/app

ENV NODE_ENV=production

ARG APP_NAME
ARG APP_DEPENDENCIES

# Install environment dependencies
RUN \
  if [ -n "${APP_DEPENDENCIES}" ]; then \
    apk add --no-cache ${APP_DEPENDENCIES}; \
  fi

RUN chown -R node:node /opt/app

COPY --from=build /opt/build/apps/${APP_NAME}/.output ./

ARG APP_VERSION
ARG APP_BUILD_DATE
ARG APP_COMMIT_HASH

ENV NUXT_TW_NAME=${APP_NAME}
ENV NUXT_TW_VERSION=${APP_VERSION}
ENV NUXT_TW_BUILD_DATE=${APP_BUILD_DATE}
ENV NUXT_TW_COMMIT_HASH=${APP_COMMIT_HASH}

EXPOSE 3000

USER node

ENTRYPOINT [ "node", "./server/index.mjs" ]

########################################
## Extended Build Stage for Node Apps
########################################
FROM build AS deploy-node

WORKDIR /opt/deploy

ARG APP_NAME

# Here we assume node apps are bundled in `dist` via `@teleskop/build-utils`.
# It's possible to do this without this assumption but it's a lot more complex.
# Read more: https://gitlab.com/eliarelektronik/dijital_boyahane/teleskop-web/-/commit/82687055346afa7c6c6c0f3cab0f380d5983c19a

# Extract start script from `package.json`, move build output to deploy
RUN cp -r /opt/build/apps/${APP_NAME}/dist /opt/build/apps/${APP_NAME}/package.json ./ \
  && node -e "console.log('#!/bin/sh\nexec ' + require('./package.json').scripts.start)" > ./start \
  && chmod +x ./start

###############
## Node Apps
###############
FROM base AS node

WORKDIR /opt/app

ENV NODE_ENV=production

ARG APP_DEPENDENCIES

# Install environment dependencies
RUN \
  if [ -n "${APP_DEPENDENCIES}" ]; then \
    apk add --no-cache ${APP_DEPENDENCIES}; \
  fi

RUN chown -R node:node /opt/app

COPY --from=deploy-node /opt/deploy /opt/app

ARG APP_NAME
ARG APP_VERSION
ARG APP_BUILD_DATE
ARG APP_COMMIT_HASH

ENV APP_NAME=${APP_NAME}
ENV APP_VERSION=${APP_VERSION}
ENV APP_BUILD_DATE=${APP_BUILD_DATE}
ENV APP_COMMIT_HASH=${APP_COMMIT_HASH}

USER node

ENTRYPOINT [ "/opt/app/start" ]
