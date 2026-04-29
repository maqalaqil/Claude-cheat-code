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
