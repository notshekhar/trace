import { drizzle } from "drizzle-orm/better-sqlite3";
import BetterSQLite from "better-sqlite3";
import * as schema from "./schema";

const sqlite = new BetterSQLite(process.env.DATABASE_URL ?? "./trace.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
