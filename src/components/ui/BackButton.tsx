"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
 href?: string;
 onClick?: () => void;
 label?: string;
 className?: string;
 variant?: "default" | "small";
}

export function BackButton({ 
 href, 
 onClick, 
 label = "Volver", 
 className = "",
 variant = "default" 
}: BackButtonProps) {
 const router = useRouter();

 const handleBack = () => {
  if (onClick) {
   onClick();
  } else if (!href) {
   router.back();
  }
 };

 const isSmall = variant === "small";

 const buttonContent = (
  <>
   <ArrowLeft size={isSmall ? 14 : 18} className="text-primary group-hover:-translate-x-1 transition-transform" />
   <span className="text-muted-foreground group-hover:text-foreground">{label}</span>
  </>
 );

 const baseClasses = isSmall 
  ? "w-fit flex items-center gap-2 transition-all group text-[10px] font-black uppercase tracking-widest cursor-pointer"
  : "w-fit flex items-center gap-2.5 transition-all group cursor-pointer font-medium text-sm";

 if (href) {
  return (
   <Link href={href} className={`${baseClasses} ${className}`}>
    {buttonContent}
   </Link>
  );
 }

 return (
  <button
   type="button"
   onClick={handleBack}
   className={`${baseClasses} ${className}`}
  >
   {buttonContent}
  </button>
 );
}
