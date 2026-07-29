"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CountdownStage } from "./CountdownStage";
import { ShareBar } from "./ShareBar";
import { getTemplate } from "@/lib/templates";
import { remainingFrom, tabLabel } from "@/lib/time";
import type { Countdown } from "@/lib/types";

interface Props {
  countdown: Countdown;
  initialNowMs: number;
  justCreated: boolean;
}

export function CountdownScreen({ countdown, initialNowMs, justCreated }: Props) {
  const template = getTemplate(countdown.template);
  const stageRef = useRef<HTMLDivElement>(null);

  useTabTitle(countdown);

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <CountdownStage
        template={template}
        content={countdown}
        initialNowMs={initialNowMs}
        size="full"
        stageRef={stageRef}
      />

      <Link
        href="/"
        className="absolute top-4 left-4 z-20 inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium backdrop-blur-md transition-opacity duration-200 hover:opacity-75"
        style={{
          borderColor: `color-mix(in srgb, ${template.colors.fg} 16%, transparent)`,
          background: `color-mix(in srgb, ${template.colors.bg} 70%, transparent)`,
          color: template.colors.fg,
        }}
      >
        <Plus size={15} aria-hidden="true" />
        New
      </Link>

      <ShareBar
        countdown={countdown}
        template={template}
        stageRef={stageRef}
        justCreated={justCreated}
      />
    </main>
  );
}

/** Keeps the tab title ticking, so a pinned tab acts as the widget. */
function useTabTitle(countdown: Countdown) {
  useEffect(() => {
    const original = document.title;

    const update = () => {
      const remaining = remainingFrom(countdown.targetMs, Date.now());
      document.title = `${tabLabel(remaining)} · ${countdown.title}`;
    };

    update();
    const id = window.setInterval(update, 1000);

    return () => {
      window.clearInterval(id);
      document.title = original;
    };
  }, [countdown.targetMs, countdown.title]);
}
