"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

interface TopBarProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  isFixed?: boolean;
}

export default function TopBar({
  left,
  center,
  right,
  className,
  isFixed = true,
}: TopBarProps) {
  const defaultLeft = (
    <div className="flex items-center gap-3">
      <Link href="/" className="transition-opacity hover:opacity-80 flex items-center shrink-0">
        <div className="relative w-28 md:w-36 h-8 md:h-12">
          <Logo fill priority />
        </div>
      </Link>
    </div>
  );

  return (
    <header
      className={cn(
        "flex h-14 md:h-[74px] w-full items-center gap-3 md:gap-4 px-4 md:px-6 bg-background border-b border-border/80 flex-shrink-0 z-50 transition-all duration-300",
        isFixed ? "fixed top-0 left-0 right-0 shadow-[0_1px_10px_-5px_rgba(0,0,0,0.05)] shadow-border/30" : "relative",
        className
      )}
    >
      {/* Left Section (Default: Logo) */}
      <div className="flex items-center gap-4 md:gap-6 pointer-events-auto shrink-0">
        {left || defaultLeft}
      </div>

      {/* Center Section – flex-1 so it grows to fill all available space between logo and right buttons */}
      {center && (
        <div className="hidden md:flex flex-1 items-center justify-center pointer-events-auto min-w-0 px-2">
          {center}
        </div>
      )}

      {/* Right Section (e.g. Auth Buttons, User Profile) */}
      <div className="flex items-center gap-2 md:gap-3 pointer-events-auto shrink-0 ml-auto">
        {right}
      </div>
    </header>
  );
}
