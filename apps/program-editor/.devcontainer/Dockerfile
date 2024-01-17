FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

# [Optional] Uncomment this section to install additional OS packages.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends iputils-ping

ARG PNPM_HOME=/pnpm
ENV PNPM_HOME=${PNPM_HOME}
ENV PATH="$PNPM_HOME:$PATH"

RUN mkdir -p /home/node/.local/bin \
  && corepack enable --install-directory /home/node/.local/bin \
  && corepack prepare pnpm@latest-8 --activate
