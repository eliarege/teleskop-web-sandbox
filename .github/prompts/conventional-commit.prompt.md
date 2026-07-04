---
name: "Conventional Commit"
description: "Write a conventional commit message for this repository from staged changes, with optional user context"
argument-hint: "Generate from staged changes; optional context allowed"
agent: "agent"
model: DeepSeek V4 Flash (copilot)
tools: [execute/runInTerminal]
---
Write a conventional commit message for this repository.

Treat the staged git diff as the primary source of truth for what changed. You may also use the user's prose description as supplemental context to clarify intent, motivation, or naming, as long as it does not conflict with the staged diff.

Do not use unstaged changes, selected code that is not staged, visible diff outside the index, recent chat context unrelated to the staged change, or repository files as evidence for what changed.

Use these git commands in this order:
- `git diff --cached --name-only` to identify affected files
- `git diff --cached --stat` to understand the size and shape of the staged change
- `git diff --cached` to inspect the staged patch content

If any git command returns an error (e.g. not a git repository, permission denied), stop immediately and return exactly: `Unable to read staged changes: <error message>.`

If there are no staged changes, do not infer anything from other context. Return exactly: `No staged changes to summarize.`

Commit format rules:
- Format: `<type>(<optional scope>): <subject>`
- Allowed types: `feat`, `fix`, `refactor`, `perf`, `style`, `test`, `docs`, `build`, `ops`, `chore`, `revert`
- App scope abbreviations: `AR` for `archive`, `DM` for `dispensing-manager-ui`, `MS` for `machine-status`, `MA` for `machines`, `MM` for `multi-monitor`, `PB` for `planning-board`, `PB` for `planning-board-engine`, `PE` for `program-editor`, `RE` for `recipes`, `CD` for `communication-driver`, `MG` for `migration-service`
- For other apps and packages, use the full app or package name as the scope
- For changes outside apps/ and packages/, use the owning top-level directory name as the scope when the staged diff is confined to one such area (for example: `mcp`, `hooks`, `patches`, `docs`, `devops`, `keycloak`, `scripts`, `config`)
- Breaking changes use `!` immediately before `:`
- The subject must be imperative, present tense, start with a lowercase letter, and not end with a period
- Add a body only when it adds useful motivation or behavior context
- Add a footer only for issue references or breaking changes
- Breaking-change footers must start with `BREAKING CHANGE:`

Inputs:
- The user's argument, if provided
- Output from `git diff --cached --name-only`
- Output from `git diff --cached --stat`
- Output from `git diff --cached`

Requirements:
- Choose the most accurate type from the allowed list
- Use the documented short app scopes when they apply; otherwise use the full app or package name
- If the staged diff spans more than one unrelated app or package, omit the scope entirely rather than listing multiple scopes
- Use imperative, present-tense wording
- Do not capitalize the first letter of the subject
- Do not end the subject with a period
- Include a body only when it adds useful motivation or behavior context
- Include a footer only when it is needed for issue references or breaking changes
- Use `!` before `:` only for breaking changes

Output format:
- Return only the commit message
- Prefer a single-line commit when no body or footer is needed
- If the staged diff is ambiguous, use the user's context only to refine the message without contradicting the staged diff

Before finalizing, quickly verify that the message matches the rules above and that the scope is valid for the affected app or package.
