import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, "../../supabase/migrations/002_posture_sessions.sql");

const connectionString = process.env.POSTGRES_URL_NON_POOLING;
if (!connectionString) {
  console.error("Set POSTGRES_URL_NON_POOLING before running this script.");
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, "utf8");
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("MIGRATION_OK", path.basename(sqlPath));
} catch (error) {
  console.error("MIGRATION_FAIL", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
