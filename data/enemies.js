// Enemy type definitions.
// Stats are base values for floor 1; createEnemy() scales them by floor depth.
export const ENEMY_TYPES = {
  prisoner: {
    name: 'Prisoner',
    char: 'p',
    color: '#9e9e9e',
    base: { hp: 15, str: 4, def: 1, spd: 3 },
    xpBase: 10,
    goldRange: [1, 5],
  },
  gladiator: {
    name: 'Gladiator',
    char: 'g',
    color: '#e0e0e0',
    base: { hp: 25, str: 7, def: 4, spd: 4 },
    xpBase: 20,
    goldRange: [5, 12],
  },
  mercenary: {
    name: 'Mercenary',
    char: 'm',
    color: '#ffb74d',
    base: { hp: 30, str: 8, def: 3, spd: 5 },
    xpBase: 28,
    goldRange: [8, 18],
  },
  legionary: {
    name: 'Legionary',
    char: 'l',
    color: '#ef5350',
    base: { hp: 40, str: 10, def: 7, spd: 3 },
    xpBase: 38,
    goldRange: [10, 25],
  },
  beast: {
    name: 'Wild Beast',
    char: 'b',
    color: '#a5d6a7',
    base: { hp: 18, str: 9, def: 2, spd: 7 },
    xpBase: 22,
    goldRange: [0, 3],
  },
};

/**
 * Instantiate an enemy at (x, y) scaled to the given dungeon floor.
 * Uses ROT.RNG (global from CDN) for gold randomisation.
 */
export function createEnemy(typeId, x, y, floor) {
  const type  = ENEMY_TYPES[typeId];
  const scale = 1 + (floor - 1) * 0.12;
  const hp    = Math.max(1, Math.floor(type.base.hp  * scale));
  const gold  = ROT.RNG.getUniformInt(type.goldRange[0], type.goldRange[1]);

  return {
    id:    typeId,
    name:  type.name,
    char:  type.char,
    color: type.color,
    x,
    y,
    stats: {
      hp,
      maxHp: hp,
      str: Math.max(1, Math.floor(type.base.str * scale)),
      def: Math.max(0, Math.floor(type.base.def * scale)),
      spd: type.base.spd,
    },
    xp:    Math.max(1, Math.floor(type.xpBase * scale)),
    gold,
    alive: true,
  };
}
