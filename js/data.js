/* Minimal dataset for rapid prototyping.
   Run `scripts/build.js` to overwrite this file with all 1 025 Pokémon,
   compressed via LZ‑string. */

export const POKEMON = [
  { id: 1, name: "Bulbasaur", types: ["grass", "poison"] },
  { id: 4, name: "Charmander", types: ["fire"] },
  { id: 7, name: "Squirtle", types: ["water"] },
];

/* Decode helper that will be used after build step */
export function decodeCompressed(dataStr) {
  // placeholder; build.js will inject LZ‑string decode logic
  return JSON.parse(dataStr);
}
