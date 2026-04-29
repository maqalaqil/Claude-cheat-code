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
5. Validate locally: `npx --yes ajv-cli@5 validate --spec=draft2020 -s data/schema.json -d data/commands.json --strict=false` and `node scripts/check-integrity.mjs`.
6. Open a pull request titled `chore: monthly refresh YYYY-MM` whose body lists the additions, updates, and removals as bullet points, with a link to each upstream source.

Do not invent entries. If a feature is unclear or undocumented, skip it and note it in the PR body.
