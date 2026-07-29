import type { Template } from "./templates";
import { formatTargetDate, remainingFrom } from "./time";
import type { Countdown } from "./types";

/**
 * Draws the countdown as a 1080x1920 story image on a canvas. Hand-drawn rather
 * than DOM-rasterised: no extra dependency, no cross-origin font problems, and
 * we get a layout tuned for a phone screen instead of a squashed web page.
 */

const W = 1080;
const H = 1920;

export interface ResolvedFonts {
  display: string;
  body: string;
  digits: string;
}

/**
 * next/font generates obfuscated family names, so we read them back off a live
 * element rather than guessing.
 */
export function resolveFonts(stage: HTMLElement): ResolvedFonts {
  const styles = getComputedStyle(stage);
  const fallback = "system-ui, sans-serif";
  return {
    display: styles.getPropertyValue("--font-display").trim() || fallback,
    body: styles.getPropertyValue("--font-body").trim() || fallback,
    digits: styles.getPropertyValue("--font-digits").trim() || fallback,
  };
}

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);

  if (lines.length === maxLines) {
    // Trim the last line until the ellipsis fits.
    let last = lines[maxLines - 1];
    if (words.join(" ") !== lines.join(" ")) {
      while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
        last = last.slice(0, -1);
      }
      lines[maxLines - 1] = `${last.trimEnd()}…`;
    }
  }

  return lines;
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, value: string) {
  // Supported in Chrome 99+ and Safari 17+; harmless to set elsewhere.
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = value;
}

export async function renderStoryImage(
  countdown: Countdown,
  template: Template,
  fonts: ResolvedFonts,
  shareUrl: string,
): Promise<Blob> {
  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Proceed with whatever is loaded.
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");

  const { colors } = template;

  // Background wash.
  const wash = ctx.createLinearGradient(0, 0, W * 0.4, H);
  wash.addColorStop(0, colors.bg);
  wash.addColorStop(1, colors.bgAlt);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  // A restrained nod to the template motif.
  const glow = ctx.createRadialGradient(W * 0.28, H * 0.16, 0, W * 0.28, H * 0.16, W * 0.85);
  glow.addColorStop(0, withAlpha(colors.primary, 0.22));
  glow.addColorStop(1, withAlpha(colors.primary, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const accentGlow = ctx.createRadialGradient(W * 0.82, H * 0.82, 0, W * 0.82, H * 0.82, W * 0.7);
  accentGlow.addColorStop(0, withAlpha(colors.accent, 0.16));
  accentGlow.addColorStop(1, withAlpha(colors.accent, 0));
  ctx.fillStyle = accentGlow;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  // Top baseline makes the two-pass layout below simple and predictable.
  ctx.textBaseline = "top";

  const remaining = remainingFrom(countdown.targetMs, Date.now());
  const centerX = W / 2;
  const maxWidth = W - 160;

  const showClock = !remaining.past && remaining.days < 1;
  const bigValue = showClock
    ? [remaining.hours, remaining.minutes, remaining.seconds]
        .map((n) => String(n).padStart(2, "0"))
        .join(":")
    : String(remaining.days);

  const eyebrow = remaining.celebrating
    ? template.tone.arrived
    : remaining.past
      ? template.tone.since
      : template.tone.until;

  const unitLabel = showClock
    ? "HOURS TO GO"
    : remaining.past
      ? remaining.days === 1
        ? "DAY AGO"
        : "DAYS AGO"
      : remaining.days === 1
        ? "DAY TO GO"
        : "DAYS TO GO";

  // Fonts for wrapping have to be active before measuring.
  const titleFont = `${template.type.digitWeight >= 600 ? 600 : 400} 92px ${fonts.display}`;
  ctx.font = titleFont;
  const titleLines = wrapText(ctx, countdown.title, maxWidth, 3);

  ctx.font = `400 40px ${fonts.body}`;
  const messageLines = countdown.message
    ? wrapText(ctx, countdown.message, maxWidth - 80, 3)
    : [];

  interface Group {
    lines: string[];
    font: string;
    color: string;
    lineHeight: number;
    letterSpacing: string;
    marginTop: number;
  }

  const groups: Group[] = [
    {
      lines: [eyebrow.toUpperCase()],
      font: `600 34px ${fonts.body}`,
      color: colors.primary,
      lineHeight: 46,
      letterSpacing: "10px",
      marginTop: 0,
    },
    {
      lines: titleLines,
      font: titleFont,
      color: colors.fg,
      lineHeight: 108,
      letterSpacing: "0px",
      marginTop: 34,
    },
  ];

  if (remaining.celebrating) {
    groups.push({
      lines: [template.tone.arrived],
      font: `400 168px ${fonts.display}`,
      color: colors.primary,
      lineHeight: 210,
      letterSpacing: "0px",
      marginTop: 56,
    });
  } else {
    const size = showClock ? 210 : 340;
    groups.push({
      lines: [bigValue],
      font: `${template.type.digitWeight} ${size}px ${fonts.digits}`,
      color: colors.fg,
      // Generous line box: several of these faces have descending figures.
      lineHeight: showClock ? 250 : 400,
      letterSpacing: showClock ? "-4px" : "-14px",
      marginTop: 48,
    });
    groups.push({
      lines: [unitLabel],
      font: `600 40px ${fonts.body}`,
      color: colors.muted,
      lineHeight: 54,
      letterSpacing: "14px",
      marginTop: 0,
    });
  }

  groups.push({
    lines: [formatTargetDate(countdown.targetMs, countdown.timeZone, countdown.allDay)],
    font: `400 42px ${fonts.body}`,
    color: withAlpha(colors.fg, 0.8),
    lineHeight: 58,
    letterSpacing: "0px",
    marginTop: 72,
  });

  if (messageLines.length > 0) {
    groups.push({
      lines: messageLines,
      font: `400 40px ${fonts.body}`,
      color: colors.muted,
      lineHeight: 56,
      letterSpacing: "0px",
      marginTop: 34,
    });
  }

  // Pass one: total height. Pass two: draw, optically centred.
  const totalHeight = groups.reduce(
    (sum, group) => sum + group.marginTop + group.lines.length * group.lineHeight,
    0,
  );

  // Bias slightly above centre — story UI crowds the bottom of the frame.
  let y = Math.max(220, (H - totalHeight) / 2 - 60);

  for (const group of groups) {
    y += group.marginTop;
    ctx.font = group.font;
    ctx.fillStyle = group.color;
    setLetterSpacing(ctx, group.letterSpacing);
    for (const line of group.lines) {
      ctx.fillText(line, centerX, y);
      y += group.lineHeight;
    }
    setLetterSpacing(ctx, "0px");
  }

  // Footer: the share link, so the image itself carries the invitation.
  ctx.font = `600 34px ${fonts.body}`;
  ctx.fillStyle = withAlpha(colors.fg, 0.55);
  setLetterSpacing(ctx, "2px");
  ctx.fillText(shareUrl.replace(/^https?:\/\//, ""), centerX, H - 190);
  setLetterSpacing(ctx, "0px");

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the image."))),
      "image/png",
    );
  });
}
