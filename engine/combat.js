/**
 * Resolves one melee exchange between attacker and defender.
 *
 * opts:
 *   ignoreDefense  — bypass defender.stats.def (Cyclops boulder throw)
 *   dmgMultiplier  — scale final damage before returning (Chimera chaos attack)
 *
 * Returns { damage, crit, miss, log } — caller applies damage to defender.stats.hp.
 */
export function resolveMelee(attacker, defender, opts = {}) {
  const { ignoreDefense = false, dmgMultiplier = 1 } = opts;

  // Miss chance: 5% base, adjusted by speed difference
  const hitChance = 0.95 + (attacker.stats.spd - defender.stats.spd) * 0.02;
  if (ROT.RNG.getUniform() > hitChance) {
    return { damage: 0, crit: false, miss: true, log: `${attacker.name} misses!` };
  }

  const base    = attacker.stats.str + ROT.RNG.getUniformInt(1, 4);
  const reduced = ignoreDefense ? base : Math.max(1, base - defender.stats.def);

  // Crit: 10% chance, ×1.5 damage
  const crit   = ROT.RNG.getUniform() < 0.10;
  const raw    = crit ? Math.floor(reduced * 1.5) : reduced;
  const damage = Math.max(1, Math.floor(raw * dmgMultiplier));

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
