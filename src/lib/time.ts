/**
 * All countdown math runs off a single UTC instant (`targetMs`), so two people
 * in different timezones always count down to the same moment. Only the *date
 * label* is rendered in the creator's timezone, because that is the calendar
 * date they meant.
 */

export interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Signed milliseconds to target. Negative once the date has passed. */
  deltaMs: number;
  /** True once the target instant is in the past. */
  past: boolean;
  /** True within the celebration window just after the target. */
  celebrating: boolean;
}

/** How long the "it's here" celebration holds before flipping to count-up. */
export const CELEBRATION_MS = 60 * 60 * 1000;

export function remainingFrom(targetMs: number, nowMs: number): Remaining {
  const deltaMs = targetMs - nowMs;
  const past = deltaMs <= 0;
  const totalSeconds = Math.floor(Math.abs(deltaMs) / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    deltaMs,
    past,
    celebrating: past && -deltaMs < CELEBRATION_MS,
  };
}

/**
 * A coarse label for the current phase. The countdown view pulses whenever this
 * changes, which gives us free milestone moments at 100d / 30d / 7d / 1d / 1h
 * without scheduling anything.
 */
export function milestoneKey(r: Remaining): string {
  if (r.past) return "past";
  if (r.days >= 100) return "far";
  if (r.days >= 30) return "100d";
  if (r.days >= 7) return "30d";
  if (r.days >= 1) return "7d";
  if (r.hours >= 1) return "1d";
  return "1h";
}

/**
 * Only the closing stretch gets a label. Earlier bands still drive the pulse,
 * but naming them would talk over each template's own phrasing for no gain.
 */
const URGENT_MILESTONE_COPY: Record<string, string> = {
  "7d": "final week",
  "1d": "tomorrow",
  "1h": "within the hour",
};

export function milestoneLabel(r: Remaining): string | null {
  return URGENT_MILESTONE_COPY[milestoneKey(r)] ?? null;
}

/** Compact string for the browser tab, e.g. "12d" or "04:31:09". */
export function tabLabel(r: Remaining): string {
  if (r.past) return r.days > 0 ? `+${r.days}d` : "now";
  if (r.days > 0) return `${r.days}d`;
  return [r.hours, r.minutes, r.seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

/**
 * Node and the browser resolve a `undefined` locale differently (usually en-US
 * vs. the viewer's own), which shows up as a hydration mismatch. Server render
 * and first client render both use this fixed locale; the viewer's real locale
 * is applied after mount.
 */
export const HYDRATION_SAFE_LOCALE = "en-GB";

/** Pass `undefined` for `locale` to use the viewer's own formatting. */
export function formatTargetDate(
  targetMs: number,
  timeZone: string,
  allDay: boolean,
  locale?: string,
): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(allDay ? {} : { hour: "numeric", minute: "2-digit" }),
  };

  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(new Date(targetMs));
  } catch {
    // Unknown timezone from an old record — fall back to the viewer's own.
    return new Intl.DateTimeFormat(locale, options).format(new Date(targetMs));
  }
}

/** The viewer's timezone, or a safe default during SSR. */
export function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Convert the composer's `<input type="date">` + `<input type="time">` values
 * into a UTC instant, interpreting them in the composer's own timezone (which
 * is what the browser does for a local Date constructor).
 */
export function toInstant(dateValue: string, timeValue: string | null): number | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!dateMatch) return null;

  const [, y, m, d] = dateMatch;
  let hours = 0;
  let minutes = 0;

  if (timeValue) {
    const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue);
    if (!timeMatch) return null;
    hours = Number(timeMatch[1]);
    minutes = Number(timeMatch[2]);
    if (hours > 23 || minutes > 59) return null;
  }

  const instant = new Date(Number(y), Number(m) - 1, Number(d), hours, minutes, 0, 0);
  return Number.isNaN(instant.getTime()) ? null : instant.getTime();
}

/** Split a UTC instant back into date/time inputs for the given timezone. */
export function fromInstant(targetMs: number, timeZone: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).formatToParts(new Date(targetMs));

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${hour}:${get("minute")}`,
  };
}
