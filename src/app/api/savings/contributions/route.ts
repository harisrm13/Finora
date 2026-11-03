import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  addSavingsContribution,
  getSavingsContributions,
  deleteSavingsContribution,
} from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get("goalId") ? parseInt(searchParams.get("goalId")!, 10) : undefined;

  const contributions = await getSavingsContributions(user.id, goalId);
  return NextResponse.json(contributions);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const result = await addSavingsContribution(user.id, body);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Gagal menambah setoran" }, { status: 400 });
    }
    return NextResponse.json({ success: true, id: result.contributionId });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID setoran wajib ada" }, { status: 400 });

  const success = await deleteSavingsContribution(user.id, parseInt(id, 10));
  return NextResponse.json({ success });
}
