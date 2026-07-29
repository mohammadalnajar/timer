# Soon

A single-page countdown you can share. Pick a date, pick a look, get a short link.

```bash
npm install && npm run dev
```

No database setup, no environment variables, no accounts. It runs immediately.

## How it works

Three routes, one idea:

| Route | What it is |
|---|---|
| `/` | Compose. Neutral UI on the left, a live themed preview on the right. |
| `/c/[slug]` | The countdown. Full-bleed, themed, what the recipient sees. |
| `/c/[slug]/edit` | Same composer, prefilled. Only reachable if you hold the edit token. |

### Ownership without accounts

Creating a countdown returns a public `slug` and a secret `editToken`. The token
is stored in the creator's browser (`localStorage`, see [mine.ts](src/lib/mine.ts))
and is the only thing that authorises a `PATCH`. Anyone with the link can view;
only the browser that created it sees an **Edit** button.

Clearing browser data means losing the ability to edit — the countdown itself is
unaffected. That is the trade for having no sign-up.

### Time is stored as one UTC instant

`targetMs` is a single instant, so two people in different timezones count down
to the same moment. The creator's IANA zone is stored separately and used *only*
to render the date label, because that is the calendar date they meant. See
[time.ts](src/lib/time.ts).

### Lifecycle

A countdown has three states, and the copy for each comes from the template:

1. **Counting down** — four columns: days, hours, minutes, seconds.
2. **Arrived** — for one hour after the target, a large "it's here" line plus a
   one-shot confetti fall. `CELEBRATION_MS` in [time.ts](src/lib/time.ts).
3. **Counting up** — one calm number and "days ago". Past dates are valid input,
   which makes the same app work for anniversaries and "days since".

Crossing into a new phase (100d / 30d / 7d / 1d / 1h) fires a single pulse. No
timers are scheduled for this — it falls out of comparing a derived key each tick.

## Templates

Six, in [templates.ts](src/lib/templates.ts). Each one swaps palette, font
pairing, background motif and tone of voice together.

| Template | Type | Voice |
|---|---|---|
| Romantic | Great Vibes / Cormorant Infant | "until" |
| Tech | Exo / Roboto Mono | "T-minus to" |
| Education | Lexend / Source Sans 3 | "until" |
| Travel | Outfit | "until" / "Wheels up" |
| Celebration | Fredoka / Nunito | "It's here" |
| Minimal | Inter | "until" |

The composer UI stays neutral on purpose. If the shell has an opinion, every
template preview fights it.

Motifs are pure CSS gradients and masks — nothing to download, nothing to shift
the layout. Only Inter is preloaded; the other nine families set `preload: false`
so a visitor downloads a template's fonts only if they actually see it.

### Adding a template

Add an entry to `TEMPLATES`, add a `.motif-<id>` rule in
[globals.css](src/app/globals.css) if it needs a backdrop, and register any new
font in [fonts.ts](src/lib/fonts.ts). `TemplateId` is derived from `TEMPLATE_IDS`,
so TypeScript will point at anything left to update.

Keep the palette above WCAG AA. Several of the starting palettes had to be
darkened: `primary` carries small eyebrow text and the Copy button label, where
display-weight colours landed around 3.3–4.2:1. All 24 pairs across the six
templates were measured against rendered output and clear 4.5:1.

## Sharing

- **Copy link / native share** — Web Share API where available, clipboard
  otherwise, with a select-the-text fallback for insecure contexts.
- **Save image** — a 1080×1920 story card drawn on a canvas in
  [story-image.ts](src/lib/story-image.ts). Hand-drawn rather than
  DOM-rasterised: no extra dependency, no cross-origin font problems, and a
  layout tuned for a phone rather than a squashed web page. Font families are
  read back off the live DOM because `next/font` obfuscates their names.
- **Add to calendar** — a `.ics` written by hand in [ics.ts](src/lib/ics.ts).
  Correct CRLF endings and 75-octet line folding; all-day events emit
  `VALUE=DATE`.
- **Link previews** — `/c/[slug]/opengraph-image` renders a per-countdown card
  via `next/og`. Satori has no `radial-gradient`, so structure comes from
  straight-edged panels. It uses the default font rather than the template's;
  wiring real fonts in means shipping font binaries to the renderer.

## Deploying

**The one thing to change.** Storage is SQLite via `better-sqlite3`, which is
perfect locally and on any host with a persistent disk (a VPS, Docker, Fly,
Railway) but **will not work on Vercel or other serverless platforms** — the
filesystem is ephemeral, so countdowns would vanish between requests.

Every query lives in [store.ts](src/lib/store.ts) behind four functions:

```
createCountdown(input) -> { countdown, editToken }
getCountdown(slug)     -> Countdown | null
updateCountdown(slug, editToken, input) -> Countdown | null | "forbidden"
```

Swap that one file for Postgres (Neon, Supabase) or a KV store and nothing else
in the app changes. `SOON_DB_PATH` overrides the SQLite location.

Set `SOON_SITE_URL` to your real origin so OG image URLs resolve absolutely
(see [.env.example](.env.example)).

## Deliberately not included

No accounts, no email or push reminders, no view counters, no photo uploads, no
comments. Each one needs infrastructure or clutters the thirty seconds that
matter, which are: type a title, pick a look, send the link.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · better-sqlite3 ·
lucide-react. No state library and no router config — the URL is the state.
