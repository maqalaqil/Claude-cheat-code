## What changed

<!-- Briefly describe the change. -->

## Source

<!-- Link to official docs / changelog entry / release notes that justifies this change. -->

## Checklist

- [ ] Ran `npx ajv-cli@5 validate --spec=draft2020 -s data/schema.json -d data/commands.json --strict=false`
- [ ] Ran `node scripts/check-integrity.mjs`
- [ ] Bumped `lastUpdated` and `version` in `data/commands.json` (if data changed)
- [ ] Verified the page renders locally (`python3 -m http.server 8080`)