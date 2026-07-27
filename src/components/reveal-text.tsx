"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

type RevealTextProps = {
  children: React.ReactNode;
  image?: string;
  className?: string;
  hoverImageClass?: string;
};

const RevealText = ({
  children,
  image,
  className = "",
  hoverImageClass,
}: RevealTextProps) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const quickToX = useRef<any>(null);

  const handleMouseEnter = () => {
    if (!imageRef.current) return;
    gsap.killTweensOf(imageRef.current);
    quickToX.current = gsap.quickTo(imageRef.current, "x", {
      duration: 0.6,
    });
    gsap.to(imageRef.current, {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    if (!imageRef.current) return;
    gsap.killTweensOf(imageRef.current);
    gsap.to(imageRef.current, {
      opacity: 0,
      scale: 0.9,
      x: 0,
      duration: 0.2,
      ease: "power3.in",
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (!imageRef.current || !quickToX.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const offset = ((x - rect.width / 2) / rect.width) * 60;
    quickToX.current(offset);
  };

  return (
    <span
      className={cn("relative inline-block cursor-default", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {image && (
        <img
          ref={imageRef}
          src={image}
          alt=""
          className={cn(
            "absolute left-1/2 top-[-9.5rem] z-30 aspect-video -translate-x-1/2",
            "min-w-44 md:min-w-52 lg:min-w-60",
            "h-28 md:h-32 lg:h-36",
            "object-cover pointer-events-none opacity-0 scale-90",
            "border-2 border-accent",
            hoverImageClass
          )}
        />
      )}
      <span>{children}</span>
    </span>
  );
};

export { RevealText };
