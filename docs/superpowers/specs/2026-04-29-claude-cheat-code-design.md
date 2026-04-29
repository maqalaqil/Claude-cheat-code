# Claude Cheat Code — Design Spec

- **Date:** 2026-04-29
- **Status:** Approved (awaiting written-spec review)
- **Author:** Maher Al-Aqil (collaborative design with Claude)
- **Repo:** `Claude cheat code` (will rename slug to `claude-cheat-code` for the Pages URL)

## 1. Goal

Build a single-page, searchable cheat sheet for **Claude Code** covering every shipped surface — slash commands, CLI, keyboard shortcuts, hooks, MCP, agents, skills, `settings.json` keys, and environment variables — deployed to GitHub Pages, kept current automatically, and easy for the community to contribute to.

The site should be the answer to "is there a fast, current, comprehensive Claude Code reference?"

## 2. Non-goals

- **Not** a tutorial site or learning path. It is a *reference*, not a guide.
- **Not** a docs replacement. It links to official docs but does not duplicate prose explanations.
- **Not** a multi-tool catalog. Scope is Claude Code only (CLI, IDE extensions, web app surfaces). Anthropic API / SDK reference belongs elsewhere.
- **Not** versioned per Claude Code release. The cheat sheet always reflects "what is currently shipped on stable."

## 3. Success criteria

- All 9 categories present, each with at least one entry, populated from a single first-pass research sweep.
- Site loads and is interactive in under 200 ms on a fresh visit; total payload under 50 KB excluding the data file.
- Search returns results within one frame of typing across all categories.
- Anyone can add a new entry with a single edit to `data/commands.json` and a PR. CI validates the change automatically.
- A scheduled monthly job opens a refresh PR without human intervention; if the agent fails to run, an issue is opened so the freshness gap is visible.

## 4. Scope of content (the 9 categories)

| id | Label | Examples |
|---|---|---|
| `slash` | Slash Commands | `/help`, `/clear`, `/model`, `/agents`, `/hooks`, `/mcp`, `/config`, `/login`, `/cost`, `/compact`, `/resume`, `/review` |
| `cli` | CLI | `claude`, `claude -p "..."`, `claude --resume`, `claude mcp add`, `claude config` |
| `shortcuts` | Keyboard | `Esc`, `Esc Esc`, `Ctrl+R`, `Shift+Tab`, `Option+T`, `Ctrl+O`, `/` to focus, `!` shell prefix |
| `hooks` | Hooks | `PreToolUse`, `PostToolUse`, `Stop`, `SessionStart`, hook config schema |
| `mcp` | MCP | `claude mcp add`, server config keys, transports (stdio/SSE/HTTP), well-known servers |
| `agents` | Agents | Built-in subagent types, `Agent` tool fields, when to use each |
| `skills` | Skills | Skill discovery, invocation via `Skill` tool, plugin-namespaced skills |
| `settings` | `settings.json` | Permissions, `allowedTools`, `env`, `hooks`, `alwaysThinkingEnabled`, `MAX_THINKING_TOKENS` |
| `env` | Env Vars | `MAX_THINKING_TOKENS`, `ANTHROPIC_API_KEY`, `CLAUDE_CODE_*` overrides |

Initial research targets ~80–150 entries.

## 5. Architecture

Single static site, single source of truth.

```
claude-cheat-code/
├── index.html              Landing + reference (one page)
├── assets/
│   ├── styles.css          Custom CSS atop Tailwind CDN
│   └── app.js              Search, filter, theme, copy, routing
├── data/
│   ├── commands.json       Source of truth (categories + entries)
│   └── schema.json         JSON Schema (Draft 2020-12)
├── .github/
│   ├── workflows/
│   │   ├── pages.yml       Deploy on push to main
│   │   ├── validate.yml    Schema + link check on PRs
│   │   └── refresh.yml     Monthly cron + manual dispatch
│   └── PULL_REQUEST_TEMPLATE.md
├── scripts/
│   └── refresh.md          Prompt the scheduled agent uses
├── CONTRIBUTING.md
├── LICENSE                 MIT
└── README.md
```

Rationale: zero build step, no Node toolchain required to contribute, fastest possible Pages deploy (just upload the repo).

## 6. Data model

`data/commands.json`:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-04-29",
  "categories": [
    { "id": "slash",     "label": "Slash Commands", "icon": "/" },
    { "id": "cli",       "label": "CLI",            "icon": ">_" },
    { "id": "shortcuts", "label": "Keyboard",       "icon": "⌨" },
    { "id": "hooks",     "label": "Hooks",          "icon": "🪝" },
    { "id": "mcp",       "label": "MCP",            "icon": "🔌" },
    { "id": "agents",    "label": "Agents",         "icon": "🤖" },
    { "id": "skills",    "label": "Skills",         "icon": "✨" },
    { "id": "settings",  "label": "settings.json",  "icon": "⚙" },
    { "id": "env",       "label": "Env Vars",       "icon": "$" }
  ],
  "entries": [
    {
      "id": "slash-help",
      "category": "slash",
      "name": "/help",
      "syntax": "/help",
      "description": "Show available commands and usage hints.",
      "example": "/help",
      "notes": "Works in any session.",
      "since": "0.2.0",
      "tags": ["basics", "discovery"],
      "docs": "https://docs.claude.com/..."
    }
  ]
}
```

**Required fields per entry:** `id`, `category`, `name`, `description`. **Optional:** `syntax`, `example`, `notes`, `since`, `tags`, `docs`. `id` must be unique across all entries. `category` must reference a `categories[].id`.

`data/schema.json` enforces this with `additionalProperties: false`, regex on `id` (`^[a-z][a-z0-9-]*$`), and an `enum` for `category` derived from the categories list.

## 7. Page UX

**Landing (top of page):**
- Hero with project name, tagline, `lastUpdated` badge, GitHub star button, "Contribute" link.
- Search input — autofocused on load; `/` focuses it from anywhere; `Esc` clears.
- Category chips below search, multi-select. Filter state lives in URL hash (`#cat=slash,hooks&q=mcp`) so any view is shareable.

**Reference body:**
- Sticky left sidebar listing categories with counts; clicking jumps to the section.
- Each category renders as a section header + responsive card grid (1 col mobile, 2 col tablet, 3 col desktop).
- Each card shows: name (monospace), description, `syntax` block with copy-to-clipboard, expandable details for `example` / `notes` / `since` / `docs` link.
- Filtering hides non-matching cards; categories with zero matches collapse out of view.
- Empty state: "No matches — try clearing filters."

**Chrome:**
- Dark mode toggle; respects `prefers-color-scheme`; persisted in `localStorage`.
- Keyboard: `/` focus, `Esc` clear, `g` then category-letter to jump.
- Mobile: sidebar collapses to a top dropdown; cards stack to one column.

**Search behavior:**
- Fuse.js (CDN) over `name`, `description`, `tags`, `syntax`. Threshold 0.3.
- Debounced 80 ms.
- Results render via template strings; no virtual DOM.

## 8. Performance budget

| Asset | Budget |
|---|---|
| `index.html` | ≤ 8 KB |
| `app.js` | ≤ 15 KB |
| `styles.css` | ≤ 4 KB |
| Tailwind CDN | external, deferred |
| Fuse.js CDN | external, deferred |
| `commands.json` | ≤ 80 KB at 150 entries |
| Time-to-interactive | < 200 ms on broadband, < 1 s on 3G |

No frameworks, no bundler, no service worker.

## 9. Deployment & automation

### 9.1 GitHub Pages deploy — `.github/workflows/pages.yml`
- Trigger: `push` to `main`, plus `workflow_dispatch`.
- Steps: `actions/checkout` → `actions/configure-pages` → `actions/upload-pages-artifact` (path: `.`) → `actions/deploy-pages`.
- One-time setup documented in README: Settings → Pages → Source: GitHub Actions.

### 9.2 PR validation — `.github/workflows/validate.yml`
- Trigger: `pull_request` touching `data/**` or `*.html` / `assets/**`.
- Step 1 (schema): install `ajv-cli`, run `npx ajv validate -s data/schema.json -d data/commands.json --strict=false`.
- Step 2 (uniqueness + integrity): tiny inline node script asserts `id` uniqueness and that every `entry.category` exists in `categories`.
- Step 3 (link check): `lycheeverse/lychee-action` against `data/commands.json` to flag dead `docs` URLs (warn, don't fail, on transient HTTP errors).

### 9.3 Scheduled refresh — `.github/workflows/refresh.yml`
- Trigger: `schedule: cron '0 9 1 * *'` (1st of month, 09:00 UTC) + `workflow_dispatch`.
- The scheduled **remote agent** is created once via `/schedule` after the repo is up; it uses the prompt in `scripts/refresh.md`. The agent:
  1. Pulls the official Claude Code docs and changelog.
  2. Diffs additions / changes / removals against current `commands.json`.
  3. Opens a PR titled `chore: monthly refresh YYYY-MM` with the diff and a summary of what changed in Claude Code that month.
- The workflow itself is a safety net: it queries the GitHub API for the most recent PR whose title starts with `chore: monthly refresh`. If none exists in the last 35 days, the workflow opens an issue tagged `stale-refresh` describing the gap. This guarantees a freshness signal even if the agent quota is exhausted or the schedule lapses.

### 9.4 Contribution flow
- `CONTRIBUTING.md` walkthrough for adding a command: edit `commands.json`, validate locally with `npx ajv ...`, open PR.
- PR template asks for: source/docs link, category, "tested locally?" checkbox.
- CI auto-validates on every PR; status checks gate merging.

## 10. Initial content population

Spawned once during implementation: a `claude-code-guide` subagent researches each of the 9 categories from official Claude Code docs and writes the entries directly into `commands.json`. The implementation plan will treat content population as its own phase, gated on the page rendering correctly with placeholder data first.

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Docs URLs change → broken `docs` links | Lychee link checker on every PR + monthly refresh |
| Tailwind CDN breaking change | Pin to a specific Play CDN version in `index.html` |
| Fuse.js CDN outage breaks search | Fall back to substring match if `Fuse` is undefined |
| Scheduled agent stops running silently | Workflow opens an issue if no refresh in 35 days |
| `commands.json` grows past 80 KB budget | If it does, split into per-category JSON files lazy-loaded on filter; deferred until budget breached |
| Repo slug has a space (`Claude cheat code`) | Site works regardless (relative paths), but the public URL would contain `%20`. Rename the GitHub repo slug to `claude-cheat-code` before enabling Pages for a clean URL. |

## 12. Out of scope (deferred)

- Per-version views (e.g., "show me what changed in Claude Code 0.5.x").
- Comments / discussion per entry.
- Multilingual translations.
- Server-side search.
- Advanced agent autonomy beyond the monthly refresh.

## 13. Open questions

None at design time. All Section 1–4 questions resolved during brainstorming.
