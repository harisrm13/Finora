import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFinancialReport } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");

  const startDate = searchParams.get("startDate") || `${y}-${m}-01`;
  const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0];
  const categoryId = searchParams.get("categoryId") ? parseInt(searchParams.get("categoryId")!, 10) : undefined;
  const accountId = searchParams.get("accountId") ? parseInt(searchParams.get("accountId")!, 10) : undefined;

  const report = getFinancialReport(user.id, {
    startDate,
    endDate,
    categoryId,
    accountId,
  });

  return NextResponse.json(report);
}
