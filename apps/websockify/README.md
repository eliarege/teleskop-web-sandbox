# T7 Websockify

NoVNC için WebSocket Proxy. Teleskopta tanımlanmış cihazlardaki VNC sunucularına WebSocket trafiğini yönlendirir.


## Kullanım

[noVNC](https://www.npmjs.com/package/@novnc/novnc) ile `ws://localhost:{SERVER_PORT}/{MACHINEID}` adresi parametre olarak verilir.

`MACHINEID` teleskoptaki makine id'sine tekabül etmektedir.

```js
import RFB from '@novnc/novnc'

// ...

const url = `ws://${SERVER_HOST}:${SERVER_PORT}/${MACHINEID}`
const rfb = new RFB(screen, url, {
  credentials: {
    password: '123456'
  }
})

```

## Environment Variables

- `SERVER_HOST`
- `SERVER_PORT`
- `TELESKOP_HOST`
- `TELESKOP_PORT`
- `TELESKOP_USER`
- `TELESKOP_PASSWORD`
- `TELESKOP_DATABASE`
- `TARGET_HOST`
- `TARGET_PORT`
- `LOG_LEVEL`

## Example Docker Run

```sh
docker run -d --init \
  --name t7-websockify \
  -p 6800:6800
  registry.gitlab.com/teleskopnext/t7-websockify
```
