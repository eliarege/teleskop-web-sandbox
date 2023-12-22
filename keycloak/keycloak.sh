#!/bin/bash

DIR=$(dirname $0)

case "$1" in
  up)
    shift
    if [[ ! -e $DIR/keycloak-token-inspector/dist ]]; then
      cd $DIR/keycloak-token-inspector && pnpm build && cd -
    fi
    exec docker compose -f $DIR/docker-compose.yml -p teleskop up -d $@
    ;;
  sync)
    out=$(script -q /dev/null -c "pnpm exec tsx $DIR/keycloak-sync/bin/sync.ts" | tee /dev/tty)
    # NodeJS BUG: `fetch` exits the process silently if Keycloak has not been initialized.
    # If the sync process exits with 0 and has no output, weinfer it's due to the fetch issue.
    if [[ -z $out && $? -eq 0 ]]; then
      echo "[ERROR] Keycloak has not been initialized."
      exit 1
    fi
    ;;
  create | down | kill | restart | pull | start | stop)
    exec docker compose -f $DIR/docker-compose.yml -p teleskop $@
    ;;
  *)
    echo "Usage: $0 {up|sync|create|down|kill|restart|pull|start|stop}"
    ;;
esac
