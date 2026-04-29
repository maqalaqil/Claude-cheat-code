# Claude Cheat Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a single-page, searchable Claude Code cheat sheet to GitHub Pages with automated validation, monthly refresh, and a community-friendly contribution flow.

**Architecture:** Static site (one `index.html`, vanilla JS, Tailwind + Fuse.js via CDN). Single source of truth: `data/commands.json` validated against a JSON Schema. Three GitHub Actions workflows handle deploy, PR validation, and monthly refresh. Initial content populated via `claude-code-guide` agent research sweep.

**Tech Stack:** HTML5 + vanilla JS (ES2022), Tailwind Play CDN, Fuse.js (CDN), GitHub Actions, `ajv-cli` for JSON Schema validation, `lychee` for link checking.

**Spec:** `docs/superpowers/specs/2026-04-29-claude-cheat-code-design.md`

**Working directory:** `/Users/maheralaqil/Documents/GitHub/Claude cheat code` (repo slug rename to `claude-cheat-code` happens on GitHub before Pages enablement; no local rename required).

---

## File Map

| Path | Responsibility |
|---|---|
| `index.html` | Page shell + sections; mounts JS app |
| `assets/styles.css` | Custom CSS (theme, layout polish, scrollbar) |
| `assets/app.js` | Data fetch, render, search, filter, theme, copy, hash routing |
| `data/commands.json` | All entries + categories (source of truth) |
| `data/schema.json` | JSON Schema for `commands.json` |
| `.github/workflows/pages.yml` | Deploy to Pages on push to main |
| `.github/workflows/validate.yml` | Validate JSON + check links on PRs |
| `.github/workflows/refresh.yml` | Monthly cron; opens stale-refresh issue if no recent refresh PR |
| `.github/PULL_REQUEST_TEMPLATE.md` | Contribution checklist |
| `scripts/refresh.md` | Prompt the scheduled remote agent uses |
| `CONTRIBUTING.md` | How to add/update commands |
| `LICENSE` | MIT |
| `README.md` | What this is + deploy / contribute instructions |

---

## Phase 1 — Site skeleton

### Task 1: Create the JSON Schema

**Files:**
- Create: `data/schema.json`

- [ ] **Step 1: Write the schema**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/claude-cheat-code/commands.schema.json",
  "title": "Claude Cheat Code Commands",
  "type": "object",
  "additionalProperties": false,
  "required": ["version", "lastUpdated", "categories", "entries"],
  "properties": {
    "version": { "type": "string", "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$" },
    "lastUpdated": { "type": "string", "format": "date" },
    "categories": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "label"],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" },
          "label": { "type": "string", "minLength": 1 },
          "icon": { "type": "string" }
        }
      }
    },
    "entries": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "category", "name", "description"],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" },
          "category": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" },
          "name": { "type": "string", "minLength": 1 },
          "syntax": { "type": "string" },
          "description": { "type": "string", "minLength": 1 },
          "example": { "type": "string" },
          "notes": { "type": "string" },
          "since": { "type": "string" },
          "tags": { "type": "array", "items": { "type": "string" } },
          "docs": { "type": "string", "format": "uri" }
        }
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add data/schema.json
git commit -m "feat: add JSON schema for commands data"
```

---

### Task 2: Create seed `commands.json` with two real entries

We seed with two real entries (one slash command, one shortcut) so the page can render meaningfully from the first deploy. Full content population happens in Phase 6.

**Files:**
- Create: `data/commands.json`

- [ ] **Step 1: Write the seed data**

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-04-29",
  "categories": [
    { "id": "slash",     "label": "Slash Commands", "icon": "/" },
    { "id": "cli",       "label": "CLI",            "icon": ">_" },
    { "id": "shortcuts", "label": "Keyboard",       "icon": "K" },
    { "id": "hooks",     "label": "Hooks",          "icon": "H" },
    { "id": "mcp",       "label": "MCP",            "icon": "M" },
    { "id": "agents",    "label": "Agents",         "icon": "A" },
    { "id": "skills",    "label": "Skills",         "icon": "S" },
    { "id": "settings",  "label": "settings.json",  "icon": "C" },
    { "id": "env",       "label": "Env Vars",       "icon": "$" }
  ],
  "entries": [
    {
      "id": "slash-help",
      "category": "slash",
      "name": "/help",
      "syntax": "/help",
      "description": "Show available commands and usage hints inside Claude Code.",
      "example": "/help",
      "tags": ["basics", "discovery"],
      "docs": "https://docs.claude.com/en/docs/claude-code/slash-commands"
    },
    {
      "id": "shortcut-focus-search",
      "category": "shortcuts",
      "name": "/ (focus prompt)",
      "syntax": "/",
      "description": "When a slash command list is open, '/' filters it. In this cheat sheet, '/' focuses the search bar from anywhere on the page.",
      "tags": ["keyboard"]
    }
  ]
}
```

- [ ] **Step 2: Validate locally**

Run: `npx --yes ajv-cli@5 validate -s data/schema.json -d data/commands.json --strict=false`
Expected: `data/commands.json valid`

- [ ] **Step 3: Commit**

```bash
git add data/commands.json
git commit -m "feat: add seed commands data"
```

---

### Task 3: Page shell — `index.html`

**Files:**
- Create: `index.html`

- [ ] **Step 1: Write the shell**

```html
<!doctype html>
<html lang="en" class="h-full">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Claude Cheat Code — every command, in one place</title>
  <meta name="description" content="A fast, searchable cheat sheet for every Claude Code surface: slash commands, CLI, hooks, MCP, agents, skills, settings, and more." />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ctext y='52' font-size='52'%3E%E2%9A%A1%3C/text%3E%3C/svg%3E" />
  <link rel="stylesheet" href="./assets/styles.css" />
  <script src="https://cdn.tailwindcss.com/3.4.16"></script>
  <script>
    tailwind.config = { darkMode: 'class' };
  </script>
</head>
<body class="h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 antialiased">
  <header class="sticky top-0 z-30 backdrop-blur bg-white/70 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
      <h1 class="font-semibold tracking-tight">Claude Cheat Code</h1>
      <span id="last-updated" class="text-xs text-zinc-500"></span>
      <div class="flex-1"></div>
      <a id="repo-link" href="#" class="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">GitHub</a>
      <button id="theme-toggle" type="button" aria-label="Toggle theme" class="text-sm px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800">Theme</button>
    </div>
    <div class="max-w-6xl mx-auto px-4 pb-3">
      <input id="search" type="search" placeholder="Search commands… (press / to focus)" autocomplete="off"
             class="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" />
      <div id="chips" class="mt-2 flex flex-wrap gap-1"></div>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[12rem_1fr] gap-6">
    <aside id="sidebar" class="hidden md:block sticky top-32 self-start space-y-1 text-sm"></aside>
    <section id="content" class="min-w-0 space-y-10">
      <p id="status" class="text-zinc-500">Loading…</p>
    </section>
  </main>

  <footer class="max-w-6xl mx-auto px-4 py-10 text-xs text-zinc-500">
    Open source under MIT. Not affiliated with Anthropic. <a id="contribute-link" class="underline" href="#">Contribute →</a>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js" defer></script>
  <script src="./assets/app.js" type="module" defer></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add page shell"
```

---

### Task 4: Custom CSS — `assets/styles.css`

**Files:**
- Create: `assets/styles.css`

- [ ] **Step 1: Write the CSS**

```css
:root { color-scheme: light dark; }

html { scroll-behavior: smooth; scroll-padding-top: 9rem; }

code, pre, kbd, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }

.card {
  border: 1px solid rgb(228 228 231);
  border-radius: 0.75rem;
  padding: 1rem;
  background: white;
}
.dark .card { background: rgb(24 24 27); border-color: rgb(39 39 42); }

.chip {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  border: 1px solid rgb(228 228 231);
  cursor: pointer;
  user-select: none;
}
.chip[aria-pressed="true"] { background: rgb(24 24 27); color: white; }
.dark .chip { border-color: rgb(63 63 70); }
.dark .chip[aria-pressed="true"] { background: white; color: rgb(24 24 27); }

.copy-btn { font-size: 0.75rem; }
.copy-btn[data-state="copied"]::after { content: " ✓"; }

details > summary { cursor: pointer; list-style: none; }
details > summary::-webkit-details-marker { display: none; }
details[open] > summary::after { content: " −"; }
details:not([open]) > summary::after { content: " +"; }

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: rgb(212 212 216); border-radius: 999px; }
.dark ::-webkit-scrollbar-thumb { background: rgb(63 63 70); }
```

- [ ] **Step 2: Commit**

```bash
git add assets/styles.css
git commit -m "feat: add custom styles"
```

---

### Task 5: Minimal `app.js` — load data and render placeholder

This task only loads the JSON, sets `lastUpdated`, and renders one card per entry into `#content` as a flat list — no search, no filter yet. The goal is to verify wiring end-to-end.

**Files:**
- Create: `assets/app.js`

- [ ] **Step 1: Write the loader + minimal renderer**

```js
const DATA_URL = './data/commands.json';

const $ = (sel) => document.querySelector(sel);

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function loadData() {
  const res = await fetch(DATA_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to load ${DATA_URL}: ${res.status}`);
  return res.json();
}

function renderCard(entry) {
  return `
    <article class="card" id="${escapeHtml(entry.id)}">
      <h3 class="font-semibold mono">${escapeHtml(entry.name)}</h3>
      <p class="mt-1 text-sm text-zinc-600 dark:text-zinc-300">${escapeHtml(entry.description)}</p>
      ${entry.syntax ? `<pre class="mt-2 text-xs bg-zinc-100 dark:bg-zinc-900 p-2 rounded overflow-x-auto"><code>${escapeHtml(entry.syntax)}</code></pre>` : ''}
    </article>
  `;
}

async function main() {
  try {
    const data = await loadData();
    $('#last-updated').textContent = `updated ${data.lastUpdated}`;
    const grid = data.entries.map(renderCard).join('');
    $('#content').innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${grid}</div>`;
  } catch (err) {
    $('#content').innerHTML = `<p class="text-red-600">Error: ${escapeHtml(err.message)}</p>`;
  }
}

main();
```

- [ ] **Step 2: Verify in a browser**

Run: `cd "/Users/maheralaqil/Documents/GitHub/Claude cheat code" && python3 -m http.server 8080`
Open: `http://localhost:8080/`
Expected:
- "updated 2026-04-29" appears next to the title.
- Two cards render: `/help` and `/ (focus prompt)`.
- No console errors.

Stop the server with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add assets/app.js
git commit -m "feat: load commands data and render basic cards"
```

---

## Phase 2 — Sections, sidebar, copy buttons

### Task 6: Group by category + render sidebar + copy buttons

**Files:**
- Modify: `assets/app.js`

- [ ] **Step 1: Replace the contents of `assets/app.js` with the grouped renderer**

```js
const DATA_URL = './data/commands.json';
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let STATE = { data: null, query: '', activeCats: new Set(), filtered: null };

async function loadData() {
  const res = await fetch(DATA_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to load ${DATA_URL}: ${res.status}`);
  return res.json();
}

function renderCard(entry) {
  const detailsParts = [];
  if (entry.example) detailsParts.push(`<div><strong>Example:</strong> <code>${escapeHtml(entry.example)}</code></div>`);
  if (entry.notes) detailsParts.push(`<div>${escapeHtml(entry.notes)}</div>`);
  if (entry.since) detailsParts.push(`<div class="text-zinc-500">Since: ${escapeHtml(entry.since)}</div>`);
  if (entry.docs) detailsParts.push(`<div><a class="underline" href="${escapeHtml(entry.docs)}" target="_blank" rel="noopener">Docs ↗</a></div>`);
  const details = detailsParts.length
    ? `<details class="mt-2 text-xs"><summary class="text-zinc-500">Details</summary><div class="mt-1 space-y-1">${detailsParts.join('')}</div></details>`
    : '';
  const syntax = entry.syntax
    ? `<div class="mt-2 flex items-start gap-2">
         <pre class="flex-1 text-xs bg-zinc-100 dark:bg-zinc-900 p-2 rounded overflow-x-auto"><code>${escapeHtml(entry.syntax)}</code></pre>
         <button class="copy-btn px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800" data-copy="${escapeHtml(entry.syntax)}">Copy</button>
       </div>`
    : '';
  return `
    <article class="card" id="${escapeHtml(entry.id)}">
      <h3 class="font-semibold mono">${escapeHtml(entry.name)}</h3>
      <p class="mt-1 text-sm text-zinc-600 dark:text-zinc-300">${escapeHtml(entry.description)}</p>
      ${syntax}
      ${details}
    </article>
  `;
}

function renderSidebar(data, counts) {
  const items = data.categories.map((c) => {
    const n = counts.get(c.id) ?? 0;
    return `<a href="#cat-${escapeHtml(c.id)}" class="flex justify-between items-center px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900">
      <span><span class="mono text-zinc-500 mr-2">${escapeHtml(c.icon ?? '')}</span>${escapeHtml(c.label)}</span>
      <span class="text-xs text-zinc-500">${n}</span>
    </a>`;
  });
  $('#sidebar').innerHTML = items.join('');
}

function renderChips(data) {
  $('#chips').innerHTML = data.categories.map((c) =>
    `<button type="button" class="chip" data-cat="${escapeHtml(c.id)}" aria-pressed="false">${escapeHtml(c.label)}</button>`
  ).join('');
}

function renderContent(data, entries) {
  if (entries.length === 0) {
    $('#content').innerHTML = `<p class="text-zinc-500">No matches — try clearing filters.</p>`;
    return;
  }
  const byCat = new Map();
  for (const e of entries) {
    if (!byCat.has(e.category)) byCat.set(e.category, []);
    byCat.get(e.category).push(e);
  }
  const html = data.categories
    .filter((c) => byCat.has(c.id))
    .map((c) => {
      const cards = byCat.get(c.id).map(renderCard).join('');
      return `<section id="cat-${escapeHtml(c.id)}">
        <h2 class="text-lg font-semibold mb-3">${escapeHtml(c.label)} <span class="text-zinc-500 text-sm font-normal">(${byCat.get(c.id).length})</span></h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${cards}</div>
      </section>`;
    })
    .join('');
  $('#content').innerHTML = html;
}

function countByCategory(entries) {
  const m = new Map();
  for (const e of entries) m.set(e.category, (m.get(e.category) ?? 0) + 1);
  return m;
}

function attachCopyHandlers() {
  for (const btn of $$('.copy-btn')) {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy ?? '');
        btn.dataset.state = 'copied';
        setTimeout(() => { delete btn.dataset.state; }, 1200);
      } catch { /* ignore */ }
    });
  }
}

function rerender() {
  const entries = STATE.filtered ?? STATE.data.entries;
  renderContent(STATE.data, entries);
  renderSidebar(STATE.data, countByCategory(entries));
  attachCopyHandlers();
}

async function main() {
  try {
    STATE.data = await loadData();
    $('#last-updated').textContent = `updated ${STATE.data.lastUpdated}`;
    renderChips(STATE.data);
    rerender();
  } catch (err) {
    $('#content').innerHTML = `<p class="text-red-600">Error: ${escapeHtml(err.message)}</p>`;
  }
}

main();
```

- [ ] **Step 2: Verify in browser**

Run: `python3 -m http.server 8080`
Open: `http://localhost:8080/`
Expected:
- Sidebar shows all 9 categories with counts (most are 0; `slash` is 1; `shortcuts` is 1).
- Two section headers render: "Slash Commands (1)" and "Keyboard (1)".
- Each card has a "Copy" button next to its `syntax` block.
- Clicking Copy shows a checkmark briefly and the syntax is on the clipboard.
- Clicking a sidebar link scrolls to its section.
- No console errors.

- [ ] **Step 3: Commit**

```bash
git add assets/app.js
git commit -m "feat: group cards by category, add sidebar and copy buttons"
```

---

## Phase 3 — Search, filter, and URL hash routing

### Task 7: Add fuzzy search + chip filter + URL hash sync

**Files:**
- Modify: `assets/app.js`

- [ ] **Step 1: Add `applyFilters`, hash routing, and event handlers**

Append the following just **before** the line `async function main()` and replace `main()` with the new version below.

```js
function readHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  STATE.query = h.get('q') ?? '';
  const cats = (h.get('cat') ?? '').split(',').filter(Boolean);
  STATE.activeCats = new Set(cats);
}

function writeHash() {
  const h = new URLSearchParams();
  if (STATE.query) h.set('q', STATE.query);
  if (STATE.activeCats.size) h.set('cat', Array.from(STATE.activeCats).join(','));
  const next = h.toString();
  const target = next ? `#${next}` : '#';
  if (location.hash !== target) history.replaceState(null, '', target);
}

let FUSE = null;
function initFuse(entries) {
  if (typeof Fuse === 'undefined') { FUSE = null; return; }
  FUSE = new Fuse(entries, {
    keys: ['name', 'description', 'tags', 'syntax'],
    threshold: 0.3,
    ignoreLocation: true,
  });
}

function substringMatch(entries, q) {
  const needle = q.toLowerCase();
  return entries.filter((e) =>
    [e.name, e.description, e.syntax, ...(e.tags ?? [])]
      .filter(Boolean)
      .some((s) => String(s).toLowerCase().includes(needle))
  );
}

function applyFilters() {
  let entries = STATE.data.entries;
  if (STATE.activeCats.size) entries = entries.filter((e) => STATE.activeCats.has(e.category));
  if (STATE.query) {
    entries = FUSE
      ? new Fuse(entries, { keys: ['name', 'description', 'tags', 'syntax'], threshold: 0.3, ignoreLocation: true })
          .search(STATE.query).map((r) => r.item)
      : substringMatch(entries, STATE.query);
  }
  STATE.filtered = entries;
  rerender();
  syncChipState();
  $('#search').value = STATE.query;
  writeHash();
}

function syncChipState() {
  for (const chip of $$('.chip')) {
    const id = chip.dataset.cat;
    chip.setAttribute('aria-pressed', STATE.activeCats.has(id) ? 'true' : 'false');
  }
}

function attachInteractionHandlers() {
  let timer;
  $('#search').addEventListener('input', (ev) => {
    clearTimeout(timer);
    const v = ev.target.value;
    timer = setTimeout(() => { STATE.query = v; applyFilters(); }, 80);
  });
  $('#chips').addEventListener('click', (ev) => {
    const chip = ev.target.closest('.chip');
    if (!chip) return;
    const id = chip.dataset.cat;
    if (STATE.activeCats.has(id)) STATE.activeCats.delete(id); else STATE.activeCats.add(id);
    applyFilters();
  });
  document.addEventListener('keydown', (ev) => {
    const tag = (ev.target && ev.target.tagName) || '';
    const typing = tag === 'INPUT' || tag === 'TEXTAREA';
    if (ev.key === '/' && !typing) { ev.preventDefault(); $('#search').focus(); }
    if (ev.key === 'Escape' && tag === 'INPUT' && ev.target.id === 'search') {
      ev.target.value = ''; STATE.query = ''; applyFilters();
    }
  });
  window.addEventListener('hashchange', () => { readHash(); applyFilters(); });
}

async function main() {
  try {
    STATE.data = await loadData();
    $('#last-updated').textContent = `updated ${STATE.data.lastUpdated}`;
    renderChips(STATE.data);
    initFuse(STATE.data.entries);
    readHash();
    applyFilters();
    attachInteractionHandlers();
  } catch (err) {
    $('#content').innerHTML = `<p class="text-red-600">Error: ${escapeHtml(err.message)}</p>`;
  }
}
```

Delete the old `async function main() { ... } main();` block, keep a single `main();` call at the end.

- [ ] **Step 2: Verify in browser**

Run: `python3 -m http.server 8080`
Open: `http://localhost:8080/`
Expected:
- Typing `help` in the search box reduces visible cards to one (`/help`).
- Clicking the "Slash Commands" chip toggles aria-pressed and filters to that category.
- URL hash updates to `#cat=slash&q=help`.
- Pressing `/` from outside the input focuses the search box.
- Pressing `Esc` while in the search box clears it and restores all entries.
- Reloading with `#cat=slash` in the URL filters to slash on load.

- [ ] **Step 3: Commit**

```bash
git add assets/app.js
git commit -m "feat: add fuzzy search, chip filter, and URL hash routing"
```

---

### Task 8: Theme toggle with `localStorage` + `prefers-color-scheme`

**Files:**
- Modify: `index.html` (add a tiny pre-paint script in `<head>`)
- Modify: `assets/app.js` (toggle button handler)

- [ ] **Step 1: Add the pre-paint theme script in `index.html`**

Place this `<script>` block in `<head>` immediately **after** the Tailwind config script and **before** the `</head>` tag:

```html
<script>
  (function () {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
    if (isDark) document.documentElement.classList.add('dark');
  })();
</script>
```

- [ ] **Step 2: Wire the toggle button in `assets/app.js`**

Inside `attachInteractionHandlers()`, add:

```js
$('#theme-toggle').addEventListener('click', () => {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});
```

- [ ] **Step 3: Verify**

Run: `python3 -m http.server 8080`
- Toggle button flips light/dark.
- Reload preserves the chosen theme.
- Clearing `localStorage` and reloading respects OS preference.

- [ ] **Step 4: Commit**

```bash
git add index.html assets/app.js
git commit -m "feat: add theme toggle with persistence"
```

---

## Phase 4 — CI: deploy + validation

### Task 9: GitHub Pages deploy workflow

**Files:**
- Create: `.github/workflows/pages.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/pages.yml
git commit -m "ci: add GitHub Pages deploy workflow"
```

---

### Task 10: PR validation workflow (schema + integrity + links)

**Files:**
- Create: `.github/workflows/validate.yml`
- Create: `scripts/check-integrity.mjs`

- [ ] **Step 1: Write the integrity check script**

```js
// scripts/check-integrity.mjs
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync('data/commands.json', 'utf8'));
const errors = [];

const catIds = new Set(data.categories.map((c) => c.id));
const seen = new Set();

for (const e of data.entries) {
  if (seen.has(e.id)) errors.push(`duplicate entry id: ${e.id}`);
  seen.add(e.id);
  if (!catIds.has(e.category)) errors.push(`entry ${e.id} references unknown category: ${e.category}`);
}

if (errors.length) {
  for (const err of errors) console.error('::error::' + err);
  process.exit(1);
}
console.log(`OK: ${data.entries.length} entries across ${catIds.size} categories`);
```

- [ ] **Step 2: Write the workflow**

```yaml
name: Validate

on:
  pull_request:
    paths:
      - 'data/**'
      - 'index.html'
      - 'assets/**'
      - 'scripts/**'
      - '.github/workflows/validate.yml'
  workflow_dispatch:

jobs:
  schema:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Validate JSON Schema
        run: npx --yes ajv-cli@5 validate -s data/schema.json -d data/commands.json --strict=false
      - name: Integrity check
        run: node scripts/check-integrity.mjs

  links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Link check (docs URLs in commands.json)
        uses: lycheeverse/lychee-action@v2
        with:
          args: --no-progress --include-fragments data/commands.json
          fail: false
```

- [ ] **Step 3: Verify the integrity script locally**

Run: `node scripts/check-integrity.mjs`
Expected: `OK: 2 entries across 9 categories`

- [ ] **Step 4: Commit**

```bash
git add scripts/check-integrity.mjs .github/workflows/validate.yml
git commit -m "ci: validate JSON schema, entry integrity, and links on PRs"
```

---

### Task 11: Refresh workflow (cron + stale-refresh issue safety net)

**Files:**
- Create: `.github/workflows/refresh.yml`
- Create: `scripts/refresh.md`

- [ ] **Step 1: Write the agent prompt**

```markdown
<!-- scripts/refresh.md -->
# Monthly Refresh Prompt

You are refreshing the Claude Cheat Code data. Steps:

1. Read `data/commands.json` and `data/schema.json` to understand the current set of entries and the schema constraints.
2. Pull the latest official Claude Code documentation and changelog (docs.claude.com and the Claude Code changelog).
3. Compute a diff:
   - **Adds:** commands or settings that are now shipped but not in `commands.json`.
   - **Updates:** existing entries whose syntax, description, or `since` has changed.
   - **Removes:** entries that have been deprecated or removed in stable.
4. Apply the diff to `data/commands.json`. Update the top-level `lastUpdated` to today's date and bump `version` (patch for additions/edits, minor for new categories).
5. Validate locally: `npx --yes ajv-cli@5 validate -s data/schema.json -d data/commands.json --strict=false` and `node scripts/check-integrity.mjs`.
6. Open a pull request titled `chore: monthly refresh YYYY-MM` whose body lists the additions, updates, and removals as bullet points, with a link to each upstream source.

Do not invent entries. If a feature is unclear or undocumented, skip it and note it in the PR body.
```

- [ ] **Step 2: Write the workflow**

```yaml
name: Refresh data

on:
  schedule:
    - cron: '0 9 1 * *'   # 1st of each month, 09:00 UTC
  workflow_dispatch:

permissions:
  contents: read
  issues: write
  pull-requests: read

jobs:
  stale-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Open issue if no recent refresh PR
        uses: actions/github-script@v7
        with:
          script: |
            const cutoffDays = 35;
            const since = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000).toISOString();
            const prs = await github.paginate(github.rest.search.issuesAndPullRequests, {
              q: `repo:${context.repo.owner}/${context.repo.repo} is:pr "chore: monthly refresh" created:>=${since}`,
              per_page: 100,
            });
            if (prs.length > 0) {
              core.info(`Found ${prs.length} recent refresh PR(s); no action needed.`);
              return;
            }
            const existing = await github.paginate(github.rest.issues.listForRepo, {
              owner: context.repo.owner,
              repo: context.repo.repo,
              labels: 'stale-refresh',
              state: 'open',
              per_page: 100,
            });
            if (existing.length > 0) {
              core.info('Stale-refresh issue already open; skipping.');
              return;
            }
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Stale refresh: no monthly refresh PR in ${cutoffDays} days`,
              labels: ['stale-refresh'],
              body: [
                `No PR with title prefix \`chore: monthly refresh\` has been created in the last ${cutoffDays} days.`,
                ``,
                `The scheduled remote agent (configured via \`/schedule\` against \`scripts/refresh.md\`) may have lapsed.`,
                ``,
                `Run \`workflow_dispatch\` on the agent or recreate the schedule.`,
              ].join('\n'),
            });
```

- [ ] **Step 3: Commit**

```bash
git add scripts/refresh.md .github/workflows/refresh.yml
git commit -m "ci: add monthly refresh workflow with stale-refresh safety net"
```

---

## Phase 5 — Contribution materials

### Task 12: README, CONTRIBUTING, PR template, LICENSE

**Files:**
- Create: `README.md`
- Create: `CONTRIBUTING.md`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `LICENSE`

- [ ] **Step 1: Write `LICENSE` (MIT)**

```
MIT License

Copyright (c) 2026 Maher Al-Aqil

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Write `README.md`**

```markdown
# Claude Cheat Code

A fast, searchable cheat sheet for every Claude Code surface — slash commands, CLI, keyboard shortcuts, hooks, MCP, agents, skills, `settings.json` keys, and environment variables. One page. Instant search. Always current.

> Not affiliated with Anthropic. Community-maintained.

## Live site

`https://<your-username>.github.io/claude-cheat-code/`

## Run locally

No build step. Just serve the static files:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Stack

- Vanilla HTML/CSS/JS, no bundler
- Tailwind CSS via Play CDN
- Fuse.js (CDN) for fuzzy search
- Data lives in `data/commands.json`, validated by `data/schema.json`

## Deploy to GitHub Pages

1. Push the repo to GitHub. Recommended slug: `claude-cheat-code`.
2. **Settings → Pages → Source: GitHub Actions**.
3. Push to `main`. The `Deploy to GitHub Pages` workflow publishes the site.

## Stay current automatically

The `Refresh data` workflow runs on the 1st of every month. It opens a `stale-refresh` issue if no `chore: monthly refresh` PR has landed in 35 days. The PR itself is opened by a remote agent configured via `/schedule` using `scripts/refresh.md` as its prompt.

## Contribute

See `CONTRIBUTING.md`. Adding a command is one JSON entry and a PR.

## License

MIT — see `LICENSE`.
```

- [ ] **Step 3: Write `CONTRIBUTING.md`**

```markdown
# Contributing

Thanks for helping keep this current!

## Add or update a command

1. Open `data/commands.json`.
2. Add a new object to `entries` (or edit an existing one). The shape:

   ```json
   {
     "id": "slash-cost",
     "category": "slash",
     "name": "/cost",
     "syntax": "/cost",
     "description": "Show token usage and cost for the current session.",
     "example": "/cost",
     "tags": ["session"],
     "docs": "https://docs.claude.com/..."
   }
   ```

   - `id` must be unique and kebab-case.
   - `category` must match a `categories[].id`.
   - `description` should be one sentence.
   - Include `docs` whenever an official source exists.

3. Validate locally:

   ```bash
   npx --yes ajv-cli@5 validate -s data/schema.json -d data/commands.json --strict=false
   node scripts/check-integrity.mjs
   ```

4. Bump `lastUpdated` to today and increment `version` (patch).
5. Open a PR. CI will validate the JSON and check links.

## Add a new category

Add to `categories` first, then any entries that reference it. Keep `id` kebab-case.

## Code or styling changes

Run `python3 -m http.server 8080` and verify the page in a browser. Keep the JS under ~15 KB; this stays a no-build site.
```

- [ ] **Step 4: Write `.github/PULL_REQUEST_TEMPLATE.md`**

```markdown
## What changed

<!-- Briefly describe the change. -->

## Source

<!-- Link to official docs / changelog entry / release notes that justifies this change. -->

## Checklist

- [ ] Ran `npx ajv-cli@5 validate -s data/schema.json -d data/commands.json --strict=false`
- [ ] Ran `node scripts/check-integrity.mjs`
- [ ] Bumped `lastUpdated` and `version` in `data/commands.json` (if data changed)
- [ ] Verified the page renders locally (`python3 -m http.server 8080`)
```

- [ ] **Step 5: Commit**

```bash
git add LICENSE README.md CONTRIBUTING.md .github/PULL_REQUEST_TEMPLATE.md
git commit -m "docs: add README, CONTRIBUTING, PR template, and LICENSE"
```

---

## Phase 6 — Initial content population

### Task 13: Populate `commands.json` via research sweep

This task delegates the heavy research to the `claude-code-guide` subagent. The agent reads the official Claude Code docs and writes ~80–150 entries across all 9 categories. Treat the agent's output as a draft to review and merge.

**Files:**
- Modify: `data/commands.json`

- [ ] **Step 1: Dispatch the research subagent**

Use the Agent tool with `subagent_type: "claude-code-guide"` and the following prompt:

```
You are populating data/commands.json for the Claude Cheat Code site. Read the current
data/commands.json and data/schema.json. Then research the current state of every
Claude Code surface and write back a full entries array.

Cover these 9 categories (use exactly these category ids: slash, cli, shortcuts, hooks,
mcp, agents, skills, settings, env). Aim for 80–150 entries total.

For each entry:
- id: unique, kebab-case, prefixed with category id (e.g. "slash-cost", "shortcut-esc-esc")
- category: one of the 9 ids above
- name: human-readable label (the command, key combo, setting key, env var name, etc.)
- syntax: exact invocation string when applicable (omit for pure concepts)
- description: ONE sentence, terse, no marketing language
- example: a realistic usage example, when adding one helps
- since: version string when known
- tags: 1–3 short tags
- docs: URL to the official Claude Code docs section that documents this

Sources to consult:
- https://docs.claude.com/en/docs/claude-code/  (and all subpages)
- The Claude Code changelog
- The Claude Code GitHub releases page

Constraints:
- Do not invent entries. If something is undocumented or unclear, skip it.
- Preserve the two seed entries already in the file.
- Bump version to 1.1.0 and update lastUpdated to today's date.
- Validate the file when done with: npx --yes ajv-cli@5 validate -s data/schema.json -d data/commands.json --strict=false
- Run: node scripts/check-integrity.mjs
- Both must pass before you finish.

Return a one-paragraph summary of how many entries you added per category.
```

- [ ] **Step 2: Review the agent's output**

Open `data/commands.json` and skim. Check:
- All 9 categories have at least one entry.
- No `id` collisions, no missing `description`, no fabricated docs URLs (spot-check 3–5).
- Counts per category are roughly balanced (no single category dominates and no category is empty).

If the agent fabricated content or missed a category, push back with a corrective follow-up message.

- [ ] **Step 3: Validate**

Run:
```bash
npx --yes ajv-cli@5 validate -s data/schema.json -d data/commands.json --strict=false
node scripts/check-integrity.mjs
```
Both must pass.

- [ ] **Step 4: Verify in browser**

Run: `python3 -m http.server 8080`
- Sidebar counts are non-zero across all 9 categories.
- Search for `mcp` returns at least 5 results.
- Random docs link opens an actual docs page.

- [ ] **Step 5: Commit**

```bash
git add data/commands.json
git commit -m "feat: populate initial command set across all 9 categories"
```

---

## Phase 7 — Ship

### Task 14: Push, enable Pages, schedule the refresh agent

This task is human-driven on GitHub. Document and walk through it.

**Files:** none (all changes happen on GitHub.com)

- [ ] **Step 1: Confirm/rename repo slug on GitHub**

If the GitHub repo is currently named `Claude cheat code` (with spaces), rename it to `claude-cheat-code` in **Settings → Repository name**. The local working directory does **not** need to be renamed — git will continue to work with the existing remote.

- [ ] **Step 2: Push to `main`**

```bash
git push -u origin main
```

- [ ] **Step 3: Enable Pages**

Repo on GitHub → **Settings → Pages → Build and deployment → Source: GitHub Actions**. Then re-run the latest `Deploy to GitHub Pages` workflow if it didn't auto-trigger.

- [ ] **Step 4: Verify the deployed site**

Open `https://<your-username>.github.io/claude-cheat-code/`. Run the same browser checks as Task 13 Step 4.

- [ ] **Step 5: Schedule the refresh agent**

In a Claude Code session for this repo, run:

```
/schedule
```

Create a routine with:
- **Cadence:** monthly, 1st of month, 09:00 UTC
- **Prompt:** the contents of `scripts/refresh.md`
- **Repo:** this one

This is what actually opens the monthly PR. The `refresh.yml` workflow is only the safety net that opens a `stale-refresh` issue if the agent stops running.

- [ ] **Step 6: Final commit + tag**

If the prior tasks left no uncommitted changes, tag the release:

```bash
git tag -a v1.0.0 -m "Initial public release"
git push origin v1.0.0
```

---

## Self-review

**Spec coverage check:**
- §1 Goal — Tasks 1–13 build the searchable single-page reference. ✓
- §3 Success criteria, "all 9 categories present" — Task 13 enforces this. ✓
- §3 "<200 ms interactive" — performance budget mentioned in spec; vanilla stack with no build inherently meets it; manual browser check in Tasks 5/6/7 verifies. ✓
- §3 "single-edit contributions" — Task 12 ships CONTRIBUTING.md, PR template, schema validation. ✓
- §3 "monthly refresh PR + freshness signal" — Task 11 stale-refresh workflow + Task 14 Step 5 schedules the agent. ✓
- §4 Categories — Task 2 seeds all 9 in `commands.json`. ✓
- §5 File structure — Task list matches the file map exactly. ✓
- §6 Data model — Task 1 schema mirrors the spec section verbatim. ✓
- §7 UX — Tasks 3, 5, 6, 7, 8 cover shell, sidebar, cards, search, filter, copy, theme, hash routing. ✓
- §8 Performance budget — Phase 1–3 deliberately keep `app.js` small; no framework. ✓
- §9.1 Pages deploy — Task 9. ✓
- §9.2 PR validation (schema + integrity + links) — Task 10. ✓
- §9.3 Refresh workflow — Task 11. ✓
- §9.4 Contribution flow — Task 12. ✓
- §10 Initial content population — Task 13. ✓
- §11 Risks — Tailwind CDN pinned in Task 3 (`@3.4.16`); Fuse.js fallback to substring match in Task 7; stale-refresh issue in Task 11; repo rename note in Task 14. ✓

**Placeholder scan:** Searched plan for "TBD", "TODO", "fill in", "appropriate error handling", "similar to" — none in instruction steps. ✓

**Type/name consistency:**
- `STATE` shape introduced in Task 6, extended consistently in Task 7 (`activeCats`, `filtered`, `query`, `data`). ✓
- Function names (`renderCard`, `renderContent`, `renderSidebar`, `renderChips`, `applyFilters`, `attachInteractionHandlers`, `attachCopyHandlers`, `rerender`, `loadData`, `main`) are stable across tasks. ✓
- Category ids match between Task 2, Task 13 prompt, and Task 1 schema regex. ✓
- Workflow filenames (`pages.yml`, `validate.yml`, `refresh.yml`) match between file map, Tasks 9–11, and README. ✓

No issues to fix. Plan ready.
