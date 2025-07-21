import { POKEMON }   from "./data.js";
import { TYPE_CHART } from "./typeChart.js";
import { explain }    from "./mnemonics.js";
import {
  updateMastery, getMastery, weightedRandomType, scheduleReview
} from "./learning.js";
import { storeSession, saveMastery } from "./storage.js";

/* ---------- constants ---------- */
const TYPES = [
  "normal","fire","water","electric","grass","ice","fighting","poison","ground",
  "flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"
];
const SPRITE_URL = id =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const badge = t => `<span class="type-badge" type="${t}">${t}</span>`;

/* ---------- helpers (hoisted functions) ---------- */
function bestMultiplier(att, def){
  let best = 1;
  att.types.forEach(a =>
    def.types.forEach(d => {
      const m = TYPE_CHART[TYPES.indexOf(a)][TYPES.indexOf(d)];
      if(m > best) best = m;
    })
  );
  return best;
}
function isSuperEffective(a,b){ return bestMultiplier(a,b) >= 2; }
function bestCounter(op){ return POKEMON.find(p => isSuperEffective(p,op)); }

/* ---------- state ---------- */
const app = document.getElementById("app");
let opponent, choices;

/* ---------- flow ---------- */
nextBattle();

function nextBattle(){
  app.innerHTML = "";
  opponent = pickOpponent();
  choices  = pickChoices(opponent);
  renderScene();
}

function pickOpponent(){
  const weakType = weightedRandomType();
  const pool = POKEMON.filter(p => p.types.includes(weakType));
  return pool[Math.floor(Math.random()*pool.length)];
}

function pickChoices(op){
  const arr=[];
  while(arr.length<6){
    const p = POKEMON[Math.floor(Math.random()*POKEMON.length)];
    if(!arr.includes(p)) arr.push(p);
  }
  if(!arr.some(c => isSuperEffective(c, op))) arr[0] = bestCounter(op);
  return arr;
}

/* ---------- render ---------- */
function renderScene(){
  /* Opponent */
  app.insertAdjacentHTML("beforeend",`
    <div class="opponent">
      <img src="${SPRITE_URL(opponent.id)}" alt="${opponent.name}">
      <div>${opponent.name}</div>
      <div class="types">${opponent.types.map(badge).join("")}</div>
    </div>`);

  /* Choices */
  const grid = document.createElement("div");
  grid.className = "choice-grid";
  choices.forEach((p,i)=>{
    grid.insertAdjacentHTML("beforeend",`
      <button class="choice-btn">
        <img src="${SPRITE_URL(p.id)}" alt="${p.name}">
        <div class="poke-name">${p.name}</div>
        <div class="types">${p.types.map(badge).join("")}</div>
      </button>`);
  });
  grid.querySelectorAll("button").forEach((btn,idx)=>
    btn.onclick = () => handlePick(idx,btn)
  );
  app.appendChild(grid);

  /* Textbox */
  app.insertAdjacentHTML("beforeend",
    `<div class="textbox" id="feedback">Choose the best Pokémon to counter!</div>`);
}

/* ---------- interaction ---------- */
function handlePick(idx, btn){
  disableAll();
  const chosen   = choices[idx];
  const mult     = bestMultiplier(chosen, opponent);
  const bestMult = Math.max(...choices.map(c=>bestMultiplier(c,opponent)));
  const correct  = mult === bestMult;

  /* Feedback */
  const fb = document.getElementById("feedback");
  fb.innerHTML =
    `${correct?"✅":"❌"} <b>${chosen.name}</b> vs <b>${opponent.name}</b><br>`+
    `×${mult} against ${opponent.types.join("/").toUpperCase()} – `+
    explain(chosen.types,opponent.types,mult);

  btn.style.outline = `2px solid ${correct ? "#4caf50" : "#c62828"}`;

  /* Adaptation & persistence */
  updateMastery(chosen.types,opponent.types,correct);
  scheduleReview({attacker:chosen.name,defender:opponent.name},correct);
  storeSession({
    date:Date.now(),pick:chosen.name,pickTypes:chosen.types,
    opponent:opponent.name,opponentTypes:opponent.types,
    correct,multiplier:mult
  });
  saveMastery(getMastery());

  setTimeout(nextBattle,3000);
}

function disableAll(){
  document.querySelectorAll(".choice-btn").forEach(b=>b.disabled=true);
}
