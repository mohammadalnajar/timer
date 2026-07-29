"use client";

import { Check } from "lucide-react";
import { TEMPLATE_LIST, type TemplateId } from "@/lib/templates";

interface Props {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
}

/**
 * Real radio inputs under the cards, so arrow-key navigation, focus and screen
 * reader semantics all come for free.
 */
export function TemplatePicker({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium" style={{ color: "var(--shell-ink)" }}>
        Look
      </legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {TEMPLATE_LIST.map((template) => {
          const selected = template.id === value;
          return (
            <label
              key={template.id}
              className="group relative flex cursor-pointer flex-col gap-2 rounded-xl border p-3 transition-colors duration-200 focus-within:outline-2 focus-within:outline-offset-2"
              style={{
                borderColor: selected ? "var(--shell-ink)" : "var(--shell-line)",
                background: selected ? "var(--shell-sunken)" : "var(--shell-raised)",
                outlineColor: "var(--shell-focus)",
              }}
            >
              <input
                type="radio"
                name="template"
                value={template.id}
                checked={selected}
                onChange={() => onChange(template.id)}
                className="sr-only"
              />

              {/* Chips sit on the template's own background, so dark palettes
                  stay visible in dark mode and the strip previews the real pairing. */}
              <span
                className="flex items-center gap-1.5 rounded-lg p-1.5"
                style={{ background: template.colors.bg }}
                aria-hidden="true"
              >
                {template.swatch.map((color, index) => (
                  <span
                    key={index}
                    className="h-5 flex-1 rounded"
                    style={{
                      background: color,
                      boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${template.colors.fg} 12%, transparent)`,
                    }}
                  />
                ))}
              </span>

              <span className="flex items-start justify-between gap-2">
                <span className="flex flex-col gap-0.5">
                  <span
                    className="text-sm font-medium leading-tight"
                    style={{ color: "var(--shell-ink)" }}
                  >
                    {template.name}
                  </span>
                  <span
                    className="text-[0.7rem] leading-snug"
                    style={{ color: "var(--shell-muted)" }}
                  >
                    {template.blurb}
                  </span>
                </span>

                <span
                  className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full transition-opacity duration-200"
                  style={{
                    background: selected ? "var(--shell-ink)" : "transparent",
                    opacity: selected ? 1 : 0,
                  }}
                  aria-hidden="true"
                >
                  <Check size={11} strokeWidth={3} color="var(--shell-raised)" />
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
