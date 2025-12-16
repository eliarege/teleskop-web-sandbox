# Teleskop Web

- [Commit Formats](#commit-formats)
- [VSCode Profile](#vscode-profile)
- [Implementing Authentication](./docs/authentication.md)

## Commit Formats

### Default

<pre>
<b><a href="#types">&lt;type&gt;</a></b></font>(<b><a href="#scopes">&lt;optional scope&gt;</a></b>): <b><a href="#subject">&lt;subject&gt;</a></b>
<sub>empty separator line</sub>
<b><a href="#body">&lt;optional body&gt;</a></b>
<sub>empty separator line</sub>
<b><a href="#footer">&lt;optional footer&gt;</a></b>
</pre>

### Types

- API relevant changes
  - `feat` Commits, that adds a new feature
  - `fix` Commits, that fixes a bug
- `refactor` Commits, that rewrite/restructure your code, however does not change any behaviour
  - `perf` Commits are special `refactor` commits, that improve performance
- `style` Commits, that do not affect the meaning (white-space, formatting, missing semi-colons, etc)
- `test` Commits, that add missing tests or correcting existing tests
- `docs` Commits, that affect documentation only
- `build` Commits, that affect build components like build tool, ci pipeline, dependencies, project version, ...
- `ops` Commits, that affect operational components like infrastructure, deployment, backup, recovery, ...
- `chore` Miscellaneous commits e.g. modifying `.gitignore`
- `revert` Commits, that reverts previous commit

### Scopes

The `scope` provides additional contextual information.

- Allowed Scopes depends on the specific project
- Don't use issue identifiers as scopes

#### Scopes used for apps

| Scope      | Application                     |
| ---------- | ------------------------------- |
| AR         | `archive`                       |
| DM         | `dispensing-manager-ui`         |
| MS         | `machine-status`                |
| MA         | `machines`                      |
| MM         | `multi-monitor`                 |
| PB         | `planning-board`                |
| PB         | `planning-board-engine`         |
| PE         | `program-editor`                |
| RE         | `recipes`                       |
| migrations | `migration-service`             |

Other apps and packages should always use full name for scopes.

### Breaking Changes Indicator

Breaking changes should be indicated by an `!` before the `:` in the subject line e.g. `feat(api)!: remove status endpoint`

- Is an **optional** part of the format

### Subject

The `subject` contains a succinct description of the change.

- Is a **mandatory** part of the format
- Use the imperative, present tense: "change" not "changed" nor "changes"
  - Think of `This commit will <subject>`
- Don't capitalize the first letter
- No dot (.) at the end

### Body

The `body` should include the motivation for the change and contrast this with previous behavior.

- Is an **optional** part of the format
- Use the imperative, present tense: "change" not "changed" nor "changes"
- This is the place to mention issue identifiers and their relations

### Footer

The `footer` should contain any information about **Breaking Changes** and is also the place to **reference Issues** that this commit refers to.

- Is an **optional** part of the format
- **optionally** reference an issue by its id.
- **Breaking Changes** should start with the word `BREAKING CHANGES:` followed by space or two newlines. The rest of the commit message is then used for this.

### Examples

- ```
  feat(shopping cart): add the amazing button
  ```
- ```
  feat: remove ticket list endpoint

  refers to JIRA-1337
  BREAKING CHANGES: ticket enpoints no longer supports list all entites.
  ```

- ```
  fix: add missing parameter to service call

  The error occurred because of <reasons>.
  ```

- ```
  build(release): bump version to 1.0.0
  ```
- ```
  build: update dependencies
  ```
- ```
  refactor: implement calculation method as recursion
  ```
- ```
  style: remove empty line
  ```

## VSCode Profile

Profiles allow us create set of customizations and quickly switch between them or share them with others.
This monorepo uses to following [profile](https://gist.github.com/Maiquu/9f56512b2ea6709a16c0584a821ced8b).

### Setting up

https://code.visualstudio.com/assets/docs/editor/profiles/create-profile-via-manage.png

- Click `Import Profile` like shown in image
- Enter following URL: https://gist.github.com/Maiquu/9f56512b2ea6709a16c0584a821ced8b
- Click `Create Profile` > `Create`

More details about profiles: https://code.visualstudio.com/docs/editor/profiles

## MCP Server

### SQL Server MCP Server

Create/edit `.vscode/mcp.json` file with following content:

> Edit the environment variables to match your local setup

```json
{
  "servers": {
    // ... other servers

    "mssql-mcp-server": {
      "command": "pnpm",
      "cwd": "${workspaceFolder}",
      "args": [
        "exec",
        "teleskop-mcp-sqlserver"
      ],
      "env": {
        "DB_USER": "YOUR_USERNAME",
        "DB_PASSWORD": "YOUR_PASSWORD",
        "DB_SERVER": "localhost",
        "DB_DATABASE": "Teleskop",
        "DB_TRUST_SERVER_CERT": "true"
      }
    },
  }
}
```

### Nuxt MCP Server

Create/edit `.vscode/mcp.json` file with following content:

> See here for details: https://nuxt.com/docs/4.x/guide/ai/mcp#resources

```json
{
  "servers": {
    // ... other servers
    "nuxt": {
      "type": "http",
      "url": "https://nuxt.com/mcp"
    }
  }
}
```

### GitLab Merge Request MCP Server

Create/edit `.vscode/mcp.json` file with following content:

> Create a GitLab Personal Access Token with `api` scope for authentication

```json
{
  "servers": {
    // ... other servers
    "gitlab-merge-request": {
      "command": "pnpm",
      "cwd": "${workspaceFolder}",
      "args": [
        "-w",
        "exec",
        "teleskop-mcp-gitlab-mr"
      ],
      "env": {
        "GITLAB_HOST": "https://gitlab.com",
        "GITLAB_TOKEN": "YOUR_GITLAB_PERSONAL_ACCESS_TOKEN",
        "GITLAB_PROJECT_ID": "50621216"
      }
    }
  }
}
```
