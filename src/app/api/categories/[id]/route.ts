import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateCategory, deleteCategory } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const success = await updateCategory(user.id, parseInt(id, 10), body);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await deleteCategory(user.id, parseInt(id, 10));
  if (!result.success) {
    return NextResponse.json({ error: result.error || "Gagal menghapus kategori" }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
