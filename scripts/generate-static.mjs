// scripts/generate-static.mjs
// Generates: sitemap.xml, robots.txt, llms.txt, llms-full.txt
// Source of truth: data/commands.json
//
// Run: `node scripts/generate-static.mjs`
// Run in CI on every deploy so the artifacts always match the data.

import { readFileSync, writeFileSync } from 'node:fs';

const SITE_URL =
  (process.env.SITE_URL && process.env.SITE_URL.trim()) ||
  'https://maqalaqil.github.io/Claude-cheat-code/';
const SITE_HOST = new URL(SITE_URL).origin + new URL(SITE_URL).pathname.replace(/\/$/, '');

const data = JSON.parse(readFileSync('data/commands.json', 'utf8'));

const catLabel = (id) => data.categories.find((c) => c.id === id)?.label ?? id;

// ------- robots.txt -------
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_HOST}/sitemap.xml
`;
writeFileSync('robots.txt', robots);

// ------- sitemap.xml -------
const today = data.lastUpdated;
const urls = [
  `${SITE_HOST}/`,
  ...data.categories.map((c) => `${SITE_HOST}/#cat=${c.id}`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq></url>`,
  )
  .join('\n')}
</urlset>
`;
writeFileSync('sitemap.xml', sitemap);

// ------- llms.txt (compact directory) -------
// Spec: https://llmstxt.org/
const llms = [
  `# Claude Cheat Code`,
  ``,
  `> The community-maintained reference for every Claude Code surface: slash commands, CLI flags, keyboard shortcuts, hooks, MCP, agents, skills, settings.json keys, and environment variables. ${data.entries.length} entries across ${data.categories.length} categories. Source of truth lives in data/commands.json. Last updated ${data.lastUpdated} (v${data.version}).`,
  ``,
  `## Live site`,
  ``,
  `- [Searchable cheat sheet](${SITE_HOST}/)`,
  `- [Raw structured data (commands.json)](${SITE_HOST}/data/commands.json)`,
  `- [Full plain-text dump (llms-full.txt)](${SITE_HOST}/llms-full.txt)`,
  ``,
  `## Categories`,
  ``,
  ...data.categories.map(
    (c) =>
      `- [${c.label}](${SITE_HOST}/#cat=${c.id}) — ${data.entries.filter((e) => e.category === c.id).length} entries`,
  ),
  ``,
  `## Optional`,
  ``,
  `- [Repo](https://github.com/maqalaqil/Claude-cheat-code) — open an issue or PR to add or correct an entry.`,
  ``,
].join('\n');
writeFileSync('llms.txt', llms);

// ------- llms-full.txt (full content as plain text) -------
const blocks = [];
blocks.push(`# Claude Cheat Code — full reference`);
blocks.push(``);
blocks.push(
  `Generated from data/commands.json on ${data.lastUpdated} (v${data.version}). ${data.entries.length} entries.`,
);
blocks.push(``);

for (const cat of data.categories) {
  const items = data.entries.filter((e) => e.category === cat.id);
  if (items.length === 0) continue;
  blocks.push(`## ${cat.label} (${items.length})`);
  blocks.push(``);
  for (const e of items) {
    blocks.push(`### ${e.name}`);
    if (e.syntax) blocks.push(`Syntax: \`${e.syntax}\``);
    blocks.push(e.description);
    if (e.example) blocks.push(`Example: \`${e.example}\``);
    if (e.notes) blocks.push(`Notes: ${e.notes}`);
    if (e.since) blocks.push(`Since: ${e.since}`);
    if (e.tags?.length) blocks.push(`Tags: ${e.tags.join(', ')}`);
    if (e.docs) blocks.push(`Docs: ${e.docs}`);
    blocks.push(``);
  }
}

writeFileSync('llms-full.txt', blocks.join('\n'));

// ------- og.svg (1200x630 social card) -------
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0e0e0e"/>
      <stop offset="100%" stop-color="#1f1f23"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <text x="80" y="220" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="56" fill="#a1a1aa">claude-cheat-code</text>
  <text x="80" y="340" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="84" font-weight="700" fill="#fafafa">Every Claude Code</text>
  <text x="80" y="430" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="84" font-weight="700" fill="#fafafa">command in one page.</text>
  <text x="80" y="540" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="32" fill="#d4d4d8">${data.entries.length} entries · ${data.categories.length} categories · v${data.version}</text>
</svg>
`;
writeFileSync('og.svg', og);

console.log(
  `wrote: robots.txt, sitemap.xml (${urls.length} urls), llms.txt, llms-full.txt (${data.entries.length} entries), og.svg`,
);
