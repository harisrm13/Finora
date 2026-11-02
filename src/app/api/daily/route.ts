import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDailyExpenseStats, updateDailyLimit } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || undefined;

  const stats = getDailyExpenseStats(user.id, date);
  return NextResponse.json(stats);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const amount = parseFloat(body.amount);
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    if (isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: "Nominal batas harian tidak valid." }, { status: 400 });
    }

    const success = updateDailyLimit(user.id, amount, isActive);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
