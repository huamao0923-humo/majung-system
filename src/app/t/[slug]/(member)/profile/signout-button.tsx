"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useParams } from "next/navigation";

export default function SignOutButton() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  return (
    <Button
      variant="outline"
      className="w-full rounded-xl h-12 text-red-600 border-red-200 hover:bg-red-50"
      onClick={() => signOut({ callbackUrl: `/t/${slug}/login` })}
    >
      <LogOut className="w-4 h-4 mr-2" />
      登出
    </Button>
  );
}
