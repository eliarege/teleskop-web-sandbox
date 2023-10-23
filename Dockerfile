FROM node:18.18-alpine as base

RUN apk add --no-cache libc6-compat

FROM base as workspace

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /workspace

RUN corepack enable
RUN corepack prepare pnpm@latest-8 --activate

FROM workspace as build

# COPY out/json/pnpm-*.yaml out/json/.npmrc ./

# RUN \
#   --mount=type=cache,id=pnpm,target=/pnpm/store \
#   --mount=type=secret,id=NPM_TOKEN,required=true \
#   NPM_TOKEN=$(cat /run/secrets/NPM_TOKEN) pnpm fetch --frozen-lockfile

COPY out/json/ ./

RUN \
  --mount=type=cache,id=pnpm,target=/pnpm/store \
  --mount=type=secret,id=NPM_TOKEN,required=true \
  NPM_TOKEN=$(cat /run/secrets/NPM_TOKEN) pnpm install --no-frozen-lockfile

COPY out/full ./

ARG APP_NAME
ARG TURBO_CONFIG={}
ARG TURBO_FORCE=false

ENV TURBO_FORCE=${TURBO_FORCE}

RUN mkdir -p .turbo && echo "$TURBO_CONFIG" > .turbo/config.json

RUN \
  --mount=type=secret,id=NPM_TOKEN,required=true \
  --mount=type=secret,id=TURBO_TOKEN \
  NPM_TOKEN=$(cat /run/secrets/NPM_TOKEN) \
  TURBO_TOKEN=$(cat /run/secrets/TURBO_TOKEN) \
  pnpx turbo build --filter ${APP_NAME} --remote-only

FROM workspace as dependencies

COPY out/json/ ./

RUN \
  --mount=type=secret,id=NPM_TOKEN,required=true \
  NPM_TOKEN=$(cat /run/secrets/NPM_TOKEN) \
  pnpm install --prod --no-frozen-lockfile

RUN ls node_modules

FROM base as common

WORKDIR /app

ARG APP_NAME
ARG APP_VERSION
ARG APP_PORT=3000
ARG APP_OUT_DIR=.output

ENV APP_NAME=${APP_NAME}
ENV APP_VERSION=${APP_VERSION}
ENV NODE_ENV=production

COPY --from=build /workspace/apps/${APP_NAME}/package.json ./
COPY --from=build /workspace/apps/${APP_NAME}/${APP_OUT_DIR} ${APP_OUT_DIR}

EXPOSE ${APP_PORT}

FROM common as nuxt

USER node
ENTRYPOINT [ "npm", "start" ]

FROM common as node

COPY --from=dependencies /workspace/node_modules node_modules
USER node
ENTRYPOINT [ "npm", "start" ]
