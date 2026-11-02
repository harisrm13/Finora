import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTransactions, createTransaction } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "15", 10);
  const type = searchParams.get("type") || undefined;
  const categoryId = searchParams.get("categoryId") ? parseInt(searchParams.get("categoryId")!, 10) : undefined;
  const accountId = searchParams.get("accountId") ? parseInt(searchParams.get("accountId")!, 10) : undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const search = searchParams.get("search") || undefined;
  const sort = (searchParams.get("sort") === "asc" ? "asc" : "desc") as "asc" | "desc";

  const result = getTransactions(user.id, {
    page,
    limit,
    type,
    categoryId,
    accountId,
    startDate,
    endDate,
    search,
    sort,
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = createTransaction(user.id, body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, transactionId: result.transactionId });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Gagal membuat transaksi: " + (err as Error).message },
      { status: 500 }
    );
  }
}
