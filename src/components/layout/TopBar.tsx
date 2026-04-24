"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TopBarProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  isFixed?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function TopBar({
  left,
  center,
  right,
  className,
  isFixed = true,
  showBackButton = false,
  onBack,
}: TopBarProps) {
  const defaultLeft = (
    <div className="flex items-center gap-3">
      {showBackButton && (
        <button 
          onClick={onBack}
          className="p-1.5 bg-slate-800/40 rounded-xl hover:bg-slate-800/80 hover:scale-105 active:scale-95 transition-all md:mr-2 border border-white/5"
          title="Volver"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#62ae40]">
            <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
          </svg>
        </button>
      )}
      <Link href="/" className="transition-opacity hover:opacity-80 flex items-center shrink-0">
        <div className="relative w-28 md:w-32 h-8 md:h-10">
          <Image
            src="/assets/images/jmtinfinite_logo.svg"
            alt="JMT Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </Link>
    </div>
  );

  return (
    <header
      className={cn(
        "flex h-14 md:h-16 w-full items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-xl border-b border-white/5 flex-shrink-0 z-50 transition-all duration-300",
        isFixed ? "fixed top-0 left-0 right-0 shadow-[0_2px_20px_-10px_rgba(0,0,0,0.5)]" : "relative",
        className
      )}
    >
      {/* Left Section (Default: Logo) */}
      <div className="flex items-center gap-4 md:gap-6 pointer-events-auto">
        {left || defaultLeft}
      </div>

      {/* Center Section (e.g. Search Bar) */}
      {center && (
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 items-center pointer-events-auto">
          {center}
        </div>
      )}

      {/* Right Section (e.g. Auth Buttons, User Profile) */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {right}
      </div>
    </header>
  );
}
