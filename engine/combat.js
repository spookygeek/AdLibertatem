/* global ROT */

/**
 * Resolves one melee exchange between attacker and defender.
 * Returns { damage, crit, miss, log } — caller applies damage to defender.hp.
 */
export function resolveMelee(attacker, defender) {
  // Miss on 5% base chance, reduced by attacker speed vs defender speed
  const hitChance = 0.95 + (attacker.stats.speed - defender.stats.speed) * 0.02;
  if (ROT.RNG.getUniform() > hitChance) {
    return { damage: 0, crit: false, miss: true, log: `${attacker.name} misses!` };
  }

  const base = attacker.stats.atk + ROT.RNG.getUniformInt(1, 4);
  const reduced = Math.max(1, base - defender.stats.def);

  // Crit: 10% chance, x1.5 damage
  const crit = ROT.RNG.getUniform() < 0.10;
  const damage = crit ? Math.floor(reduced * 1.5) : reduced;

  const suffix = crit ? ' (CRITICAL!)' : '';
  return {
    damage,
    crit,
    miss: false,
    log: `${attacker.name} hits ${defender.name} for ${damage}${suffix}`,
  };
}

/**
 * Apply damage to target. Returns true if target died.
 */
export function applyDamage(target, damage) {
  target.stats.hp = Math.max(0, target.stats.hp - damage);
  return target.stats.hp === 0;
}
