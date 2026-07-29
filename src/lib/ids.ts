import { randomBytes } from "node:crypto";

/** Crockford-ish alphabet: no I, L, O, U, so slugs survive being read aloud. */
const SLUG_ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";
const SLUG_LENGTH = 7;

export function makeSlug(): string {
  const bytes = randomBytes(SLUG_LENGTH);
  let slug = "";
  for (let i = 0; i < SLUG_LENGTH; i++) {
    slug += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  }
  return slug;
}

export function isSlugShaped(value: string): boolean {
  return new RegExp(`^[${SLUG_ALPHABET}]{${SLUG_LENGTH}}$`).test(value);
}

/**
 * The secret that lets the creator edit later. Held in the creator's
 * localStorage — there are no accounts, so this is the only proof of ownership.
 */
export function makeEditToken(): string {
  return randomBytes(24).toString("base64url");
}
