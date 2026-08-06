"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { signOutAdmin } from "@/lib/actions/adminAuth";
import {
  CalendarIcon,
  GearIcon,
  LogOutIcon,
  PersonIcon,
  PhotoLibraryIcon,
  StarIcon,
  TicketIcon,
} from "@/components/ui/icons";

const LINKS = [
  { href: "/admin/dashboard", label: "Moderación", icon: PhotoLibraryIcon },
  { href: "/admin/destacados", label: "Destacados", icon: StarIcon },
  { href: "/admin/bingo", label: "Bingo", icon: TicketIcon },
  { href: "/admin/people", label: "Personas", icon: PersonIcon },
  { href: "/admin/planificacion", label: "Planificación", icon: CalendarIcon },
  { href: "/admin/ajustes", label: "Ajustes", icon: GearIcon },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1.5">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-1.5 rounded-glass-pill border px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-foreground/25 bg-glass-strong text-foreground"
                : "border-glass-border bg-glass text-foreground-muted",
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}

      <form action={signOutAdmin} className="ml-auto">
        <button
          type="submit"
          aria-label="Cerrar sesión"
          className="flex items-center gap-1.5 rounded-glass-pill px-3 py-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
        >
          <LogOutIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </form>
    </nav>
  );
}
