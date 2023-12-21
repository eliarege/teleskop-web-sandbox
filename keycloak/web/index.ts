import Keycloak from 'keycloak-js'
import hljs from 'highlight.js'
import json from 'highlight.js/lib/languages/json'
import 'highlight.js/styles/github.css'

const keycloak = new Keycloak({
  url: 'http://127.0.0.1:8080',
  realm: 'teleskop-web',
  clientId: 'keycloak-dev',
})
hljs.registerLanguage('json', json)

await keycloak.init({
  onLoad: 'login-required',
})
await keycloak.loadUserInfo()

const token = document.getElementById('token')!
const tokenParsed = document.getElementById('token-parsed')!
const userInfo = document.getElementById('user-info')!
const clipboardBtn = document.getElementById('clipboard-button')!
const logoutBtn = document.getElementById('logout-button')!
const updateBtn = document.getElementById('update-button')

function printJSON(data) {
  return hljs.highlight('json', JSON.stringify(data, null, 2).replace(/ /g, '\u00A0')).value
}

token.textContent = keycloak.token || ''
tokenParsed.innerHTML = printJSON(keycloak.tokenParsed || null)
userInfo.innerHTML = printJSON(keycloak.userInfo)

clipboardBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(keycloak.token!)
})

logoutBtn.addEventListener('click', () => {
  keycloak.logout()
})

updateBtn?.addEventListener('click', async () => {
  updateBtn.setAttribute('disabled', '')
  await keycloak.updateToken(Number.POSITIVE_INFINITY)
  token.textContent = keycloak.token || ''
  tokenParsed.innerHTML = printJSON(keycloak.tokenParsed || null)
  updateBtn.removeAttribute('disabled')
})
