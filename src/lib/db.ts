import { createClient, type Client, type InValue } from "@libsql/client";
import path from "node:path";
import fs from "node:fs";

const IS_SERVERLESS = !!process.env.VERCEL;

function resolveDbUrl(): string {
  const u = process.env.DATABASE_URL;
  if (u && u.length > 0) return u;
  const dataDir = path.join(process.cwd(), "data");
  if (!IS_SERVERLESS && !fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return `file:${path.join(dataDir, "tracker.db")}`;
}

let _client: Client | null = null;
function client(): Client {
  if (_client) return _client;
  _client = createClient({
    url: resolveDbUrl(),
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  return _client;
}

export async function exec(sql: string, args: InValue[] = []) {
  return client().execute({ sql, args });
}

export async function rows<T = Record<string, unknown>>(
  sql: string,
  args: InValue[] = []
): Promise<T[]> {
  const r = await client().execute({ sql, args });
  return r.rows as unknown as T[];
}

async function initSchema() {
  const stmts = [
    `CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS subtopics (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_subtopics_topic ON subtopics(topic_id)`,
    `CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      subtopic_id TEXT,
      date TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_entries_topic ON entries(topic_id)`,
    `CREATE INDEX IF NOT EXISTS idx_entries_subtopic ON entries(subtopic_id)`,
    `CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date)`,
  ];
  for (const s of stmts) await exec(s);
}

let _initPromise: Promise<void> | null = null;
export function ensureInit(): Promise<void> {
  if (!_initPromise) _initPromise = initSchema();
  return _initPromise;
}

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
