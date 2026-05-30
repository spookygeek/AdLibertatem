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

    // Deep-copy base stats from class definition
    this.stats = { ...classDef.stats };
    this.baseStats = { ...classDef.stats };

    this.inventory = new Inventory();
  }

  gainXp(amount) {
    this.xp += amount;
    const leveled = [];
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this._levelUp();
      leveled.push(this.level);
      this.xpNext = XP_PER_LEVEL(this.level);
    }
    return leveled;
  }

  _levelUp() {
    this.level += 1;
    this.stats.maxHp += 3;
    this.stats.hp = Math.min(this.stats.hp + 3, this.stats.maxHp);
    this.stats.atk += 1;
    this.stats.def += 1;
  }

  heal(amount) {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
  }

  isDead() {
    return this.stats.hp <= 0;
  }
}
