"use client";

import { usePathname } from "next/navigation";
import TopBar from "./TopBar";

export default function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide this global header on the map page, auth pages, and checkout
  // These pages handle their own TopBar or specific layout requirements.
  const hideHeader = ["/map", "/login", "/signup", "/checkout"].includes(pathname);
  if (hideHeader) return null;

  return (
    <TopBar 
      isFixed={true}
      right={children}
    />
  );
}
