"use client";

import React, { forwardRef } from "react";
import dynamic from "next/dynamic";
import { MAP_PROVIDER } from "@/config/mapConfig";
import { MapEngineProps } from "../engines/types";

// Dynamic imports to load ONLY the active map library chunk
const DynamicMapbox = dynamic(() => import("../engines/MapboxEngine"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 text-primary animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cargando Mapbox...</p>
    </div>
  ),
});

const DynamicMaplibre = dynamic(() => import("../engines/MaplibreEngine"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 text-primary animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cargando Maplibre...</p>
    </div>
  ),
});

export const UnifiedMap = forwardRef<any, MapEngineProps>((props, ref) => {
  if (MAP_PROVIDER === "maplibre") {
    return <DynamicMaplibre {...props} ref={ref} />;
  }
  return <DynamicMapbox {...props} ref={ref} />;
});

UnifiedMap.displayName = "UnifiedMap";
export default UnifiedMap;
