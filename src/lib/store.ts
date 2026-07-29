import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { makeEditToken, makeSlug } from "./ids";
import type { Countdown, CountdownInput } from "./types";
import { isTemplateId, DEFAULT_TEMPLATE } from "./templates";

/**
 * The only module that touches persistence. Swap the four exported functions
 * for Postgres/KV queries and nothing else in the app has to change — see the
 * "Deploying" section of the README.
 */

const DB_PATH = process.env.SOON_DB_PATH ?? join(process.cwd(), "data", "soon.db");

let db: Database.Database | null = null;

function connect(): Database.Database {
  if (db) return db;

  mkdirSync(dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS countdowns (
      slug        TEXT PRIMARY KEY,
      title       TEXT    NOT NULL,
      message     TEXT,
      target_ms   INTEGER NOT NULL,
      all_day     INTEGER NOT NULL DEFAULT 0,
      time_zone   TEXT    NOT NULL DEFAULT 'UTC',
      template    TEXT    NOT NULL,
      edit_token  TEXT    NOT NULL,
      created_ms  INTEGER NOT NULL,
      updated_ms  INTEGER NOT NULL
    );
  `);
  return db;
}

interface Row {
  slug: string;
  title: string;
  message: string | null;
  target_ms: number;
  all_day: number;
  time_zone: string;
  template: string;
  edit_token: string;
  created_ms: number;
  updated_ms: number;
}

function toCountdown(row: Row): Countdown {
  return {
    slug: row.slug,
    title: row.title,
    message: row.message,
    targetMs: row.target_ms,
    allDay: row.all_day === 1,
    timeZone: row.time_zone,
    template: isTemplateId(row.template) ? row.template : DEFAULT_TEMPLATE,
    createdMs: row.created_ms,
  };
}

export function createCountdown(input: CountdownInput): { countdown: Countdown; editToken: string } {
  const conn = connect();
  const editToken = makeEditToken();
  const now = Date.now();

  const insert = conn.prepare(`
    INSERT INTO countdowns
      (slug, title, message, target_ms, all_day, time_zone, template, edit_token, created_ms, updated_ms)
    VALUES
      (@slug, @title, @message, @targetMs, @allDay, @timeZone, @template, @editToken, @now, @now)
  `);

  // Retry on the astronomically unlikely slug collision rather than failing.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = makeSlug();
    try {
      insert.run({
        slug,
        title: input.title,
        message: input.message,
        targetMs: input.targetMs,
        allDay: input.allDay ? 1 : 0,
        timeZone: input.timeZone,
        template: input.template,
        editToken,
        now,
      });
      return {
        countdown: { ...input, slug, createdMs: now },
        editToken,
      };
    } catch (error) {
      const isCollision =
        error instanceof Error && error.message.includes("UNIQUE constraint failed");
      if (!isCollision) throw error;
    }
  }

  throw new Error("Could not allocate a slug.");
}

export function getCountdown(slug: string): Countdown | null {
  const row = connect()
    .prepare("SELECT * FROM countdowns WHERE slug = ?")
    .get(slug) as Row | undefined;
  return row ? toCountdown(row) : null;
}

/** Returns null when the slug is unknown, or 'forbidden' when the token is wrong. */
export function updateCountdown(
  slug: string,
  editToken: string,
  input: CountdownInput,
): Countdown | null | "forbidden" {
  const conn = connect();
  const row = conn.prepare("SELECT * FROM countdowns WHERE slug = ?").get(slug) as Row | undefined;
  if (!row) return null;
  if (!safeEquals(row.edit_token, editToken)) return "forbidden";

  conn
    .prepare(
      `UPDATE countdowns
          SET title = @title, message = @message, target_ms = @targetMs,
              all_day = @allDay, time_zone = @timeZone, template = @template,
              updated_ms = @now
        WHERE slug = @slug`,
    )
    .run({
      slug,
      title: input.title,
      message: input.message,
      targetMs: input.targetMs,
      allDay: input.allDay ? 1 : 0,
      timeZone: input.timeZone,
      template: input.template,
      now: Date.now(),
    });

  return { ...input, slug, createdMs: row.created_ms };
}

/** Constant-time-ish comparison so the edit token can't be probed by timing. */
function safeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
