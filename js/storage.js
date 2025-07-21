/* Simplified IndexedDB wrapper using native APIs.
   Falls back to localStorage when unavailable. */

const DB_NAME = "pokeTrainerDB";
const DB_VERSION = 1;
let db;

/* ---------- IndexedDB setup ---------- */
function initDB() {
  return new Promise((res, rej) => {
    if (!("indexedDB" in window)) return res(false);
    const open = indexedDB.open(DB_NAME, DB_VERSION);
    open.onupgradeneeded = () => {
      const dbase = open.result;
      dbase.createObjectStore("sessions", { keyPath: "id", autoIncrement: true });
      dbase.createObjectStore("mastery");
    };
    open.onerror = () => res(false);
    open.onsuccess = () => {
      db = open.result;
      res(true);
    };
  });
}

export async function storeSession(row) {
  if (!db && !(await initDB())) return fallback("sessions", row);
  const tx = db.transaction("sessions", "readwrite");
  tx.objectStore("sessions").add(row);
}

export async function saveMastery(mastery) {
  if (!db && !(await initDB())) return fallback("mastery", mastery);
  const tx = db.transaction("mastery", "readwrite");
  const store = tx.objectStore("mastery");
  Object.entries(mastery).forEach(([k, v]) => store.put(v, k));
}

function fallback(key, data) {
  const arr = JSON.parse(localStorage.getItem(key) || "[]");
  arr.push(data);
  localStorage.setItem(key, JSON.stringify(arr));
}
