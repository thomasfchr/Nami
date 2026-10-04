"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") router.back();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm sm:flex sm:items-center sm:justify-center sm:p-6">
      <button
        type="button"
        aria-label="Fermer"
        onClick={() => router.back()}
        className="fixed inset-0 z-0 cursor-default sm:absolute"
      />

      <div className="relative z-10 min-h-dvh w-full bg-background sm:min-h-0 sm:max-h-[90vh] sm:max-w-3xl sm:overflow-y-auto sm:rounded-xl sm:shadow-2xl">
        <button
          type="button"
          aria-label="Fermer"
          onClick={() => router.back()}
          className="absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-surface-elevated"
        >
          <X className="size-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
