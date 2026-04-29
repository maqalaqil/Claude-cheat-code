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
