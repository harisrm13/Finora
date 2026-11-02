import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllowancePlans, createAllowancePlan } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plans = getAllowancePlans(user.id);
  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.name || !body.start_date || !body.end_date || !body.spending_limit) {
      return NextResponse.json({ error: "Data rencana uang saku belum lengkap." }, { status: 400 });
    }

    const id = createAllowancePlan(user.id, body);
    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
