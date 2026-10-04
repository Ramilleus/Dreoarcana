/* ===================================================================
 * Dreoarcana Arcana — Flux on the map
 *
 * A Flux zone is a circular Measured Template on the scene, flagged
 * with its intensity and when it last weakened. Large conversions and
 * fumbles make them; the active GM's clock lets them fade; a cast or a
 * structure standing in one feels it. Positions are read from token
 * and template documents, so none of this needs the canvas drawn.
 * =================================================================== */

import { SYSTEM_ID } from "./core.js";
import { FLUX_MAX, FLUX_SIGNS, fluxRadius } from "./rules.js";
import { setting, num, SETTINGS } from "./settings.js";
import { e } from "./html.js";

const FLAG = "flux";
const now = () => Number(game.time?.worldTime) || 0;
const COLOURS = { 1: "#8a63d2", 2: "#c04fd8", 3: "#ff3fa4" };

export const fluxOn = () => setting(SETTINGS.fluxEnabled) !== false;
export const isFlux = (tpl) => Boolean(tpl?.flags?.[SYSTEM_ID]?.[FLAG]);
export const fluxState = (tpl) => tpl?.flags?.[SYSTEM_ID]?.[FLAG] ?? null;
export const fluxZones = (scene) => (scene?.templates?.filter(isFlux) ?? []);

/** The scene an actor is on, and its token there (linked or not), without the canvas. */
export function tokenOf(actor) {
  if (!actor) return null;
  const scenes = [game.scenes?.viewed, game.scenes?.active, ...(game.scenes ?? [])].filter(Boolean);
  for (const scene of scenes) {
    const tok = scene.tokens.find(t => t.actor === actor || (t.actorLink && t.actorId === actor.id));
    if (tok) return tok;
  }
  return null;
}

/** Scene units per metre (Mythras scenes are in metres; a feet scene is converted). */
function unitsPerMetre(scene) {
  const u = String(scene?.grid?.units ?? "m").toLowerCase();
  return /ft|feet|foot/.test(u) ? 1 / 0.3048 : 1;
}

function centreOf(tok) {
  const size = tok.parent?.grid?.size ?? 100;
  return { x: tok.x + (Number(tok.width) || 1) * size / 2, y: tok.y + (Number(tok.height) || 1) * size / 2 };
}

/** The strongest Flux at a token's centre: 0 for none. */
export function fluxAtToken(tok) {
  if (!tok || !fluxOn()) return 0;
  const scene = tok.parent;
  const size = scene?.grid?.size ?? 100, dist = scene?.grid?.distance ?? 1;
  const c = centreOf(tok);
  let best = 0;
  for (const tpl of fluxZones(scene)) {
    const radiusPx = (Number(tpl.distance) || 0) / dist * size;
    if (Math.hypot(c.x - tpl.x, c.y - tpl.y) <= radiusPx + 1e-6) best = Math.max(best, Number(fluxState(tpl).intensity) || 0);
  }
  return best;
}

export const fluxAt = (actor) => fluxAtToken(tokenOf(actor));

/** A random sign of Flux, from the canon. */
export const fluxSign = () => FLUX_SIGNS[Math.floor(Math.random() * FLUX_SIGNS.length)];

/**
 * Open a Flux zone where an actor stands. Returns the template, or null
 * when there is nowhere to put it (no token on a scene).
 *   radiusM      the zone's radius; default the spell's Size radius + 3 m per intensity
 *   stepSeconds  how fast this zone weakens; default the setting (an hour)
 */
export async function createFlux(actor, intensity, opts = {}) {
  return createFluxAtToken(tokenOf(actor), intensity, opts);
}

export async function createFluxAtToken(tok, intensity, { sizeTier = 1, radiusM = null, stepSeconds = null, source = "" } = {}) {
  const i = Math.min(FLUX_MAX, Math.max(0, Math.round(Number(intensity) || 0)));
  if (!i || !fluxOn() || !tok) return null;
  const scene = tok.parent;
  const c = centreOf(tok);
  const data = {
    t: "circle", x: c.x, y: c.y,
    distance: Math.round((radiusM ?? fluxRadius(i, sizeTier)) * unitsPerMetre(scene) * 10) / 10,
    fillColor: COLOURS[i], borderColor: COLOURS[i],
    flags: { [SYSTEM_ID]: { [FLAG]: { intensity: i, since: now(), source, ...(stepSeconds ? { stepSeconds } : {}) } } }
  };
  try {
    const [tpl] = await scene.createEmbeddedDocuments("MeasuredTemplate", [data]);
    return tpl ?? null;
  } catch (err) {
    console.warn("Dreoarcana | Arcana: could not open a Flux zone", err);
    return null;
  }
}

/** The active GM lets Flux fade: one intensity per `fluxHours` of game time. */
let ageing = false;
export async function ageFlux() {
  if (!game.user?.isGM || (game.users.activeGM && game.users.activeGM !== game.user) || ageing) return;
  ageing = true;
  try {
    const step = Math.max(0.1, num(SETTINGS.fluxHours, 1)) * 3600;
    const t = now();
    for (const scene of game.scenes ?? []) {
      const updates = [], gone = [];
      for (const tpl of fluxZones(scene)) {
        const s = fluxState(tpl);
        const zoneStep = Number(s.stepSeconds) > 0 ? Number(s.stepSeconds) : step;
        const lost = Math.floor((t - (Number(s.since) || 0)) / zoneStep);
        if (lost < 1) continue;
        const left = (Number(s.intensity) || 0) - lost;
        if (left <= 0) gone.push(tpl.id);
        else updates.push({ _id: tpl.id, fillColor: COLOURS[left], borderColor: COLOURS[left],
          [`flags.${SYSTEM_ID}.${FLAG}`]: { ...s, intensity: left, since: (Number(s.since) || 0) + lost * zoneStep } });
      }
      if (updates.length) await scene.updateEmbeddedDocuments("MeasuredTemplate", updates);
      if (gone.length) await scene.deleteEmbeddedDocuments("MeasuredTemplate", gone);
    }
  } catch (err) {
    console.warn("Dreoarcana | Arcana: Flux", err);
  } finally { ageing = false; }
}

/** One line for a card: the Flux a cast left. */
export const fluxLeftHTML = (intensity, made) => `<p class="mm-error"><strong>Flux ${intensity}.</strong> ${e(fluxSign())} ${made
  ? "The conversion leaves a zone of it where the portal opened."
  : "The conversion leaves Flux behind; with no token on a scene, the GM places it."}</p>`;
