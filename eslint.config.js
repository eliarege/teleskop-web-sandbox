import { workspaceEslintConfig } from 'eslint-config'

export default workspaceEslintConfig.append({
  ignores: [
    'packages/tbb-ftp-client/tests/fixtures/data',
  ],
})
