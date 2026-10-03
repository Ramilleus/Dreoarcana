/* ===================================================================
 * Dreoarcana Arcana — sound, in Foundry
 *
 * The synthesis lives in audio.js and knows nothing of Foundry. This
 * file plugs it in: an audio context, the players' volume settings,
 * the system socket that lets every client hear a cast, and exporting
 * a spell's sound as a WAV file in the user data folder.
 *
 * Casting sends the *build* over the socket, not audio — each client
 * synthesises the same sound locally, so nothing is uploaded.
 * =================================================================== */

import { SYSTEM_ID, FilePickerImpl } from "./core.js";
import { setting, SETTINGS } from "./settings.js";
import { playSpell, renderSpellWav, describeSound } from "./audio.js";
import { buildOf, DATA_DIR } from "./spells.js";
import { buildShapeKey } from "./rules.js";

const SOCKET = `system.${SYSTEM_ID}`;
export const SOUND_DIR = `${DATA_DIR}/sounds`;

/** Foundry's interface context if it has one; else a private one. */
function audioContext() {
  const ctx = game.audio?.interface ?? game.audio?.context ?? null;
  if (ctx) return ctx;
  const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  return AC ? (audioContext._own ??= new AC()) : null;
}

/** This player's volume: their Arcana slider under the core interface slider. */
export function soundVolume() {
  const mine = Number(setting(SETTINGS.soundVolume) ?? 0.8);
  let core = 1;
  try { core = Number(game.settings.get("core", "globalInterfaceVolume")); } catch { /* older core */ }
  if (!Number.isFinite(core)) core = 1;
  return Math.max(0, Math.min(1, mine)) * Math.max(0, Math.min(1, core));
}

/** Play a build on this client only. Returns the length in seconds. */
export async function playLocal(build, { outcome = "success", overheat = false, volume = null } = {}) {
  const v = volume ?? soundVolume();
  if (v <= 0) return 0;
  return playSpell(build, { ctx: audioContext(), volume: v, outcome, overheat });
}

/** Play here and on every other client. */
export async function broadcastCast(build, { outcome = "success", overheat = false } = {}) {
  if (setting(SETTINGS.castSounds) === false) return 0;
  try { game.socket?.emit(SOCKET, { type: "arcana.cast-sound", build, outcome, overheat, user: game.user?.id }); }
  catch (err) { console.warn("Dreoarcana | Arcana: sound broadcast failed:", err.message); }
  return playLocal(build, { outcome, overheat });
}

/** Listen for other clients' casts. Call once at ready. */
export function registerSocket() {
  game.socket?.on(SOCKET, (msg) => {
    if (msg?.type !== "arcana.cast-sound" || !msg.build) return;
    if (setting(SETTINGS.castSounds) === false) return;
    playLocal(msg.build, { outcome: msg.outcome, overheat: Boolean(msg.overheat) });
  });
}

/**
 * Render a spell item's sound to a WAV in Data/dreoarcana/sounds and
 * remember the path on the item. Needs file-upload permission.
 */
export async function exportSpellWav(item) {
  if (!game.user?.can?.("FILES_UPLOAD")) {
    ui.notifications.warn("You can't upload files in this world, so the sound can't be saved. Listening still works.");
    return null;
  }
  const build = buildOf(item);
  const slug = String(item.name ?? "spell").slugify?.({ strict: true }) || "spell";
  const fileName = `${slug}-${buildShapeKey(build)}.wav`;
  const FP = FilePickerImpl();
  try {
    ui.notifications.info(`Rendering the sound of ${item.name}…`);
    const blob = await renderSpellWav(build, { volume: 1 });
    for (const dir of [DATA_DIR, SOUND_DIR]) { try { await FP.createDirectory("data", dir); } catch { /* exists */ } }
    const file = new File([blob], fileName, { type: "audio/wav" });
    const res = await FP.upload("data", SOUND_DIR, file, {}, { notify: false });
    const path = res?.path ?? `${SOUND_DIR}/${fileName}`;
    if (item.isOwner) await item.update({ "system.soundFile": path });
    ui.notifications.info(`Saved ${path} (${(blob.size / 1024).toFixed(0)} KB).`);
    return path;
  } catch (err) {
    console.error("Dreoarcana | Arcana: sound export failed", err);
    ui.notifications.error(`Could not save the sound: ${err.message}`);
    return null;
  }
}

export { describeSound };
