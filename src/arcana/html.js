/* ===================================================================
 * Dreoarcana Arcana — HTML escaping
 *
 * Chat cards, panels and dialogs are built as HTML strings. Anything a
 * user can set — an item or actor name, a flag value — is escaped so a
 * rename like `<img src=x onerror=...>` stays text. Quotes are escaped
 * too, so one function is safe in both element text and attributes.
 * =================================================================== */

export function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const e = escapeHTML;
