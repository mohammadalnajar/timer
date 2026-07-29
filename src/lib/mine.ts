"use client";

import type { TemplateId } from "./templates";
import type { Countdown } from "./types";

/**
 * There are no accounts. A countdown you created is remembered in this browser
 * along with its edit token, which is the only thing that authorises an edit.
 */

const KEY = "soon:mine:v1";
const MAX_REMEMBERED = 40;

export interface Owned {
  slug: string;
  title: string;
  targetMs: number;
  template: TemplateId;
  editToken: string;
  savedMs: number;
}

function read(): Owned[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Owned =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Owned).slug === "string" &&
        typeof (item as Owned).editToken === "string",
    );
  } catch {
    return [];
  }
}

function write(items: Owned[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_REMEMBERED)));
  } catch {
    // Private mode or a full quota — the app still works, it just forgets.
  }
}

/** Newest first, and past countdowns sink below upcoming ones. */
export function listOwned(): Owned[] {
  const now = Date.now();
  return read().sort((a, b) => {
    const aPast = a.targetMs < now;
    const bPast = b.targetMs < now;
    if (aPast !== bPast) return aPast ? 1 : -1;
    return aPast ? b.targetMs - a.targetMs : a.targetMs - b.targetMs;
  });
}

export function remember(countdown: Countdown, editToken: string) {
  const entry: Owned = {
    slug: countdown.slug,
    title: countdown.title,
    targetMs: countdown.targetMs,
    template: countdown.template,
    editToken,
    savedMs: Date.now(),
  };
  write([entry, ...read().filter((item) => item.slug !== countdown.slug)]);
}

export function forget(slug: string) {
  write(read().filter((item) => item.slug !== slug));
}

export function editTokenFor(slug: string): string | null {
  return read().find((item) => item.slug === slug)?.editToken ?? null;
}
