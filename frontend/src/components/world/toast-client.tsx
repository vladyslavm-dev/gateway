"use client";

import { Toaster } from "sonner";

export function ToastClient() {
  return (
    <Toaster
      position="top-center"
      theme="light"
      duration={3000}
      closeButton
      style={{ "--width": "260px" } as React.CSSProperties}
      toastOptions={{
        classNames: {
          toast:
            "font-mono text-[10px] uppercase tracking-[0.22em] !min-h-0",
          title: "leading-none",
          closeButton: "!bg-white/40 !border-cyan-100/40 !text-slate-700",
        },
        style: {
          background: [
            "linear-gradient(180deg, rgba(255, 255, 255, 0.40) 0%, rgba(255, 255, 255, 0.18) 60%, rgba(220, 240, 248, 0.22) 100%)",
            "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(255, 255, 255, 0.32) 0%, transparent 80%)",
          ].join(", "),
          border: "1px solid rgba(232, 246, 252, 0.55)",
          boxShadow:
            "0 4px 14px rgba(20, 50, 70, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.65), inset 0 -1px 0 rgba(120, 180, 200, 0.22)",
          backdropFilter: "blur(8px) saturate(115%)",
          WebkitBackdropFilter: "blur(8px) saturate(115%)",
          borderRadius: "9999px",
          color: "rgba(20, 40, 56, 0.92)",
          fontFamily: "var(--font-mono, ui-monospace)",
          fontSize: "10px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          padding: "10px 18px",
          width: "max-content",
          maxWidth: "min(92vw, 420px)",
        },
      }}
    />
  );
}
