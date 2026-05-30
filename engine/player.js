import { Inventory } from './economy.js';

const XP_PER_LEVEL = (level) => level * 20;

export class Player {
  constructor(classDef) {
    this.classDef = classDef;
    this.name = classDef.name;
    this.char = '@';
    this.color = classDef.color;
    this.x = 0;
    this.y = 0;

    this.level = 1;
    this.xp = 0;
    this.xpNext = XP_PER_LEVEL(1);
    this.gold = 0;
    this.honor = 0;
    this.honorMax = 50;

    // Stats deep-copied from class definition (uses str/def/spd naming)
    this.stats = { ...classDef.stats };

    // Equipment slots — all empty at start
    this.equipment = {
      head: null, body: null, boots: null,
      mainhand: null, offhand: null,
      ring: null, necklace: null,
    };

    this.inventory = new Inventory();
  }

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
}
