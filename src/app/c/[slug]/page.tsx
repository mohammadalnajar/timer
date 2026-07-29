import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CountdownScreen } from "@/components/CountdownScreen";
import { getCountdown } from "@/lib/store";
import { isSlugShaped } from "@/lib/ids";
import { remainingFrom } from "@/lib/time";

// Countdowns are editable, so never serve a cached copy.
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function load(slug: string) {
  if (!isSlugShaped(slug)) return null;
  return getCountdown(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const countdown = load(slug);

  if (!countdown) {
    return { title: "Countdown not found — Soon" };
  }

  const remaining = remainingFrom(countdown.targetMs, Date.now());
  const description = remaining.past
    ? `${remaining.days} days since ${countdown.title}.`
    : `${remaining.days} days to go.`;

  return {
    title: `${countdown.title} — Soon`,
    description: countdown.message ?? description,
    openGraph: {
      title: countdown.title,
      description: countdown.message ?? description,
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function CountdownPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const countdown = load(slug);

  if (!countdown) notFound();

  return (
    <CountdownScreen
      countdown={countdown}
      initialNowMs={Date.now()}
      justCreated={query.new === "1"}
    />
  );
}
