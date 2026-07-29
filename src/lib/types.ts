import { DEFAULT_TEMPLATE, isTemplateId, type TemplateId } from "./templates";

/** What a viewer of a shared link is allowed to see. */
export interface Countdown {
  slug: string;
  title: string;
  message: string | null;
  /** UTC instant. Everyone counts down to this exact moment. */
  targetMs: number;
  /** No specific time of day was chosen. */
  allDay: boolean;
  /** IANA zone of whoever created it, used only for the date label. */
  timeZone: string;
  template: TemplateId;
  createdMs: number;
}

/** The create/update payload, after validation. */
export interface CountdownInput {
  title: string;
  message: string | null;
  targetMs: number;
  allDay: boolean;
  timeZone: string;
  template: TemplateId;
}

export const LIMITS = {
  title: 70,
  message: 140,
  /** Roughly year 1970 .. 2200, enough to reject nonsense without being fussy. */
  minTargetMs: 0,
  maxTargetMs: 7_258_118_400_000,
} as const;

export type ValidationResult =
  | { ok: true; value: CountdownInput }
  | { ok: false; error: string };

export function validateInput(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Expected an object." };
  }

  const raw = body as Record<string, unknown>;

  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) return { ok: false, error: "Give it a title." };
  if (title.length > LIMITS.title) {
    return { ok: false, error: `Keep the title under ${LIMITS.title} characters.` };
  }

  const rawMessage = typeof raw.message === "string" ? raw.message.trim() : "";
  if (rawMessage.length > LIMITS.message) {
    return { ok: false, error: `Keep the message under ${LIMITS.message} characters.` };
  }

  const targetMs = typeof raw.targetMs === "number" ? raw.targetMs : NaN;
  if (!Number.isFinite(targetMs) || !Number.isInteger(targetMs)) {
    return { ok: false, error: "Pick a date." };
  }
  if (targetMs < LIMITS.minTargetMs || targetMs > LIMITS.maxTargetMs) {
    return { ok: false, error: "That date is outside the supported range." };
  }

  const timeZone = typeof raw.timeZone === "string" && raw.timeZone.length <= 60 ? raw.timeZone : "UTC";

  return {
    ok: true,
    value: {
      title,
      message: rawMessage || null,
      targetMs,
      allDay: raw.allDay === true,
      timeZone,
      template: isTemplateId(raw.template) ? raw.template : DEFAULT_TEMPLATE,
    },
  };
}
