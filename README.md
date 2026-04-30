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

## SEO + LLM-friendly

The page ships with full SEO metadata (Open Graph, Twitter Card, canonical URL, JSON-LD `WebSite` + `SoftwareApplication`, `theme-color`, social card) and a `<noscript>` fallback that points at plain-text directories.

For LLMs and crawlers that prefer plain text, `scripts/generate-static.mjs` emits these on every deploy from `commands.json`:

- `/llms.txt` — short directory following the [llmstxt.org](https://llmstxt.org/) convention
- `/llms-full.txt` — the entire reference as plain markdown
- `/sitemap.xml` — homepage + one URL per category hash
- `/robots.txt` — open crawl + sitemap pointer
- `/og.svg` — 1200×630 social card

These are gitignored; they only exist in the deployed site. Regenerate locally with `node scripts/generate-static.mjs`.

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