"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { EventCalendarSheet } from "./EventCalendarSheet";
import { CalendarIcon } from "@/components/ui/icons";
import { springSnappy } from "@/animations/springs";

export function EventCalendarFab() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setSheetOpen(true)}
        whileTap={{ scale: 0.92 }}
        transition={springSnappy}
        aria-label="Ver calendario de eventos"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+20px)] left-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-glass-lg"
      >
        <CalendarIcon className="h-6 w-6" />
      </motion.button>

      <EventCalendarSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
