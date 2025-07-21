import { POKEMON }   from "./data.js";
import { TYPE_CHART } from "./typeChart.js";
import { explain }    from "./mnemonics.js";
import {
  updateMastery, getMastery, weightedRandomType, scheduleReview
} from "./learning.js";
import { storeSession, saveMastery } from "./storage.js";

/* ---------- constants ---------- */
const TYPES=[
  "normal","fire","water","electric","grass","ice","fighting","poison","ground",
  "flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"
];
const SPRITE=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const pill=t=>`<span class="type-badge" type="${t}">${t}</span>`;

/* ---------- helpers ---------- */
function cap(str){
  return str.split(/[- ]/).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ");
}
function bestMult(att,def){
  let best=1;
  att.types.forEach(a=>def.types.forEach(d=>{
    const m=TYPE_CHART[TYPES.indexOf(a)][TYPES.indexOf(d)];
    if(m>best) best=m;
  }));
  return best;
}
const superEff =(a,b)=>bestMult(a,b)>=2;
const bestCounter=op=>POKEMON.find(p=>superEff(p,op));

/* ---------- state ---------- */
const app=document.getElementById("app");
let opponent,choices;
nextBattle();

/* ---------- main cycle ---------- */
function nextBattle(){
  app.innerHTML="";
  opponent = pickOpponent();
  choices  = pickChoices(opponent);
  drawScene();
}

function pickOpponent(){
  const weak=weightedRandomType();
  const pool=POKEMON.filter(p=>p.types.includes(weak));
  return pool[Math.floor(Math.random()*pool.length)];
}
function pickChoices(op){
  const arr=[];
  while(arr.length<6){
    const p=POKEMON[Math.floor(Math.random()*POKEMON.length)];
    if(!arr.includes(p)) arr.push(p);
  }
  if(!arr.some(c=>superEff(c,op))) arr[0]=bestCounter(op);
  return arr;
}

/* ---------- render ---------- */
function drawScene(){
  /* Opponent */
  app.insertAdjacentHTML("beforeend",`
    <div class="opponent">
      <img src="${SPRITE(opponent.id)}" alt="${cap(opponent.name)}">
      <div><b>${cap(opponent.name)}</b></div>
      <div class="types">${opponent.types.map(pill).join("")}</div>
    </div>`);

  /* Choices grid */
  const grid=document.createElement("div");grid.className="choice-grid";
  choices.forEach((p,i)=>{
    grid.insertAdjacentHTML("beforeend",`
      <button class="choice-btn">
        <img src="${SPRITE(p.id)}" alt="${cap(p.name)}">
        <div class="poke-name"><b>${cap(p.name)}</b></div>
        <div class="types">${p.types.map(pill).join("")}</div>
      </button>`);
  });
  grid.querySelectorAll("button").forEach((btn,idx)=>
    btn.onclick=()=>onPick(idx,btn)
  );
  app.appendChild(grid);

  /* Textbox */
  app.insertAdjacentHTML("beforeend",
    `<div class="textbox" id="fb">Choose the best Pokémon to counter!</div>`);
}

/* ---------- interaction ---------- */
function onPick(idx,btn){
  disableAll();
  const pick=choices[idx];
  const mult=bestMult(pick,opponent);
  const correct = mult===Math.max(...choices.map(c=>bestMult(c,opponent)));

  document.getElementById("fb").innerHTML=
    `${correct?"✅":"❌"} <b>${cap(pick.name)}</b> vs <b>${cap(opponent.name)}</b><br>`+
    `×${mult} against ${opponent.types.join("/").toUpperCase()} – `+
    explain(pick.types,opponent.types,mult);

  btn.style.outline=`2px solid ${correct?"#4caf50":"#c62828"}`;

  updateMastery(pick.types,opponent.types,correct);
  scheduleReview({attacker:pick.name,defender:opponent.name},correct);
  storeSession({
    date:Date.now(),pick:pick.name,pickTypes:pick.types,
    opponent:opponent.name,opponentTypes:opponent.types,
    correct,multiplier:mult
  });
  saveMastery(getMastery());

  setTimeout(nextBattle,3000);
}

function disableAll(){
  document.querySelectorAll(".choice-btn").forEach(b=>b.disabled=true);
}
