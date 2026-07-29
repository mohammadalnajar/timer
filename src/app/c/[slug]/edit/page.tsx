import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Composer } from "@/components/Composer";
import { getCountdown } from "@/lib/store";
import { isSlugShaped } from "@/lib/ids";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit countdown — Soon",
  robots: { index: false },
};

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const countdown = isSlugShaped(slug) ? getCountdown(slug) : null;

  if (!countdown) notFound();

  return <Composer existing={countdown} />;
}
