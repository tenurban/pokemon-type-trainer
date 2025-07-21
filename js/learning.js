import { TYPE_CHART } from "./typeChart.js";

const TYPES = [
  "normal","fire","water","electric","grass","ice","fighting","poison",
  "ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"
];

const INIT_SCORE = 50;
const DECAY_PER_DAY = 0.5;
const K = 16;

/* ---------- Mastery state ---------- */
let mastery = Object.fromEntries(TYPES.map(t => [t, INIT_SCORE]));
let lastDecay = Date.now();

/**
 * Apply daily decay to all mastery scores.
 */
export function decayMastery() {
  const now = Date.now();
  const days = (now - lastDecay) / 864e5;
  if (days < 0.99) return;
  TYPES.forEach(t => (mastery[t] = Math.max(0, mastery[t] - DECAY_PER_DAY * days)));
  lastDecay = now;
}

/**
 * Update mastery based on result.
 * @param {string[]} attackerTypes
 * @param {string[]} defenderTypes
 * @param {boolean} isCorrect
 */
export function updateMastery(attackerTypes, defenderTypes, isCorrect) {
  const deficit = defenderTypes
    .map(d => 100 - mastery[d])
    .reduce((a, b) => a + b, 0) / defenderTypes.length;
  const expected = 1 / (1 + 10 ** (deficit / 40));
  const delta = K * ((isCorrect ? 1 : 0) - expected);
  defenderTypes.forEach(d => {
    mastery[d] = Math.min(100, Math.max(0, mastery[d] + delta));
  });
}

/**
 * Pick an opponent primary weakness weighted toward weak mastery.
 */
export function weightedRandomType() {
  decayMastery();
  const weights = TYPES.map(t => Math.min(0.4, Math.max(0.05, 1 - mastery[t] / 100)));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < TYPES.length; i++) {
    if ((r -= weights[i]) <= 0) return TYPES[i];
  }
  return TYPES[0];
}

export function getMastery() {
  return { ...mastery };
}

/* ----- Spaced‑Repetition queue (minimal stub) ----- */
let queue = []; // {attacker, defender, interval, nextDue}

export function scheduleReview(item, success) {
  const existing = queue.find(
    q => q.attacker === item.attacker && q.defender === item.defender
  );
  const now = Date.now();
  if (!existing) {
    queue.push({ ...item, interval: 1, nextDue: now + 864e5 });
    return;
  }
  existing.interval = success ? existing.interval * 2 : 1;
  existing.nextDue = now + existing.interval * 864e5;
}

export function getDueReviews() {
  const now = Date.now();
  return queue.filter(q => q.nextDue <= now);
}
