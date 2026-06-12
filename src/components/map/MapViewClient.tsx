"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ViewStateChangeEvent } from "react-map-gl/mapbox";
import UnifiedMap from "./shared/UnifiedMap";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
import { MapPin, X, SlidersHorizontal, List, Map as MapIcon, User, Users, Maximize, Navigation, ShoppingCart, Search, Filter, CheckCircle2, Trash2, Calendar, ChevronRight, Loader2, CreditCard, Clock, PlusCircle, FileText, Copy, Check } from "lucide-react";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, parseISO, differenceInDays } from "date-fns";
import { getCached, setCached } from "@/lib/bboxCache";
import AuthButton from "@/components/layout/AuthButton";
import TopBar from "@/components/layout/TopBar";
import TopBarSearch from "@/components/layout/TopBarSearch";
import StructureDetailModal from "@/components/map/StructureDetailModal";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import QuotePDFDocument from "./QuotePDFDocument";
import QuoteDialog from "./components/QuoteDialog";
import { LIMA_CALLAO_DISTRICTS, DISTRICT_COORDINATES, isDistrictMatch, getRelevanceScore } from "./mapUtils";
import { useMapSearch } from "./hooks/useMapSearch";
import { useMapFilters } from "./hooks/useMapFilters";
import { useQuoteFlow } from "./hooks/useQuoteFlow";
import MobileSearchBox from "./components/MobileSearchBox";
import MapFiltersSidebar from "./components/MapFiltersSidebar";
import MapCartSidebar from "./components/MapCartSidebar";


// Define Types
type Panel = {
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
};

type PoiItem = {
  nombre: string;
  distancia_metros: number;
  lat?: number;
  lng?: number;
};

type Structure = {
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
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;


export function MapViewClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeDistrict = searchParams?.get("district") || null;
  const [pendingDistrict, setPendingDistrict] = useState<string | null>(null);
  const [districtsGeoJSON, setDistrictsGeoJSON] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isInitialFitDone, setIsInitialFitDone] = useState(!activeDistrict);

  const isInitialLoadRef = useRef(true);

  // Load districts GeoJSON on mount
  useEffect(() => {
    fetch("/data/lima_callao_distritos_simple.geojson")
      .then((res) => res.json())
      .then((data) => {
        setDistrictsGeoJSON(data);
      })
      .catch((err) => {
        console.error("Error loading districts GeoJSON:", err);
      });
  }, []);

  // Safety fallback for initial fit loading screen
  useEffect(() => {
    if (activeDistrict) {
      const timer = setTimeout(() => {
        setIsInitialFitDone(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [activeDistrict]);

  const districtCoords = activeDistrict ? DISTRICT_COORDINATES[activeDistrict] : null;
  const initialLat = Number(searchParams?.get("lat")) || (districtCoords ? districtCoords.lat : -12.0464);
  const initialLng = Number(searchParams?.get("lng")) || (districtCoords ? districtCoords.lng : -77.0428);
  const initialZoom = districtCoords ? districtCoords.zoom : 13;

  const fromParam = searchParams?.get("from");
  const toParam = searchParams?.get("to");

  const [viewState, setViewState] = useState({
    longitude: initialLng,
    latitude: initialLat,
    zoom: initialZoom,
  });

  // Default dates for new items
  const today = new Date().toISOString().split('T')[0];
  const defaultEnd = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  })();

  const initialStart = fromParam || "";
  const initialEnd = toParam || "";

  // Staged states for active search (only update when "Buscar" is clicked)
  const [activeStartDate, setActiveStartDate] = useState(initialStart);
  const [activeEndDate, setActiveEndDate] = useState(initialEnd);
  const [pendingLocation, setPendingLocation] = useState<{ lng: number, lat: number } | null>(null);
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);

  // Match the active district from the URL against the GeoJSON features
  const selectedDistrictFeature = useMemo(() => {
    if (!activeDistrict || !districtsGeoJSON) return null;

    const searchName = activeDistrict.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    return districtsGeoJSON.features.find((feature: any) => {
      const distName = feature.properties?.distrito || "";
      const distName2 = feature.properties?.distrito2 || "";

      const norm1 = distName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const norm2 = distName2.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

      // Support manual mapping overrides
      if (searchName === "SURCO" && (norm1 === "SANTIAGO DE SURCO" || norm2 === "SANTIAGO DE SURCO")) return true;
      if (searchName === "LURIGANCHO" && (norm1 === "LURIGANCHO" || norm2 === "LURIGANCHO-CHOSICA")) return true;
      if (searchName === "MI PERU" && (norm1 === "MI PERU" || norm2 === "MI PERU")) return true;
      if (searchName === "BRENA" && (norm1 === "BRENA" || norm2 === "BRENA")) return true;

      return norm1 === searchName || norm2 === searchName;
    });
  }, [activeDistrict, districtsGeoJSON]);

  // Helper to fit map bounds to the active district in a robust way, preventing mobile race conditions
  const fitDistrictBounds = useCallback((mapInstance: any, isInitial: boolean) => {
    if (!selectedDistrictFeature || !mapInstance) return;

    try {
      const geom = selectedDistrictFeature.geometry;
      let coordinates = [];

      if (geom.type === "Polygon") {
        coordinates = geom.coordinates[0];
      } else if (geom.type === "MultiPolygon") {
        coordinates = geom.coordinates.flatMap((poly: any) => poly[0]);
      }

      if (coordinates.length > 0) {
        let minLng = Infinity, minLat = Infinity;
        let maxLng = -Infinity, maxLat = -Infinity;

        for (const [lng, lat] of coordinates) {
          if (lng < minLng) minLng = lng;
          if (lat < minLat) minLat = lat;
          if (lng > maxLng) maxLng = lng;
          if (lat > maxLat) maxLat = lat;
        }

        const bbox: [[number, number], [number, number]] = [
          [minLng, minLat],
          [maxLng, maxLat]
        ];

        const executeFit = () => {
          mapInstance.resize();
          const container = mapInstance.getContainer();
          const width = container.clientWidth;
          const height = container.clientHeight;

          // If container layout width/height is not resolved, retry in 100ms
          if (width === 0 || height === 0) {
            setTimeout(executeFit, 100);
            return;
          }

          const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
          const fitPadding = isMobile
            ? { top: 60, bottom: 120, left: 25, right: 25 }
            : { top: 120, bottom: 140, left: 60, right: 60 };

          const camera = mapInstance.cameraForBounds(bbox, {
            padding: fitPadding
          });

          mapInstance.fitBounds(bbox, {
            padding: fitPadding,
            duration: isInitial ? 0 : 1200,
            essential: true
          });

          if (isInitial) {
            let targetLng = initialLng;
            let targetLat = initialLat;
            let targetZoom = initialZoom;

            if (camera && camera.center) {
              targetLng = camera.center.lng;
              targetLat = camera.center.lat;
              targetZoom = typeof camera.zoom === "number" ? camera.zoom : targetZoom;
            } else {
              const newCenter = mapInstance.getCenter();
              const newZoom = mapInstance.getZoom();
              targetLng = newCenter.lng;
              targetLat = newCenter.lat;
              targetZoom = newZoom;
            }

            setViewState({
              longitude: targetLng,
              latitude: targetLat,
              zoom: targetZoom
            });

            isInitialLoadRef.current = false;
            // Defer hiding loader slightly so map renders its new viewport frame first
            setTimeout(() => {
              setIsInitialFitDone(true);
            }, 100);
          } else {
            // Sincronizar al terminar la animación
            mapInstance.once('moveend', () => {
              const newCenter = mapInstance.getCenter();
              const newZoom = mapInstance.getZoom();
              setViewState({
                longitude: newCenter.lng,
                latitude: newCenter.lat,
                zoom: newZoom
              });
            });
          }
        };

        if (isInitial) {
          setTimeout(executeFit, 50);
        } else {
          executeFit();
        }
      }
    } catch (err) {
      console.error("Error adjusting map boundaries (fitBounds) for selected district:", err);
    }
  }, [selectedDistrictFeature]);

  // Automatically zoom and fit the map boundaries to the selected district's geometry
  useEffect(() => {
    if (selectedDistrictFeature && mapLoaded && mapRef.current) {
      const map = mapRef.current.getMap();
      if (map) {
        fitDistrictBounds(map, isInitialLoadRef.current);
      }
    }
  }, [selectedDistrictFeature, mapLoaded, fitDistrictBounds]);

  // The automatic sync useEffect for dates is removed in favor of the "Buscar" button
  // to avoid redundant URL updates and follow the user's request for manual search trigger.

  // Calculate days based on active state (for prices and cart)
  let numberOfDays = 0;
  if (activeStartDate && activeEndDate) {
    const start = new Date(activeStartDate).getTime();
    const end = new Date(activeEndDate).getTime();
    const diff = end - start;
    if (diff > 0) {
      numberOfDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
  }

  const cartItems = useCartStore((state) => state.items);
  const addCartItem = useCartStore((state) => state.addItem);
  const removeCartItem = useCartStore((state) => state.removeItem);
  const updateCartItem = useCartStore((state) => state.updateItem);
  const cartItemCount = useCartStore((state) => state.getTotalItems());
  const cartTotal = useCartStore((state) => state.items.reduce((total, item) => total + item.totalPrice, 0));

  const [showToast, setShowToast] = useState({ show: false, message: "" });
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const setIsCartOpen = useCartStore((state) => state.setIsCartOpen);

  const triggerToast = useCallback((message: string) => {
    setShowToast({ show: true, message });
    setTimeout(() => setShowToast({ show: false, message: "" }), 3000);
  }, []);


  const [structures, setStructures] = useState<Structure[]>([]);
  const [allStructures, setAllStructures] = useState<Structure[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);
  const [hoveredStructureId, setHoveredStructureId] = useState<string | null>(null);
  const [activePanelIndex, setActivePanelIndex] = useState(0);

  // Close other modals when cart opens to prevent modal stacking and ensure returning to clean map on close
  useEffect(() => {
    if (isCartOpen) {
      setSelectedStructure(null);
    }
  }, [isCartOpen]);

  // Derivations moved up for reliable scoping
  const currentActivePanel = selectedStructure?.panels?.[activePanelIndex];
  const currentFinalDailyPrice = currentActivePanel?.daily_price || 150;
  const currentIsInCart = currentActivePanel ? cartItems.some(i => i.panelId === currentActivePanel.id) : false;

  // Helpers moved to top for visibility
  const getDailyDisplayPrice = (dailyPrice: number) => {
    return Math.round(dailyPrice * 1.18 * 100) / 100;
  };

  const getDisplayPrice = (dailyPrice: number) => {
    return Math.round(dailyPrice * 1.18 * 100) / 100; // Round to 2 decimals
  };

  const calculateDisplayPrice = (structure: Structure) => {
    if (!structure.panels || structure.panels.length === 0) return getDisplayPrice(150);
    const prices = structure.panels.map((p) => p.daily_price || 150);
    const lowestNet = Math.min(...prices);
    return getDisplayPrice(lowestNet);
  };

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "list">("map");
  // Hook de Búsqueda
  const {
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
  } = useMapSearch({
    onSelectDistrict: setPendingDistrict,
    onSelectLocation: setPendingLocation,
  });

  // Hook de Filtros
  const {
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
  } = useMapFilters({
    allStructures,
    activeDistrict,
  });

  const hasActiveFilters =
    activeFilters.audience !== null ||
    activeFilters.mediaType !== "" ||
    activeFilters.minPrice !== null ||
    activeFilters.maxPrice !== null ||
    activeFilters.poi !== null;

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (isSearchOpen && searchQuery.length < 2) {
      setSuggestions(getTopRecommendations());
    }
  }, [isSearchOpen, searchQuery, getTopRecommendations, setSuggestions]);


  const PAGE_SIZE = 20;
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const currentBoundsRef = useRef<any>(null);



  useEffect(() => {
    setTotalCount(filteredStructures.length);
    setCurrentPage(0);
    setStructures(filteredStructures.slice(0, PAGE_SIZE));
    setHasMore(PAGE_SIZE < filteredStructures.length);
    if (listScrollRef.current) listScrollRef.current.scrollTop = 0;
  }, [filteredStructures]);


  const handleApplyFilters = () => {
    applyFilters();
    if (mapRef.current) {
      const bounds = mapRef.current.getMap().getBounds();
      if (bounds) fetchStructuresInBounds(bounds);
    }
  };

  const handleResetFilters = () => {
    resetFilters();
    if (mapRef.current) {
      const bounds = mapRef.current.getMap().getBounds();
      if (bounds) setTimeout(() => fetchStructuresInBounds(bounds), 0);
    }
  };

  const mapRef = useRef<any>(null);

  // Paginated fetch with two-layer cache (memory + localStorage)
  const fetchStructuresInBounds = useCallback(async (bounds: any) => {
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // ── Cache check ────────────────────────────────────────────────────────
    const cached = getCached(sw.lat, sw.lng, ne.lat, ne.lng, 0, activeFilters);
    if (cached) {
      const fullData = cached.data as Structure[];
      setAllStructures(fullData);
      setIsLoading(false);
      setIsLoadingMore(false);
      return; // ✅ cache hit — no network request
    }

    // ── Cache miss: fetch from Supabase ────────────────────────────────────
    setIsLoading(true);

    try {
      const isPanelFiltering = activeFilters.audience || activeFilters.mediaType || activeFilters.minPrice || activeFilters.maxPrice;
      const relation = isPanelFiltering ? "panels!inner" : "panels";

      let data: any = null;
      let error: any = null;
      const retries = 3;

      for (let i = 0; i < retries; i++) {
        let query = supabase
          .from("structures")
          .select(
            `id, code, address, district, reference, latitude, longitude, poi_tags, poi_details,
      ${relation} (id, panel_code, face, media_type, format, daily_price, photo_url, audience, width, height, traffic_view, resolution_width, resolution_height, slot_duration_seconds, max_slots, operating_start_time, operating_end_time)`
          )
          .gte("latitude", sw.lat)
          .lte("latitude", ne.lat)
          .gte("longitude", sw.lng)
          .lte("longitude", ne.lng)
          .limit(300); // Fetch all structures in the bounds (up to 300)

        if (activeFilters.audience) {
          query = query.gte("panels.audience", activeFilters.audience);
        }
        if (activeFilters.mediaType) {
          query = query.eq("panels.media_type", activeFilters.mediaType);
        }
        if (activeFilters.minPrice) {
          query = query.gte("panels.daily_price", activeFilters.minPrice / 1.18);
        }
        if (activeFilters.maxPrice) {
          query = query.lte("panels.daily_price", activeFilters.maxPrice / 1.18);
        }

        const result = await query;
        error = result.error;
        data = result.data;

        if (!error) break; // Success

        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
      }

      if (error) throw error;

      if (data) {
        const fullData = data as Structure[];

        // Write to cache
        setCached(sw.lat, sw.lng, ne.lat, ne.lng, 0, fullData, fullData.length, activeFilters);

        setAllStructures(fullData);
      }
    } catch (err: any) {
      console.warn("Detailed error fetching structures after retries:", err);
      triggerToast("Error al cargar los paneles. Por favor intenta de nuevo.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    const locationQuery = searchParams?.get("location");
    const latParam = searchParams?.get("lat");
    const lngParam = searchParams?.get("lng");
    const districtParam = searchParams?.get("district");

    const hasCoords = latParam && lngParam && !isNaN(Number(latParam)) && !isNaN(Number(lngParam));

    if (hasCoords) {
      const lat = Number(latParam);
      const lng = Number(lngParam);
      setViewState(prev => {
        if (prev.longitude === lng && prev.latitude === lat) {
          return prev;
        }
        return {
          ...prev,
          longitude: lng,
          latitude: lat,
          zoom: 14,
          transitionDuration: 1000
        };
      });

      // Esperar a que el mapa se estabilice antes de cargar los paneles en el área
      setTimeout(() => {
        if (mapRef.current) {
          const bounds = mapRef.current.getMap().getBounds();
          if (bounds) fetchStructuresInBounds(bounds);
        }
      }, 1200);
      return;
    }

    if (districtParam) {
      // Si tenemos un distrito, dejamos que el useEffect de selectedDistrictFeature haga el fitBounds.
      // No queremos buscar una estructura individual para centrar a zoom 15.
      setTimeout(() => {
        if (mapRef.current) {
          const bounds = mapRef.current.getMap().getBounds();
          if (bounds) fetchStructuresInBounds(bounds);
        }
      }, 1000);
      return;
    }

    if (locationQuery && dbLoaded) {
      // No coords in URL, but we have locationQuery and dbStructures is loaded: resolve locally
      const cleanLocation = locationQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

      const matchedStructure = dbStructures.find(s => {
        const addressClean = (s.address || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const districtClean = (s.district || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const cityClean = (s.city || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const codeClean = (s.code || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        return addressClean.includes(cleanLocation) ||
          districtClean.includes(cleanLocation) ||
          cityClean.includes(cleanLocation) ||
          codeClean.includes(cleanLocation);
      });

      if (matchedStructure) {
        setViewState(prev => {
          if (prev.longitude === matchedStructure.longitude && prev.latitude === matchedStructure.latitude) {
            return prev;
          }
          return {
            ...prev,
            longitude: matchedStructure.longitude,
            latitude: matchedStructure.latitude,
            zoom: 15,
            transitionDuration: 1000
          };
        });

        // Esperar a que el mapa se estabilice antes de cargar los paneles en el área
        setTimeout(() => {
          if (mapRef.current) {
            const bounds = mapRef.current.getMap().getBounds();
            if (bounds) fetchStructuresInBounds(bounds);
          }
        }, 1200);
        return;
      }
    }

    // Carga inicial en la ubicación por defecto
    setTimeout(() => {
      if (mapRef.current) {
        const bounds = mapRef.current.getMap().getBounds();
        if (bounds) fetchStructuresInBounds(bounds);
      }
    }, 1000);
  }, [searchParams, dbLoaded, fetchStructuresInBounds]);

  const executeSearch = async (
    overrideSearchQuery?: any,
    overrideDistrict?: string | null,
    overrideLocation?: { lng: number, lat: number } | null
  ) => {
    // 1. Update active states
    setActiveStartDate(startDate);
    setActiveEndDate(endDate);

    // Safeguard against React MouseEvent or other objects passed implicitly via onClick
    const isStringQuery = typeof overrideSearchQuery === "string";
    const queryToUse = isStringQuery ? overrideSearchQuery : searchQuery;
    const districtToUse = overrideDistrict !== undefined ? overrideDistrict : pendingDistrict;
    const locationToUse = overrideLocation !== undefined ? overrideLocation : pendingLocation;

    if (isStringQuery) setSearchQuery(overrideSearchQuery);
    if (overrideDistrict !== undefined) setPendingDistrict(overrideDistrict);
    if (overrideLocation !== undefined) setPendingLocation(overrideLocation);

    // 2. Prepare URL params
    const params = new URLSearchParams(searchParams?.toString());
    params.set("location", queryToUse);
    params.set("from", startDate);
    params.set("to", endDate);

    // 3. Handle location update
    const cleanSearch = queryToUse.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const matched = LIMA_CALLAO_DISTRICTS.find(d =>
      d.display.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === cleanSearch ||
      d.key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === cleanSearch
    );

    const activeDist = overrideDistrict !== undefined ? overrideDistrict : (districtToUse || (matched ? matched.key : null));

    if (activeDist) {
      params.set("district", activeDist);
      params.delete("lat");
      params.delete("lng");

      const displayName = matched ? matched.display : (LIMA_CALLAO_DISTRICTS.find(d => d.key === activeDist)?.display || queryToUse);
      params.set("location", displayName);
      setSearchQuery(displayName);

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      setPendingDistrict(null);
      setPendingLocation(null);

      // Force structure refetch based on new activeDistrict in bounds after transition
      setTimeout(() => {
        if (mapRef.current) {
          fetchStructuresInBounds(mapRef.current.getMap().getBounds());
        }
      }, 1300);
      return;
    }

    params.delete("district");

    if (locationToUse) {
      // Si seleccionaron una sugerencia del buscador, usamos esas coordenadas exactas
      params.set("lat", locationToUse.lat.toString());
      params.set("lng", locationToUse.lng.toString());
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      setViewState(prev => ({
        ...prev,
        longitude: locationToUse.lng,
        latitude: locationToUse.lat,
        zoom: 14,
        transitionDuration: 1000
      }));
      setPendingLocation(null);
      setPendingDistrict(null);

      // Cargar paneles en la nueva ubicación
      setTimeout(() => {
        if (mapRef.current) {
          fetchStructuresInBounds(mapRef.current.getMap().getBounds());
        }
      }, 1100);
    } else if (queryToUse.length >= 3) {
      const matchedStructure = dbStructures.find(s => {
        const addressClean = (s.address || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const districtClean = (s.district || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const cityClean = (s.city || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const codeClean = (s.code || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        return addressClean.includes(cleanSearch) ||
          districtClean.includes(cleanSearch) ||
          cityClean.includes(cleanSearch) ||
          codeClean.includes(cleanSearch);
      });

      if (matchedStructure) {
        params.set("lat", matchedStructure.latitude.toString());
        params.set("lng", matchedStructure.longitude.toString());

        const displayName = `${matchedStructure.address}${matchedStructure.district ? `, ${matchedStructure.district}` : ""}`;
        params.set("location", displayName);
        setSearchQuery(displayName);

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });

        setViewState(prev => ({
          ...prev,
          longitude: matchedStructure.longitude,
          latitude: matchedStructure.latitude,
          zoom: 15,
          transitionDuration: 1000
        }));

        setTimeout(() => {
          if (mapRef.current) {
            fetchStructuresInBounds(mapRef.current.getMap().getBounds());
          }
        }, 1100);
      } else {
        triggerToast("No se encontraron paneles en esa ubicación en nuestra base de datos.");
      }
    } else {
      // Si no hay cambio de ubicación pero pudieron cambiar las fechas
      params.delete("lat");
      params.delete("lng");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      if (mapRef.current) {
        fetchStructuresInBounds(mapRef.current.getMap().getBounds());
      }
    }
  };

  const handleSelectSuggestionAndSearch = useCallback(
    (lng: number, lat: number, placeName: string, suggestion?: any) => {
      setShowSuggestions(false);
      
      let query = placeName;
      let dist: string | null = null;
      let coords: { lng: number; lat: number } | null = null;

      if (suggestion?.isDistrict) {
        query = suggestion.display;
        dist = suggestion.districtKey;
      } else {
        coords = { lng, lat };
      }

      executeSearch(query, dist, coords);
    },
    [executeSearch, setShowSuggestions]
  );


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch();
    }
  };

  const handleMoveEnd = (e: ViewStateChangeEvent) => {
    setViewState(e.viewState);
    const bounds = mapRef.current?.getMap().getBounds();
    if (!bounds) return;
    currentBoundsRef.current = bounds;

    // Debounce: wait 350ms after the user stops panning/zooming
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchStructuresInBounds(bounds);
    }, 350);
  };

  // Infinite scroll handler — appends the next page in the frontend
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    setTimeout(() => {
      const nextPage = currentPage + 1;
      const from = nextPage * PAGE_SIZE;
      const to = from + PAGE_SIZE;
      const nextChunk = filteredStructures.slice(from, to);

      setStructures(prev => [...prev, ...nextChunk]);
      setCurrentPage(nextPage);
      setHasMore(to < filteredStructures.length);
      setIsLoadingMore(false);
    }, 200); // Small delay for nice visual feedback
  }, [isLoadingMore, hasMore, currentPage, filteredStructures]);

  // Helpers moved to top for visibility


  const handleSelectStructure = (structure: Structure) => {
    setSelectedStructure(structure);
    setActivePanelIndex(0);

    // Center the map on the selected marker without changing zoom
    setViewState(prev => ({
      ...prev,
      longitude: structure.longitude,
      latitude: structure.latitude,
      transitionDuration: 1000
    }));
  };




  // Derived state for the active selection

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background">

      {/* TOP NAVBAR */}
      <TopBar
        isFixed={false}
        center={
          <TopBarSearch
            searchQuery={searchQuery}
            onLocationSearch={handleLocationSearch}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            onSearch={executeSearch}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            onSelectSuggestion={handleSelectSuggestion}
            onFocus={() => {
              if (searchQuery.length < 2) {
                setSuggestions(getTopRecommendations());
              }
              setShowSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
        }
        right={
          <div className="flex items-center gap-2 md:gap-2 lg:gap-3">
            {/* Filtros: icon-only on md, icon+text on lg+ */}
            <Button
              variant="outline"
              size="icon-lg"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "hidden md:flex lg:hidden items-center justify-center",
                isFilterOpen
                  ? "bg-foreground text-background border-foreground shadow-md hover:bg-foreground/90"
                  : "bg-card/60 backdrop-blur-md border-border text-foreground hover:bg-primary hover:text-background cursor-pointer"
              )}
              aria-label="Filtros"
            >
              <Filter size={18} />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "hidden lg:flex px-4 items-center gap-2 text-sm font-medium",
                isFilterOpen
                  ? "bg-foreground text-background border-foreground shadow-md hover:bg-foreground/90"
                  : "bg-card/60 backdrop-blur-md border-border text-foreground hover:bg-primary hover:text-background cursor-pointer"
              )}
            >
              <Filter size={18} />
              <span>Filtros</span>
            </Button>
            <AuthButton />
          </div>
        }

      />



      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 w-full flex-col md:flex-row overflow-hidden relative">

        {/* LEFT PANEL: List View (Hidden on mobile map view) */}
        <div
          className={`w-full md:w-[400px] lg:w-[480px] flex-shrink-0 flex-col bg-background border-r border-border h-full z-20 
    ${activeTab === "list" ? "flex" : "hidden md:flex"}`}
        >
          {/* Dynamic Context Header */}
          <div className="px-fluid-md py-fluid-xs border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-fluid-base font-bold text-foreground tracking-tight">
                  {isLoading ? "Buscando paneles..." : "Paneles en esta área"}
                </h2>
                <AnimatePresence mode="wait">
                  {!isLoading && (
                    <motion.p
                      key={totalCount}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-fluid-xs text-muted-foreground mt-0.5"
                    >
                      {totalCount === 0
                        ? "Sin resultados en esta zona"
                        : `Mostrando ${structures.length} de ${totalCount} paneles`}
                    </motion.p>
                  )}
                  {isLoading && (
                    <motion.p
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-fluid-xs text-muted-foreground mt-0.5"
                    >
                      Actualizando resultados...
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Progress bar shown while loading more */}
            {(isLoading || isLoadingMore) && (
              <div className="mt-2 h-0.5 w-full bg-border overflow-hidden rounded-full">
                <motion.div
                  className="h-full bg-primary"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
              </div>
            )}
          </div>

          {/* Scrollable List */}
          <div
            ref={listScrollRef}
            className="flex-1 overflow-y-auto p-fluid-md space-y-fluid-xs pb-[180px] md:pb-4"
            onScroll={(e) => {
              const el = e.currentTarget;
              const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
              if (nearBottom) handleLoadMore();
            }}
          >
            {isLoading && structures.length === 0 ? (
              // Layout-matching skeleton cards
              <div className="space-y-fluid-xs">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card border border-border rounded-xl overflow-hidden animate-pulse flex flex-col h-auto">
                    <div className="w-full h-[180px] bg-muted shrink-0" />
                    <div className="p-fluid-sm flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                      <div className="flex justify-between items-end pt-2 border-t border-border/30 mt-2">
                        <div className="space-y-1 w-1/3">
                          <div className="h-2 bg-muted rounded w-1/2" />
                          <div className="h-4 bg-muted rounded w-full" />
                        </div>
                        <div className="h-8 bg-muted rounded-xl w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : structures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-fluid-xl gap-fluid-sm text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <MapPin size={28} className="text-muted-foreground/40" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-fluid-sm">Sin paneles en esta zona</p>
                  <p className="text-fluid-xs text-muted-foreground mt-1">Mueve el mapa para explorar otras áreas</p>
                </div>
              </div>
            ) : (
              <>
                {structures.map((s, idx) => (
                  <Card
                    key={s.id}
                    className={`cursor-pointer transition-all flex flex-col h-auto overflow-hidden group
          ${selectedStructure?.id === s.id
                        ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/35"
                        : "hover:border-primary hover:bg-muted/10"}`}
                    onClick={() => {
                      handleSelectStructure(s);
                      setActiveTab("map");
                    }}
                  >
                    <div className="w-full h-[180px] relative bg-muted shrink-0 border-b border-border/10">
                      {s.panels?.[0]?.photo_url ? (
                        <Image
                          src={s.panels[0].photo_url}
                          alt={s.address}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 480px"
                          priority={idx < 2}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted">
                          <MapIcon size={24} className="opacity-20" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-background/90 backdrop-blur text-[9px] font-medium px-1.5 py-0.5 rounded text-foreground shadow-sm">
                        {s.panels?.length || 0}
                      </div>
                    </div>
                    <div className="p-fluid-sm flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start mb-1 gap-fluid-2xs">
                          <h3 className={`font-semibold line-clamp-2 text-fluid-sm ${selectedStructure?.id === s.id ? "text-foreground" : "text-foreground"}`} title={s.address}>{s.address}</h3>
                          <Badge variant="secondary" className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap shrink-0", selectedStructure?.id === s.id ? "bg-primary/10 text-primary border-primary/20 font-semibold" : "text-muted-foreground/80")}>{s.code}</Badge>
                        </div>
                        <p className="text-fluid-xs truncate text-muted-foreground">{s.district}</p>
                      </div>

                      <div className="flex justify-between items-end pt-2 border-t border-border/50">
                        <div>
                          <p className="font-bold text-fluid-sm leading-none text-foreground">
                            S/ {calculateDisplayPrice(s).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-[10px] font-normal text-muted-foreground"> por día</span>
                          </p>
                        </div>
                        <Button size="sm" className="px-3 py-1.5 text-xs font-bold whitespace-nowrap shadow-sm cursor-pointer group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          Ver
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Infinite Scroll Trigger */}
                {hasMore && (
                  <div className="py-fluid-sm flex justify-center">
                    {isLoadingMore ? (
                      <div className="flex items-center gap-fluid-2xs text-fluid-xs text-muted-foreground">
                        <Loader2 size={14} className="animate-spin text-primary" />
                        <span>Cargando más paneles...</span>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadMore}
                        className="text-fluid-xs text-muted-foreground hover:text-foreground font-semibold hover:bg-transparent hover:underline cursor-pointer"
                      >
                        Cargar más
                      </Button>
                    )}
                  </div>
                )}

                {!hasMore && structures.length > 0 && totalCount > PAGE_SIZE && (
                  <p className="text-center text-[10px] text-muted-foreground pb-2">
                    Todos los {totalCount} paneles cargados.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* MIDDLE PANEL: Map */}
        <div className={`flex-1 relative h-full ${activeTab === "map" ? "block" : "hidden md:block"}`}>
          <UnifiedMap
            ref={mapRef}
            {...viewState}
            onLoad={(e) => {
              setMapLoaded(true);
              const bounds = e.target.getBounds();
              if (bounds) {
                currentBoundsRef.current = bounds;
                fetchStructuresInBounds(bounds);
              }
              if (selectedDistrictFeature) {
                fitDistrictBounds(e.target, isInitialLoadRef.current);
              }
            }}
            onIdle={(e) => {
              // Very reliable for initial load and after transitions
              const bounds = e.target.getBounds();
              if (bounds) fetchStructuresInBounds(bounds);
            }}
            onMove={e => setViewState(e.viewState)}
            onMoveEnd={handleMoveEnd}
            filteredStructures={filteredStructures}
            activeDistrict={activeDistrict}
            selectedStructure={selectedStructure}
            hoveredStructureId={hoveredStructureId}
            setHoveredStructureId={setHoveredStructureId}
            onSelectStructure={handleSelectStructure}
            calculateDisplayPrice={calculateDisplayPrice}
            selectedDistrictFeature={selectedDistrictFeature}
          />

          {/* Map Loader Overlay */}
          {!isInitialFitDone && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cargando mapa...</p>
            </div>
          )}

          {/* Loading Indicator for Map */}
          {isLoading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur px-4 py-2 rounded-full border border-border shadow-lg z-10 text-sm font-medium text-foreground flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              Buscando ubicaciones...
            </div>
          )}
        </div>




        {/* UNIFIED FILTER MODAL (Centered) */}
        <MapFiltersSidebar
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          setFilters={setFilters}
          filterOptions={filterOptions}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />

        {/* SIDE PANEL / MODAL (Mobile full-screen, Desktop right-side) */}
        <AnimatePresence>
          {selectedStructure && currentActivePanel && (
            <StructureDetailModal
              selectedStructure={selectedStructure}
              onClose={() => setSelectedStructure(null)}
              activePanelIndex={activePanelIndex}
              setActivePanelIndex={setActivePanelIndex}
              numberOfDays={numberOfDays}
              startDate={startDate}
              endDate={endDate}
              activeStartDate={activeStartDate}
              activeEndDate={activeEndDate}
              currentFinalDailyPrice={currentFinalDailyPrice}
              currentIsInCart={currentIsInCart}
              onAddToCart={(item) => {
                addCartItem(item);
                triggerToast(`¡Panel ${item.panelCode} añadido!`);
              }}
              onOpenCart={() => {
                setIsCartOpen(true);
                setSelectedStructure(null);
              }}
              getDisplayPrice={getDisplayPrice}
            />
          )}
        </AnimatePresence>

      </div> {/* CLOSE MAIN CONTENT AREA */}

      {/* MOBILE FLOATING CONTROL BAR (Only visible on map page when no detail modal is selected) */}
      {!selectedStructure && (
        <div className="md:hidden fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-4 right-4 z-[100] flex items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Segmented Control: Mapa / Lista */}
          <div className="flex items-center bg-card/95 backdrop-blur-md border border-border shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-1 shrink-0 pointer-events-auto h-14 w-[96px]">
            <button
              onClick={() => setActiveTab("map")}
              className={cn(
                "flex-1 h-full rounded-xl transition-all cursor-pointer flex items-center justify-center",
                activeTab === "map"
                  ? "bg-muted text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MapIcon size={18} />
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={cn(
                "flex-1 h-full rounded-xl transition-all cursor-pointer flex items-center justify-center",
                activeTab === "list"
                  ? "bg-muted text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List size={18} />
            </button>
          </div>

          {/* Search Button (Donde anunciar) */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex-1 flex items-center gap-2 px-4 h-14 text-sm font-bold text-muted-foreground bg-card/95 backdrop-blur-md border border-border shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl hover:bg-muted/30 transition-all text-left truncate pointer-events-auto cursor-pointer"
          >
            <Search size={18} className="text-muted-foreground shrink-0" strokeWidth={2.5} />
            <span className="truncate flex-1">
              {searchQuery || "¿Dónde anunciar?"}
            </span>
          </button>

          {/* Filters Button */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-2xl transition-all pointer-events-auto shadow-[0_8px_30px_rgb(0,0,0,0.12)] cursor-pointer shrink-0",
              hasActiveFilters || isFilterOpen
                ? "bg-primary border border-primary"
                : "bg-card/95 backdrop-blur-md border border-border hover:bg-muted/30"
            )}
          >
            <Filter size={20} className={cn((hasActiveFilters || isFilterOpen) ? "text-white" : "text-muted-foreground")} />
          </button>
        </div>
      )}

      {/* MOBILE SEARCH DIALOG / OVERLAY */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-background/95 backdrop-blur-md z-[300] flex flex-col p-4 pt-[calc(1rem+env(safe-area-inset-top))] animate-in fade-in duration-200"
          >
            {/* Header / Input Row */}
            <div className="flex items-center gap-3 w-full mb-6">
              <div className="relative flex-1 bg-card border border-border rounded-2xl flex items-center pr-3">
                <Search size={18} className="text-muted-foreground ml-4 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="¿Dónde quieres anunciarte?"
                  value={searchQuery}
                  onChange={(e) => handleLocationSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      executeSearch();
                      setIsSearchOpen(false);
                    }
                  }}
                  className="flex-1 pl-3 pr-2 py-3.5 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground font-semibold"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      handleLocationSearch("");
                      setPendingLocation(null);
                    }}
                    className="p-1 bg-muted hover:bg-muted/80 rounded-full transition-all text-muted-foreground"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsSearchOpen(false);
                  setShowSuggestions(false);
                }}
                className="text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground px-2"
              >
                Cancelar
              </Button>
            </div>

            {/* Suggestions list */}
            <div className="flex-1 overflow-y-auto space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-2 mb-2">Recomendados / Sugeridos</p>
              {suggestions.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Escribe al menos 2 caracteres para ver sugerencias.
                </div>
              ) : (
                suggestions.map((s: any, idx: number) => (
                  <div
                    key={s.id || s.districtKey || `mobile-sug-modal-${idx}`}
                    onClick={() => {
                      handleSelectSuggestionAndSearch(
                        s.center ? s.center[0] : 0,
                        s.center ? s.center[1] : 0,
                        s.place_name,
                        s
                      );
                      setIsSearchOpen(false);
                    }}
                    className="flex items-center gap-4 p-3 hover:bg-primary/[0.08] active:bg-primary/[0.08] rounded-xl cursor-pointer transition-all border border-border/10 hover:border-primary/20 bg-card"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-muted-foreground" />
                    </div>
                    <span className="text-xs font-bold text-foreground truncate">
                      {s.place_name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP FLOATING CART BUTTON */}
      <AnimatePresence>
        {cartItemCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: "-50%" }}
            animate={{ y: -40, opacity: 1, x: "-50%" }}
            exit={{ y: 100, opacity: 0, x: "-50%" }}
            className="hidden md:flex fixed bottom-0 left-1/2 z-[100]"
          >
            <Button
              onClick={() => {
                setIsCartOpen(true);
                setSelectedStructure(null);
              }}
              size="2xl"
              className="flex items-center gap-4 shadow-[0_20px_50px_-10px_hsl(var(--primary)/0.7)] group cursor-pointer"
            >
              <div className="bg-white/20 p-2 rounded-xl group-hover:bg-white/30 transition-colors">
                <ShoppingCart size={24} />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-white/80 text-xs font-medium uppercase tracking-widest">Resumen de Selección</span>
                <span>Ver Campaña ({cartItemCount} {cartItemCount === 1 ? 'panel seleccionado' : 'paneles seleccionados'})</span>
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
    .custom-scrollbar::-webkit-scrollbar {
     width: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
     background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
     background: rgba(15, 23, 42, 0.1);
     border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
     background: rgba(15, 23, 42, 0.2);
    }
   `}</style>
    </div>
  );
}
