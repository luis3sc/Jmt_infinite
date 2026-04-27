"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Map, { Marker, Popup, ViewStateChangeEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/lib/supabaseClient";
import { MapPin, X, SlidersHorizontal, List, Map as MapIcon, User, Users, Maximize, Navigation, ShoppingCart, Search, Filter, CheckCircle2, Trash2, Calendar, ChevronRight, Loader2, CreditCard, Clock } from "lucide-react";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, parseISO, differenceInDays } from "date-fns";
import { getCached, setCached } from "@/lib/bboxCache";
import AuthButton from "@/components/layout/AuthButton";
import TopBar from "@/components/layout/TopBar";
import TopBarSearch from "@/components/layout/TopBarSearch";
import { cn } from "@/lib/utils";


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
  traffic_view: string | null;
};

type Structure = {
  id: string;
  code: string;
  address: string;
  district: string;
  reference: string | null;
  latitude: number;
  longitude: number;
  panels: Panel[];
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function MapViewClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialLat = Number(searchParams?.get("lat")) || -12.0464; // Default Lima
  const initialLng = Number(searchParams?.get("lng")) || -77.0428;

  const fromParam = searchParams?.get("from");
  const toParam = searchParams?.get("to");

  const [viewState, setViewState] = useState({
    longitude: initialLng,
    latitude: initialLat,
    zoom: 13,
  });

  // Default dates for new items
  const today = new Date().toISOString().split('T')[0];
  const defaultEnd = addDays(new Date(), 30).toISOString().split('T')[0];

  // Staged states for active search (only update when "Buscar" is clicked)
  const [activeStartDate, setActiveStartDate] = useState(fromParam || today);
  const [activeEndDate, setActiveEndDate] = useState(toParam || defaultEnd);
  const [pendingLocation, setPendingLocation] = useState<{ lng: number, lat: number } | null>(null);
  const [startDate, setStartDate] = useState(fromParam || today);
  const [endDate, setEndDate] = useState(toParam || defaultEnd);

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
  const cartTotal = useCartStore((state) => state.getTotalPrice());

  const triggerToast = (message: string) => {
    setShowToast({ show: true, message });
    setTimeout(() => setShowToast({ show: false, message: "" }), 3000);
  };


  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: "" });
  const [structures, setStructures] = useState<Structure[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);
  const [activePanelIndex, setActivePanelIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "list">("map");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    audience: null as number | null,
    mediaType: "",
    minPrice: null as number | null,
    maxPrice: null as number | null,
  });

  const [activeFilters, setActiveFilters] = useState({
    audience: null as number | null,
    mediaType: "",
    minPrice: null as number | null,
    maxPrice: null as number | null,
  });

  const [filterOptions, setFilterOptions] = useState({
    mediaTypes: [] as string[],
    prices: [] as number[],
    audiences: [] as number[],
  });

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const { data: panels, error: panelError } = await supabase.from("panels").select("media_type, daily_price, audience");
        if (panelError) throw panelError;

        const uniqueMediaTypes = [...new Set(panels?.map(p => p.media_type).filter(Boolean) || [])].sort();
        const uniquePrices = [...new Set(panels?.map(p => p.daily_price).filter(Boolean) || [])].sort((a: any, b: any) => a - b);
        const uniqueAudiences = [...new Set(panels?.map(p => p.audience).filter(Boolean) || [])].sort((a: any, b: any) => a - b);

        setFilterOptions({
          mediaTypes: uniqueMediaTypes.length ? uniqueMediaTypes as string[] : ["Estática", "Digital"],
          prices: uniquePrices as number[],
          audiences: uniqueAudiences as number[],
        });
      } catch (err: any) {
        console.error("Error loading filter options:", err.message || err);
      }
    }
    loadFilterOptions();
  }, []);

  const [isFilterOpen, setIsFilterOpen] = useState(false);


  const PAGE_SIZE = 20;
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const currentBoundsRef = useRef<any>(null);


  const applyFilters = async () => {
    setActiveFilters(filters);

    // Close the modal on all screen sizes
    setIsFilterOpen(false);

    // manually trigger fetch to update with other filters
    if (mapRef.current) {
      const bounds = mapRef.current.getMap().getBounds();
      if (bounds) fetchStructuresInBounds(bounds);
    }
  };

  const resetFilters = () => {
    const empty = { audience: null, mediaType: "", minPrice: null, maxPrice: null };
    setFilters(empty);
    setActiveFilters(empty);
    if (mapRef.current) {
      const bounds = mapRef.current.getMap().getBounds();
      if (bounds) setTimeout(() => fetchStructuresInBounds(bounds), 0);
    }
  };

  const FilterContent = () => (
    <div className="flex flex-col gap-8 p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Tipo de Medio</label>
          <button onClick={resetFilters} className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline">Limpiar Todo</button>
        </div>
        <select
          value={filters.mediaType}
          onChange={e => setFilters({ ...filters, mediaType: e.target.value })}
          className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
        >
          <option value="">Todos los tipos</option>
          {filterOptions.mediaTypes.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Rango de Inversión Diaria</label>
        <div className="grid grid-cols-2 gap-4">
          <select
            value={filters.minPrice || ''}
            onChange={e => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : null })}
            className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 text-sm font-bold text-foreground focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">Mínimo</option>
            {filterOptions.prices.map(p => (
              <option key={`min-${p}`} value={p}>S/ {p}</option>
            ))}
          </select>
          <select
            value={filters.maxPrice || ''}
            onChange={e => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : null })}
            className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 text-sm font-bold text-foreground focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">Máximo</option>
            {filterOptions.prices.map(p => (
              <option key={`max-${p}`} value={p}>S/ {p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Alcance Potencial (Audiencia)</label>
        <select
          value={filters.audience || ''}
          onChange={e => setFilters({ ...filters, audience: e.target.value ? Number(e.target.value) : null })}
          className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 text-sm font-bold text-foreground focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">Cualquier alcance</option>
          {filterOptions.audiences.map(a => (
            <option key={a} value={a}>{a.toLocaleString()}+ impactos</option>
          ))}
        </select>
      </div>

      <button
        onClick={applyFilters}
        className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] mt-2 hover:bg-primary/90 transition-all shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.5)] active:scale-95"
      >
        Aplicar Filtros
      </button>
    </div>
  );

  const handleLocationSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=pe&proximity=-77.0428,-12.0464&language=es&types=place,locality,region,address`);
      const data = await res.json();
      if (data.features) {
        setSuggestions(data.features);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectSuggestion = (lng: number, lat: number, placeName: string) => {
    setSearchQuery(placeName);
    setShowSuggestions(false);
    setPendingLocation({ lng, lat });
    // Don't move the map or fetch yet - wait for "Buscar"
  };

  const mapRef = useRef<any>(null);

  // Paginated fetch with two-layer cache (memory + localStorage)
  const fetchStructuresInBounds = useCallback(async (bounds: any, page = 0) => {

    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // ── Cache check ────────────────────────────────────────────────────────
    const cached = getCached(sw.lat, sw.lng, ne.lat, ne.lng, page, activeFilters);
    if (cached) {
      const total = cached.count;
      setTotalCount(total);
      setCurrentPage(page);
      setHasMore(from + cached.data.length < total);
      if (page === 0) {
        setStructures(cached.data as Structure[]);
        if (listScrollRef.current) listScrollRef.current.scrollTop = 0;
      } else {
        setStructures(prev => [...prev, ...(cached.data as Structure[])]);
      }
      // Still mark loading as done in case it was triggered mid-flight
      setIsLoading(false);
      setIsLoadingMore(false);
      return; // ✅ cache hit — no network request
    }

    // ── Cache miss: fetch from Supabase ────────────────────────────────────
    if (page === 0) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const isPanelFiltering = activeFilters.audience || activeFilters.mediaType || activeFilters.minPrice || activeFilters.maxPrice;
      const relation = isPanelFiltering ? "panels!inner" : "panels";

      let query = supabase
        .from("structures")
        .select(
          `id, code, address, district, reference, latitude, longitude,
          ${relation} (id, panel_code, face, media_type, format, daily_price, photo_url, audience, width, height, traffic_view)`,
          { count: "exact" }
        )
        .gte("latitude", sw.lat)
        .lte("latitude", ne.lat)
        .gte("longitude", sw.lng)
        .lte("longitude", ne.lng);


      if (activeFilters.audience) {
        query = query.gte("panels.audience", activeFilters.audience);
      }
      if (activeFilters.mediaType) {
        query = query.eq("panels.media_type", activeFilters.mediaType);
      }
      if (activeFilters.minPrice) {
        query = query.gte("panels.daily_price", activeFilters.minPrice);
      }
      if (activeFilters.maxPrice) {
        query = query.lte("panels.daily_price", activeFilters.maxPrice);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      if (data) {
        const total = count ?? 0;

        // Write to cache before updating state
        setCached(sw.lat, sw.lng, ne.lat, ne.lng, page, data, total, activeFilters);

        setTotalCount(total);
        setCurrentPage(page);
        setHasMore(from + data.length < total);
        if (page === 0) {
          setStructures(data as Structure[]);
          if (listScrollRef.current) listScrollRef.current.scrollTop = 0;
        } else {
          setStructures(prev => [...prev, ...(data as Structure[])]);
        }
      }
    } catch (err: any) {
      console.error("Detailed error fetching structures:", err);
      // Log more details if it's a Supabase error
      if (err.message) console.error("Error message:", err.message);
      if (err.details) console.error("Error details:", err.details);
      if (err.hint) console.error("Error hint:", err.hint);

      triggerToast("Error al cargar los paneles. Por favor intenta de nuevo.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    const locationQuery = searchParams?.get("location");
    if (locationQuery) {
      setSearchQuery(locationQuery);
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationQuery)}.json?access_token=${MAPBOX_TOKEN}&country=pe&proximity=-77.0428,-12.0464&language=es&types=place,locality,region,address`)
        .then(res => res.json())
        .then(data => {
          if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            setViewState(prev => ({
              ...prev,
              longitude: lng,
              latitude: lat,
              zoom: 13,
              transitionDuration: 1000
            }));

            // Wait for map to settle before fetching
            setTimeout(() => {
              if (mapRef.current) {
                const bounds = mapRef.current.getMap().getBounds();
                if (bounds) fetchStructuresInBounds(bounds);
              }
            }, 1200);
          }
        })
        .catch(console.error);
    } else {
      // Initial fetch for default location
      setTimeout(() => {
        if (mapRef.current) {
          const bounds = mapRef.current.getMap().getBounds();
          if (bounds) fetchStructuresInBounds(bounds);
        }
      }, 1000);
    }
  }, [searchParams, fetchStructuresInBounds]);

  const executeSearch = async () => {
    // 1. Update active states
    setActiveStartDate(startDate);
    setActiveEndDate(endDate);

    // 2. Sync current state to URL
    const params = new URLSearchParams(searchParams?.toString());
    params.set("location", searchQuery);
    params.set("from", startDate);
    params.set("to", endDate);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });

    // 3. Handle location update
    if (pendingLocation) {
      setViewState(prev => ({
        ...prev,
        longitude: pendingLocation.lng,
        latitude: pendingLocation.lat,
        zoom: 14,
        transitionDuration: 1000
      }));
      setPendingLocation(null);

      // Fetch structures in the new location
      setTimeout(() => {
        if (mapRef.current) {
          fetchStructuresInBounds(mapRef.current.getMap().getBounds());
        }
      }, 1100);
    } else if (searchQuery.length >= 3) {
      try {
        let finalQuery = searchQuery;
        const lowerSearch = searchQuery.toLowerCase().trim();

        if (!lowerSearch.includes("peru")) {
          finalQuery = `${searchQuery}, Peru`;
        }

        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(finalQuery)}.json?access_token=${MAPBOX_TOKEN}&country=pe&proximity=-77.0428,-12.0464&language=es&types=place,locality,region,address`);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const first = data.features[0];
          const [lng, lat] = first.center;
          setViewState(prev => ({
            ...prev,
            longitude: lng,
            latitude: lat,
            zoom: 14,
            transitionDuration: 1000
          }));

          setTimeout(() => {
            if (mapRef.current) {
              fetchStructuresInBounds(mapRef.current.getMap().getBounds());
            }
          }, 1100);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Just refresh bounds if no specific location change but dates might have changed
      if (mapRef.current) {
        fetchStructuresInBounds(mapRef.current.getMap().getBounds());
      }
    }
  };

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
      fetchStructuresInBounds(bounds, 0);
    }, 350);
  };

  // Infinite scroll handler — appends the next page
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || !currentBoundsRef.current) return;
    fetchStructuresInBounds(currentBoundsRef.current, currentPage + 1);
  }, [isLoadingMore, hasMore, currentPage, fetchStructuresInBounds]);

  const getDailyDisplayPrice = (dailyPrice: number) => {
    return Math.round(dailyPrice * 1.18 * 100) / 100;
  };

  const getDisplayPrice = (dailyPrice: number) => {
    const basePrice = numberOfDays > 0 ? dailyPrice * numberOfDays : dailyPrice;
    return Math.round(basePrice * 1.18 * 100) / 100; // Round to 2 decimals
  };

  const calculateDisplayPrice = (structure: Structure) => {
    if (!structure.panels || structure.panels.length === 0) return getDisplayPrice(150);
    const prices = structure.panels.map((p) => p.daily_price || 150);
    const lowestNet = Math.min(...prices);
    return getDisplayPrice(lowestNet);
  };


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

  const handleUpdateItemDates = (panelId: string, start: string, end: string) => {
    if (!start || !end) return;

    try {
      const s = parseISO(start);
      const e = parseISO(end);

      // Basic validation: if dates are invalid, return
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return;

      let diff = differenceInDays(e, s);

      // Ensure at least 1 day and end >= start
      if (diff < 1) {
        diff = 1;
        const newEnd = addDays(s, 1).toISOString().split('T')[0];
        const item = cartItems.find(i => i.panelId === panelId);
        if (item) {
          useCartStore.getState().updateItem(panelId, {
            startDate: start,
            endDate: newEnd,
            days: 1,
            totalPrice: item.dailyPrice * 1 * 1.18
          });
        }
        return;
      }

      const item = cartItems.find(i => i.panelId === panelId);
      if (item) {
        useCartStore.getState().updateItem(panelId, {
          startDate: start,
          endDate: end,
          days: diff,
          totalPrice: Math.round(item.dailyPrice * diff * 1.18 * 100) / 100
        });
      }
    } catch (error) {
      console.error("Error updating dates:", error);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background">

      {/* TOP NAVBAR (Consolidated using TopBar component) */}
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
          />
        }
        right={
          <div className="hidden md:flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "hidden md:flex px-4 py-2 rounded-2xl transition-all flex items-center gap-2 text-sm font-medium border active:scale-95",
                isFilterOpen 
                  ? "bg-primary text-white border-primary shadow-[0_0_15px_hsl(var(--primary)/0.1)]" 
                  : "bg-card/60 backdrop-blur-md border-white/5 text-foreground hover:bg-muted"
              )}
            >
              <Filter size={18} />
              <span>Filtros</span>
            </button>
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
          <div className="px-4 py-3 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-foreground tracking-tight">
                  {isLoading ? "Buscando paneles..." : "Paneles en esta área"}
                </h2>
                <AnimatePresence mode="wait">
                  {!isLoading && (
                    <motion.p
                      key={totalCount}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-muted-foreground mt-0.5"
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
                      className="text-xs text-muted-foreground mt-0.5"
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
            className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 md:pb-4"
            onScroll={(e) => {
              const el = e.currentTarget;
              const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
              if (nearBottom) handleLoadMore();
            }}
          >
            {isLoading && structures.length === 0 ? (
              // Layout-matching skeleton cards
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse flex flex-row h-[120px]">
                    <div className="w-[35%] h-full bg-muted shrink-0" />
                    <div className="p-3 flex-1 flex flex-col justify-between min-w-0">
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
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <MapPin size={28} className="text-muted-foreground/40" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Sin paneles en esta zona</p>
                  <p className="text-xs text-muted-foreground mt-1">Mueve el mapa para explorar otras áreas</p>
                </div>
              </div>
            ) : (
              <>
                {structures.map((s) => (
                  <div
                    key={s.id}
                    className={`rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-row h-[130px] border
                    ${selectedStructure?.id === s.id 
                      ? "bg-[#0e162b] text-white border-primary shadow-sm" 
                      : "bg-[#0e162b] text-white border-white/10 hover:border-primary/40"}`}
                    onClick={() => {
                      handleSelectStructure(s);
                      setActiveTab("map");
                    }}
                  >
                    <div className="w-[35%] h-full relative bg-muted shrink-0">
                      {s.panels?.[0]?.photo_url ? (
                        <Image src={s.panels[0].photo_url} alt={s.address} fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-[#1a233a]">
                          <MapIcon size={24} className="opacity-20" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-background/90 backdrop-blur text-[9px] font-medium px-1.5 py-0.5 rounded text-foreground shadow-sm">
                        {s.panels?.length || 0}
                      </div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h3 className={`font-semibold truncate text-sm ${selectedStructure?.id === s.id ? "text-primary" : "text-foreground"}`} title={s.address}>{s.address}</h3>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 ${selectedStructure?.id === s.id ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground"}`}>{s.code}</span>
                        </div>
                        <p className={`text-xs truncate ${selectedStructure?.id === s.id ? "text-white/60" : "text-muted-foreground"}`}>{s.district}</p>
                      </div>

                      <div className="flex justify-between items-end pt-2 border-t border-border/50">
                        <div>
                          <p className={`text-[10px] leading-none mb-1 ${selectedStructure?.id === s.id ? "text-white/40" : "text-muted-foreground"}`}>Desde</p>
                          <p className={`font-bold text-sm leading-none ${selectedStructure?.id === s.id ? "text-primary" : "text-primary"}`}>
                            S/ {calculateDisplayPrice(s).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                            <span className={`text-[10px] font-normal ${selectedStructure?.id === s.id ? "text-white/40" : "text-muted-foreground"}`}>{numberOfDays > 0 ? "" : "/día"}</span>
                          </p>
                        </div>
                        <button className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20`}>
                          Ver
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Infinite Scroll Trigger */}
                {hasMore && (
                  <div className="py-4 flex justify-center">
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 size={14} className="animate-spin text-primary" />
                        <span>Cargando más paneles...</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleLoadMore}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        Cargar más
                      </button>
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
          <Map
            ref={mapRef}
            {...viewState}
            onLoad={(e) => {
              const bounds = e.target.getBounds();
              if (bounds) {
                currentBoundsRef.current = bounds;
                fetchStructuresInBounds(bounds, 0);
              }
            }}
            onIdle={(e) => {
              // Very reliable for initial load and after transitions
              const bounds = e.target.getBounds();
              if (bounds) fetchStructuresInBounds(bounds);
            }}
            onMove={e => setViewState(e.viewState)}
            onMoveEnd={handleMoveEnd}
            mapStyle="mapbox://styles/luis3sc/cmkew1btx007x01qq60hf55ok"
            mapboxAccessToken={MAPBOX_TOKEN}
            attributionControl={false}
          >
            {structures.map((structure) => (
              <Marker
                key={structure.id}
                longitude={structure.longitude}
                latitude={structure.latitude}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handleSelectStructure(structure);
                }}
              >
                <div
                  className={`flex items-center justify-center cursor-pointer transition-all duration-300 group
                ${selectedStructure?.id === structure.id ? "scale-125 z-10" : "hover:scale-110 z-0"}`}
                >
                  <div className={`px-3 py-1.5 rounded-full shadow-lg font-bold text-sm whitespace-nowrap transition-all duration-300 border-2
                  ${selectedStructure?.id === structure.id
                      ? "bg-primary text-white border-white shadow-[0_0_20px_rgba(98,174,64,0.5)]"
                      : "bg-[#0e162b] text-white border-primary group-hover:bg-primary group-hover:text-white group-hover:border-white group-hover:shadow-[0_0_20px_rgba(98,174,64,0.5)]"}
                `}>
                    S/ {calculateDisplayPrice(structure).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                </div>
              </Marker>
            ))}


          </Map>

          {/* Loading Indicator for Map */}
          {isLoading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur px-4 py-2 rounded-full border border-border shadow-lg z-10 text-sm font-medium text-foreground flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              Buscando ubicaciones...
            </div>
          )}
        </div>




        {/* UNIFIED FILTER MODAL (Centered) */}
        <AnimatePresence>
          {isFilterOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFilterOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
              />

              {/* Modal Container */}
              <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="pointer-events-auto w-full max-w-[420px] bg-card border border-border rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
                >
                  <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
                        <Filter size={22} />
                      </div>
                      <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Filtros</h2>
                    </div>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <FilterContent />
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* SIDE PANEL / MODAL (Mobile full-screen, Desktop right-side) */}
        <AnimatePresence>
          {selectedStructure && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedStructure(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[90]"
              />


              <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed inset-0 md:inset-y-0 md:right-0 md:left-auto md:w-[480px] z-[100] bg-[#0e162b] text-white flex flex-col overflow-hidden shadow-2xl md:border-l md:border-white/10"
              >
            {(() => {
              const activePanel = selectedStructure.panels[activePanelIndex] || selectedStructure.panels[0];
              if (!activePanel) return null;

              // Base daily price (net)
              const finalDailyPrice = Number(activePanel.daily_price || 150);

              return (
                <>
                  {/* Header with Close Button - Semi-transparent glass effect */}
                  <div className="absolute top-0 left-0 right-0 z-30 flex justify-between items-center p-4">
                    <div className="text-white font-bold tracking-tight shadow-sm px-4 py-1.5 bg-black/40 rounded-full text-xs backdrop-blur-md border border-white/10">
                      {activePanel.panel_code || selectedStructure.code}
                    </div>
                    <button
                      onClick={() => setSelectedStructure(null)}
                      className="bg-black/50 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-black/70 transition-all hover:scale-110 active:scale-95 border border-white/10"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Scrollable Content Container */}
                  <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar">
                    {/* Photo Area */}
                    <div className="relative h-[45vh] w-full bg-[#1a233a] shrink-0">
                      {activePanel.photo_url ? (
                        <Image
                          src={activePanel.photo_url}
                          alt={selectedStructure.address}
                          fill
                          className="object-cover"
                          priority
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full text-white/30 bg-[#1a233a]">
                          <MapIcon size={48} className="mb-2 opacity-20" />
                          <span className="text-sm font-medium">Vista no disponible</span>
                        </div>
                      )}

                      {/* Face Selector Overlay (if 2+ panels) */}
                      {selectedStructure.panels.length > 1 && (
                        <div className="absolute bottom-6 left-6 right-6 flex bg-black/60 backdrop-blur-xl p-1.5 rounded-2xl gap-2 z-20 border border-white/10 shadow-2xl">
                          {selectedStructure.panels.map((p, idx) => (
                            <button
                              key={p.id}
                              onClick={() => setActivePanelIndex(idx)}
                              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap px-4 ${activePanelIndex === idx
                                  ? 'bg-primary text-white shadow-[0_0_20px_hsl(var(--primary)/0.4)]'
                                  : 'text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                            >
                              Cara {p.face || (idx === 0 ? 'A' : 'B')}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Gradient Overlay for better text legibility */}
                      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0e162b] to-transparent z-10" />
                    </div>

                    {/* Details Area */}
                    <div className="px-6 py-4 space-y-6">
                      {/* Tags & Title */}
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-primary/30">
                            {activePanel.media_type || "Estática"}
                          </span>
                          <span className="bg-white/5 text-white/70 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-white/10">
                            {activePanel.format || "Panel"}
                          </span>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">
                          {selectedStructure.address}
                        </h2>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-primary font-medium text-sm">
                            <MapPin size={16} />
                            <span>{selectedStructure.district}</span>
                          </div>
                          {selectedStructure.reference && (
                            <p className="text-white/50 text-sm italic">
                              Ref: {selectedStructure.reference}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price Card - Prominent inside scroll */}
                      <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-6 flex justify-between items-end shadow-inner">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{numberOfDays > 0 ? `Inversión total (${numberOfDays} días)` : "Inversión diaria"}</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-white tracking-tighter">S/ {Math.floor(getDisplayPrice(finalDailyPrice)).toLocaleString()}</span>
                            <div className="flex flex-col">
                              <span className="text-white/40 text-[10px] font-bold uppercase leading-none">
                                .{(getDisplayPrice(finalDailyPrice) % 1).toFixed(2).split('.')[1]}
                              </span>
                              <span className="text-primary text-[8px] font-black uppercase leading-none mt-1">Incl. IGV</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                          DISPONIBLE
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 transition-colors hover:bg-white/10">
                          <div className="p-2 bg-primary/10 rounded-xl w-fit">
                            <Users size={18} className="text-primary" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Alcance</span>
                            <p className="font-bold text-xl text-white">
                              {activePanel.audience ? activePanel.audience.toLocaleString() : '125,000+'}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 transition-colors hover:bg-white/10">
                          <div className="p-2 bg-primary/10 rounded-xl w-fit">
                            <Maximize size={18} className="text-primary" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Medidas</span>
                            <p className="font-bold text-xl text-white">
                              {activePanel.width && activePanel.height ? `${activePanel.width}x${activePanel.height}m` : '12x4m'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="space-y-4">
                        {activePanel.traffic_view && (
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <Navigation size={18} className="text-primary" />
                              <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Visibilidad</h4>
                            </div>
                            <p className="text-sm text-white/90 font-medium leading-relaxed">
                              {activePanel.traffic_view}
                            </p>
                          </div>
                        )}

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <List size={18} className="text-primary" />
                            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Especificaciones</h4>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex justify-between items-center text-sm py-1 border-b border-white/5">
                              <span className="text-white/40">Código</span>
                              <span className="text-white font-bold">{activePanel.panel_code || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm py-1 border-b border-white/5">
                              <span className="text-white/40">Material</span>
                              <span className="text-white font-bold">Lona Frontlit</span>
                            </div>
                            <div className="flex justify-between items-center text-sm py-1">
                              <span className="text-white/40">Iluminación</span>
                              <span className="text-white font-bold">Reflector LED</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Spacing for fixed button */}
                      <div className="h-24" />
                    </div>
                  </div>

                  {/* Fixed Bottom Action Bar */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0e162b] via-[#0e162b] to-transparent pt-12 z-40">
                    {(() => {
                      const currentPanel = activePanel;
                      const panelDailyPrice = Number(currentPanel.daily_price || 150);
                      const isInCart = cartItems.some(i => i.panelId === currentPanel.id);
                      return (
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          className={`w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-2xl overflow-hidden
                            ${isInCart
                              ? "bg-white/10 text-white border border-white/20 hover:bg-white/20 shadow-none"
                              : "bg-primary hover:bg-primary/90 text-white shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.5)]"
                            }`}
                          onClick={() => {
                            if (isInCart) {
                              setIsCartOpen(true);
                              return;
                            }
                            addCartItem({
                              panelId: currentPanel.id,
                              structureId: selectedStructure.id,
                              panelCode: currentPanel.panel_code || selectedStructure.code,
                              address: selectedStructure.address,
                              district: selectedStructure.district,
                              photoUrl: currentPanel.photo_url || "",
                              dailyPrice: panelDailyPrice,
                              startDate: activeStartDate,
                              endDate: activeEndDate,
                              days: numberOfDays > 0 ? numberOfDays : 1,
                              totalPrice: Math.round(panelDailyPrice * (numberOfDays > 0 ? numberOfDays : 1) * 1.18 * 100) / 100,
                              format: currentPanel.format || "",
                              mediaType: currentPanel.media_type || ""
                            });
                            triggerToast(`¡Panel ${currentPanel.panel_code || selectedStructure.code} añadido!`);
                          }}
                        >
                          <AnimatePresence mode="wait">
                            {isInCart ? (
                              <motion.div
                                key="in-cart"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                className="flex items-center gap-3"
                              >
                                <CheckCircle2 size={22} className="text-primary" />
                                <span>Ir al Carrito</span>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="add-to-cart"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                className="flex items-center gap-3"
                              >
                                <ShoppingCart size={22} />
                                <span>Añadir al Carrito</span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })()}
                  </div>
                </>
              );
            })()}
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div> {/* CLOSE MAIN CONTENT AREA */}

      {/* MOBILE BOTTOM NAVBAR (Hidden when modal is open) */}
      {!selectedStructure && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          {/* Search floating above navbar */}
          <div className="px-4 pb-4 pointer-events-auto">
            <div className="relative w-full shadow-2xl rounded-2xl bg-card border border-border">
              <button
                onClick={executeSearch}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary z-10 p-1.5 hover:bg-primary/10 rounded-full transition-all active:scale-90"
              >
                <Search size={20} strokeWidth={2.5} />
              </button>
              <input
                type="text"
                value={searchQuery || ""}
                onChange={(e) => handleLocationSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar ubicaciones..."
                className="w-full pl-11 pr-12 py-3.5 bg-transparent rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {/* Filter button removed from mobile search as requested */}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute bottom-full mb-2 left-0 right-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                  {suggestions.map((s: any) => (
                    <li
                      key={s.id}
                      className="px-4 py-3 hover:bg-muted cursor-pointer text-sm border-b border-border last:border-0 truncate text-foreground"
                      onClick={() => handleSelectSuggestion(s.center[0], s.center[1], s.place_name)}
                    >
                      {s.place_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Bottom Nav Icons */}
          <div className="h-16 bg-card/95 backdrop-blur border-t border-border flex items-center justify-around px-2 pointer-events-auto pb-[env(safe-area-inset-bottom)]">
            <button
              onClick={() => setActiveTab("map")}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors
                ${activeTab === "map" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <MapIcon size={20} />
              <span className="text-[10px] font-medium">Mapa</span>
            </button>

            <button
              onClick={() => setActiveTab("list")}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors
                ${activeTab === "list" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List size={20} />
              <span className="text-[10px] font-medium">Tarjetas</span>
            </button>

            <button
              onClick={() => setIsFilterOpen(true)}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${isFilterOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Filter size={20} />
              <span className="text-[10px] font-medium">Filtros</span>
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-foreground hover:text-foreground transition-colors relative"
            >
              <ShoppingCart size={20} />
              <span className="text-[10px] font-medium">Carrito</span>
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-3 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
                  {cartItemCount}
                </span>
              )}
            </button>

            <AuthButton mode="mobile" />

          </div>
        </div>
      )}

      {/* CART MODAL */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[210] flex items-center justify-center pointer-events-none"
            >
              <div className="pointer-events-auto w-full h-full md:w-[90%] md:h-[90%] bg-card border-0 md:border border-border rounded-none md:rounded-3xl shadow-2xl flex flex-col md:flex-row">

                {/* LEFT COLUMN: Header + Cart Items */}
                <div className="flex-1 flex flex-col min-w-0 min-h-0 border-r-0 md:border-r border-border">
                  {/* Header */}
                  <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <ShoppingCart size={20} className="text-primary" />
                      </div>
                      <h2 className="text-lg font-bold text-foreground tracking-tight">Tu Carrito</h2>
                      <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{cartItemCount}</span>
                    </div>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Scrollable Items */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar min-h-0">
                    {checkoutSuccess ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6"
                      >
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                          <CheckCircle2 size={48} className="text-primary" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">¡Pedido Recibido!</h3>
                          <p className="text-sm text-muted-foreground max-w-[240px] mx-auto font-medium leading-relaxed">
                            Tu solicitud de reserva para <span className="text-foreground font-bold">{cartItems.length} ubicaciones</span> ha sido enviada con éxito.
                          </p>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-2xl w-full border border-border/50 text-xs text-muted-foreground">
                          Un asesor de JMT se pondrá en contacto contigo en breve para finalizar los detalles técnicos y contractuales.
                        </div>
                        <button
                          onClick={() => {
                            setCheckoutSuccess(false);
                            setIsCartOpen(false);
                          }}
                          className="w-full bg-foreground text-background py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-foreground/90 transition-all shadow-xl"
                        >
                          Volver al Mapa
                        </button>
                      </motion.div>
                    ) : cartItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-8">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                          <div className="relative w-28 h-28 bg-muted rounded-full flex items-center justify-center border border-border/50 shadow-2xl">
                            <ShoppingCart size={40} className="text-muted-foreground/30" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Tu Carrito está vacío</h3>
                          <p className="text-sm text-muted-foreground max-w-[220px] mx-auto font-medium leading-relaxed">
                            Selecciona ubicaciones estratégicas en el mapa para tu campaña.
                          </p>
                        </div>
                        <button
                          onClick={() => setIsCartOpen(false)}
                          className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_15px_30px_-10px_hsl(var(--primary)/0.5)]"
                        >
                          Explorar Ubicaciones
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {cartItems.map((item) => (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            key={item.panelId}
                            className="flex flex-row rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all group overflow-hidden"
                          >
                            {/* Image: fixed 96px on mobile, 35% on desktop */}
                            <div className="relative w-24 md:w-[35%] shrink-0 bg-muted">
                              {item.photoUrl ? (
                                <Image src={item.photoUrl} alt={item.address} fill className="object-cover" />
                              ) : (
                                <div className="flex items-center justify-center w-full h-full bg-[#1a233a]"><MapIcon size={20} className="opacity-20" /></div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="p-3 md:p-4 flex flex-col gap-1.5 flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <p className="font-bold text-sm text-foreground leading-tight line-clamp-2">{item.address}</p>
                                <button
                                  onClick={() => removeCartItem(item.panelId)}
                                  className="text-red-500 hover:text-white hover:bg-red-500 transition-all p-1.5 rounded-xl bg-red-50 dark:bg-red-950/30 shrink-0"
                                  title="Eliminar"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin size={10} className="text-primary shrink-0" />
                                <span className="truncate">{item.district}</span>
                              </p>
                              <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                                <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{item.panelCode}</span>
                                <p className="font-bold text-sm text-primary">S/ {item.totalPrice.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                              </div>

                              {/* Date Range */}
                              <div className="pt-2 border-t border-border/30">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="relative group flex flex-col gap-1 p-2 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer border border-border/50">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                      <Calendar size={10} className="text-primary" />
                                      Inicio
                                    </label>
                                    <div className="text-xs font-bold text-foreground truncate">
                                      {item.startDate ? new Date(item.startDate).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }) : '---'}
                                    </div>
                                    <input
                                      type="date"
                                      value={item.startDate || ""}
                                      min={new Date().toISOString().split('T')[0]}
                                      onChange={(e) => handleUpdateItemDates(item.panelId, e.target.value, item.endDate || "")}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const input = e.currentTarget;
                                        if ('showPicker' in input) {
                                          try { (input as any).showPicker(); } catch (err) { console.error(err); }
                                        }
                                      }}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                  </div>
                                  <div className="relative group flex flex-col gap-1 p-2 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer border border-border/50">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                      <Calendar size={10} className="text-primary" />
                                      Fin
                                    </label>
                                    <div className="text-xs font-bold text-foreground truncate">
                                      {item.endDate ? new Date(item.endDate).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }) : '---'}
                                    </div>
                                    <input
                                      type="date"
                                      value={item.endDate || ""}
                                      min={item.startDate || new Date().toISOString().split('T')[0]}
                                      onChange={(e) => handleUpdateItemDates(item.panelId, item.startDate || "", e.target.value)}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const input = e.currentTarget;
                                        if ('showPicker' in input) {
                                          try { (input as any).showPicker(); } catch (err) { console.error(err); }
                                        }
                                      }}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full text-[10px] font-black text-primary uppercase tracking-tight">
                                    <Clock size={10} />
                                    <span>{item.days} días</span>
                                  </div>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">S/ {item.dailyPrice.toFixed(2)} / día</p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* MOBILE BOTTOM BAR (Only visible on small screens when cart has items) */}
                  {cartItems.length > 0 && !checkoutSuccess && (
                    <div className="md:hidden p-4 border-t border-border bg-background shrink-0 flex flex-col gap-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-10 pb-safe">
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Total (Inc. IGV)</span>
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-xl font-black text-primary tracking-tighter">
                              S/ {Math.floor(cartTotal).toLocaleString()}
                            </span>
                            <span className="text-sm font-black text-primary opacity-60">
                              .{(cartTotal % 1).toFixed(2).split('.')[1]}
                            </span>
                          </div>
                        </div>
                        <button
                          disabled={isCheckingOut}
                          onClick={() => {
                            setIsCheckingOut(true);
                            router.push('/checkout');
                            setTimeout(() => setIsCheckingOut(false), 1000);
                          }}
                          className="flex-1 bg-primary text-white px-4 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-md ml-4"
                        >
                          {isCheckingOut ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <>
                              Pagar <ChevronRight size={14} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Payment Summary */}
                {cartItems.length > 0 && !checkoutSuccess && (
                  <div className="hidden md:flex w-full md:w-[340px] shrink-0 flex-col bg-muted/20">
                    <div className="p-5 border-b border-border shrink-0">
                      <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Resumen del Pedido</h3>
                      <p className="text-xs text-muted-foreground mt-1">{cartItemCount} {cartItemCount === 1 ? 'panel seleccionado' : 'paneles seleccionados'}</p>
                    </div>

                    {/* Items list — desktop only */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {cartItems.map((item) => (
                        <div key={item.panelId} className="flex justify-between items-center px-5 py-3.5 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                          <div className="min-w-0 flex-1 pr-3">
                            <p className="font-bold text-sm text-foreground truncate uppercase tracking-tight">{item.panelCode}</p>
                            <p className="text-xs text-muted-foreground truncate font-medium">{item.address}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">{item.days} días</span>
                              <p className="text-[10px] text-muted-foreground font-bold tracking-tight">{item.startDate} al {item.endDate}</p>
                            </div>
                          </div>
                          <p className="font-black text-sm text-foreground whitespace-nowrap">S/ {item.totalPrice.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-5 border-t border-border bg-card/80 backdrop-blur-md shrink-0">
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Subtotal</span>
                          <span className="text-foreground font-bold">S/ {(cartTotal / 1.18).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>IGV (18%)</span>
                          <span className="text-foreground font-bold">S/ {(cartTotal - (cartTotal / 1.18)).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="pt-3 border-t border-border/50 flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-1">Inversión Total</p>
                            <div className="flex items-baseline gap-0.5">
                              <p className="text-2xl font-black text-primary tracking-tighter">
                                S/ {Number(cartTotal.toFixed(2).split('.')[0]).toLocaleString()}
                              </p>
                              <p className="text-base font-black text-primary opacity-60">
                                .{cartTotal.toFixed(2).split('.')[1]}
                              </p>
                            </div>
                          </div>
                          <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-primary/20">
                            <CreditCard size={10} />
                            Cotización
                          </div>
                        </div>
                      </div>
                      <button
                        disabled={isCheckingOut}
                        onClick={() => {
                          setIsCheckingOut(true);
                          router.push('/checkout');
                          setTimeout(() => setIsCheckingOut(false), 1000);
                        }}
                        className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-[0_15px_30px_-10px_hsl(var(--primary)/0.5)] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        {isCheckingOut ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            <span className="uppercase tracking-widest text-xs">Procesando...</span>
                          </>
                        ) : (
                          <>
                            <span>Proceder al Pago</span>
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                      <p className="text-center text-[10px] text-muted-foreground mt-3 font-medium italic">
                        * Precios incluyen IGV. Sujeto a disponibilidad.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {showToast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-[300] bg-foreground text-background px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-border min-w-[300px]"
          >
            <div className="bg-primary p-1 rounded-full">
              <CheckCircle2 size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm leading-tight">{showToast.message}</p>
            </div>
            <button
              onClick={() => {
                setIsCartOpen(true);
                setShowToast({ show: false, message: "" });
              }}
              className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Ver Carrito
            </button>
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
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-4 px-10 py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-[0_20px_50px_-10px_hsl(var(--primary)/0.7)] font-bold text-lg transition-all hover:scale-105 active:scale-95 group"
            >
              <div className="bg-white/20 p-2 rounded-xl group-hover:bg-white/30 transition-colors">
                <ShoppingCart size={24} />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-white/80 text-xs font-medium uppercase tracking-widest">Resumen de Selección</span>
                <span>Ver Carrito ({cartItemCount} {cartItemCount === 1 ? 'panel seleccionado' : 'paneles seleccionados'})</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary)/0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary)/0.1);
        }
      `}</style>
    </div>
  );
}
