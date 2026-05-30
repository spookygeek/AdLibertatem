// Boss definitions.  special describes the mechanic; doBossAttack() in game.js enforces it.
export const BOSSES = [
  {
    id: 'harpy', name: 'Harpy', char: 'H', color: '#ffca28', floor: 3,
    stats: { hp: 45, maxHp: 45, str: 8, def: 2, spd: 6 },
    special: 'none',   // high speed already baked into stats
    description: 'Fast and aggressive. Screech attack hits from a distance.',
    loot: ['mana_potion'], xp: 70,
  },
  {
    id: 'minotaur', name: 'Minotaur', char: 'M', color: '#8d6e63', floor: 5,
    stats: { hp: 80, maxHp: 80, str: 12, def: 5, spd: 3 },
    special: 'rage',   // STR doubles when HP < 50 % (once)
    description: 'Rages when below half HP — attack doubles.',
    loot: ['iron_helm', 'bulls_blood_potion'], xp: 100,
  },
  {
    id: 'hydra', name: 'Hydra', char: 'Y', color: '#66bb6a', floor: 8,
    stats: { hp: 90, maxHp: 90, str: 11, def: 4, spd: 2 },
    special: 'regen',  // restores 30 % HP once when below 50 %
    description: 'Regenerates when bloodied.',
    loot: ['regen_scroll'], xp: 120,
  },
  {
    id: 'medusa', name: 'Medusa', char: 'G', color: '#a5d6a7', floor: 10,
    stats: { hp: 60, maxHp: 60, str: 10, def: 3, spd: 5 },
    special: 'stun',   // 25 % chance each hit stuns player 1 turn
    description: 'Gaze attack can stun for 1 turn.',
    loot: ['serpent_scale', 'scroll_of_blindness'], xp: 130,
  },
  {
    id: 'sphinx', name: 'Sphinx', char: 'X', color: '#ab47bc', floor: 12,
    stats: { hp: 70, maxHp: 70, str: 9, def: 6, spd: 4 },
    special: 'none',
    description: 'Ancient riddle-keeper. Tough defences.',
    loot: ['ring_of_vitality'], xp: 150,
  },
  {
    id: 'cerberus', name: 'Cerberus', char: 'C', color: '#ce93d8', floor: 15,
    stats: { hp: 120, maxHp: 120, str: 15, def: 6, spd: 6 },
    special: 'double',  // attacks twice each turn
    description: 'Three-headed. Attacks twice per turn.',
    loot: ['hound_fang', 'scroll_of_haste'], xp: 200,
  },
  {
    id: 'chimera', name: 'Chimera', char: 'K', color: '#ef9a9a', floor: 17,
    stats: { hp: 100, maxHp: 100, str: 13, def: 5, spd: 5 },
    special: 'chaos',   // random × 0.5 / × 1.0 / × 2.0 damage each turn
    description: 'Randomized attack type: fire, physical, or poison.',
    loot: ['scroll_of_fire'], xp: 180,
  },
  {
    id: 'cyclops', name: 'Cyclops', char: 'O', color: '#ffcc02', floor: 20,
    stats: { hp: 200, maxHp: 200, str: 20, def: 8, spd: 2 },
    special: 'boulder', // every 3rd turn ignores defense
    description: 'Slow but devastating. Boulder throw ignores defense.',
    loot: ['giant_club', 'regen_scroll'], xp: 350,
  },
  {
    id: 'scylla', name: 'Scylla', char: 'S', color: '#26c6da', floor: 25,
    stats: { hp: 150, maxHp: 150, str: 16, def: 7, spd: 3 },
    special: 'double',  // attacks twice each turn
    description: 'Multi-target attack strikes all adjacent tiles.',
    loot: ['amulet_of_fortune'], xp: 280,
  },
];

/**
 * Instantiate a boss entity at (x, y) for the given dungeon floor.
 * Scales stats slightly if the floor is deeper than the boss's intended floor.
 */
export function createBoss(bossId, x, y, floor) {
  const t     = BOSSES.find(b => b.id === bossId);
  const scale = 1 + Math.max(0, floor - t.floor) * 0.08;
  const hp    = Math.floor(t.stats.hp * scale);
  return {
    id:          t.id,
    name:        t.name,
    char:        t.char,
    color:       t.color,
    x, y,
    stats: {
      hp, maxHp: hp,
      str: Math.floor(t.stats.str * scale),
      def: t.stats.def,
      spd: t.stats.spd,
    },
    xp:          Math.floor(t.xp * scale),
    gold:        Math.floor(60 + floor * 12),
    loot:        [...t.loot],
    special:     t.special,
    alive:       true,
    isBoss:      true,
  };
}
