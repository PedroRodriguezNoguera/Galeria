import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  className?: string;
}

/**
 * La galería siempre se ve en modo claro (ver app/globals.css), así que el
 * logo sólo necesita su variante negra. El contenedor del que cuelga debe
 * ser `relative` y tener tamaño propio (usa `fill` por debajo).
 */
export function Logo({ className }: LogoProps) {
  return <Image src="/logo.png" alt="" fill priority className={cn("object-contain", className)} />;
}
