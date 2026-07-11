"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { LIMA_CALLAO_DISTRICTS, getRelevanceScore, getActiveDepartments } from "../mapUtils";

const supabase = createClient();

interface UseMapSearchProps {
  onSelectDistrict: (districtKey: string | null) => void;
  onSelectLocation: (loc: { lng: number; lat: number; zoom?: number } | null) => void;
}

export function useMapSearch({ onSelectDistrict, onSelectLocation }: UseMapSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dbStructures, setDbStructures] = useState<any[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);

  // Load search index structures on mount
  useEffect(() => {
    async function loadSearchIndex() {
      try {
        const { data, error } = await supabase
          .from("structures")
          .select("id, code, address, district, city, latitude, longitude");
        if (error) throw error;
        if (data) {
          setDbStructures(data);
          setDbLoaded(true);
        }
      } catch (err) {
        console.error("Error loading search index structures:", err);
      }
    }
    loadSearchIndex();
  }, []);

  const getTopRecommendations = useCallback(() => {
    const districtCounts: Record<string, number> = {};
    dbStructures.forEach((s) => {
      if (s.district) {
        const distClean = s.district
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const matched = LIMA_CALLAO_DISTRICTS.find(
          (d) =>
            d.key
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") === distClean
        );

        if (matched) {
          districtCounts[matched.key] = (districtCounts[matched.key] || 0) + 1;
        }
      }
    });

    const sorted = Object.entries(districtCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return sorted.map(([distKey, count]) => {
      const matched = LIMA_CALLAO_DISTRICTS.find((d) => d.key === distKey)!;
      return {
        isDistrict: true,
        place_name: ` ${matched.display} (${count} paneles)`,
        display: matched.display,
        districtKey: matched.key,
        center: null,
      };
    });
  }, [dbStructures]);

  const handleLocationSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (query.length < 2) {
        const top = getTopRecommendations();
        setSuggestions(top);
        setShowSuggestions(top.length > 0);
        return;
      }

      const queryClean = query
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

      // 1. Filter matching departments
      const activeDepts = getActiveDepartments(dbStructures);
      const matchedDepartments = activeDepts.filter(
        (d) =>
          d.display
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .includes(queryClean) ||
          d.key
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .includes(queryClean)
      ).map((d) => ({
        isDepartment: true,
        place_name: `${d.display} (Departamento)`,
        display: d.display,
        text: d.display,
        departmentKey: d.key,
        center: [d.center.lng, d.center.lat] as [number, number],
        zoom: d.zoom,
      }));

      // Sort matched departments by relevance
      matchedDepartments.sort((a, b) => {
        const scoreA = Math.max(
          getRelevanceScore(a.display, queryClean),
          getRelevanceScore(a.departmentKey, queryClean)
        );
        const scoreB = Math.max(
          getRelevanceScore(b.display, queryClean),
          getRelevanceScore(b.departmentKey, queryClean)
        );
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.display.localeCompare(b.display, "es");
      });

      // 2. Filter matching districts
      const matchedDistricts = LIMA_CALLAO_DISTRICTS.filter(
        (d) =>
          d.display
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .includes(queryClean) ||
          d.key
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .includes(queryClean)
      ).map((d) => ({
        isDistrict: true,
        place_name: `${d.display} (Distrito, ${d.province})`,
        display: d.display,
        text: d.display,
        districtKey: d.key,
        center: null,
      }));

      // Sort matched districts by search relevance
      matchedDistricts.sort((a, b) => {
        const scoreA = Math.max(
          getRelevanceScore(a.display, queryClean),
          getRelevanceScore(a.districtKey, queryClean)
        );
        const scoreB = Math.max(
          getRelevanceScore(b.display, queryClean),
          getRelevanceScore(b.districtKey, queryClean)
        );
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.display.localeCompare(b.display, "es");
      });

      // 3. Filter matching structures
      const matchedStructures = dbStructures
        .filter((s) => {
          const addressClean = (s.address || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          const districtClean = (s.district || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          const cityClean = (s.city || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          const codeClean = (s.code || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

          return (
            addressClean.includes(queryClean) ||
            districtClean.includes(queryClean) ||
            cityClean.includes(queryClean) ||
            codeClean.includes(queryClean)
          );
        })
        .map((s) => ({
          isStructure: true,
          place_name: `${s.address}${s.district ? `, ${s.district}` : ""}${
            s.city ? ` (${s.city})` : ""
          }`,
          display: s.address,
          text: s.address,
          code: s.code,
          center: [s.longitude, s.latitude] as [number, number],
          id: s.id,
        }));

      // Sort matched structures by relevance
      matchedStructures.sort((a, b) => {
        const scoreA = Math.max(
          getRelevanceScore(a.display || "", queryClean),
          getRelevanceScore(a.code || "", queryClean)
        );
        const scoreB = Math.max(
          getRelevanceScore(b.display || "", queryClean),
          getRelevanceScore(b.code || "", queryClean)
        );
        if (scoreA !== scoreB) return scoreB - scoreA;
        return (a.display || "").localeCompare(b.display || "", "es");
      });

      const allSuggestions = [...matchedDepartments, ...matchedDistricts, ...matchedStructures];
      setSuggestions(allSuggestions);
      setShowSuggestions(allSuggestions.length > 0);
    },
    [dbStructures, getTopRecommendations]
  );

  const handleSelectSuggestion = useCallback(
    (lng: number, lat: number, placeName: string, suggestion?: any) => {
      setShowSuggestions(false);
      if (suggestion?.isDistrict) {
        setSearchQuery(suggestion.display);
        onSelectDistrict(suggestion.districtKey);
        onSelectLocation(null);
      } else if (suggestion?.isDepartment) {
        setSearchQuery(suggestion.display);
        onSelectDistrict(null);
        onSelectLocation({ lng, lat, zoom: suggestion.zoom });
      } else {
        setSearchQuery(placeName);
        onSelectDistrict(null);
        onSelectLocation({ lng, lat });
      }
    },
    [onSelectDistrict, onSelectLocation]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    onSelectDistrict(null);
    onSelectLocation(null);
  }, [onSelectDistrict, onSelectLocation]);

  return {
    searchQuery,
    setSearchQuery,
    suggestions,
    setSuggestions,
    showSuggestions,
    setShowSuggestions,
    dbStructures,
    dbLoaded,
    handleLocationSearch,
    handleSelectSuggestion,
    clearSearch,
    getTopRecommendations,
  };
}
