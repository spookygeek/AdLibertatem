import { ITEMS } from '../data/items.js';

export class Inventory {
  constructor(capacity = 20) {
    this.capacity = capacity;
    this.slots = [];   // array of { itemId, qty }
  }

  add(itemId, qty = 1) {
    const item = ITEMS[itemId];
    if (!item) return false;

    if (item.stackable) {
      const existing = this.slots.find((s) => s.itemId === itemId);
      if (existing) { existing.qty += qty; return true; }
    }

    if (this.slots.length >= this.capacity) return false;
    this.slots.push({ itemId, qty });
    return true;
  }

  remove(itemId, qty = 1) {
    const idx = this.slots.findIndex((s) => s.itemId === itemId);
    if (idx === -1) return false;
    this.slots[idx].qty -= qty;
    if (this.slots[idx].qty <= 0) this.slots.splice(idx, 1);
    return true;
  }

  has(itemId) {
    return this.slots.some((s) => s.itemId === itemId);
  }
}

export class Vendor {
  constructor(stock = []) {
    this.stock = stock;   // array of { itemId, price }
  }

  buy(player, itemId) {
    const listing = this.stock.find((s) => s.itemId === itemId);
    if (!listing) return { ok: false, reason: 'Not in stock.' };
    if (player.gold < listing.price) return { ok: false, reason: 'Not enough gold.' };
    if (!player.inventory.add(itemId)) return { ok: false, reason: 'Inventory full.' };
    player.gold -= listing.price;
    return { ok: true };
  }

  sell(player, itemId) {
    const item = ITEMS[itemId];
    if (!item || !item.value) return { ok: false, reason: 'Cannot sell that.' };
    if (!player.inventory.remove(itemId)) return { ok: false, reason: 'Not in inventory.' };
    player.gold += Math.floor(item.value * 0.5);
    return { ok: true };
  }
}
