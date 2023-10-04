# Teleskop Database Documentation
```yaml
  https://eliarelektronik.atlassian.net/wiki/spaces/TB/pages/9764869/Teleskop+Database+-+1.4+-
```

# Example docker-compose.yml

```yaml
version: '3.11'
services:
  multi-monitor:
    image: https://gitlab.com/eliarelektronik/dijital_boyahane/multi-monitor
    init: true
    ports:
      - '5000:3000'
    networks:
      - teleskop-network
    environment:
      NUXT_TELESKOP_HOST: ${TELESKOP_HOST}
      NUXT_TELESKOP_PORT: ${TELESKOP_PORT}
      NUXT_TELESKOP_USER: ${TELESKOP_USER}
      NUXT_TELESKOP_PASSWORD: ${TELESKOP_PASSWORD}
      NUXT_TELESKOP_DATABASE: ${TELESKOP_DB}
      NUXT_MACHINE_STATUS_URL: ${MACHINE_STATUS_URL}
      NUXT_TELESKOP_HAS_DY_LOGS: ${BOOLEAN}
      NUXT_IS_STAGING: ${BOOLEAN}
      NUXT_PUBLIC_WEBSOCKIFY_PORT: ${WEBSOCKIFY_PORT}
    pull_policy: always

  machine-status:
    image: registry.gitlab.com/eliargemes/machinestatusweb
    init: true
    networks:
      - teleskop-network
    ports:
      - '3000:80'
    environment:
      SQL_SERVER_TELESKOP_DATABASE: ${TELESKOP_DB}
      SQL_SERVER_TELESKOP_HOST: ${TELESKOP_HOST}
      SQL_SERVER_TELESKOP_USER: ${TELESKOP_USER}
      SQL_SERVER_TELESKOP_PASSWORD: ${TELESKOP_PASSWORD}
      SQL_SERVER_ERP_HOST: ${TELESKOP_HOST}
      SQL_SERVER_ERP_USER: ${TELESKOP_USER}
      SQL_SERVER_ERP_PASSWORD: ${TELESKOP_PASSWORD}
    pull_policy: always

  t7-websockify:
    image: registry.gitlab.com/eliarelektronik/dijital_boyahane/t7-websockify
    init: true
    ports:
      - '6800:6800'
    networks:
      - teleskop-network
    environment:
      TELESKOP_HOST: ${TELESKOP_HOST}
      TELESKOP_USER: ${TELESKOP_USER}
      TELESKOP_PASSWORD: ${TELESKOP_PASSWORD}
      TELESKOP_DATABASE: ${TELESKOP_DB}
    pull_policy: always
networks:
  teleskop-network:
    external: true
```
