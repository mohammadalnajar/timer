import { NextResponse } from "next/server";
import { createCountdown } from "@/lib/store";
import { validateInput } from "@/lib/types";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }

  const parsed = validateInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { countdown, editToken } = createCountdown(parsed.value);
  return NextResponse.json({ countdown, editToken }, { status: 201 });
}
