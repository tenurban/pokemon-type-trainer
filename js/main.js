import { POKEMON } from "./data.js";
import { TYPE_CHART } from "./typeChart.js";
import { explain } from "./mnemonics.js";
import { updateMastery, getMastery, weightedRandomType, scheduleReview } from "./learning.js";
import { storeSession, saveMastery } from "./storage.js";

/* ─── constants ──────────────────────────── */
const TYPES = [
  "normal","fire","water","electric","grass","ice","fighting","poison","ground",
  "flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"
];
const SPRITE = id =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const badge  = t => `<span class="type-badge" type="${t}">${t}</span>`;
const cap    = s => s.replace(/(?:^|[- ])[a-z]/g,c=>c.toUpperCase());

/* ─── damage helper (safe) ──────────────── */
function dmg(att,def){
  let best=1;
  for(const at of att.types){
    const ia=TYPES.indexOf(at); if(ia===-1) continue;
    for(const dt of def.types){
      const id=TYPES.indexOf(dt); if(id===-1) continue;
      best=Math.max(best,TYPE_CHART[ia][id]);
    }
  }
  return best;
}
const superEff=(a,b)=>dmg(a,b)>=2;
const bestCounter=op=>POKEMON.find(p=>superEff(p,op));

/* ─── state ─────────────────────────────── */
const app=document.getElementById("app"); let foe,choices;
newBattle();

/* ─── main loop ─────────────────────────── */
function newBattle(){
  app.innerHTML="";
  foe      = pickOpponent();
  choices  = pickChoices(foe);
  draw();
}
function pickOpponent(){
  const weak=weightedRandomType();
  const pool=POKEMON.filter(p=>p.types.includes(weak));
  return pool[Math.random()*pool.length|0];
}
function pickChoices(op){
  const arr=[];
  while(arr.length<6){
    const p=POKEMON[Math.random()*POKEMON.length|0];
    if(!arr.includes(p)) arr.push(p);
  }
  if(!arr.some(c=>superEff(c,op))) arr[0]=bestCounter(op);
  return arr;
}

/* ─── render ────────────────────────────── */
function draw(){
  app.insertAdjacentHTML("afterbegin",`
    <div class="opponent">
      <img src="${SPRITE(foe.id)}" alt="${cap(foe.name)}">
      <div class="poke-name">${cap(foe.name)}</div>
      <div class="types">${foe.types.map(badge).join("")}</div>
    </div>`);

  const grid=document.createElement("div");
  grid.className="choice-grid";
  choices.forEach((p,i)=>grid.insertAdjacentHTML("beforeend",`
    <button class="choice-btn">
      <img src="${SPRITE(p.id)}" alt="${cap(p.name)}">
      <div class="poke-name">${cap(p.name)}</div>
      <div class="types">${p.types.map(badge).join("")}</div>
    </button>`));
  grid.querySelectorAll(".choice-btn").forEach((b,i)=>b.onclick=()=>pick(i,b));
  app.appendChild(grid);

  app.insertAdjacentHTML("beforeend",
    `<div class="textbox"><div id="fb">Choose the best Pokémon to counter!</div></div>`);
}

/* ─── interaction ──────────────────────── */
function pick(index,btn){
  document.querySelectorAll(".choice-btn").forEach(b=>b.disabled=true);
  const me   = choices[index];
  const mult = dmg(me,foe);
  const best = Math.max(...choices.map(c=>dmg(c,foe)));
  const ok   = mult===best;

  document.getElementById("fb").innerHTML =
    `${ok?"✅":"❌"} <b>${cap(me.name)}</b> → <b>${cap(foe.name)}</b> ` +
    `(×${mult}). ${explain(me.types,foe.types,mult)}`;
  btn.style.outline = `3px solid ${ok?"#4caf50":"#c62828"}`;

  updateMastery(me.types,foe.types,ok);
  scheduleReview({attacker:me.name,defender:foe.name},ok);
  storeSession({
    date:Date.now(),pick:me.name,opponent:foe.name,
    pickTypes:me.types,opponentTypes:foe.types,correct:ok,multiplier:mult
  });
  saveMastery(getMastery());

  if(!document.querySelector(".next-btn")){
    const n=document.createElement("button");
    n.className="next-btn"; n.textContent="Next ▶︎"; n.onclick=newBattle;
    document.querySelector(".textbox").appendChild(n);
  }
}
