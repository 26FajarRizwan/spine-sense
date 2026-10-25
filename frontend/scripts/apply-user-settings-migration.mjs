import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, "../../supabase/migrations/001_user_settings.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

const connectionString = process.env.POSTGRES_URL_NON_POOLING;
if (!connectionString) {
  console.error("Set POSTGRES_URL_NON_POOLING before running this script.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  const { rows } = await client.query(
    `select column_name, data_type
     from information_schema.columns
     where table_schema = 'public' and table_name = 'user_settings'
     order by ordinal_position`,
  );
  console.log("MIGRATION_OK");
  console.log(JSON.stringify(rows, null, 2));
} catch (error) {
  console.error("MIGRATION_FAIL", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
