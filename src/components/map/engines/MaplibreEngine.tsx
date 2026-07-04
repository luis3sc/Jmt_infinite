"use client";

import React, { forwardRef, useMemo } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import { layers, LIGHT } from "@protomaps/basemaps";
import "maplibre-gl/dist/maplibre-gl.css";
import { cn } from "@/lib/utils";
import { isDistrictMatch } from "../mapUtils";
import { MAPLIBRE_STYLE, PMTILES_URL } from "@/config/mapConfig";
import { MapEngineProps } from "./types";

// Register PMTiles protocol handler in MapLibre
if (typeof window !== "undefined") {
  const protocol = new Protocol();
  try {
    maplibregl.addProtocol("pmtiles", protocol.tile);
  } catch (e) {
    // Protocol might already be registered in development/HMR, ignore error
  }
}

export const MaplibreEngine = forwardRef<any, MapEngineProps>((props, ref) => {
  const {
    longitude,
    latitude,
    zoom,
    onMove,
    onMoveEnd,
    onLoad,
    onIdle,
    filteredStructures,
    activeDistrict,
    selectedStructure,
    hoveredStructureId,
    setHoveredStructureId,
    onSelectStructure,
    calculateDisplayPrice,
    selectedDistrictFeature,
  } = props;

  const mapStyle = useMemo<any>(() => {
    if (!PMTILES_URL) {
      return MAPLIBRE_STYLE;
    }
    
    const isVectorTileUrl = PMTILES_URL.includes("{z}") || PMTILES_URL.includes("{x}") || PMTILES_URL.includes("{y}");
    const sourceConfig = isVectorTileUrl 
      ? {
          type: "vector" as const,
          tiles: [PMTILES_URL],
          maxzoom: 15
        }
      : {
          type: "vector" as const,
          url: `pmtiles://${PMTILES_URL}`
        };

    return {
      version: 8,
      glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
      sprite: "https://protomaps.github.io/basemaps-assets/sprites/v4/light",
      sources: {
        protomaps: sourceConfig
      },
      layers: layers("protomaps", LIGHT, { lang: "es" })
    };
  }, []);

  return (
    <Map
      ref={ref}
      longitude={longitude}
      latitude={latitude}
      zoom={zoom}
      onMove={onMove}
      onMoveEnd={onMoveEnd}
      onLoad={onLoad}
      onIdle={onIdle}
      mapStyle={mapStyle}
      attributionControl={false}
      maxBounds={[[-85.0, -20.0], [-65.0, 2.0]]}
      minZoom={5}
    >
      {filteredStructures.map((structure) => {
        const isInsideActiveDistrict = isDistrictMatch(structure.district, activeDistrict);

        return (
          <Marker
            key={structure.id}
            longitude={structure.longitude}
            latitude={structure.latitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelectStructure(structure);
            }}
            style={{
              zIndex: hoveredStructureId === structure.id
                ? 55
                : selectedStructure?.id === structure.id
                  ? 50
                  : isInsideActiveDistrict
                    ? 40
                    : 10
            }}
          >
            <div
              className={cn(
                "flex items-center justify-center cursor-pointer transition-all duration-300 group",
                (selectedStructure?.id === structure.id || hoveredStructureId === structure.id) ? "scale-125 z-10" : " z-0"
              )}
              onMouseEnter={() => setHoveredStructureId(structure.id)}
              onMouseLeave={() => setHoveredStructureId(null)}
            >
              <div
                className={cn(
                  "px-3 py-1.5 rounded-full shadow-md font-bold text-sm whitespace-nowrap transition-all duration-300",
                  (selectedStructure?.id === structure.id || hoveredStructureId === structure.id)
                    ? "bg-primary text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border-none"
                    : isInsideActiveDistrict
                      ? "bg-brand-dark text-white border-2 border-white/40 shadow-[0_4px_12px_rgba(14,22,43,0.3)] scale-105 font-bold group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] group-hover:border-none"
                      : "bg-white text-brand-dark group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] group-hover:border-none"
                )}
              >
                S/ {calculateDisplayPrice(structure).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </Marker>
        );
      })}

      {selectedDistrictFeature && (
        <Source id="selected-district-source" type="geojson" data={selectedDistrictFeature}>
          <Layer
            id="selected-district-fill"
            type="fill"
            paint={{
              "fill-color": "#0e162b",
              "fill-opacity": 0.05,
            }}
          />
          <Layer
            id="selected-district-line"
            type="line"
            paint={{
              "line-color": "#0e162b",
              "line-width": 2.5,
            }}
          />
        </Source>
      )}
    </Map>
  );
});

MaplibreEngine.displayName = "MaplibreEngine";
export default MaplibreEngine;
