import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSavingsGoals, createSavingsGoal } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await getSavingsGoals(user.id);
  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.name || !body.target_amount || body.target_amount <= 0) {
      return NextResponse.json({ error: "Nama dan nominal target tabungan wajib valid." }, { status: 400 });
    }

    const id = await createSavingsGoal(user.id, body);
    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
