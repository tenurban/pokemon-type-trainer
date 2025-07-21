import { POKEMON }   from "./data.js";
import { TYPE_CHART } from "./typeChart.js";
import { explain }   from "./mnemonics.js";
import {
  updateMastery, getMastery,
  weightedRandomType, scheduleReview
} from "./learning.js";
import { storeSession, saveMastery } from "./storage.js";

const TYPES = [
  "normal","fire","water","electric","grass","ice","fighting","poison",
  "ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"
];

const SPRITE_URL = id =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

const app = document.getElementById("app");

/* ------------ game state ------------ */
let opponent, choices;
startNewBattle();

/* ------------ functions ------------ */
function clear() { app.innerHTML = ""; }

function startNewBattle() {
  clear();

  /* 1 • pick opponent weighted by weak mastery */
  const weakType = weightedRandomType();
  const pool     = POKEMON.filter(p => p.types.includes(weakType));
  opponent       = pool[Math.floor(Math.random() * pool.length)];

  /* 2 • pick 6 choices (ensure one good counter) */
  choices = [];
  while (choices.length < 6) {
    const c = POKEMON[Math.floor(Math.random() * POKEMON.length)];
    if (!choices.includes(c)) choices.push(c);
  }
  /* guarantee at least 1 optimal pick */
  if (!choices.some(c => isBestCounter(c))) choices[0] = bestCounter();

  renderBattle();
}

function renderBattle() {
  /* opponent sprite & name */
  const oppBox = document.createElement("div");
  oppBox.className = "opponent";
  oppBox.innerHTML = `
    <img src="${SPRITE_URL(opponent.id)}" alt="${opponent.name}" />
    <div>${opponent.name}</div>`;
  app.appendChild(oppBox);

  /* grid of choices */
  const grid = document.createElement("div");
  grid.className = "choice-grid";
  choices.forEach((p, idx) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.innerHTML = `
      <img src="${SPRITE_URL(p.id)}" alt="${p.name}">
      <div>${p.name}</div>`;
    btn.onclick = () => pickPokemon(idx, btn);
    grid.appendChild(btn);
  });
  app.appendChild(grid);

  /* textbox */
  const box = document.createElement("div");
  box.className = "textbox";
  box.id = "feedback";
  box.textContent = "Choose the best Pokémon to counter!";
  app.appendChild(box);
}

function pickPokemon(index, btnEl) {
  disableAllButtons();
  const pick       = choices[index];
  const multiplier = bestMultiplier(pick, opponent);
  const isCorrect  = multiplier === Math.max(...choices.map(c => bestMultiplier(c, opponent)));

  /* feedback */
  const fb = document.getElementById("feedback");
  fb.textContent =
    (isCorrect ? "Correct! " : "Wrong! ") +
    explain(pick.types, opponent.types, multiplier);

  /* visual cue */
  btnEl.style.border = isCorrect ? "2px solid var(--green-2)"
                                 : "2px solid var(--border)";

  /* learning & storage */
  updateMastery(pick.types, opponent.types, isCorrect);
  scheduleReview({ attacker: pick.name, defender: opponent.name }, isCorrect);
  storeSession({
    date: Date.now(), pick: pick.name, pickTypes: pick.types,
    opponent: opponent.name, opponentTypes: opponent.types,
    correct: isCorrect, multiplier
  });
  saveMastery(getMastery());

  setTimeout(startNewBattle, 2500);
}

function disableAllButtons() {
  document.querySelectorAll(".choice-btn").forEach(b => (b.disabled = true));
}

function bestMultiplier(attacker, defender) {
  let best = 1;
  attacker.types.forEach(a =>
    defender.types.forEach(d => {
      const m = TYPE_CHART[TYPES.indexOf(a)][TYPES.indexOf(d)];
      if (m > best) best = m;
    })
  );
  return best;
}
function isBestCounter(p)      { return bestMultiplier(p, opponent) >= 2; }
function bestCounter()         { return POKEMON.find(isBestCounter); }
