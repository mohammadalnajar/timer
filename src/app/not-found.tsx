import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p
        className="digits text-6xl"
        style={{ color: "var(--shell-line-strong)" }}
        aria-hidden="true"
      >
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]" style={{ color: "var(--shell-ink)" }}>
        This countdown isn&apos;t here
      </h1>
      <p className="text-[0.95rem]" style={{ color: "var(--shell-muted)" }}>
        The link may have a typo, or it was never created. You can always start a new one.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex min-h-11 items-center rounded-lg px-5 text-sm font-medium"
        style={{ background: "var(--shell-ink)", color: "var(--shell-raised)" }}
      >
        Start a countdown
      </Link>
    </main>
  );
}
