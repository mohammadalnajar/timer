"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Check, Copy, ImageDown, Link2, Pencil, Share2 } from "lucide-react";
import type { Template } from "@/lib/templates";
import type { Countdown } from "@/lib/types";
import { buildIcs, icsFileName } from "@/lib/ics";
import { renderStoryImage, resolveFonts } from "@/lib/story-image";
import { editTokenFor } from "@/lib/mine";

interface Props {
  countdown: Countdown;
  template: Template;
  /** The stage element, read for its resolved font families when exporting. */
  stageRef: React.RefObject<HTMLDivElement | null>;
  /** True right after creation: reveal the link prominently. */
  justCreated: boolean;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser a beat to start the download before revoking.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function ShareBar({ countdown, template, stageRef, justCreated }: Props) {
  const [shareUrl, setShareUrl] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<null | "image">(null);
  const [toast, setToast] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(justCreated);
  const linkInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShareUrl(window.location.origin + `/c/${countdown.slug}`);
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
    setIsOwner(editTokenFor(countdown.slug) !== null);
  }, [countdown.slug]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Select the link on reveal so a single Cmd+C also works.
  useEffect(() => {
    if (panelOpen && shareUrl) linkInput.current?.select();
  }, [panelOpen, shareUrl]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard blocked (insecure context or denied) — fall back to selecting.
      linkInput.current?.select();
      setToast("Press Cmd/Ctrl + C to copy the selected link.");
      setPanelOpen(true);
    }
  }, [shareUrl]);

  const nativeShare = useCallback(async () => {
    try {
      await navigator.share({
        title: countdown.title,
        text: countdown.message ?? `Counting down to ${countdown.title}`,
        url: shareUrl,
      });
    } catch {
      // User dismissed the sheet; nothing to report.
    }
  }, [countdown.title, countdown.message, shareUrl]);

  const saveImage = useCallback(async () => {
    setBusy("image");
    try {
      const stage = stageRef.current;
      const fonts = stage
        ? resolveFonts(stage)
        : { display: "system-ui", body: "system-ui", digits: "system-ui" };
      const blob = await renderStoryImage(countdown, template, fonts, shareUrl);
      download(blob, `${icsFileName(countdown.title).replace(/\.ics$/, "")}.png`);
      setToast("Image saved.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not create the image.");
    } finally {
      setBusy(null);
    }
  }, [countdown, template, shareUrl, stageRef]);

  const saveCalendar = useCallback(() => {
    const blob = new Blob([buildIcs(countdown, shareUrl)], {
      type: "text/calendar;charset=utf-8",
    });
    download(blob, icsFileName(countdown.title));
    setToast("Calendar file saved.");
  }, [countdown, shareUrl]);

  // Chrome tinted to the template so the bar never fights the design.
  const chrome: React.CSSProperties = {
    background: `color-mix(in srgb, ${template.colors.bg} 82%, transparent)`,
    borderColor: `color-mix(in srgb, ${template.colors.fg} 14%, transparent)`,
    color: template.colors.fg,
  };

  return (
    <>
      {panelOpen && (
        <div
          className="animate-rise absolute inset-x-4 top-4 z-20 mx-auto max-w-md rounded-2xl border p-4 shadow-lg backdrop-blur-md sm:inset-x-auto sm:right-4 sm:left-auto"
          style={chrome}
          role="region"
          aria-label="Your shareable link"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Your link is ready</p>
              <p className="mt-0.5 text-[0.78rem]" style={{ color: template.colors.muted }}>
                Send it to anyone. No account needed to view it.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="-mt-1 -mr-1 rounded-lg px-2 py-1 text-[0.78rem] font-medium hover:opacity-70"
              style={{ color: template.colors.muted }}
            >
              Done
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <label className="sr-only" htmlFor="share-url">
              Shareable link
            </label>
            <input
              id="share-url"
              ref={linkInput}
              readOnly
              value={shareUrl}
              onFocus={(event) => event.currentTarget.select()}
              className="digits min-w-0 flex-1 rounded-lg border px-2.5 py-2 text-[0.8rem]"
              style={{
                borderColor: `color-mix(in srgb, ${template.colors.fg} 18%, transparent)`,
                background: `color-mix(in srgb, ${template.colors.bg} 70%, transparent)`,
                color: template.colors.fg,
              }}
            />
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-transform duration-200 active:scale-[0.98]"
              style={{ background: template.colors.primary, color: template.colors.onPrimary }}
            >
              {copied ? (
                <Check size={15} strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <Copy size={15} aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <nav
        className="absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-center justify-center gap-2 border-t px-4 py-3 backdrop-blur-md"
        style={{ ...chrome, paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        aria-label="Share this countdown"
      >
        {canNativeShare ? (
          <BarButton onClick={nativeShare} template={template} icon={<Share2 size={15} />}>
            Share
          </BarButton>
        ) : (
          <BarButton
            onClick={copyLink}
            template={template}
            icon={copied ? <Check size={15} strokeWidth={2.5} /> : <Link2 size={15} />}
          >
            {copied ? "Copied" : "Copy link"}
          </BarButton>
        )}

        <BarButton onClick={saveImage} template={template} icon={<ImageDown size={15} />} disabled={busy === "image"}>
          {busy === "image" ? "Saving…" : "Save image"}
        </BarButton>

        <BarButton onClick={saveCalendar} template={template} icon={<CalendarPlus size={15} />}>
          Add to calendar
        </BarButton>

        {isOwner && (
          <Link
            href={`/c/${countdown.slug}/edit`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-opacity duration-200 hover:opacity-75"
            style={{
              borderColor: `color-mix(in srgb, ${template.colors.fg} 18%, transparent)`,
              color: template.colors.fg,
            }}
          >
            <Pencil size={15} aria-hidden="true" />
            Edit
          </Link>
        )}
      </nav>

      <div aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard." : ""}
      </div>

      {toast && (
        <div
          className="animate-rise absolute bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-lg border px-3.5 py-2 text-sm shadow-md backdrop-blur-md"
          style={chrome}
          role="status"
        >
          {toast}
        </div>
      )}
    </>
  );
}

function BarButton({
  onClick,
  icon,
  children,
  template,
  disabled,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  template: Template;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-opacity duration-200 hover:opacity-75 disabled:pointer-events-none disabled:opacity-45"
      style={{
        borderColor: `color-mix(in srgb, ${template.colors.fg} 18%, transparent)`,
        color: template.colors.fg,
      }}
    >
      <span aria-hidden="true" className="flex items-center">
        {icon}
      </span>
      {children}
    </button>
  );
}
