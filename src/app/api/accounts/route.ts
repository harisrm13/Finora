import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccounts, createAccount } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accounts = await getUserAccounts(user.id);
  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.name || !body.type) {
      return NextResponse.json({ error: "Nama dan jenis akun wajib diisi." }, { status: 400 });
    }
    const id = await createAccount(user.id, body);
    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
