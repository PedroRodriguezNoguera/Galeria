"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLogoTapCounter } from "@/hooks/useLogoTapCounter";
import { useActiveEventTheme } from "@/hooks/useActiveEventTheme";
import { useConfettiWave } from "@/hooks/useConfettiWave";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { fadeTransition } from "@/animations/springs";
import { ConfettiCanvas } from "./ConfettiCanvas";
import { HeaderRunEvent } from "./HeaderRunEvent";
import { HeaderPartyVanEvent } from "./HeaderPartyVanEvent";
import { HeaderCharangaEvent } from "./HeaderCharangaEvent";
import { HeaderDiscoStageEvent } from "./HeaderDiscoStageEvent";
import { HeaderCrateReleaseEvent } from "./HeaderCrateReleaseEvent";
import { HeaderCenaPatronalEvent } from "./HeaderCenaPatronalEvent";
import { HeaderChupinazoEvent } from "./HeaderChupinazoEvent";
import { HeaderEncierroEvent } from "./HeaderEncierroEvent";
import { Logo } from "./Logo";

interface HeaderProps {
  bingoEnabled?: boolean;
}

// Más lenta y suave que springPop (pensada para reacciones rápidas): el
// cambio de texto de la cabecera no es algo a lo que reaccionar al instante,
// así que se saborea un poco más.
const HEADER_TEXT_TRANSITION = { type: "spring", stiffness: 110, damping: 16, mass: 1.4 } as const;

export function Header({ bingoEnabled = false }: HeaderProps) {
  const router = useRouter();
  const activeTheme = useActiveEventTheme();
  const confettiWaving = useConfettiWave(activeTheme);
  const prefersReducedMotion = usePrefersReducedMotion();

  const unlockAdmin = useCallback(() => {
    router.push("/admin/login");
  }, [router]);

  const registerTap = useLogoTapCounter(unlockAdmin);

  return (
    // `fixed`, no `sticky`: en varios navegadores/entornos `position: sticky`
    // dejaba de pegarse al hacer scroll (el header se iba con el contenido).
    // `fixed` no depende del contexto de scroll de ningún ancestro, así que
    // no se puede romper igual. El `<main>` compensa con padding-top.
    <header className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <GlassPanel
        elevation="sm"
        className="relative flex w-full max-w-2xl items-center overflow-hidden rounded-glass-pill px-4 py-2.5 lg:max-w-4xl xl:max-w-5xl"
      >
        {/* Confeti recortado a la propia forma (píldora) de la cabecera. */}
        <ConfettiCanvas
          className="pointer-events-none absolute inset-0 h-full w-full"
          intense={confettiWaving}
        />

        {/* Toro persiguiendo a una persona: por delante del confeti, por detrás del logo/texto. */}
        <HeaderRunEvent activeTheme={activeTheme} />

        {/* Furgoneta DJ cruzando la cabecera: mismo hueco visual que el toro. */}
        <HeaderPartyVanEvent activeTheme={activeTheme} />

        {/* Charanga cruzando la cabecera: mismo hueco visual que el toro y la furgoneta. */}
        <HeaderCharangaEvent activeTheme={activeTheme} />

        {/* Escenario de discomóvil: no cruza, se monta por partes en el centro. */}
        <HeaderDiscoStageEvent activeTheme={activeTheme} />

        {/* Desencajonada de toro: mismo hueco visual que el resto de temas de cruce. */}
        <HeaderCrateReleaseEvent activeTheme={activeTheme} />

        {/* Cena patronal: vajilla cayendo en el primer tercio, no cruza. */}
        <HeaderCenaPatronalEvent activeTheme={activeTheme} />

        {/* Chupinazo: fuente + balcón fijos, el cohete sí cruza hasta el texto. */}
        <HeaderChupinazoEvent activeTheme={activeTheme} />

        {/* Encierro: manada de toros+cabestro pegada a los mozos, cruzando entre vallas. */}
        <HeaderEncierroEvent activeTheme={activeTheme} />

        {/* Logo: 7 toques consecutivos abren el acceso de administrador. Sin ninguna pista visible. */}
        <button
          type="button"
          onClick={registerTap}
          className="relative z-10 h-12 w-12 shrink-0"
          aria-label="Logo"
        >
          <Logo />
        </button>

        {/* Texto de cabecera: placeholder a sustituir por el usuario más adelante.
            AnimatePresence + key por texto: al activar/desactivar el bingo, el
            saliente y el entrante se cruzan (uno sube y se desvanece, el otro
            entra desde abajo) en vez de cambiar de golpe. */}
        <div className="relative z-10 ml-auto overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p
              key={bingoEnabled ? "bingo" : "fiestas"}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.9 }}
              transition={prefersReducedMotion ? fadeTransition : HEADER_TEXT_TRANSITION}
              className="whitespace-nowrap text-xl font-extrabold tracking-tight leading-tight"
            >
              {bingoEnabled ? "¡Bingo en directo!" : "¡Felices Fiestas!"}
            </motion.p>
          </AnimatePresence>
        </div>
      </GlassPanel>
    </header>
  );
}
