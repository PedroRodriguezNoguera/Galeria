"use client";

import { signOutAdmin } from "@/lib/actions/adminAuth";
import { Button } from "@/components/ui/Button";

export function AdminDashboardHeader() {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-xl font-semibold">Moderación</h1>
      <form action={signOutAdmin}>
        <Button type="submit" variant="ghost" size="sm">
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}
