import { Inventory } from './economy.js';
import { ITEMS }     from '../data/items.js';

const XP_PER_LEVEL = (level) => level * 20;

export class Player {
  constructor(classDef) {
    this.classDef = classDef;
    this.name     = classDef.name;
    this.char     = '@';
    this.color    = classDef.color;
    this.x        = 0;
    this.y        = 0;

    this.level   = 1;
    this.xp      = 0;
    this.xpNext  = XP_PER_LEVEL(1);
    this.gold    = 0;
    this.honor   = 0;
    this.honorMax = 50;

    // Stats deep-copied from class definition
    this.stats = { ...classDef.stats };

    // Equipment slots — all empty at start
    this.equipment = {
      head: null, body: null, boots: null,
      mainhand: null, offhand: null,
      ring: null, necklace: null,
    };

    this.inventory = new Inventory();
  }

  // ── Progression ───────────────────────────────────────────────────────────

  gainXp(amount) {
    this.xp += amount;
    const leveled = [];
    while (this.xp >= this.xpNext && this.level < 20) {
      this.xp -= this.xpNext;
      this._levelUp();
      leveled.push(this.level);
      this.xpNext = XP_PER_LEVEL(this.level);
    }
    return leveled;
  }

  _levelUp() {
    if (this.level >= 20) return;
    this.level += 1;
    const g = this.classDef.growth;
    this.stats.maxHp += g.hp;
    this.stats.hp     = Math.min(this.stats.hp + g.hp, this.stats.maxHp);
    this.stats.str   += g.str;
    this.stats.def   += g.def;
    this.stats.spd   += g.spd;
    this.stats.maxMp += g.mp;
  }

  heal(amount) {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
  }

  isDead() {
    return this.stats.hp <= 0;
  }

  // ── Equipment ────────────────────────────────────────────────────────────

  /**
   * Equip an item that is already in the player's inventory.
   * Unequips whatever is in that slot (returning it to inventory).
   * Adjusts stats for removed and new items.
   */
  equip(itemId) {
    const item = ITEMS[itemId];
    if (!item || (item.type !== 'weapon' && item.type !== 'armor')) return false;
    if (!this.inventory.has(itemId)) return false;

    const slot  = item.slot;
    const oldId = this.equipment[slot];

    // Remove old item's bonuses and return it to inventory
    if (oldId) {
      const old = ITEMS[oldId];
      this.stats.str   -= (old.atkBonus || 0);
      this.stats.def   -= (old.defBonus || 0);
      this.stats.spd   -= (old.spdBonus || 0);
      this.stats.maxHp -= (old.hpBonus  || 0);
      this.stats.hp     = Math.min(this.stats.hp, this.stats.maxHp);
      this.inventory.add(oldId);
    }

    // Remove new item from inventory and apply its bonuses
    this.inventory.remove(itemId);
    this.stats.str   += (item.atkBonus || 0);
    this.stats.def   += (item.defBonus || 0);
    this.stats.spd   += (item.spdBonus || 0);
    this.stats.maxHp += (item.hpBonus  || 0);
    this.equipment[slot] = itemId;
    return true;
  }

  /**
   * Pick up an item found on the dungeon floor.
   * Gear is auto-equipped if it's strictly better than what's currently worn
   * (score = sum of all stat bonuses). Consumables always go in the pack.
   * Returns 'equipped' | 'stored'.
   */
  pickup(itemId) {
    const item = ITEMS[itemId];
    if (!item) return 'failed';

    this.inventory.add(itemId);

    if (item.type === 'weapon' || item.type === 'armor') {
      const slot     = item.slot;
      const oldId    = this.equipment[slot];
      const newScore = (item.atkBonus || 0) + (item.defBonus || 0) + (item.spdBonus || 0) + (item.hpBonus || 0);
      const oldScore = oldId
        ? (ITEMS[oldId].atkBonus || 0) + (ITEMS[oldId].defBonus || 0) + (ITEMS[oldId].spdBonus || 0) + (ITEMS[oldId].hpBonus || 0)
        : -1;

      if (newScore > oldScore) {
        this.equip(itemId);
        return 'equipped';
      }
    }
    return 'stored';
  }

  /**
   * Use a consumable or scroll from inventory in combat.
   * Returns a result object the caller uses to build the combat log, or null.
   */
  useItem(itemId) {
    const item = ITEMS[itemId];
    if (!item) return null;

    const isUsable = item.type === 'consumable' || item.type === 'scroll';
    if (!isUsable || !this.inventory.has(itemId)) return null;

    this.inventory.remove(itemId);

    if (item.effect === 'heal') {
      const before = this.stats.hp;
      this.heal(item.value);
      return { effect: 'heal', amount: this.stats.hp - before, item };
    }
    if (item.effect === 'restore_mp') {
      const before = this.stats.mp;
      this.stats.mp = Math.min(this.stats.maxMp, this.stats.mp + item.value);
      return { effect: 'restore_mp', amount: this.stats.mp - before, item };
    }
    // Scrolls (fireball, etc.) — caller handles damage application
    return { effect: item.effect, item };
  }
}
