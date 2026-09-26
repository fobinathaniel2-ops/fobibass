const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");
const defaults = {
  users: [], bookings: [], availability: [], videos: [],
  services: [
    { id: "site-live-performances", name: "Live Performances", description: "Energetic and professional bass for concerts, events and celebrations." },
    { id: "site-studio-sessions", name: "Studio Sessions", description: "Clean, precise bass lines that support your recording and vision." },
    { id: "site-worship-events", name: "Worship Events", description: "Heartfelt and inspiring playing for worship teams and church events." },
    { id: "site-private-sessions", name: "Private Sessions", description: "Personalized bass support for your special moment or project." },
  ],
  testimonials: [],
  settings: {
    hero: {
      title: "Feel The Groove. Hear The Difference.",
      subtitle: "I'm FOBIbass, a professional bass guitarist in Accra, Ghana, creating unforgettable live performances, studio recordings, worship music, and private session experiences.",
    },
    bio: { bio: "I'm a dedicated and passionate bass guitarist based in Accra, Ghana, with a deep love for live performances, studio recordings, worship events, and private sessions. My goal is to bring life, energy, and emotion to every stage, studio, and worship space I work in, helping every moment feel memorable and meaningful." },
    contact: { phone: "+233 593 6786 56", email: "fobibismarkamoako@gmail.com", location: "Accra, Oyarifa, Ankonam" },
    socials: {
      youtube: "https://www.youtube.com/@FOBIbass",
      instagram: "#contact",
      tiktok: "https://www.tiktok.com/@fobi_bass?_r=1&_t=ZS-99gMTwWcj2G",
      x: "#contact",
    },
  },
  otps: [],
};

const legacyDefaults = {
  heroSubtitle: "Bass Guitarist - Live Performances - Studio Sessions - Worship - Lessons",
  bio: "Fobee Bass brings rich low-end, musical pocket, and an unmistakable live presence to every room.",
};

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function normalizeStore(data = {}) {
  const source = data && typeof data === "object" ? data : {};
  const store = { ...clone(defaults), ...source };
  const savedSettings = source.settings || {};
  store.settings = { ...clone(defaults.settings), ...savedSettings };
  for (const section of ["hero", "bio", "contact", "socials"]) {
    store.settings[section] = { ...clone(defaults.settings[section]), ...(savedSettings[section] || {}) };
  }

  if (store.settings.hero.subtitle === legacyDefaults.heroSubtitle) {
    store.settings.hero.subtitle = defaults.settings.hero.subtitle;
  }
  if (store.settings.bio.bio === legacyDefaults.bio) {
    store.settings.bio.bio = defaults.settings.bio.bio;
  }
  for (const field of ["phone", "email", "location"]) {
    if (!store.settings.contact[field]) store.settings.contact[field] = defaults.settings.contact[field];
  }
  for (const field of ["youtube", "instagram", "tiktok", "x"]) {
    if (!store.settings.socials[field]) store.settings.socials[field] = defaults.settings.socials[field];
  }

  const savedServices = Array.isArray(source.services) ? source.services.filter((service) => service && typeof service === "object") : [];
  const savedServiceNames = new Set(savedServices.map((service) => String(service.name || "").trim().toLowerCase()));
  store.services = [
    ...clone(defaults.services).filter((service) => !savedServiceNames.has(service.name.toLowerCase())),
    ...savedServices,
  ];
  return store;
}

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(defaults, null, 2));
}
function readLocalStore() {
  ensureStore();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  const normalized = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  return normalizeStore(JSON.parse(normalized));
}

function getDatabase() {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL || process.env.NETLIFY) {
      const error = new Error("DATABASE_URL must be configured for persistent production storage.");
      error.code = "PERSISTENT_STORE_REQUIRED";
      error.status = 503;
      throw error;
    }
    return null;
  }
  const { neon } = require("@neondatabase/serverless");
  return neon(process.env.DATABASE_URL);
}

async function ensureDatabase(sql) {
  await sql`CREATE TABLE IF NOT EXISTS app_state (id integer PRIMARY KEY CHECK (id = 1), data jsonb NOT NULL, version bigint NOT NULL DEFAULT 1)`;
  await sql`ALTER TABLE app_state ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 1`;
}

async function readStore() {
  const sql = getDatabase();
  if (!sql) return readLocalStore();

  await ensureDatabase(sql);
  let rows = await sql`SELECT data FROM app_state WHERE id = 1`;
  if (!rows.length) {
    const initial = readLocalStore();
    await sql`INSERT INTO app_state (id, data) VALUES (1, ${JSON.stringify(initial)}::jsonb) ON CONFLICT (id) DO NOTHING`;
    rows = await sql`SELECT data FROM app_state WHERE id = 1`;
  }

  if (!rows.length) throw new Error("Could not initialize persistent content storage.");
  return normalizeStore(rows[0].data);
}

async function writeStore(store) {
  const sql = getDatabase();
  if (sql) {
    await ensureDatabase(sql);
    await sql`
      INSERT INTO app_state (id, data, version) VALUES (1, ${JSON.stringify(store)}::jsonb, 1)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, version = app_state.version + 1
    `;
    return;
  }

  ensureStore();
  const temp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(store, null, 2));
  fs.renameSync(temp, DATA_FILE);
}

let localUpdateQueue = Promise.resolve();

function id() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }
async function update(mutator) {
  const sql = getDatabase();
  if (!sql) {
    const operation = localUpdateQueue.then(async () => {
      const store = readLocalStore();
      const result = await mutator(store);
      await writeStore(store);
      return result;
    });
    localUpdateQueue = operation.catch(() => {});
    return operation;
  }

  await ensureDatabase(sql);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    let rows = await sql`SELECT data, version FROM app_state WHERE id = 1`;
    if (!rows.length) {
      const initial = readLocalStore();
      const inserted = await sql`
        INSERT INTO app_state (id, data, version) VALUES (1, ${JSON.stringify(initial)}::jsonb, 1)
        ON CONFLICT (id) DO NOTHING
        RETURNING version
      `;
      if (!inserted.length) continue;
      rows = [{ data: initial, version: inserted[0].version }];
    }

    const store = normalizeStore(rows[0].data);
    const result = await mutator(store);
    const saved = await sql`
      UPDATE app_state
      SET data = ${JSON.stringify(store)}::jsonb, version = version + 1
      WHERE id = 1 AND version = ${rows[0].version}
      RETURNING version
    `;
    if (saved.length) return result;
  }

  throw new Error("Content changed while saving. Please retry the update.");
}

module.exports = { readStore, writeStore, update, id, now, defaults, normalizeStore };
