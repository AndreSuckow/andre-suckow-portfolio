// Shared education links for the HTML and TV views.
const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const medal = `<svg class="certification-medal" viewBox="0 0 64 80" fill="none" aria-hidden="true" focusable="false" shape-rendering="crispEdges"><path d="M16 40h14v36l-7-7-7 7V40Zm18 0h14v36l-7-7-7 7V40Z" fill="currentColor" opacity=".5"/><path d="M20 4h24v4h8v8h8v24h-8v8h-8v4H20v-4h-8v-8H4V16h8V8h8V4Z" fill="currentColor"/><path d="M23 12h18v4h8v8h4v10h-4v8h-8v4H23v-4h-8v-8h-4V24h4v-8h8v-4Z" fill="var(--tv-navy)"/><path d="M28 19h8v9h9v8h-9v9h-8v-9h-9v-8h9v-9Z" fill="currentColor"/><path d="M28 27h8v9h-8v-9Z" fill="var(--tv-paper)"/></svg>`;
exports.card = (p) =>
  `<article class="certification-card" aria-labelledby="certification-heading"><div class="certification-card__seal">${medal}<span class="pixel">ADS</span></div><div class="certification-card__body"><p class="eyebrow">Formação acadêmica</p><h3 id="certification-heading">${esc(p.education.title)}</h3><p>${esc(p.education.institution)} · ${esc(p.education.period)}</p><a class="btn" href="${esc(p.education.document)}" target="_blank" rel="noopener" data-tv="skills/certification">Ver documento <span aria-hidden="true">↗</span></a></div></article>`;
exports.reward = (p) => `<div data-certification-reward hidden></div>`;
exports.portrait = (p) =>
  `<a class="certification-portrait" href="${esc(p.education.document)}" target="_blank" rel="noopener" data-tv="sobre/certification">${medal}<span><span class="certification-portrait__label">Formação acadêmica</span><strong>${esc(p.education.title)}</strong><span class="certification-portrait__action">Ver documento ↗</span></span></a>`;
