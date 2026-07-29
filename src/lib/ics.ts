import type { Countdown } from "./types";

/**
 * Minimal RFC 5545 event. Written by hand because the spec surface we need is
 * tiny and every library is larger than this file.
 */

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** ICS lines must be folded at 75 octets, continuations prefixed with a space. */
function fold(line: string): string {
  if (line.length <= 75) return line;

  const chunks: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    chunks.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest) chunks.push(` ${rest}`);
  return chunks.join("\r\n");
}

function utcStamp(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Calendar date in a specific zone, for all-day events. */
function dateInZone(ms: number, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone,
    }).formatToParts(new Date(ms));
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return `${get("year")}${get("month")}${get("day")}`;
  } catch {
    return utcStamp(ms).slice(0, 8);
  }
}

const DEFAULT_DURATION_MS = 60 * 60 * 1000;

export function buildIcs(countdown: Countdown, shareUrl: string): string {
  const description = [countdown.message, shareUrl].filter(Boolean).join("\n\n");

  const start = countdown.allDay
    ? `DTSTART;VALUE=DATE:${dateInZone(countdown.targetMs, countdown.timeZone)}`
    : `DTSTART:${utcStamp(countdown.targetMs)}`;

  const end = countdown.allDay
    ? `DTEND;VALUE=DATE:${dateInZone(countdown.targetMs + 86400000, countdown.timeZone)}`
    : `DTEND:${utcStamp(countdown.targetMs + DEFAULT_DURATION_MS)}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Soon//Countdown//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${countdown.slug}@soon`,
    `DTSTAMP:${utcStamp(Date.now())}`,
    start,
    end,
    `SUMMARY:${escapeText(countdown.title)}`,
    description ? `DESCRIPTION:${escapeText(description)}` : null,
    `URL:${escapeText(shareUrl)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null);

  return lines.map(fold).join("\r\n") + "\r\n";
}

export function icsFileName(title: string): string {
  const slugified =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "countdown";
  return `${slugified}.ics`;
}
