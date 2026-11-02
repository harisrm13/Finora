import { NextResponse } from "next/server";
import { findUserByEmail, createUser, seedUserData } from "@/lib/db";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, full_name } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Kata sandi minimal 6 karakter." },
        { status: 400 }
      );
    }
    if (!full_name || full_name.trim().length < 2) {
      return NextResponse.json(
        { error: "Nama lengkap wajib diisi minimal 2 karakter." },
        { status: 400 }
      );
    }

    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan login." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userId = createUser({
      email,
      password_hash: passwordHash,
      full_name,
    });

    // Seed default categories, default accounts, and default daily limit
    seedUserData(userId);

    const token = await createSessionToken({ userId, email });
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: userId, email, full_name },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Terjadi kesalahan saat registrasi: " + (err as Error).message },
      { status: 500 }
    );
  }
}
