"use client";

import { motion } from "framer-motion";
import { ConfettiCanvas } from "@/components/layout/ConfettiCanvas";

/** Cuando un evento está en curso: confeti cayendo de fondo, igual que en la cabecera. */
export function ActiveEventConfetti() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-glass-md">
      <motion.div
        className="absolute inset-0 h-full w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <ConfettiCanvas className="h-full w-full" />
      </motion.div>
    </div>
  );
}
