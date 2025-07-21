/* Simple mnemonic dictionary; more can be added. */
const RULES = {
  "water>fire": "Water douses fire.",
  "electric>water": "Lightning strikes the sea.",
  "grass>water": "Plants soak up water.",
  "fire>grass": "Fire burns grass.",
  "fighting>rock": "Punch cracks rock.",
  "ghost>psychic": "Ghosts haunt the mind.",
};

/**
 * Return a short explanatory phrase.
 * @param {string[]} atkTypes attacker types
 * @param {string[]} defTypes defender types
 * @param {number} mult final multiplier
 */
export function explain(atkTypes, defTypes, mult) {
  if (mult >= 2) {
    for (const a of atkTypes) {
      for (const d of defTypes) {
        const key = `${a}>${d}`;
        if (RULES[key]) return RULES[key];
      }
    }
    return "It's super effective!";
  }
  if (mult <= 0.5) return "It's not very effective…";
  return "It’s a normal hit.";
}
