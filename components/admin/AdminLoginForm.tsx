"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { signInAdmin, type SignInState } from "@/lib/actions/adminAuth";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { springGentle } from "@/animations/springs";
import { staggerChildren, scaleFadeIn } from "@/animations/variants";

const initialState: SignInState = {};

interface AdminLoginFormProps {
  /** Se llama cuando termina de animarse la salida (login correcto), nunca antes. */
  onDone: () => void;
}

export function AdminLoginForm({ onDone }: AdminLoginFormProps) {
  const [state, formAction, isPending] = useActionState(signInAdmin, initialState);
  // `state.success` hace que este panel salga del árbol (AnimatePresence anima
  // la salida) y sólo cuando esa animación termina (onExitComplete) se avisa
  // al padre — el logo de detrás se queda visible mientras tanto.
  const isLeaving = Boolean(state.success);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {!isLeaving ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -16 }}
          transition={springGentle}
          className="relative z-10 flex w-full max-w-sm flex-col items-center gap-4"
        >
          {/* Menos blur que el resto de paneles de cristal (backdrop-blur-sm en vez
              de -xl): así se reconoce el logo de fondo en vez de perderse en la niebla. */}
          <GlassPanel
            strong
            elevation="lg"
            className="w-full overflow-hidden p-6 backdrop-blur-sm"
          >
            <motion.div initial="hidden" animate="visible" variants={staggerChildren}>
              <motion.h1 variants={scaleFadeIn} className="mb-1 text-lg font-semibold">
                Acceso
              </motion.h1>
              <motion.p variants={scaleFadeIn} className="mb-5 text-sm text-foreground-muted">
                Sólo para administración.
              </motion.p>

              <form action={formAction} className="flex flex-col gap-3">
                <motion.input
                  variants={scaleFadeIn}
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  autoComplete="username"
                  className="h-11 rounded-glass-md border border-glass-border bg-glass px-4 text-[15px] outline-none"
                />
                <motion.input
                  variants={scaleFadeIn}
                  type="password"
                  name="password"
                  placeholder="Contraseña"
                  required
                  autoComplete="current-password"
                  className="h-11 rounded-glass-md border border-glass-border bg-glass px-4 text-[15px] outline-none"
                />
                {state.error ? (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500"
                  >
                    {state.error}
                  </motion.p>
                ) : null}
                <motion.div variants={scaleFadeIn}>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isPending || isLeaving}
                    className="mt-1 w-full"
                  >
                    {isPending || isLeaving ? "Entrando…" : "Entrar"}
                  </Button>
                </motion.div>
              </form>
            </motion.div>
          </GlassPanel>

          <Link
            href="/"
            className="text-sm font-medium text-foreground-muted transition-opacity hover:opacity-80"
          >
            ← Volver a la galería
          </Link>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
