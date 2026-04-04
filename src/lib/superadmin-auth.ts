import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "superadmin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}
