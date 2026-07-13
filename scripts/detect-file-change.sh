export CI_PROJECT_PATH=eliarege/teleskop-web-sandbox
export TARGET_APPS="archive recipes dispensing-manager-ui communication-driver machine-status machines migration-service multi-monitor planning-board planning-board-engine root websockify program-editor"


node ./scripts/detect-file-change.js 2>/dev/null | jq -c '.targetApps'

node ./scripts/detect-file-change.js 2>/dev/null | jq -c '.retagApps'

# node ./scripts/detect-file-change.js
