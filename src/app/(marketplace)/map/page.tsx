"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const MapViewClient = dynamic(
  () => import("@/components/map/MapViewClient").then((mod) => mod.MapViewClient),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground text-lg font-medium">
        Cargando mapa interactivo...
      </div>
    )
  }
);

export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <MapViewClient />
    </Suspense>
  );
}
