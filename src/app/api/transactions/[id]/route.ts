import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTransactionById, updateTransaction, deleteTransaction } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tx = await getTransactionById(user.id, parseInt(id, 10));
  if (!tx) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });

  return NextResponse.json(tx);
}

export async function PUT(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const result = await updateTransaction(user.id, parseInt(id, 10), body);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Gagal memperbarui transaksi" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const success = await deleteTransaction(user.id, parseInt(id, 10));
  if (!success) {
    return NextResponse.json({ error: "Gagal menghapus transaksi" }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
