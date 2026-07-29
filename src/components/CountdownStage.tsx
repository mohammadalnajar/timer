"use client";

import { useEffect, useRef, useState } from "react";
import { Motif } from "./Motif";
import { Confetti } from "./Confetti";
import { templateStyle, type Template } from "@/lib/templates";
import {
  formatTargetDate,
  HYDRATION_SAFE_LOCALE,
  milestoneKey,
  milestoneLabel,
  remainingFrom,
  type Remaining,
} from "@/lib/time";

export interface StageContent {
  title: string;
  message: string | null;
  targetMs: number;
  allDay: boolean;
  timeZone: string;
}

interface StageProps {
  template: Template;
  content: StageContent;
  /**
   * The server's clock at render time. Passing it through keeps the first client
   * render byte-identical, so there is no hydration mismatch on the digits.
   */
  initialNowMs: number;
  /** 'preview' shrinks the type ramp for the composer; 'full' fills the screen. */
  size?: "preview" | "full";
  /** Ref to the stage element, used by the PNG exporter to read live fonts. */
  stageRef?: React.Ref<HTMLDivElement>;
}

const UNITS = ["days", "hours", "minutes", "seconds"] as const;

export function CountdownStage({
  template,
  content,
  initialNowMs,
  size = "full",
  stageRef,
}: StageProps) {
  const [nowMs, setNowMs] = useState(initialNowMs);
  const remaining = remainingFrom(content.targetMs, nowMs);

  useEffect(() => {
    // Sync immediately (the server clock may be seconds stale), then tick.
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const pulse = useMilestonePulse(remaining);
  const preview = size === "preview";

  return (
    <div
      ref={stageRef}
      style={templateStyle(template)}
      className="relative isolate flex h-full w-full flex-col items-center justify-center overflow-hidden"
      data-template={template.id}
    >
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(160deg, var(--bg) 0%, var(--bg-alt) 100%)`,
        }}
        aria-hidden="true"
      />
      <Motif template={template.id} />
      {remaining.celebrating && <Confetti template={template} />}

      {/* z-10 is load-bearing: the confetti pieces animate with 3D transforms,
          which promotes them to their own compositing layer and would otherwise
          let them paint over the text. */}
      <div
        className={`relative z-10 flex w-full flex-col items-center text-center ${
          preview ? "gap-4 px-6 py-8" : "gap-8 px-6 py-16 sm:gap-10"
        }`}
        style={{ color: "var(--fg)", fontFamily: "var(--font-body)" }}
      >
        {/* While celebrating, the large "arrived" line already says it — an
            eyebrow here would just repeat the same words. */}
        {!remaining.celebrating && (
          <Eyebrow remaining={remaining} template={template} preview={preview} />
        )}

        <h1
          className={`animate-rise max-w-[22ch] text-balance ${
            preview
              ? "text-[clamp(1.5rem,4.4vw,2.25rem)]"
              : "text-[clamp(2rem,6.4vw,4.5rem)]"
          }`}
          style={{
            fontFamily: "var(--font-display)",
            letterSpacing: "var(--title-tracking)",
            lineHeight: 1.08,
          }}
        >
          {content.title}
        </h1>

        <div className={pulse ? "animate-pulse-once w-full" : "w-full"}>
          {remaining.celebrating ? (
            <Arrived template={template} preview={preview} />
          ) : (
            <Digits remaining={remaining} preview={preview} />
          )}
        </div>

        <DateLine content={content} remaining={remaining} preview={preview} />

        {content.message && (
          <p
            className={`max-w-[34ch] text-balance ${preview ? "text-sm" : "text-base sm:text-lg"}`}
            style={{ color: "var(--muted)", lineHeight: 1.6 }}
          >
            {content.message}
          </p>
        )}
      </div>
    </div>
  );
}

function Eyebrow({
  remaining,
  template,
  preview,
}: {
  remaining: Remaining;
  template: Template;
  preview: boolean;
}) {
  // The template's own phrasing leads; urgency is appended, never substituted.
  const milestone = milestoneLabel(remaining);

  let text: string;
  if (remaining.celebrating) text = template.tone.arrived;
  else if (remaining.past) text = template.tone.since;
  else text = milestone ? `${template.tone.until} · ${milestone}` : template.tone.until;

  return (
    <p
      className={`unit-label uppercase ${preview ? "text-[0.6rem]" : "text-xs sm:text-sm"}`}
      style={{ color: "var(--primary)", fontWeight: 600 }}
    >
      {text}
    </p>
  );
}

function Digits({ remaining, preview }: { remaining: Remaining; preview: boolean }) {
  const values: Record<(typeof UNITS)[number], number> = {
    days: remaining.days,
    hours: remaining.hours,
    minutes: remaining.minutes,
    seconds: remaining.seconds,
  };

  // Counting up is a different mental model: "days since" wants one calm
  // number, not four columns of churning digits.
  if (remaining.past) {
    return (
      <div className="flex flex-col items-center gap-1" role="timer" aria-live="off">
        <span
          className={`digits leading-none ${
            preview ? "text-[clamp(2.5rem,10vw,4rem)]" : "text-[clamp(4rem,19vw,9rem)]"
          }`}
          style={{ color: "var(--fg)" }}
        >
          {remaining.days}
        </span>
        <span
          className={`unit-label uppercase ${preview ? "text-[0.55rem]" : "text-[0.65rem] sm:text-xs"}`}
          style={{ color: "var(--muted)", fontWeight: 600 }}
        >
          {remaining.days === 1 ? "day ago" : "days ago"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`mx-auto grid w-full max-w-3xl grid-cols-2 sm:grid-cols-4 ${
        preview ? "gap-x-4 gap-y-3" : "gap-x-6 gap-y-6 sm:gap-x-4"
      }`}
      role="timer"
      aria-live="off"
    >
      {UNITS.map((unit) => (
        <div key={unit} className="flex flex-col items-center gap-1">
          <span
            className={`digits leading-none ${
              preview
                ? "text-[clamp(2rem,7vw,3rem)]"
                : "text-[clamp(3rem,13vw,7rem)]"
            }`}
            style={{ color: "var(--fg)" }}
          >
            {unit === "days"
              ? values[unit]
              : String(values[unit]).padStart(2, "0")}
          </span>
          <span
            className={`unit-label uppercase ${preview ? "text-[0.55rem]" : "text-[0.65rem] sm:text-xs"}`}
            style={{ color: "var(--muted)", fontWeight: 600 }}
          >
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Shown for the hour after the target instant, in place of the digits. */
function Arrived({ template, preview }: { template: Template; preview: boolean }) {
  return (
    <p
      className={`animate-rise mx-auto max-w-[16ch] text-balance ${
        preview ? "text-[clamp(1.75rem,6vw,2.5rem)]" : "text-[clamp(2.75rem,11vw,6rem)]"
      }`}
      style={{
        fontFamily: "var(--font-display)",
        color: "var(--primary)",
        letterSpacing: "var(--title-tracking)",
        lineHeight: 1.05,
      }}
    >
      {template.tone.arrived}
    </p>
  );
}

function DateLine({
  content,
  remaining,
  preview,
}: {
  content: StageContent;
  remaining: Remaining;
  preview: boolean;
}) {
  // First render uses a fixed locale so SSR and hydration agree; the effect
  // then re-formats in whatever locale the viewer actually uses.
  const [label, setLabel] = useState(() =>
    formatTargetDate(content.targetMs, content.timeZone, content.allDay, HYDRATION_SAFE_LOCALE),
  );

  useEffect(() => {
    setLabel(formatTargetDate(content.targetMs, content.timeZone, content.allDay));
  }, [content.targetMs, content.timeZone, content.allDay]);

  return (
    <div className={`flex flex-col items-center gap-1 ${preview ? "text-xs" : "text-sm sm:text-base"}`}>
      <p style={{ color: "var(--fg)", opacity: 0.75 }}>
        <span className="sr-only">{remaining.past ? "Was on " : "Happens on "}</span>
        {label}
      </p>
      {!content.allDay && (
        <p className="text-[0.7rem]" style={{ color: "var(--muted)" }}>
          {shortZone(content.timeZone)}
        </p>
      )}
    </div>
  );
}

function shortZone(timeZone: string): string {
  return timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;
}

/** Fires a single pulse whenever the countdown crosses into a new phase. */
function useMilestonePulse(remaining: Remaining): boolean {
  const key = milestoneKey(remaining);
  const previous = useRef<string | null>(null);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (previous.current === null) {
      previous.current = key;
      return;
    }
    if (previous.current === key) return;

    previous.current = key;
    setPulsing(true);
    const id = window.setTimeout(() => setPulsing(false), 600);
    return () => window.clearTimeout(id);
  }, [key]);

  return pulsing;
}
