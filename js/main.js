import { POKEMON } from "./data.js";
import { TYPE_CHART } from "./typeChart.js";
import { explain } from "./mnemonics.js";
import { updateMastery, getMastery, weightedRandomType, scheduleReview } from "./learning.js";
import { storeSession, saveMastery } from "./storage.js";

/* ---------- constants & helpers ---------- */
const TYPES=["normal","fire","water","electric","grass","ice","fighting","poison","ground",
 "flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"];
const SPRITE=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const badge=t=>`<span class="type-badge" type="${t}">${t}</span>`;
const cap=s=>s.replace(/(?:^|[- ])[a-z]/g,c=>c.toUpperCase());

const dmg=(a,d)=>{
  let m=1; a.types.forEach(at=>d.types.forEach(dt=>{
    const v=TYPE_CHART[TYPES.indexOf(at)][TYPES.indexOf(dt)]; if(v>m) m=v;
  })); return m;
};
const superEff=(a,b)=>dmg(a,b)>=2;
const bestCounter=op=>POKEMON.find(p=>superEff(p,op));

/* ---------- state ---------- */
const app=document.getElementById("app"); let foe,choices;
newBattle();

/* ---------- main flow ---------- */
function newBattle(){
  app.innerHTML="";
  foe      = pickOpponent();
  choices  = pickChoices(foe);
  render();
}
function pickOpponent(){
  const weak=weightedRandomType();
  const pool=POKEMON.filter(p=>p.types.includes(weak));
  return pool[Math.floor(Math.random()*pool.length)];
}
function pickChoices(op){
  const arr=[]; while(arr.length<6){
    const p=POKEMON[Math.floor(Math.random()*POKEMON.length)];
    if(!arr.includes(p)) arr.push(p);
  }
  if(!arr.some(c=>superEff(c,op))) arr[0]=bestCounter(op);
  return arr;
}

/* ---------- render scene ---------- */
function render(){
  /* Opponent */
  app.insertAdjacentHTML("afterbegin",`
    <div class="opponent">
      <img src="${SPRITE(foe.id)}" alt="${cap(foe.name)}">
      <div class="poke-name"><b>${cap(foe.name)}</b></div>
      <div class="types">${foe.types.map(badge).join("")}</div>
    </div>`);

  /* Choice grid */
  const grid=document.createElement("div");grid.className="choice-grid";
  choices.forEach((p,i)=>grid.insertAdjacentHTML("beforeend",`
    <button class="choice-btn">
      <img src="${SPRITE(p.id)}" alt="${cap(p.name)}">
      <div class="poke-name"><b>${cap(p.name)}</b></div>
      <div class="types">${p.types.map(badge).join("")}</div>
    </button>`));
  grid.querySelectorAll(".choice-btn").forEach((b,i)=>b.onclick=()=>choose(i,b));
  app.appendChild(grid);

  /* Textbox */
  app.insertAdjacentHTML("beforeend",`
    <div class="textbox"><div id="fb">Choose the best Pokémon to counter!</div></div>`);
}

/* ---------- interaction ---------- */
function choose(idx,btn){
  document.querySelectorAll(".choice-btn").forEach(b=>b.disabled=true);
  const me=choices[idx]; const mult=dmg(me,foe);
  const best=Math.max(...choices.map(c=>dmg(c,foe)));
  const ok=mult===best;

  /* feedback */
  document.getElementById("fb").innerHTML=
    `${ok?"✅":"❌"} <b>${cap(me.name)}</b> → <b>${cap(foe.name)}</b> `+
    `(×${mult}). ${explain(me.types,foe.types,mult)}`;

  btn.style.outline=`3px solid ${ok?"#4caf50":"#c62828"}`;

  /* learning & storage */
  updateMastery(me.types,foe.types,ok);
  scheduleReview({attacker:me.name,defender:foe.name},ok);
  storeSession({date:Date.now(),pick:me.name,opponent:foe.name,
                pickTypes:me.types,opponentTypes:foe.types,correct:ok,multiplier:mult});
  saveMastery(getMastery());

  /* Next button (once) */
  const box=document.querySelector(".textbox");
  if(!box.querySelector(".next-btn")){
    const nxt=document.createElement("button");
    nxt.textContent="Next ▶︎"; nxt.className="next-btn"; nxt.onclick=newBattle;
    box.appendChild(nxt);
  }
}
