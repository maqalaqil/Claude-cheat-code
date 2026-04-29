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
   npx --yes ajv-cli@5 validate --spec=draft2020 -s data/schema.json -d data/commands.json --strict=false
   node scripts/check-integrity.mjs
   ```

4. Bump `lastUpdated` to today and increment `version` (patch).
5. Open a PR. CI will validate the JSON and check links.

## Add a new category

Add to `categories` first, then any entries that reference it. Keep `id` kebab-case.

## Code or styling changes

Run `python3 -m http.server 8080` and verify the page in a browser. Keep the JS under ~15 KB; this stays a no-build site.