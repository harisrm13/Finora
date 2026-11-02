import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserCategories, createCategory } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as "income" | "expense" | undefined;

  const categories = getUserCategories(user.id, type);
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.name || !body.type) {
      return NextResponse.json({ error: "Nama dan tipe kategori wajib diisi." }, { status: 400 });
    }
    const id = createCategory(user.id, body);
    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
