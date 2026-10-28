"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id: string;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/favoritos"
        className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
      >
        Favoritos
      </Link>
      <Link
        href="/perfil"
        className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
      >
        {user.name?.split(" ")[0] ?? "Perfil"}
      </Link>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-xs"
      >
        Sair
      </Button>
    </div>
  );
}
