const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const { neon } = require("@neondatabase/serverless");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");
const defaults = {
  users: [], bookings: [], availability: [], videos: [], services: [], testimonials: [],
  settings: {
    hero: { title: "Feel The Groove. Hear The Difference.", subtitle: "Bass Guitarist - Live Performances - Studio Sessions - Worship - Lessons" },
    bio: { bio: "Fobee Bass brings rich low-end, musical pocket, and an unmistakable live presence to every room." },
    contact: { phone: "", email: "", location: "" },
  },
  otps: [],
};

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(defaults, null, 2));
}
function readLocalStore() {
  ensureStore();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  const normalized = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  return { ...clone(defaults), ...JSON.parse(normalized) };
}

function getDatabase() {
  if (!process.env.DATABASE_URL) return null;
  return neon(process.env.DATABASE_URL);
}

async function ensureDatabase(sql) {
  await sql`CREATE TABLE IF NOT EXISTS app_state (id integer PRIMARY KEY CHECK (id = 1), data jsonb NOT NULL)`;
}

async function readStore() {
  const sql = getDatabase();
  if (!sql) return readLocalStore();

  await ensureDatabase(sql);
  const rows = await sql`SELECT data FROM app_state WHERE id = 1`;
  if (!rows.length) {
    const initial = readLocalStore();
    await sql`INSERT INTO app_state (id, data) VALUES (1, ${JSON.stringify(initial)}::jsonb)`;
    return initial;
  }

  return { ...clone(defaults), ...rows[0].data };
}

async function writeStore(store) {
  const sql = getDatabase();
  if (sql) {
    await ensureDatabase(sql);
    await sql`
      INSERT INTO app_state (id, data) VALUES (1, ${JSON.stringify(store)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
    `;
    return;
  }

  ensureStore();
  const temp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(store, null, 2));
  fs.renameSync(temp, DATA_FILE);
}
function id() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }
async function update(mutator) {
  const store = await readStore();
  const result = await mutator(store);
  await writeStore(store);
  return result;
}

module.exports = { readStore, writeStore, update, id, now, defaults };
