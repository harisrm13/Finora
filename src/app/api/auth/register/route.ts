import { NextResponse } from "next/server";
import { findUserByEmail, createUser, seedUserData } from "@/lib/db";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, full_name } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanName = (full_name || "").trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Kata sandi minimal 6 karakter." },
        { status: 400 }
      );
    }
    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json(
        { error: "Nama lengkap wajib diisi minimal 2 karakter." },
        { status: 400 }
      );
    }

    const existing = findUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan masuk menggunakan email ini." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userId = createUser({
      email: cleanEmail,
      password_hash: passwordHash,
      full_name: cleanName,
    });

    // Seed default categories, accounts, and daily limit for the new user
    seedUserData(userId);

    const token = await createSessionToken({ userId, email: cleanEmail });
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: userId, email: cleanEmail, full_name: cleanName },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Terjadi kesalahan saat registrasi: " + (err as Error).message },
      { status: 500 }
    );
  }
}

