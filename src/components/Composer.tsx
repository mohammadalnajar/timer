"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { TemplatePicker } from "./TemplatePicker";
import { CountdownStage } from "./CountdownStage";
import { MyCountdowns } from "./MyCountdowns";
import { Button, Field, TextArea, TextInput } from "./ui";
import { getTemplate, DEFAULT_TEMPLATE, type TemplateId } from "@/lib/templates";
import { fromInstant, localTimeZone, toInstant } from "@/lib/time";
import { LIMITS, type Countdown } from "@/lib/types";
import { editTokenFor, remember } from "@/lib/mine";

const PLACEHOLDER_TITLE = "Something worth waiting for";

interface Props {
  /** Present when editing an existing countdown. */
  existing?: Countdown;
}

function defaultDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return fromInstant(date.getTime(), localTimeZone()).date;
}

export function Composer({ existing }: Props) {
  const router = useRouter();
  const editing = Boolean(existing);

  const initial = useMemo(() => {
    if (!existing) {
      return {
        title: "",
        message: "",
        // Left blank for the first render: this page is prerendered, so a
        // build-time "today + 30" would not match the visitor's clock. Filled
        // in on mount below.
        date: "",
        time: "",
        template: DEFAULT_TEMPLATE as TemplateId,
      };
    }
    // Editing is deterministic — the instant and its zone both come from the row.
    const split = fromInstant(existing.targetMs, existing.timeZone);
    return {
      title: existing.title,
      message: existing.message ?? "",
      date: split.date,
      time: existing.allDay ? "" : split.time,
      template: existing.template,
    };
  }, [existing]);

  const [title, setTitle] = useState(initial.title);
  const [message, setMessage] = useState(initial.message);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [template, setTemplate] = useState<TemplateId>(initial.template);

  const [errors, setErrors] = useState<{ title?: string; date?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  /**
   * The preview reads the visitor's clock and timezone, neither of which exists
   * at prerender time. It renders once mounted; until then the card shows the
   * template's background, which is deterministic.
   */
  const [clock, setClock] = useState<{ nowMs: number; timeZone: string } | null>(null);

  useEffect(() => {
    setClock({ nowMs: Date.now(), timeZone: localTimeZone() });
    if (!existing) setDate((current) => current || defaultDate());
  }, [existing]);

  const targetMs = toInstant(date, time || null);
  const previewContent = {
    title: title.trim() || PLACEHOLDER_TITLE,
    message: message.trim() || null,
    targetMs: targetMs ?? (clock ? clock.nowMs + 30 * 86400000 : 0),
    allDay: !time,
    timeZone: existing?.timeZone ?? clock?.timeZone ?? "UTC",
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: typeof errors = {};
    if (!title.trim()) nextErrors.title = "Give it a title so the link means something.";
    if (!targetMs) nextErrors.date = "Pick a valid date.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      // Focus the first invalid field.
      const firstId = nextErrors.title ? "title" : "date";
      document.getElementById(firstId)?.focus();
      return;
    }

    setSubmitting(true);

    const payload = {
      title: title.trim(),
      message: message.trim() || null,
      targetMs,
      allDay: !time,
      timeZone: existing?.timeZone ?? localTimeZone(),
      template,
    };

    try {
      if (existing) {
        const token = editTokenFor(existing.slug);
        if (!token) {
          setErrors({ form: "This browser no longer has the edit key for this countdown." });
          setSubmitting(false);
          return;
        }

        const response = await fetch(`/api/countdowns/${existing.slug}`, {
          method: "PATCH",
          headers: { "content-type": "application/json", "x-edit-token": token },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not save your changes.");

        remember(data.countdown, token);
        router.push(`/c/${existing.slug}`);
      } else {
        const response = await fetch("/api/countdowns", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not create the countdown.");

        remember(data.countdown, data.editToken);
        router.push(`/c/${data.countdown.slug}?new=1`);
      }
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Something went wrong." });
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 lg:py-14">
      {/* Preview first on mobile: the point of the app is seeing it change. */}
      <div className="order-1 lg:order-2">
        <div className="lg:sticky lg:top-14">
          <div
            className="overflow-hidden rounded-2xl border shadow-sm"
            style={{ borderColor: "var(--shell-line)" }}
          >
            <div className="h-[clamp(280px,42vh,420px)] lg:h-[540px]">
              {clock ? (
                <CountdownStage
                  template={getTemplate(template)}
                  content={previewContent}
                  initialNowMs={clock.nowMs}
                  size="preview"
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{
                    background: `linear-gradient(160deg, ${getTemplate(template).colors.bg} 0%, ${
                      getTemplate(template).colors.bgAlt
                    } 100%)`,
                  }}
                />
              )}
            </div>
          </div>
          <p className="mt-2.5 text-center text-[0.75rem]" style={{ color: "var(--shell-muted)" }}>
            Live preview — this is exactly what your link shows.
          </p>
        </div>
      </div>

      <div className="order-2 lg:order-1">
        {existing && (
          <button
            type="button"
            onClick={() => router.push(`/c/${existing.slug}`)}
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-70"
            style={{ color: "var(--shell-muted)" }}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to countdown
          </button>
        )}

        <header className="mb-7">
          <h1
            className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-[-0.03em]"
            style={{ color: "var(--shell-ink)" }}
          >
            {editing ? "Edit countdown" : "What are you waiting for?"}
          </h1>
          <p className="mt-1.5 text-[0.95rem]" style={{ color: "var(--shell-muted)" }}>
            {editing
              ? "Anyone holding your link will see the changes straight away."
              : "Pick a date, pick a look, and share the link with whoever should be counting too."}
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <Field
            label="Title"
            htmlFor="title"
            error={errors.title}
            counter={`${title.length}/${LIMITS.title}`}
          >
            <TextInput
              id="title"
              name="title"
              value={title}
              maxLength={LIMITS.title}
              placeholder="Our wedding"
              autoComplete="off"
              hasError={Boolean(errors.title)}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
              onChange={(event) => {
                setTitle(event.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
            />
          </Field>

          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
            <Field
              label="Date"
              htmlFor="date"
              error={errors.date}
              hint="Past dates work too — it counts up instead."
            >
              <TextInput
                id="date"
                name="date"
                type="date"
                value={date}
                hasError={Boolean(errors.date)}
                aria-invalid={Boolean(errors.date)}
                aria-describedby={errors.date ? "date-error" : "date-hint"}
                onChange={(event) => {
                  setDate(event.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
                }}
              />
            </Field>

            <Field label="Time" htmlFor="time" hint="Optional.">
              <TextInput
                id="time"
                name="time"
                type="time"
                value={time}
                aria-describedby="time-hint"
                onChange={(event) => setTime(event.target.value)}
              />
            </Field>
          </div>

          <Field
            label="Note"
            htmlFor="message"
            hint="One line, shown under the title. Optional."
            counter={`${message.length}/${LIMITS.message}`}
          >
            <TextArea
              id="message"
              name="message"
              rows={2}
              value={message}
              maxLength={LIMITS.message}
              placeholder="Can't wait to see you there."
              aria-describedby="message-hint"
              onChange={(event) => setMessage(event.target.value)}
            />
          </Field>

          <TemplatePicker value={template} onChange={setTemplate} />

          {errors.form && (
            <p
              role="alert"
              className="rounded-lg border px-3 py-2.5 text-sm"
              style={{ borderColor: "#dc2626", color: "#dc2626", background: "#fef2f2" }}
            >
              {errors.form}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
            <Button type="submit" variant="primary" disabled={submitting} className="sm:px-6">
              {submitting && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
              {submitting
                ? editing
                  ? "Saving…"
                  : "Creating…"
                : editing
                  ? "Save changes"
                  : "Create shareable link"}
            </Button>
            {!editing && (
              <p className="text-[0.75rem]" style={{ color: "var(--shell-muted)" }}>
                No account. No email. Just a link.
              </p>
            )}
          </div>
        </form>

        {!editing && <MyCountdowns />}
      </div>
    </div>
  );
}
