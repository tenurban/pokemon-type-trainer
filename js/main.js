import { POKEMON } from "./data.js";
import { TYPE_CHART } from "./typeChart.js";
import { explain } from "./mnemonics.js";
import {
  updateMastery,
  getMastery,
  weightedRandomType,
  scheduleReview,
} from "./learning.js";
import { storeSession, saveMastery } from "./storage.js";

const TYPES = [
  "normal","fire","water","electric","grass","ice","fighting","poison",
  "ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"
];

/* ------------ DOM helpers ------------ */
const app = document.getElementById("app");
function clear() { app.innerHTML = ""; }

/* ------------ Game state ------------ */
let opponent, choices;

startNewBattle();

/* ------------ Functions ------------ */
function startNewBattle() {
  clear();
  // 1. Pick opponent weighted by player weaknesses
  const weakType = weightedRandomType();
  const candidates = POKEMON.filter(p => p.types.includes(weakType));
  opponent = candidates[Math.floor(Math.random() * candidates.length)];

  // 2. Candidate choices (6 random Pokémon)
  choices = [];
  while (choices.length < 6) {
    const pick = POKEMON[Math.floor(Math.random() * POKEMON.length)];
    if (!choices.includes(pick)) choices.push(pick);
  }

  renderBattle();
}

function renderBattle() {
  // Simple textual battle until canvas is added
  const oppDiv = document.createElement("div");
  oppDiv.textContent = `Wild ${opponent.name.toUpperCase()} (${opponent.types.join("/")}) appeared!`;
  oppDiv.style.fontSize = "7px";
  oppDiv.style.padding = "2px";

  const grid = document.createElement("div");
  grid.className = "choice-grid";

  choices.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = p.name;
    btn.style.fontSize = "6px";
    btn.onclick = () => onChoose(i);
    grid.appendChild(btn);
  });

  const box = document.createElement("div");
  box.className = "textbox";
  box.id = "feedback";
  box.textContent = "Choose the best Pokémon to counter!";

  app.appendChild(oppDiv);
  app.appendChild(grid);
  app.appendChild(box);
}

function onChoose(index) {
  const pick = choices[index];
  const multiplier = getBestMultiplier(pick.types, opponent.types);
  const best = Math.max(...choices.map(c => getBestMultiplier(c.types, opponent.types)));
  const isCorrect = multiplier === best;

  updateMastery(pick.types, opponent.types, isCorrect);
  scheduleReview({ attacker: pick.name, defender: opponent.name }, isCorrect);

  const fb = document.getElementById("feedback");
  fb.textContent =
    (isCorrect ? "Correct! " : "Wrong! ") +
    explain(pick.types, opponent.types, multiplier);

  // grey out buttons
  document.querySelectorAll(".choice-btn").forEach(b => (b.disabled = true));

  // store result
  storeSession({
    date: Date.now(),
    pick: pick.name,
    pickTypes: pick.types,
    opponent: opponent.name,
    opponentTypes: opponent.types,
    correct: isCorrect,
    multiplier,
  });
  saveMastery(getMastery());

  setTimeout(startNewBattle, 2000);
}

function getBestMultiplier(atkTypes, defTypes) {
  let best = 1;
  atkTypes.forEach(a => {
    defTypes.forEach(d => {
      const m = TYPE_CHART[TYPES.indexOf(a)][TYPES.indexOf(d)];
      if (m > best) best = m;
    });
  });
  return best;
}
