"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/layout/Logo";
import { AdminLoginForm } from "./AdminLoginForm";
import { springGentle } from "@/animations/springs";

export function AdminLoginScreen() {
  const router = useRouter();
  // El formulario no se monta hasta que el logo termina su propia animación
  // de entrada: así aparece primero el logo y luego el login, no a la vez.
  const [showForm, setShowForm] = useState(false);

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 0.65, scale: 1 }}
        transition={springGentle}
        onAnimationComplete={() => setShowForm(true)}
        className="pointer-events-none absolute h-56 w-56 select-none"
      >
        <Logo />
      </motion.div>

      {showForm ? (
        <AdminLoginForm onDone={() => router.push("/admin/dashboard")} />
      ) : null}
    </main>
  );
}
