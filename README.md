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