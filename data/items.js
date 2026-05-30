export const ITEMS = {
  // — Gear ————————————————————————————————
  iron_helm: {
    name: 'Iron Helm', type: 'armor', slot: 'head',
    char: '^', color: '#90a4ae',
    def: 2, value: 40,
    stackable: false,
  },
  bronze_shield: {
    name: 'Bronze Shield', type: 'armor', slot: 'offhand',
    char: ')', color: '#cd7f32',
    def: 3, value: 60,
    stackable: false,
  },
  gladius: {
    name: 'Gladius', type: 'weapon', slot: 'mainhand',
    char: '/', color: '#e0e0e0',
    atk: 4, value: 80,
    stackable: false,
  },
  trident: {
    name: 'Trident', type: 'weapon', slot: 'mainhand',
    char: '|', color: '#4fc3f7',
    atk: 6, value: 110,
    stackable: false,
  },
  serpent_scale: {
    name: 'Serpent Scale', type: 'armor', slot: 'body',
    char: '%', color: '#a5d6a7',
    def: 5, value: 150,
    stackable: false,
  },
  giant_club: {
    name: 'Giant\'s Club', type: 'weapon', slot: 'mainhand',
    char: '\\', color: '#8d6e63',
    atk: 12, value: 200,
    stackable: false,
  },
  hound_fang: {
    name: 'Hound Fang', type: 'weapon', slot: 'offhand',
    char: '"', color: '#ce93d8',
    atk: 3, value: 90,
    stackable: false,
  },

  // — Potions ————————————————————————————————
  health_potion: {
    name: 'Health Potion', type: 'consumable',
    char: '!', color: '#f44336',
    effect: 'heal', value: 15, sellValue: 10,
    stackable: true,
  },
  bulls_blood_potion: {
    name: "Bull's Blood", type: 'consumable',
    char: '!', color: '#b71c1c',
    effect: 'heal', value: 40, sellValue: 25,
    stackable: true,
  },
  mana_potion: {
    name: 'Mana Potion', type: 'consumable',
    char: '!', color: '#1565c0',
    effect: 'restore_mp', value: 12, sellValue: 10,
    stackable: true,
  },

  // — Scrolls ————————————————————————————————
  scroll_of_fire: {
    name: 'Scroll of Fire', type: 'scroll',
    char: '?', color: '#ff9800',
    effect: 'fireball', damage: 20, value: 0, sellValue: 15,
    stackable: true,
  },
  scroll_of_blindness: {
    name: 'Scroll of Blindness', type: 'scroll',
    char: '?', color: '#78909c',
    effect: 'blind', duration: 3, value: 0, sellValue: 12,
    stackable: true,
  },
  scroll_of_haste: {
    name: 'Scroll of Haste', type: 'scroll',
    char: '?', color: '#ffee58',
    effect: 'haste', duration: 5, value: 0, sellValue: 20,
    stackable: true,
  },
  regen_scroll: {
    name: 'Scroll of Regeneration', type: 'scroll',
    char: '?', color: '#66bb6a',
    effect: 'regen', duration: 8, value: 0, sellValue: 18,
    stackable: true,
  },
};
