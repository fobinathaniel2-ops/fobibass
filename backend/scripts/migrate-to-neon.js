const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required in backend/.env before migrating.");
}

const storePath = path.join(__dirname, "..", "data", "store.json");
const raw = fs.readFileSync(storePath, "utf8").replace(/^\uFEFF/, "");
const store = JSON.parse(raw);
const sql = neon(process.env.DATABASE_URL);

(async () => {
  await sql`CREATE TABLE IF NOT EXISTS app_state (id integer PRIMARY KEY CHECK (id = 1), data jsonb NOT NULL)`;
  await sql`
    INSERT INTO app_state (id, data) VALUES (1, ${JSON.stringify(store)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `;
  console.log("Migrated backend/data/store.json to Neon app_state.");
})().catch((error) => {
  console.error("Neon migration failed:", error.message);
  process.exitCode = 1;
});