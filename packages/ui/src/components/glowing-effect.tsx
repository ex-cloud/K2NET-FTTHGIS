"use client";

import { memo, useEffect, useRef } from "react";
import { cn } from "../utils";

export interface GlowingEffectProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  variant?: "default" | "white";
  glow?: boolean;
  className?: string;
  disabled?: boolean;
  movementDuration?: number;
  borderWidth?: number;
}

const GlowingEffect = memo(
  ({
    blur = 0,
    inactiveZone = 0.7,
    proximity = 64,
    spread = 20,
    variant = "default",
    glow = false,
    className,
    borderWidth = 1,
    disabled = false,
  }: GlowingEffectProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const targetPos = useRef({ x: 0, y: 0 });
    const currentAngleRef = useRef(0);
    const activeRef = useRef(0);

    useEffect(() => {
      if (disabled) return;

      let frameId: number;

      const tick = () => {
        const el = containerRef.current;
        if (!el) {
          frameId = requestAnimationFrame(tick);
          return;
        }

        const { left, top, width, height } = el.getBoundingClientRect();
        const mouseX = targetPos.current.x;
        const mouseYVal = targetPos.current.y;

        const center = [left + width * 0.5, top + height * 0.5];
        const distanceFromCenter = Math.hypot(
          mouseX - center[0],
          mouseYVal - center[1]
        );
        const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

        const isInProximity =
          mouseX > left - proximity &&
          mouseX < left + width + proximity &&
          mouseYVal > top - proximity &&
          mouseYVal < top + height + proximity;

        const shouldBeActive = isInProximity && distanceFromCenter >= inactiveRadius;
        
        // Lerp active state for smooth fade-in/fade-out
        const targetActive = shouldBeActive ? 1 : 0;
        activeRef.current = activeRef.current + (targetActive - activeRef.current) * 0.15;
        
        el.style.setProperty("--active", activeRef.current.toFixed(4));

        if (activeRef.current > 0.01) {
          const targetAngle =
            (180 * Math.atan2(mouseYVal - center[1], mouseX - center[0])) /
              Math.PI +
            90;

          const angleDiff = ((targetAngle - currentAngleRef.current + 180) % 360) - 180;
          currentAngleRef.current = currentAngleRef.current + angleDiff * 0.15; // Smooth interpolation speed

          el.style.setProperty("--start", currentAngleRef.current.toFixed(2));
        }

        frameId = requestAnimationFrame(tick);
      };

      const handlePointerMove = (e: PointerEvent) => {
        targetPos.current = { x: e.clientX, y: e.clientY };
      };

      const handleScroll = () => {
        // Trigger position update on scroll if needed
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      document.body.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });

      frameId = requestAnimationFrame(tick);

      return () => {
        if (frameId) {
          cancelAnimationFrame(frameId);
        }
        window.removeEventListener("scroll", handleScroll);
        document.body.removeEventListener("pointermove", handlePointerMove);
      };
    }, [disabled, inactiveZone, proximity]);

    return (
      <>
        <div
          className={cn(
            "pointer-events-none absolute -inset-px hidden rounded-[inherit] border opacity-0 transition-opacity",
            glow && "opacity-100",
            variant === "white" && "border-white",
            disabled && "!block"
          )}
        />
        <div
          ref={containerRef}
          style={
            {
              "--blur": `${blur}px`,
              "--spread": spread,
              "--start": "0",
              "--active": "0",
              "--glowingeffect-border-width": `${borderWidth}px`,
              "--repeating-conic-gradient-times": "5",
              "--gradient":
                variant === "white"
                  ? `repeating-conic-gradient(
                  from 236.84deg at 50% 50%,
                  #ffffff,
                  #ffffff calc(25% / var(--repeating-conic-gradient-times))
                )`
                  : `radial-gradient(circle, var(--primary) 10%, transparent 20%),
                radial-gradient(circle at 40% 40%, var(--primary) 5%, transparent 15%),
                radial-gradient(circle at 60% 60%, #06b6d4 10%, transparent 20%), 
                repeating-conic-gradient(
                  from 236.84deg at 50% 50%,
                  var(--primary) 0%,
                  #8b5cf6 calc(25% / var(--repeating-conic-gradient-times)),
                  #06b6d4 calc(50% / var(--repeating-conic-gradient-times)), 
                  var(--primary) calc(75% / var(--repeating-conic-gradient-times)),
                  #8b5cf6 calc(100% / var(--repeating-conic-gradient-times))
                )`,
            } as React.CSSProperties
          }
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity",
            glow && "opacity-100",
            blur > 0 && "blur-[var(--blur)]",
            className,
            disabled && "!hidden"
          )}
        >
          <div
            className={cn(
              "glow",
              "rounded-[inherit]",
              'after:content-[""] after:rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))]',
              "after:[border:var(--glowingeffect-border-width)_solid_transparent]",
              "after:[background:var(--gradient)] after:[background-attachment:fixed]",
              "after:opacity-[var(--active)] after:transition-opacity after:duration-300",
              "after:[mask-clip:padding-box,border-box]",
              "after:[mask-composite:intersect]",
              "after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]"
            )}
          />
        </div>
      </>
    );
  }
);

GlowingEffect.displayName = "GlowingEffect";

export { GlowingEffect };
