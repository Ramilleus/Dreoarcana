/* ===================================================================
 * Dreoarcana Alchemy — the rules, as pages
 *
 * static/rules/alchemy.md is the canon "Mythras Alchemy System"
 * document, carried into the system with its few contradictions of the
 * Mythras rulebook corrected (each correction says so in place). It is
 * fetched once and split at its "## " headings; Foundry's own showdown
 * converter renders each page.
 * =================================================================== */

import { SYSTEM_ID } from "../arcana/core.js";

const PATH = `systems/${SYSTEM_ID}/rules/alchemy.md`;
let cache = null;

function toHTML(md) {
  const Showdown = globalThis.showdown;
  if (!Showdown) return `<pre>${foundry.utils.escapeHTML(md)}</pre>`;
  const conv = new Showdown.Converter({ ...(CONST.SHOWDOWN_OPTIONS ?? {}), tables: true, strikethrough: true, simpleLineBreaks: false });
  return conv.makeHtml(md);
}

/** [{ name, html }] — one page per "## " section, the title page first. */
export async function alchemyPages() {
  if (cache) return cache;
  let text = "";
  try { text = await (await fetch(PATH)).text(); }
  catch (err) { console.warn("Dreoarcana | Alchemy: rules text not found", err); return [{ name: "Rules", html: "<p>The alchemy rules text could not be loaded.</p>" }]; }
  const parts = text.split(/^## /m);
  const intro = parts.shift();
  const pages = [];
  if (intro.trim()) pages.push({ name: "Overview", html: toHTML(intro.replace(/^# .*\n/, "")) });
  for (const p of parts) {
    const nl = p.indexOf("\n");
    pages.push({ name: p.slice(0, nl).trim(), html: toHTML(p.slice(nl + 1)) });
  }
  cache = pages;
  return pages;
}
