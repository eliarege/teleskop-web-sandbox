FROM node:18-alpine as base

RUN apk add --no-cache libc6-compat

FROM base as workspace

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /workspace

RUN corepack enable
RUN corepack prepare pnpm@latest-8 --activate

COPY out/json/pnpm-*.yaml out/json/.npmrc ./

RUN \
  --mount=type=cache,id=pnpm,target=/pnpm/store \
  --mount=type=secret,id=NPM_TOKEN,required=true \
  NPM_TOKEN=$(cat /run/secrets/NPM_TOKEN) pnpm fetch --frozen-lockfile

COPY out/json/ ./

RUN --mount=type=secret,id=NPM_TOKEN,required=true \
  NPM_TOKEN=$(cat /run/secrets/NPM_TOKEN) pnpm install --offline --frozen-lockfile

COPY out/full ./

ARG APP_NAME
ARG TURBO_CONFIG

RUN mkdir -p .turbo && echo "$TURBO_CONFIG" > .turbo/config.json

RUN \
  --mount=type=secret,id=NPM_TOKEN,required=true \
  --mount=type=secret,id=TURBO_TOKEN \
  NPM_TOKEN=$(cat /run/secrets/NPM_TOKEN) \
  TURBO_TOKEN=$(cat /run/secrets/TURBO_TOKEN) \
  pnpx turbo build --filter ${APP_NAME}

FROM base

WORKDIR /app

ARG APP_NAME
ARG APP_VERSION

ENV APP_NAME=${APP_NAME}
ENV APP_VERSION=${APP_VERSION}
ENV NODE_ENV=production

COPY --from=workspace /workspace/apps/${APP_NAME}/package.json ./
COPY --from=workspace /workspace/apps/${APP_NAME}/.output .output

EXPOSE 3000

USER node

ENTRYPOINT [ "npm", "start" ]

