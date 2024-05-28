FROM node:20.11-alpine as base

RUN apk add --no-cache libc6-compat

FROM base as workspace

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /workspace

RUN corepack enable

FROM workspace as build

COPY out/json/pnpm-*.yaml out/json/.npmrc ./

RUN \
  --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm fetch --frozen-lockfile

COPY out/json/ ./

RUN \
  --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --offline --frozen-lockfile --ignore-scripts=false

COPY out/full ./

ARG APP_NAME
ARG APP_VERSION
ARG APP_BUILD_DATE
ARG APP_COMMIT_HASH

# Build environment
ENV APP_NAME=${APP_NAME}
ENV APP_VERSION=${APP_VERSION}
ENV APP_BUILD_DATE=${APP_BUILD_DATE}
ENV APP_COMMIT_HASH=${APP_COMMIT_HASH}

ARG TURBO_CONFIG={}
ARG TURBO_FORCE=false

ENV TURBO_FORCE=${TURBO_FORCE}

RUN mkdir -p .turbo && echo "$TURBO_CONFIG" > .turbo/config.json

RUN \
  --mount=type=secret,id=TURBO_TOKEN \
  TURBO_TOKEN=$(cat /run/secrets/TURBO_TOKEN) \
  pnpx turbo build --filter ${APP_NAME} --remote-only

FROM base

WORKDIR /app

ARG APP_NAME
ARG APP_PORT=3000
ARG APP_OUT_DIR=.output
ARG APP_DEPENDENCIES

ENV NODE_ENV=production

COPY --from=build --chown=node:node /workspace/apps/${APP_NAME}/package.json ./
COPY --from=build --chown=node:node /workspace/apps/${APP_NAME}/${APP_OUT_DIR} ${APP_OUT_DIR}

# Create a directory for apps to write data in
# Then install environment dependencies
RUN mkdir data \
  && chown node:node data \
  && if [ -n "${APP_DEPENDENCIES}" ]; then \
    apk add --no-cache ${APP_DEPENDENCIES}; \
  fi

EXPOSE ${APP_PORT}

USER node
RUN npm config set update-notifier false
ENTRYPOINT [ "npm", "start" ]
