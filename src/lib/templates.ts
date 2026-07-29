/**
 * A template is a complete swap of palette, type, motif and tone.
 *
 * Colours start from the ui-ux-pro-max palette database, then several were
 * darkened because `primary` carries the small eyebrow text and the Copy button
 * label — the database's display-weight values landed in the 3.3–4.2 range
 * there. Measured against the rendered output, every template now clears
 * WCAG AA 4.5:1 for `fg`/`bg`, `muted`/`bg`, `primary`/`bg` and
 * `onPrimary`/`primary`.
 */

export const TEMPLATE_IDS = [
  "romantic",
  "tech",
  "education",
  "travel",
  "celebration",
  "minimal",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const DEFAULT_TEMPLATE: TemplateId = "minimal";

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && (TEMPLATE_IDS as readonly string[]).includes(value);
}

export interface Template {
  id: TemplateId;
  /** Shown in the picker. */
  name: string;
  /** One line of personality, shown under the name. */
  blurb: string;
  colors: {
    bg: string;
    /** Second stop for the background wash. */
    bgAlt: string;
    fg: string;
    muted: string;
    primary: string;
    onPrimary: string;
    accent: string;
    border: string;
  };
  fonts: {
    /** The event title. */
    display: string;
    /** Labels and body copy. */
    body: string;
    /** The big numbers. Must have tabular figures. */
    digits: string;
  };
  type: {
    /** Title tracking, e.g. "-0.02em". */
    titleTracking: string;
    digitWeight: number;
    digitTracking: string;
    /** Uppercase the small unit labels (DAYS / HOURS). */
    uppercaseLabels: boolean;
    labelTracking: string;
  };
  /** Phrasing for the three lifecycle states. */
  tone: {
    until: string;
    arrived: string;
    since: string;
  };
  /** Three colours for the picker swatch. */
  swatch: [string, string, string];
}

export const TEMPLATES: Record<TemplateId, Template> = {
  romantic: {
    id: "romantic",
    name: "Romantic",
    blurb: "Script title, warm light, gold accents",
    colors: {
      bg: "#FDF2F8",
      bgAlt: "#FCE7F3",
      fg: "#831843",
      muted: "#9D5178",
      primary: "#BE185D",
      onPrimary: "#FFFFFF",
      accent: "#A16207",
      border: "#FBCFE8",
    },
    fonts: {
      display: "var(--font-great-vibes), cursive",
      body: "var(--font-cormorant), Georgia, serif",
      digits: "var(--font-cormorant), Georgia, serif",
    },
    type: {
      titleTracking: "0.01em",
      digitWeight: 300,
      digitTracking: "-0.02em",
      uppercaseLabels: true,
      labelTracking: "0.22em",
    },
    tone: {
      until: "until",
      arrived: "Today is the day",
      since: "since",
    },
    swatch: ["#BE185D", "#FBCFE8", "#A16207"],
  },

  tech: {
    id: "tech",
    name: "Tech",
    blurb: "Dark, monospaced, launch-pad calm",
    colors: {
      bg: "#0B0B10",
      bgAlt: "#12121B",
      fg: "#F8FAFC",
      muted: "#94A3B8",
      primary: "#3B82F6",
      // Dark-on-blue: white would only reach 3.7:1 against this fill.
      onPrimary: "#08111F",
      accent: "#22D3EE",
      border: "#1E293B",
    },
    fonts: {
      display: "var(--font-exo), system-ui, sans-serif",
      body: "var(--font-roboto-mono), ui-monospace, monospace",
      digits: "var(--font-roboto-mono), ui-monospace, monospace",
    },
    type: {
      titleTracking: "-0.01em",
      digitWeight: 500,
      digitTracking: "-0.04em",
      uppercaseLabels: true,
      labelTracking: "0.28em",
    },
    tone: {
      until: "T-minus to",
      arrived: "Liftoff",
      since: "elapsed since",
    },
    swatch: ["#3B82F6", "#0B0B10", "#22D3EE"],
  },

  education: {
    id: "education",
    name: "Education",
    blurb: "Teal and amber, paper-clean, focused",
    colors: {
      bg: "#F0FDFA",
      bgAlt: "#E2F7F3",
      fg: "#134E4A",
      muted: "#41706A",
      primary: "#0F766E",
      onPrimary: "#FFFFFF",
      accent: "#B45309",
      border: "#A7F3E4",
    },
    fonts: {
      display: "var(--font-lexend), system-ui, sans-serif",
      body: "var(--font-source-sans), system-ui, sans-serif",
      digits: "var(--font-lexend), system-ui, sans-serif",
    },
    type: {
      titleTracking: "-0.02em",
      digitWeight: 600,
      digitTracking: "-0.04em",
      uppercaseLabels: true,
      labelTracking: "0.16em",
    },
    tone: {
      until: "until",
      arrived: "It starts now",
      since: "since",
    },
    swatch: ["#0F766E", "#A7F3E4", "#B45309"],
  },

  travel: {
    id: "travel",
    name: "Travel",
    blurb: "Sky gradient, horizon line, geometric",
    colors: {
      bg: "#F0F9FF",
      bgAlt: "#D8EEFD",
      fg: "#0C4A6E",
      muted: "#31607C",
      primary: "#0369A1",
      onPrimary: "#FFFFFF",
      accent: "#C2410C",
      border: "#BAE6FD",
    },
    fonts: {
      display: "var(--font-outfit), system-ui, sans-serif",
      body: "var(--font-outfit), system-ui, sans-serif",
      digits: "var(--font-outfit), system-ui, sans-serif",
    },
    type: {
      titleTracking: "-0.03em",
      digitWeight: 700,
      digitTracking: "-0.05em",
      uppercaseLabels: true,
      labelTracking: "0.2em",
    },
    tone: {
      until: "until",
      arrived: "Wheels up",
      since: "since",
    },
    swatch: ["#0369A1", "#BAE6FD", "#C2410C"],
  },

  celebration: {
    id: "celebration",
    name: "Celebration",
    blurb: "Vibrant blocks, rounded type, confetti",
    colors: {
      bg: "#FFF7ED",
      bgAlt: "#FFEDD5",
      fg: "#7C2D12",
      muted: "#A9552B",
      primary: "#C2410C",
      onPrimary: "#FFFFFF",
      accent: "#1D4ED8",
      border: "#FED7AA",
    },
    fonts: {
      display: "var(--font-fredoka), system-ui, sans-serif",
      body: "var(--font-nunito), system-ui, sans-serif",
      digits: "var(--font-fredoka), system-ui, sans-serif",
    },
    type: {
      titleTracking: "-0.01em",
      digitWeight: 600,
      digitTracking: "-0.02em",
      uppercaseLabels: true,
      labelTracking: "0.14em",
    },
    tone: {
      until: "until",
      arrived: "It's here",
      since: "since",
    },
    swatch: ["#C2410C", "#FED7AA", "#1D4ED8"],
  },

  minimal: {
    id: "minimal",
    name: "Minimal",
    blurb: "Nothing but very large numbers",
    colors: {
      bg: "#FAFAF9",
      bgAlt: "#F4F4F2",
      fg: "#18181B",
      muted: "#71717A",
      primary: "#18181B",
      onPrimary: "#FFFFFF",
      accent: "#18181B",
      border: "#E4E4E7",
    },
    fonts: {
      display: "var(--font-inter), system-ui, sans-serif",
      body: "var(--font-inter), system-ui, sans-serif",
      digits: "var(--font-inter), system-ui, sans-serif",
    },
    type: {
      titleTracking: "-0.03em",
      digitWeight: 500,
      digitTracking: "-0.055em",
      uppercaseLabels: true,
      labelTracking: "0.18em",
    },
    tone: {
      until: "until",
      arrived: "Now",
      since: "since",
    },
    swatch: ["#18181B", "#E4E4E7", "#71717A"],
  },
};

export function getTemplate(id: string | null | undefined): Template {
  return isTemplateId(id) ? TEMPLATES[id] : TEMPLATES[DEFAULT_TEMPLATE];
}

export const TEMPLATE_LIST: Template[] = TEMPLATE_IDS.map((id) => TEMPLATES[id]);

/** Template colours and type as CSS custom properties, for inline `style`. */
export function templateStyle(t: Template): React.CSSProperties {
  return {
    "--bg": t.colors.bg,
    "--bg-alt": t.colors.bgAlt,
    "--fg": t.colors.fg,
    "--muted": t.colors.muted,
    "--primary": t.colors.primary,
    "--on-primary": t.colors.onPrimary,
    "--accent": t.colors.accent,
    "--border": t.colors.border,
    "--font-display": t.fonts.display,
    "--font-body": t.fonts.body,
    "--font-digits": t.fonts.digits,
    "--title-tracking": t.type.titleTracking,
    "--digit-weight": String(t.type.digitWeight),
    "--digit-tracking": t.type.digitTracking,
    "--label-tracking": t.type.labelTracking,
  } as React.CSSProperties;
}
