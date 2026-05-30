import { Player } from './player.js';

const SAVE_KEY = 'al_save_v1';

/**
 * Serialize the current game state to localStorage.
 * Only the player and active mission are saved — the dungeon regenerates on next run.
 */
export function saveGame(gs) {
  if (!gs.player) return;
  const p = gs.player;
  const data = {
    v: 1,
    player: {
      classKey:  p.classDef.key,
      name:      p.name,
      level:     p.level,
      xp:        p.xp,
      xpNext:    p.xpNext,
      gold:      p.gold,
      honor:     p.honor,
      honorMax:  p.honorMax,
      stats:     { ...p.stats },         // includes equipment bonuses
      equipment: { ...p.equipment },
      inventory: { slots: p.inventory.slots.map(s => ({ ...s })) },
    },
    activeMission: gs.activeMission ? { ...gs.activeMission } : null,
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors (private browsing, full storage, etc.)
  }
}

/**
 * Reconstruct a Player and mission from the saved data.
 * Returns { player, activeMission } or null if no valid save exists.
 */
export function loadGame(CLASSES) {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);
    if (!data || data.v !== 1) return null;

    const classDef = CLASSES[data.player.classKey];
    if (!classDef) return null;

    // Construct a fresh Player then overwrite with saved data.
    // Constructor sets base stats from classDef; we immediately overwrite with
    // the saved stats, which already include all equipment bonuses — no need
    // to re-apply them.
    const player = new Player(classDef);
    player.name      = data.player.name;
    player.level     = data.player.level;
    player.xp        = data.player.xp;
    player.xpNext    = data.player.xpNext;
    player.gold      = data.player.gold;
    player.honor     = data.player.honor;
    player.honorMax  = data.player.honorMax;
    Object.assign(player.stats,     data.player.stats);
    Object.assign(player.equipment, data.player.equipment);
    player.inventory.slots = data.player.inventory.slots.map(s => ({ ...s }));

    return { player, activeMission: data.activeMission };
  } catch {
    return null;
  }
}

export function hasSave() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
