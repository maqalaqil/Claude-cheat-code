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
