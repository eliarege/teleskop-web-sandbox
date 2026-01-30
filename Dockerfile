# syntax=docker/dockerfile:1

###############
## Base Image
###############
FROM node:22.19-alpine AS base

RUN apk add --no-cache gcompat curl

##########################
## Standard Build Stage
##########################
FROM base AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /opt/build

# Fix for 'Cannot find matching keyid' errors (https://vercel.com/guides/corepack-errors-github-actions)
RUN npm install -g corepack@latest \
  && corepack use pnpm@9

COPY out/json/ ./

RUN \
  --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile --ignore-scripts=false

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
FROM base AS nuxt-app

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


HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT [ "node", "./server/index.mjs" ]

########################################
## Extended Build Stage for Node Apps
########################################
FROM build AS deploy-node

WORKDIR /opt/deploy

ARG APP_NAME
ARG APP_BUILD_DIR=dist

# Here we assume node apps are bundled in a single directory.
# It's possible to do this without this assumption but it's a lot more complex.
# Read more: https://gitlab.com/eliarelektronik/dijital_boyahane/teleskop-web/-/commit/82687055346afa7c6c6c0f3cab0f380d5983c19a

# Extract start script from `package.json`, move build output to deploy
RUN cp -r /opt/build/apps/${APP_NAME}/${APP_BUILD_DIR} /opt/build/apps/${APP_NAME}/package.json ./ \
  && node -e "console.log('#!/bin/sh\nexec ' + require('./package.json').scripts.start)" > ./start \
  && chmod +x ./start

###############
## Node Apps
###############
FROM base AS node-app

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
