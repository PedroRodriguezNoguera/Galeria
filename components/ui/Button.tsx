"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { springSnappy } from "@/animations/springs";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-glass-pill font-medium transition-colors select-none disabled:opacity-40 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-foreground text-background",
        glass: "bg-glass border border-glass-border backdrop-blur-xl text-foreground",
        ghost: "bg-transparent text-foreground hover:bg-glass",
        destructive: "bg-red-500 text-white",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-[15px]",
        lg: "h-14 px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children">,
    VariantProps<typeof buttonStyles> {
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.94 }}
        transition={springSnappy}
        className={cn(buttonStyles({ variant, size }), className)}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);
Button.displayName = "Button";
