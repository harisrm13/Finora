import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteAllowancePlan } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const success = deleteAllowancePlan(user.id, parseInt(id, 10));
  return NextResponse.json({ success });
}
