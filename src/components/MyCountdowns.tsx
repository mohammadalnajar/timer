"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { forget, listOwned, type Owned } from "@/lib/mine";
import { TEMPLATES } from "@/lib/templates";
import { remainingFrom } from "@/lib/time";

/** Countdowns created in this browser. Absent entirely when there are none. */
export function MyCountdowns() {
  const [items, setItems] = useState<Owned[] | null>(null);

  useEffect(() => {
    setItems(listOwned());
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className="mt-10 border-t pt-6" style={{ borderColor: "var(--shell-line)" }}>
      <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--shell-ink)" }}>
        Yours
      </h2>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => {
          const remaining = remainingFrom(item.targetMs, Date.now());
          const template = TEMPLATES[item.template] ?? TEMPLATES.minimal;

          return (
            <li key={item.slug} className="group flex items-center gap-2">
              <Link
                href={`/c/${item.slug}`}
                className="flex min-h-11 flex-1 items-center gap-3 rounded-lg border px-3 transition-colors duration-200 hover:opacity-85"
                style={{ borderColor: "var(--shell-line)", background: "var(--shell-raised)" }}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: template.colors.primary }}
                  aria-hidden="true"
                />
                <span
                  className="flex-1 truncate text-sm font-medium"
                  style={{ color: "var(--shell-ink)" }}
                >
                  {item.title}
                </span>
                <span
                  className="digits shrink-0 text-xs tabular-nums"
                  style={{ color: "var(--shell-muted)" }}
                >
                  {remaining.past ? `${remaining.days}d ago` : `${remaining.days}d`}
                </span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  forget(item.slug);
                  setItems(listOwned());
                }}
                aria-label={`Remove ${item.title} from this list`}
                title="Remove from this list"
                className="flex size-11 items-center justify-center rounded-lg opacity-0 transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-60"
                style={{ color: "var(--shell-muted)" }}
              >
                <X size={15} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2.5 text-[0.7rem]" style={{ color: "var(--shell-muted)" }}>
        Saved in this browser only. Removing one here does not delete the link.
      </p>
    </section>
  );
}
