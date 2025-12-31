# Playground

## Unsaved Changes

Need to patch `quasar` with following:

1) Update `processHide` function at `quasar/src/composables/private.use-model-toggle/use-model-toggle.js` with

> Required for `production`:

```js
function processHide (evt) {
  if (showing.value === false) {
    return
  }

  showing.value = false
  const event = evt ?? {}

  emit('beforeHide', event)

  if (event.qPreventHide) {
    showing.value = true
    return
  }

  if (handleHide !== void 0) {
    handleHide(event)
  }
  else {
    emit('hide', event)
  }
}
```

2) Update `processHide` function at `quasar/dist/quasar.client.js` with:

> Required for `development`:

```js
function processHide(evt) {
  if (showing.value === false) {
    return;
  }
  showing.value = false;
  const event = evt ?? {}
  emit("beforeHide", event);
  if (event.qPreventHide) {
    showing.value = true;
    return;
  }
  if (handleHide !== void 0) {
    handleHide(event);
  } else {
    emit("hide", event);
  }
}
```
