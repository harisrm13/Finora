import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBudgets, setBudget, deleteBudget } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!, 10) : now.getMonth() + 1;
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : now.getFullYear();

  const budgets = await getBudgets(user.id, month, year);
  return NextResponse.json(budgets);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { categoryId, month, year, amount } = body;

    if (!categoryId || !month || !year || !amount || amount <= 0) {
      return NextResponse.json({ error: "Data anggaran tidak valid." }, { status: 400 });
    }

    const success = await setBudget(user.id, {
      categoryId: parseInt(categoryId, 10),
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      amount: parseFloat(amount),
    });

    return NextResponse.json({ success });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID anggaran wajib ada" }, { status: 400 });

  const success = await deleteBudget(user.id, parseInt(id, 10));
  return NextResponse.json({ success });
}
