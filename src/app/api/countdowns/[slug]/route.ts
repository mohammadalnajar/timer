import { NextResponse } from "next/server";
import { getCountdown, updateCountdown } from "@/lib/store";
import { isSlugShaped } from "@/lib/ids";
import { validateInput } from "@/lib/types";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  if (!isSlugShaped(slug)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const countdown = getCountdown(slug);
  if (!countdown) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ countdown });
}

export async function PATCH(request: Request, { params }: Params) {
  const { slug } = await params;
  if (!isSlugShaped(slug)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const editToken = request.headers.get("x-edit-token");
  if (!editToken) {
    return NextResponse.json({ error: "Missing edit token." }, { status: 401 });
  }

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

  const result = updateCountdown(slug, editToken, parsed.value);
  if (result === null) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (result === "forbidden") {
    return NextResponse.json({ error: "That edit link is not valid." }, { status: 403 });
  }

  return NextResponse.json({ countdown: result });
}
