import {
  Inter,
  Great_Vibes,
  Cormorant_Infant,
  Exo,
  Roboto_Mono,
  Lexend,
  Source_Sans_3,
  Outfit,
  Fredoka,
  Nunito,
} from "next/font/google";

/**
 * next/font resolves these at build time by statically reading the call
 * arguments, so every option has to be written out as a literal — no shared
 * options object, no spreads.
 *
 * Only Inter is preloaded. Every other family belongs to a single template, so
 * we let CSS pull it in on demand rather than shipping ten font files to
 * everyone who opens the composer.
 */

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const greatVibes = Great_Vibes({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "400",
  variable: "--font-great-vibes",
});

export const cormorant = Cormorant_Infant({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: ["300", "400", "600", "700"],
  variable: "--font-cormorant",
});

export const exo = Exo({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-exo",
});

export const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-roboto-mono",
});

export const lexend = Lexend({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-lexend",
});

export const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-source-sans",
});

export const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-outfit",
});

export const fredoka = Fredoka({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-fredoka",
});

export const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-nunito",
});

/** Every font variable, applied once on <html> so any template can reference them. */
export const fontVariables = [
  inter.variable,
  greatVibes.variable,
  cormorant.variable,
  exo.variable,
  robotoMono.variable,
  lexend.variable,
  sourceSans.variable,
  outfit.variable,
  fredoka.variable,
  nunito.variable,
].join(" ");
