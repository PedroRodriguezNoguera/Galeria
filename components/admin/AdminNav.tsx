"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const LINKS = [
  { href: "/admin/dashboard", label: "Moderación" },
  { href: "/admin/destacados", label: "Destacados" },
  { href: "/admin/bingo", label: "Bingo" },
  { href: "/admin/people", label: "Personas" },
  { href: "/admin/planificacion", label: "Planificación" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-4 flex gap-1.5">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-glass-pill border px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-foreground/25 bg-glass-strong text-foreground"
                : "border-glass-border bg-glass text-foreground-muted",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
