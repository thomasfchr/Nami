"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX = 5;
const STEP = 0.5;

function clampToStep(raw: number) {
  const stepped = Math.round(raw / STEP) * STEP;
  return Math.min(Math.max(stepped, STEP), MAX);
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 22,
  className,
}: {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const displayValue = hoverValue ?? value;

  function valueFromClientX(clientX: number) {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return clampToStep(ratio * MAX);
  }

  function commit(next: number) {
    onChange?.(next);
  }

  useEffect(() => {
    if (!dragging) return;

    function handleMove(e: MouseEvent) {
      setHoverValue(valueFromClientX(e.clientX));
    }
    function handleUp(e: MouseEvent) {
      setDragging(false);
      const next = valueFromClientX(e.clientX);
      setHoverValue(null);
      commit(next);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (readOnly) return;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      commit(clampToStep(value + STEP));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      commit(clampToStep(value - STEP));
    } else if (e.key === "Home") {
      e.preventDefault();
      commit(STEP);
    } else if (e.key === "End") {
      e.preventDefault();
      commit(MAX);
    }
  }

  return (
    <div
      ref={trackRef}
      role={readOnly ? undefined : "slider"}
      aria-label={readOnly ? undefined : "Note"}
      aria-valuemin={readOnly ? undefined : STEP}
      aria-valuemax={readOnly ? undefined : MAX}
      aria-valuenow={readOnly ? undefined : value}
      tabIndex={readOnly ? undefined : 0}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => !dragging && setHoverValue(null)}
      className={cn(
        "inline-flex items-center gap-0.5 outline-none",
        !readOnly && "cursor-pointer focus-visible:[&_svg]:scale-110",
        className,
      )}
    >
      {Array.from({ length: MAX }).map((_, i) => {
        const fillRatio = Math.min(Math.max(displayValue - i, 0), 1) * 100;
        return (
          <div
            key={i}
            className="relative"
            style={{ width: size, height: size }}
            onMouseMove={(e) => {
              if (readOnly || dragging) return;
              setHoverValue(valueFromClientX(e.clientX));
            }}
            onMouseDown={(e) => {
              if (readOnly) return;
              setDragging(true);
              setHoverValue(valueFromClientX(e.clientX));
            }}
            onClick={(e) => {
              if (readOnly || dragging) return;
              commit(valueFromClientX(e.clientX));
            }}
          >
            <Star className="absolute inset-0 text-foreground-muted" size={size} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillRatio}%` }}>
              <Star className="text-accent" size={size} fill="currentColor" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
