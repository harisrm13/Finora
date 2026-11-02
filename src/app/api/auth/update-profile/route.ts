import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword, comparePassword } from "@/lib/auth";
import { updateUserProfile, updateUserPassword, findUserById } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { full_name, old_password, new_password } = body;

    if (full_name && full_name.trim().length >= 2) {
      updateUserProfile(user.id, { full_name });
    }

    if (new_password) {
      if (new_password.length < 6) {
        return NextResponse.json(
          { error: "Kata sandi baru minimal 6 karakter." },
          { status: 400 }
        );
      }
      // Verify old password
      const fullUser = findUserById(user.id);
      if (!fullUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      // Re-fetch with password_hash
      const { findUserByEmail } = await import("@/lib/db");
      const userWithHash = findUserByEmail(user.email);
      if (!userWithHash) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const isMatch = await comparePassword(old_password || "", userWithHash.password_hash);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Kata sandi lama tidak cocok." },
          { status: 400 }
        );
      }

      const newHash = await hashPassword(new_password);
      updateUserPassword(user.id, newHash);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Gagal memperbarui profil: " + (err as Error).message },
      { status: 500 }
    );
  }
}
