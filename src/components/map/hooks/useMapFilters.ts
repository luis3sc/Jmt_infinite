"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { isDistrictMatch } from "../mapUtils";

const supabase = createClient();

interface Panel {
  id: string;
  panel_code: string;
  face: string | null;
  media_type: string;
  format: string;
  daily_price: number | null;
  photo_url: string | null;
  audience: number | null;
  width: number | null;
  height: number | null;
  resolution_width: number | null;
  resolution_height: number | null;
  traffic_view: string | null;
  slot_duration_seconds: number | null;
  max_slots: number | null;
  operating_start_time: string | null;
  operating_end_time: string | null;
}

interface PoiItem {
  nombre: string;
  distancia_metros: number;
  lat?: number;
  lng?: number;
}

interface Structure {
  id: string;
  code: string;
  address: string;
  district: string;
  reference: string | null;
  latitude: number;
  longitude: number;
  poi_tags?: string[];
  poi_details?: Record<string, PoiItem[]>;
  panels: Panel[];
}

interface UseMapFiltersProps {
  allStructures: Structure[];
  activeDistrict: string | null;
}

export function useMapFilters({ allStructures, activeDistrict }: UseMapFiltersProps) {
  const [filters, setFilters] = useState({
    audience: null as number | null,
    mediaType: "",
    minPrice: null as number | null,
    maxPrice: null as number | null,
    poi: null as { category: string; maxDistance: number } | null,
  });

  const [activeFilters, setActiveFilters] = useState({
    audience: null as number | null,
    mediaType: "",
    minPrice: null as number | null,
    maxPrice: null as number | null,
    poi: null as { category: string; maxDistance: number } | null,
  });

  const [filterOptions, setFilterOptions] = useState({
    mediaTypes: [] as string[],
    prices: [] as number[],
    audiences: [] as number[],
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Load filter options from Supabase on mount
  useEffect(() => {
    async function loadFilterOptions(retries = 3) {
      for (let i = 0; i < retries; i++) {
        try {
          const { data: panels, error: panelError } = await supabase
            .from("panels")
            .select("media_type, daily_price, audience");
          if (panelError) throw panelError;

          const allValidPrices = panels?.map((p) => p.daily_price).filter(Boolean) as number[] || [];
          const allValidDisplayPrices = allValidPrices.map(p => Math.round(p * 1.18 * 100) / 100);
          
          let optimalPrices: number[] = [];
          if (allValidDisplayPrices.length > 0) {
            const minP = Math.min(...allValidDisplayPrices);
            const maxP = Math.max(...allValidDisplayPrices);
            
            // Redondear el mínimo hacia abajo al múltiplo de 50 más cercano
            let start = Math.floor(minP / 50) * 50;
            if (start < 0) start = 0;
            
            // Redondear el máximo hacia arriba al múltiplo de 50 más cercano
            let end = Math.ceil(maxP / 50) * 50;
            if (end <= start) end = start + 100;

            const diff = end - start;
            // Calcular un salto amigable (múltiplo de 10)
            const step = Math.max(10, Math.ceil(diff / 5 / 10) * 10);
            
            for (let i = 0; i <= 5; i++) {
              optimalPrices.push(start + step * i);
            }
            
            // Asegurar que el último valor siempre cubra o supere el max real
            if (optimalPrices[optimalPrices.length - 1] < maxP) {
               optimalPrices.push(Math.ceil(maxP / 10) * 10);
            }
            
            optimalPrices = [...new Set(optimalPrices)].sort((a, b) => a - b);
          } else {
            optimalPrices = [50, 100, 150, 200, 250, 300];
          }

          const uniqueMediaTypes = [
            ...new Set(panels?.map((p) => p.media_type).filter(Boolean) || []),
          ].sort();
          
          const uniqueAudiences = [
            ...new Set(panels?.map((p) => p.audience).filter(Boolean) || []),
          ].sort((a: any, b: any) => a - b);

          setFilterOptions({
            mediaTypes: uniqueMediaTypes.length
              ? (uniqueMediaTypes as string[])
              : ["Estática", "Digital"],
            prices: optimalPrices,
            audiences: uniqueAudiences as number[],
          });
          return; // Success, exit
        } catch (err: any) {
          if (i === retries - 1) {
            console.warn(
              "Error loading filter options after retries:",
              err.message || err
            );
          } else {
            // Wait before retrying (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * Math.pow(2, i))
            );
          }
        }
      }
    }
    loadFilterOptions();
  }, []);

  const filteredStructures = useMemo(() => {
    let list = allStructures;

    // Apply POI filtering if active
    if (activeFilters.poi && activeFilters.poi.category) {
      const { category, maxDistance } = activeFilters.poi;
      list = allStructures.filter((structure) => {
        const pois = (structure.poi_details as any)?.por_categoria?.[category];
        if (!pois || !Array.isArray(pois)) return false;
        return pois.some((poi) => poi.distancia_metros <= maxDistance);
      });
    }

    // Prioritize structures in activeDistrict by sorting them first
    if (activeDistrict) {
      return [...list].sort((a, b) => {
        const aMatches = isDistrictMatch(a.district, activeDistrict);
        const bMatches = isDistrictMatch(b.district, activeDistrict);
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    }

    return list;
  }, [allStructures, activeFilters.poi, activeDistrict]);

  const applyFilters = useCallback(() => {
    setActiveFilters(filters);
    setIsFilterOpen(false);
  }, [filters]);

  const resetFilters = useCallback(() => {
    const defaultFilters = {
      audience: null,
      mediaType: "",
      minPrice: null,
      maxPrice: null,
      poi: null,
    };
    setFilters(defaultFilters);
    setActiveFilters(defaultFilters);
    setIsFilterOpen(false);
  }, []);

  return {
    filters,
    setFilters,
    activeFilters,
    setActiveFilters,
    filterOptions,
    setFilterOptions,
    isFilterOpen,
    setIsFilterOpen,
    filteredStructures,
    applyFilters,
    resetFilters,
  };
}
