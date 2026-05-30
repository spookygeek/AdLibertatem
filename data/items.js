// Stat bonus field names:
//   atkBonus → adds to player.stats.str   (weapons)
//   defBonus → adds to player.stats.def   (armor)
//   spdBonus → adds to player.stats.spd   (boots / rings)
//   hpBonus  → adds to player.stats.maxHp (rings / necklaces)
// char is the glyph drawn on the dungeon floor when the item is lying around.

export const ITEMS = {

  // ── Weapons ──────────────────────────────────────────────────────────────
  gladius: {
    name: 'Gladius', type: 'weapon', slot: 'mainhand',
    char: '/', color: '#e0e0e0',
    atkBonus: 4, value: 80, sellValue: 32, stackable: false,
    desc: 'Standard short sword. Reliable.',
  },
  trident: {
    name: 'Trident', type: 'weapon', slot: 'mainhand',
    char: '|', color: '#4fc3f7',
    atkBonus: 6, value: 110, sellValue: 44, stackable: false,
    desc: 'Long reach, brutal thrust.',
  },
  twin_sicas: {
    name: 'Twin Sicas', type: 'weapon', slot: 'mainhand',
    char: '/', color: '#ef5350',
    atkBonus: 8, value: 160, sellValue: 64, stackable: false,
    desc: 'Dual curved blades. Fast strikes.',
  },
  giant_club: {
    name: "Giant's Club", type: 'weapon', slot: 'mainhand',
    char: '\\', color: '#8d6e63',
    atkBonus: 12, value: 220, sellValue: 88, stackable: false,
    desc: 'Enormous. Devastating. Slow.',
  },
  hound_fang: {
    name: 'Hound Fang', type: 'weapon', slot: 'offhand',
    char: '"', color: '#ce93d8',
    atkBonus: 3, value: 90, sellValue: 36, stackable: false,
    desc: 'Serrated offhand blade.',
  },

  // ── Armor ────────────────────────────────────────────────────────────────
  iron_helm: {
    name: 'Iron Helm', type: 'armor', slot: 'head',
    char: '^', color: '#90a4ae',
    defBonus: 2, value: 40, sellValue: 16, stackable: false,
    desc: 'Simple protection for your skull.',
  },
  bronze_helm: {
    name: 'Bronze Helm', type: 'armor', slot: 'head',
    char: '^', color: '#cd7f32',
    defBonus: 3, value: 75, sellValue: 30, stackable: false,
    desc: 'Heavier and more protective.',
  },
  bronze_shield: {
    name: 'Bronze Shield', type: 'armor', slot: 'offhand',
    char: ')', color: '#cd7f32',
    defBonus: 3, value: 60, sellValue: 24, stackable: false,
    desc: 'Deflects strikes reliably.',
  },
  iron_shield: {
    name: 'Iron Shield', type: 'armor', slot: 'offhand',
    char: ')', color: '#90a4ae',
    defBonus: 5, value: 120, sellValue: 48, stackable: false,
    desc: 'Heavy and nearly impenetrable.',
  },
  lorica_manica: {
    name: 'Lorica Manica', type: 'armor', slot: 'body',
    char: '%', color: '#bdbdbd',
    defBonus: 3, value: 90, sellValue: 36, stackable: false,
    desc: 'Segmented arm-guard. Lighter than plate.',
  },
  serpent_scale: {
    name: 'Serpent Scale', type: 'armor', slot: 'body',
    char: '%', color: '#a5d6a7',
    defBonus: 5, value: 150, sellValue: 60, stackable: false,
    desc: 'Supple. Supernaturally hard.',
  },
  leather_boots: {
    name: 'Leather Boots', type: 'armor', slot: 'boots',
    char: '{', color: '#a1887f',
    spdBonus: 1, defBonus: 0, value: 35, sellValue: 14, stackable: false,
    desc: '+1 SPD. Light on your feet.',
  },
  iron_boots: {
    name: 'Iron Boots', type: 'armor', slot: 'boots',
    char: '{', color: '#78909c',
    spdBonus: 0, defBonus: 2, value: 70, sellValue: 28, stackable: false,
    desc: '+2 DEF. Heavy but solid.',
  },
  ring_of_strength: {
    name: 'Ring of Strength', type: 'armor', slot: 'ring',
    char: 'o', color: '#ef5350',
    atkBonus: 3, value: 140, sellValue: 56, stackable: false,
    desc: '+3 ATK. Forged from a warrior\'s token.',
  },
  ring_of_vitality: {
    name: 'Ring of Vitality', type: 'armor', slot: 'ring',
    char: 'o', color: '#4caf50',
    hpBonus: 20, value: 140, sellValue: 56, stackable: false,
    desc: '+20 max HP. Warm to the touch.',
  },
  amulet_of_fortune: {
    name: 'Amulet of Fortune', type: 'armor', slot: 'necklace',
    char: '=', color: '#ffca28',
    defBonus: 1, atkBonus: 1, value: 220, sellValue: 88, stackable: false,
    desc: '+1 ATK, +1 DEF. Luck carved in gold.',
  },

  // ── Potions ──────────────────────────────────────────────────────────────
  health_potion: {
    name: 'Health Potion', type: 'consumable',
    char: '!', color: '#f44336',
    effect: 'heal', value: 15, sellValue: 6, stackable: true,
    desc: 'Restores 15 HP.',
  },
  bulls_blood_potion: {
    name: "Bull's Blood", type: 'consumable',
    char: '!', color: '#b71c1c',
    effect: 'heal', value: 40, sellValue: 16, stackable: true,
    desc: 'Restores 40 HP. Tastes foul.',
  },
  mana_potion: {
    name: 'Mana Potion', type: 'consumable',
    char: '!', color: '#1565c0',
    effect: 'restore_mp', value: 12, sellValue: 5, stackable: true,
    desc: 'Restores 12 MP.',
  },

  // ── Scrolls ──────────────────────────────────────────────────────────────
  scroll_of_fire: {
    name: 'Scroll of Fire', type: 'scroll',
    char: '?', color: '#ff9800',
    effect: 'fireball', damage: 20, value: 30, sellValue: 12, stackable: true,
    desc: 'Deals 20 fire damage to one enemy.',
  },
  scroll_of_blindness: {
    name: 'Scroll of Blindness', type: 'scroll',
    char: '?', color: '#78909c',
    effect: 'blind', duration: 3, value: 25, sellValue: 10, stackable: true,
    desc: 'Enemy skips their next 3 turns.',
  },
  scroll_of_haste: {
    name: 'Scroll of Haste', type: 'scroll',
    char: '?', color: '#ffee58',
    effect: 'haste', duration: 5, value: 40, sellValue: 16, stackable: true,
    desc: '+5 SPD for 5 turns.',
  },
  regen_scroll: {
    name: 'Scroll of Regeneration', type: 'scroll',
    char: '?', color: '#66bb6a',
    effect: 'regen', duration: 8, value: 35, sellValue: 14, stackable: true,
    desc: 'Regenerate HP over 8 turns.',
  },
};
