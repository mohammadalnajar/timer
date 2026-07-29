import { ImageResponse } from "next/og";
import { getCountdown } from "@/lib/store";
import { isSlugShaped } from "@/lib/ids";
import { getTemplate } from "@/lib/templates";
import { formatTargetDate, HYDRATION_SAFE_LOCALE, remainingFrom } from "@/lib/time";

export const alt = "Countdown";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The number changes every day, so never cache the rendered card.
export const dynamic = "force-dynamic";

/**
 * Satori supports flexbox, solid fills and linear gradients — but not
 * radial-gradient, so structure comes from straight-edged panels rather than
 * soft blooms.
 */

/** Satori has no color-mix(), so alpha blending happens here. */
function alpha(hex: string, a: number): string {
  const v = hex.replace("#", "");
  const full = v.length === 3 ? v.split("").map((c) => c + c).join("") : v;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const countdown = isSlugShaped(slug) ? getCountdown(slug) : null;

  if (!countdown) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            background: "#fbfbfa",
            color: "#18181b",
            fontSize: 56,
            letterSpacing: "-0.03em",
          }}
        >
          Countdown not found
        </div>
      ),
      size,
    );
  }

  const template = getTemplate(countdown.template);
  const { colors } = template;
  const remaining = remainingFrom(countdown.targetMs, Date.now());

  const showClock = !remaining.past && remaining.days < 1;
  const bigValue = showClock ? `${remaining.hours}h` : String(remaining.days);
  const unitLabel = showClock
    ? "TO GO"
    : remaining.past
      ? remaining.days === 1
        ? "DAY AGO"
        : "DAYS AGO"
      : remaining.days === 1
        ? "DAY TO GO"
        : "DAYS TO GO";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: `linear-gradient(150deg, ${colors.bg} 0%, ${colors.bgAlt} 100%)`,
          color: colors.fg,
        }}
      >
        {/* Accent rule down the leading edge. */}
        <div style={{ display: "flex", width: 12, background: colors.primary }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "64px 64px 60px 68px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "0.22em",
                color: colors.primary,
                marginBottom: 20,
              }}
            >
              {(remaining.past ? template.tone.since : template.tone.until).toUpperCase()}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: countdown.title.length > 34 ? 58 : 74,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1.12,
              }}
            >
              {countdown.title}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: remaining.celebrating ? 96 : 176,
                fontWeight: 700,
                letterSpacing: "-0.06em",
                lineHeight: 1,
                color: remaining.celebrating ? colors.primary : colors.fg,
              }}
            >
              {remaining.celebrating ? template.tone.arrived : bigValue}
            </div>
            {!remaining.celebrating && (
              <div
                style={{
                  display: "flex",
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  color: colors.muted,
                  marginTop: 14,
                }}
              >
                {unitLabel}
              </div>
            )}
          </div>
        </div>

        {/* Tinted side panel: gives the card structure and holds the metadata. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 372,
            padding: "64px 56px 60px",
            justifyContent: "space-between",
            alignItems: "flex-end",
            background: alpha(colors.primary, 0.1),
            borderLeft: `1px solid ${alpha(colors.fg, 0.1)}`,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: alpha(colors.fg, 0.5),
            }}
          >
            SOON
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              textAlign: "right",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 30,
                lineHeight: 1.25,
                color: alpha(colors.fg, 0.85),
              }}
            >
              {compactDate(countdown.targetMs, countdown.timeZone, countdown.allDay)}
            </div>
            {countdown.message && (
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  lineHeight: 1.35,
                  color: colors.muted,
                  marginTop: 16,
                }}
              >
                {countdown.message.length > 70
                  ? `${countdown.message.slice(0, 70)}…`
                  : countdown.message}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    size,
  );
}

/** Short enough to sit in the side panel without wrapping awkwardly. */
function compactDate(targetMs: number, timeZone: string, allDay: boolean): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(allDay ? {} : { hour: "2-digit", minute: "2-digit", hour12: false }),
      timeZone,
    }).format(new Date(targetMs));
  } catch {
    return formatTargetDate(targetMs, "UTC", allDay, HYDRATION_SAFE_LOCALE);
  }
}
