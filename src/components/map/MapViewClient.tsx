"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Map, { Marker, Popup, ViewStateChangeEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
import { MapPin, X, SlidersHorizontal, List, Map as MapIcon, User, Users, Maximize, Navigation, ShoppingCart, Search, Filter, CheckCircle2, Trash2, Calendar, ChevronRight, Loader2, CreditCard, Clock, PlusCircle } from "lucide-react";
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

  const triggerToast = (message: string) => {
    setShowToast({ show: true, message });
    setTimeout(() => setShowToast({ show: false, message: "" }), 3000);
  };


  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: "" });
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

  useEffect(() => {
    async function loadFilterOptions(retries = 3) {
      for (let i = 0; i < retries; i++) {
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
          return; // Success, exit
        } catch (err: any) {
          if (i === retries - 1) {
            console.warn("Error loading filter options after retries:", err.message || err);
          } else {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
          }
        }
      }
    }
    loadFilterOptions();
  }, []);

  const [isFilterOpen, setIsFilterOpen] = useState(false);


  const PAGE_SIZE = 20;
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const currentBoundsRef = useRef<any>(null);

  const filteredStructures = useMemo(() => {
    if (!activeFilters.poi || !activeFilters.poi.category) return allStructures;
    const { category, maxDistance } = activeFilters.poi;
    return allStructures.filter(structure => {
      const pois = structure.poi_details?.por_categoria?.[category];
      if (!pois || !Array.isArray(pois)) return false;
      return pois.some(poi => poi.distancia_metros <= maxDistance);
    });
  }, [allStructures, activeFilters.poi]);

  useEffect(() => {
    setTotalCount(filteredStructures.length);
    setCurrentPage(0);
    setStructures(filteredStructures.slice(0, PAGE_SIZE));
    setHasMore(PAGE_SIZE < filteredStructures.length);
    if (listScrollRef.current) listScrollRef.current.scrollTop = 0;
  }, [filteredStructures]);


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
    const empty = {
      audience: null,
      mediaType: "",
      minPrice: null,
      maxPrice: null,
      poi: null,
    };
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
          <Button variant="link" onClick={resetFilters} className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider h-auto p-0 hover:underline">Limpiar Todo</Button>
        </div>
        <Select
          value={filters.mediaType}
          onChange={e => setFilters({ ...filters, mediaType: e.target.value })}
          className="bg-muted/50 rounded-[calc(var(--radius)*0.6875)] px-5 py-4 font-bold border-border"
        >
          <option value="">Todos los tipos</option>
          {filterOptions.mediaTypes.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Rango de Inversión Diaria</label>
        <div className="grid grid-cols-2 gap-4">
          <Select
            value={filters.minPrice || ''}
            onChange={e => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : null })}
            className="bg-muted/50 rounded-[calc(var(--radius)*0.6875)] px-5 py-4 font-bold border-border"
          >
            <option value="">Mínimo</option>
            {filterOptions.prices.map(p => (
              <option key={`min-${p}`} value={p}>S/ {p}</option>
            ))}
          </Select>
          <Select
            value={filters.maxPrice || ''}
            onChange={e => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : null })}
            className="bg-muted/50 rounded-[calc(var(--radius)*0.6875)] px-5 py-4 font-bold border-border"
          >
            <option value="">Máximo</option>
            {filterOptions.prices.map(p => (
              <option key={`max-${p}`} value={p}>S/ {p}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Alcance Potencial (Audiencia)</label>
        <Select
          value={filters.audience || ''}
          onChange={e => setFilters({ ...filters, audience: e.target.value ? Number(e.target.value) : null })}
          className="bg-muted/50 rounded-[calc(var(--radius)*0.6875)] px-5 py-4 font-bold border-border"
        >
          <option value="">Cualquier alcance</option>
          {filterOptions.audiences.map(a => (
            <option key={a} value={a}>{a.toLocaleString()}+ impactos</option>
          ))}
        </Select>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Puntos de Interés Cercanos (POI)</label>
        <Select
          value={filters.poi?.category || ""}
          onChange={(e) => {
            const cat = e.target.value;
            if (!cat) {
              setFilters({ ...filters, poi: null });
            } else {
              setFilters({
                ...filters,
                poi: {
                  category: cat,
                  maxDistance: filters.poi?.maxDistance || 300
                }
              });
            }
          }}
          className="bg-muted/50 rounded-[calc(var(--radius)*0.6875)] px-5 py-4 font-bold border-border"
        >
          <option value="">Cualquier punto de interés</option>
          <option value="Banco">Banco / ATM</option>
          <option value="Centro Comercial">Centro Comercial</option>
          <option value="Universidad">Universidad</option>
          <option value="Colegio">Colegio / Inicial</option>
          <option value="Gimnasio / Deporte">Gimnasio / Deporte</option>
          <option value="Hospital / Clínica">Hospital / Clínica</option>
          <option value="Aeropuerto">Aeropuerto</option>
          <option value="Mercado / Supermercado">Supermercado / Mercado</option>
          <option value="Grifo">Grifo / Gasolinera</option>
          <option value="Showroom de Carros">Showroom de Carros</option>
          <option value="Carwash">Car Wash</option>
          <option value="Botica / Farmacia">Botica / Farmacia</option>
          <option value="Restaurantes / Cafés">Restaurantes / Bares</option>
          <option value="Parque">Parque</option>
          <option value="Cultura / Atracción">Centro Cultural / Atracción</option>
          <option value="Telecomunicaciones">Telecomunicaciones</option>
        </Select>
      </div>

      {filters.poi?.category && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Radio de Búsqueda</label>
            <span className="text-xs font-extrabold text-primary">{filters.poi.maxDistance} metros</span>
          </div>
          <div className="space-y-2">
            <input
              type="range"
              min="100"
              max="500"
              step="200"
              value={filters.poi.maxDistance}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFilters({
                  ...filters,
                  poi: {
                    category: filters.poi!.category,
                    maxDistance: val
                  }
                });
              }}
              className="w-full accent-primary bg-muted rounded-lg h-2 cursor-pointer appearance-none"
            />
            <div className="flex justify-between text-[10px] font-extrabold text-muted-foreground/60 px-1">
              <span>100m</span>
              <span>300m</span>
              <span>500m</span>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={applyFilters}
        size="xl"
        className="w-full font-black text-xs uppercase tracking-[0.2em] mt-2 shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.5)]"
      >
        Aplicar Filtros
      </Button>
    </div>
  );

  const handleLocationSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const STREET_KEYWORDS = [
      'avenida', 'av.', 'av ', 'calle', 'jiron', 'jirón', 'jr.', 'jr ', 
      'pasaje', 'psj', 'carretera', 'panamericana', 'ovalo', 'óvalo', 
      'autopista', 'vía', 'via', 'esquina', 'cruce', 'cdra', 'cuadra', 'enlace'
    ];
    const isStreet = STREET_KEYWORDS.some(k => query.toLowerCase().includes(k));
    const types = isStreet 
      ? 'district,place,locality,neighborhood,address' 
      : 'district,place,locality';

    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=pe&proximity=-77.0428,-12.0464&language=es&types=${types}`);
      const data = await res.json();
      if (data.features) {
        let sortedFeatures = [...data.features];
        // Solo priorizar distritos si no es búsqueda de una calle/avenida
        if (!isStreet) {
          sortedFeatures.sort((a: any, b: any) => {
            const aIsDistrictOrLocality = a.place_type?.includes('district') || a.place_type?.includes('locality') || a.place_type?.includes('place') ? 1 : 0;
            const bIsDistrictOrLocality = b.place_type?.includes('district') || b.place_type?.includes('locality') || b.place_type?.includes('place') ? 1 : 0;
            return bIsDistrictOrLocality - aIsDistrictOrLocality;
          });
        }
        setSuggestions(sortedFeatures);
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
          query = query.gte("panels.daily_price", activeFilters.minPrice);
        }
        if (activeFilters.maxPrice) {
          query = query.lte("panels.daily_price", activeFilters.maxPrice);
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

    if (locationQuery) {
      setSearchQuery(locationQuery);

      // Si las coordenadas exactas ya vienen en la URL, las usamos directamente sin re-geocodificar
      if (latParam && lngParam) {
        const lat = Number(latParam);
        const lng = Number(lngParam);
        if (!isNaN(lat) && !isNaN(lng)) {
          setViewState(prev => ({
            ...prev,
            longitude: lng,
            latitude: lat,
            zoom: 14,
            transitionDuration: 1000
          }));

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

      const STREET_KEYWORDS = [
        'avenida', 'av.', 'av ', 'calle', 'jiron', 'jirón', 'jr.', 'jr ', 
        'pasaje', 'psj', 'carretera', 'panamericana', 'ovalo', 'óvalo', 
        'autopista', 'vía', 'via', 'esquina', 'cruce', 'cdra', 'cuadra', 'enlace'
      ];
      const isStreet = STREET_KEYWORDS.some(k => locationQuery.toLowerCase().includes(k));
      const types = isStreet 
        ? 'district,place,locality,neighborhood,address' 
        : 'district,place,locality';

      // De lo contrario, geocodificamos la consulta de texto como fallback
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationQuery)}.json?access_token=${MAPBOX_TOKEN}&country=pe&proximity=-77.0428,-12.0464&language=es&types=${types}`)
        .then(res => res.json())
        .then(data => {
          if (data.features && data.features.length > 0) {
            // Heurística de selección: si NO es calle, preferir distritos oficiales o ciudades
            const bestFeature = !isStreet
              ? (data.features.find((f: any) => 
                  f.place_type?.includes('district') || f.place_type?.includes('place')
                ) || data.features.find((f: any) =>
                  f.place_type?.includes('locality') || f.place_type?.includes('neighborhood')
                ) || data.features[0])
              : data.features[0]; // Si es calle/avenida, preferimos la primera coincidencia que es la dirección exacta

            console.log('[geocoding] fallbacked best feature on load:', bestFeature.place_name, bestFeature.place_type);
            const [lng, lat] = bestFeature.center;
            setViewState(prev => ({
              ...prev,
              longitude: lng,
              latitude: lat,
              zoom: 14,
              transitionDuration: 1000
            }));

            // Esperar a que el mapa se estabilice antes de cargar los paneles en el área
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
      // Carga inicial en la ubicación por defecto
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

    // 2. Prepare URL params
    const params = new URLSearchParams(searchParams?.toString());
    params.set("location", searchQuery);
    params.set("from", startDate);
    params.set("to", endDate);

    // 3. Handle location update
    if (pendingLocation) {
      // Si seleccionaron una sugerencia del buscador, usamos esas coordenadas exactas
      params.set("lat", pendingLocation.lat.toString());
      params.set("lng", pendingLocation.lng.toString());
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      setViewState(prev => ({
        ...prev,
        longitude: pendingLocation.lng,
        latitude: pendingLocation.lat,
        zoom: 14,
        transitionDuration: 1000
      }));
      setPendingLocation(null);

      // Cargar paneles en la nueva ubicación
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

        const STREET_KEYWORDS = [
          'avenida', 'av.', 'av ', 'calle', 'jiron', 'jirón', 'jr.', 'jr ', 
          'pasaje', 'psj', 'carretera', 'panamericana', 'ovalo', 'óvalo', 
          'autopista', 'vía', 'via', 'esquina', 'cruce', 'cdra', 'cuadra', 'enlace'
        ];
        const isStreet = STREET_KEYWORDS.some(k => searchQuery.toLowerCase().includes(k));
        const types = isStreet 
          ? 'district,place,locality,neighborhood,address' 
          : 'district,place,locality';

        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(finalQuery)}.json?access_token=${MAPBOX_TOKEN}&country=pe&proximity=-77.0428,-12.0464&language=es&types=${types}`);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          // Heurística de selección: si NO es calle, preferir distritos oficiales o ciudades
          const bestFeature = !isStreet
            ? (data.features.find((f: any) => 
                f.place_type?.includes('district') || f.place_type?.includes('place')
              ) || data.features.find((f: any) =>
                f.place_type?.includes('locality') || f.place_type?.includes('neighborhood')
              ) || data.features[0])
            : data.features[0]; // Si es calle/avenida, preferimos la primera coincidencia que es la dirección exacta

          console.log('[geocoding] executed best feature match:', bestFeature.place_name, bestFeature.place_type);
          const [lng, lat] = bestFeature.center;

          // Guardar las nuevas coordenadas geocodificadas en la URL para evitar rebotes
          params.set("lat", lat.toString());
          params.set("lng", lng.toString());
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });

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
      // Si no hay cambio de ubicación pero pudieron cambiar las fechas
      params.delete("lat");
      params.delete("lng");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

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

  const handleUpdateItemDates = (panelId: string, start: string, end: string) => {
    const item = cartItems.find(i => i.panelId === panelId);
    if (!item) return;

    // Use provided dates or fallback to current item dates or global defaults
    const newStart = start || item.startDate || today;
    const newEnd = end || item.endDate || defaultEnd;

    try {
      const s = parseISO(newStart);
      const e = parseISO(newEnd);

      // Validation: If dates are invalid, just update what we have
      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        useCartStore.getState().updateItem(panelId, {
          startDate: newStart,
          endDate: newEnd
        });
        return;
      }

      // Calculate difference
      let diff = differenceInDays(e, s);

      // Force at least 1 day if end is same or before start
      if (diff < 1) {
        diff = 1;
        const correctedEnd = addDays(s, 1).toISOString().split('T')[0];
        useCartStore.getState().updateItem(panelId, {
          startDate: newStart,
          endDate: correctedEnd,
          days: 1,
          totalPrice: Math.round(item.dailyPrice * 1 * 1.18 * 100) / 100
        });
        return;
      }

      // Normal update with recalculated price
      useCartStore.getState().updateItem(panelId, {
        startDate: newStart,
        endDate: newEnd,
        days: diff,
        totalPrice: Math.round(item.dailyPrice * diff * 1.18 * 100) / 100
      });
    } catch (error) {
      console.error("Error updating dates:", error);
    }
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
          />
        }
        right={
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "hidden md:flex px-4 items-center gap-2 text-sm font-medium",
                isFilterOpen
                  ? "bg-foreground text-background border-foreground shadow-md hover:bg-foreground/90"
                  : "bg-card/60 backdrop-blur-md border-border text-foreground hover:border-primary cursor-pointer"
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
            className="flex-1 overflow-y-auto p-4 space-y-3 pb-[180px] md:pb-4"
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
                  <div key={i} className="bg-card border border-border rounded-xl overflow-hidden animate-pulse flex flex-col h-auto">
                    <div className="w-full h-[180px] bg-muted shrink-0" />
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
                    <div className="p-3 flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h3 className={`font-semibold line-clamp-2 text-sm ${selectedStructure?.id === s.id ? "text-foreground" : "text-foreground"}`} title={s.address}>{s.address}</h3>
                          <Badge variant="secondary" className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap shrink-0", selectedStructure?.id === s.id ? "bg-primary/10 text-primary border-primary/20 font-semibold" : "text-muted-foreground/80")}>{s.code}</Badge>
                        </div>
                        <p className="text-xs truncate text-muted-foreground">{s.district}</p>
                      </div>

                      <div className="flex justify-between items-end pt-2 border-t border-border/50">
                        <div>
                          <p className="font-bold text-sm leading-none text-foreground">
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
                  <div className="py-4 flex justify-center">
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 size={14} className="animate-spin text-primary" />
                        <span>Cargando más paneles...</span>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadMore}
                        className="text-xs text-muted-foreground hover:text-foreground font-semibold hover:bg-transparent hover:underline"
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
          <Map
            ref={mapRef}
            {...viewState}
            onLoad={(e) => {
              const bounds = e.target.getBounds();
              if (bounds) {
                currentBoundsRef.current = bounds;
                fetchStructuresInBounds(bounds);
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
            {filteredStructures.map((structure) => (
              <Marker
                key={structure.id}
                longitude={structure.longitude}
                latitude={structure.latitude}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handleSelectStructure(structure);
                }}
                style={{
                  zIndex: hoveredStructureId === structure.id
                    ? 50
                    : selectedStructure?.id === structure.id
                    ? 40
                    : 10
                }}
              >
                <div
                  className={`flex items-center justify-center cursor-pointer transition-all duration-300 group
                ${selectedStructure?.id === structure.id ? "scale-125 z-10" : "hover:scale-110 z-0"}`}
                  onMouseEnter={() => setHoveredStructureId(structure.id)}
                  onMouseLeave={() => setHoveredStructureId(null)}
                >
                  <div className={`px-3 py-1.5 rounded-full shadow-md font-bold text-sm whitespace-nowrap transition-all duration-300
                  ${selectedStructure?.id === structure.id
                      ? "bg-primary text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border-none"
                      : "bg-white text-brand-dark group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] group-hover:border-none"}
                `}>
                    S/ {calculateDisplayPrice(structure).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] font-normal opacity-90 ml-0.5"></span>
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
                  className="pointer-events-auto w-full max-w-[420px] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                >
                  <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-muted rounded-2xl text-foreground">
                        <Filter size={22} />
                      </div>
                      <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Filtros</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsFilterOpen(false)}
                      className="rounded-2xl text-muted-foreground hover:text-foreground"
                    >
                      <X size={20} />
                    </Button>
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

      {/* MOBILE BOTTOM NAVBAR (Hidden when modal is open) */}
      {!selectedStructure && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          {/* Search floating above navbar */}
          <div className="px-4 pb-4 pointer-events-auto">
            <div className="relative w-full shadow-2xl rounded-[calc(var(--radius)*1.0)] bg-card border border-border">
              <button
                onClick={executeSearch}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10 p-1.5 hover:bg-muted rounded-[calc(var(--radius)*0.6875)] transition-all active:scale-90"
              >
                <Search size={20} strokeWidth={2.5} />
              </button>
              <Input
                type="text"
                value={searchQuery || ""}
                onChange={(e) => handleLocationSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="¿Dónde quieres anunciarte?"
                className="w-full pl-11 pr-12 py-3.5 bg-transparent rounded-[calc(var(--radius)*1.0)] text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 shadow-none ring-offset-transparent border-none h-auto"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    handleLocationSearch("");
                    setShowSuggestions(false);
                    setPendingLocation(null);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10 p-1.5 hover:bg-muted rounded-full transition-all active:scale-90"
                >
                  <X size={16} />
                </button>
              )}
              {/* Filter button removed from mobile search as requested */}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute bottom-full mb-2 left-0 right-0 bg-card border border-border rounded-[calc(var(--radius)*0.6875)] shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
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
          <div className="h-[calc(4rem+env(safe-area-inset-bottom))] bg-card/95 backdrop-blur border-t border-border flex items-center justify-around px-2 pointer-events-auto pb-[env(safe-area-inset-bottom)]">
            <button
              onClick={() => setActiveTab("map")}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors
                ${activeTab === "map" ? "text-primary font-black" : "text-muted-foreground hover:text-foreground"}`}
            >
              <MapIcon size={20} />
              <span className="text-[10px] font-medium">Mapa</span>
            </button>

            <button
              onClick={() => setActiveTab("list")}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors
                ${activeTab === "list" ? "text-primary font-black" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List size={20} />
              <span className="text-[10px] font-medium">Tarjetas</span>
            </button>

            <button
              onClick={() => setIsFilterOpen(true)}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${isFilterOpen ? 'text-primary font-black' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Filter size={20} />
              <span className="text-[10px] font-medium">Filtros</span>
            </button>

            <button
              onClick={() => {
                setIsCartOpen(true);
                setSelectedStructure(null);
              }}
              className="flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-foreground hover:text-foreground transition-colors relative"
            >
              <ShoppingCart size={20} />
              <span className="text-[10px] font-medium">Campaña</span>
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-3 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Mobile Profile / Auth Button */}
            <AuthButton mode="mobile" />
          </div>
        </div>
      )}

      {/* CART MODAL */}
      <Dialog
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        variant="fullscreen-mobile"
        hideCloseButton={true}
        noScroll={true}
        className="md:flex-row p-0 overflow-hidden"
      >
        {/* LEFT COLUMN: Header + Cart Items */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 border-r-0 md:border-r border-border">
          {/* Header */}
          <div className="p-5 pt-[calc(1.25rem+env(safe-area-inset-top))] md:pt-5 border-b border-border flex justify-between items-center bg-muted/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-xl">
                <ShoppingCart size={20} className="text-foreground" />
              </div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">Tu Campaña</h2>
              <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">{cartItemCount}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCartOpen(false)}
              className="bg-background/80 hover:bg-muted backdrop-blur-sm border border-border shadow-sm text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Scrollable Items */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar min-h-0">
            {checkoutSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6"
              >
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 size={48} className="text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">¡Pedido Recibido!</h3>
                  <p className="text-sm text-muted-foreground max-w-[240px] mx-auto font-medium leading-relaxed">
                    Tu solicitud de reserva para <span className="text-foreground font-bold">{cartItems.length} ubicaciones</span> ha sido enviada con éxito.
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl w-full border border-border/50 text-xs text-muted-foreground">
                  Un asesor de JMT se pondrá en contacto contigo en breve para finalizar los detalles técnicos y contractuales.
                </div>
                <Button
                  size="xl"
                  onClick={() => {
                    setCheckoutSuccess(false);
                    setIsCartOpen(false);
                  }}
                  className="w-full bg-foreground hover:bg-foreground/90 text-background font-black text-sm uppercase tracking-widest shadow-xl"
                >
                  Volver al Mapa
                </Button>
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
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Tu Campaña está vacío</h3>
                  <p className="text-sm text-muted-foreground max-w-[220px] mx-auto font-medium leading-relaxed">
                    Selecciona ubicaciones estratégicas en el mapa para tu campaña.
                  </p>
                </div>
                <Button
                  onClick={() => setIsCartOpen(false)}
                  size="xl"
                  className="font-black text-xs uppercase tracking-[0.2em] shadow-[0_15px_30px_-10px_hsl(var(--primary)/0.3)]"
                >
                  Explorar Ubicaciones
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                {cartItems.map((item) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    key={item.panelId}
                    className="flex flex-col md:grid md:grid-cols-[160px_1fr] rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all group overflow-hidden"
                  >
                    {/* Image: fixed height on mobile, auto height on desktop spanning both rows */}
                    <div className="relative w-full h-[180px] md:h-full md:row-span-2 shrink-0 bg-muted border-b md:border-b-0 md:border-r border-border/10">
                      {item.photoUrl ? (
                        <Image src={item.photoUrl} alt={item.address} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-brand-blue"><MapIcon size={20} className="opacity-20" /></div>
                      )}
                    </div>

                    {/* Top row: Basic info (Col 2 on mobile, Col 2 Row 1 on desktop) */}
                    <div className="p-3 md:p-4 flex flex-col gap-1.5 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-bold text-sm text-foreground leading-tight line-clamp-2">{item.address}</p>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeCartItem(item.panelId)}
                          className="text-red-500 hover:text-white hover:bg-red-500 transition-all bg-red-50 dark:bg-red-950/30 shrink-0"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin size={10} className="text-muted-foreground shrink-0" />
                        <span className="truncate">{item.district}</span>
                      </p>
                      <div className="pt-2 flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs font-mono px-1.5 py-0.5 rounded">{item.panelCode}</Badge>
                        <p className="font-bold text-sm text-foreground">S/ {item.totalPrice.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    {/* Bottom row: Dates & Summary Wrapper */}
                    <div className="px-3 pb-3 md:px-4 md:pb-4 md:pt-0 flex flex-col gap-3 min-w-0">
                      {/* Dates Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Start Date */}
                        <div
                          className="relative group flex flex-col gap-1 p-2 bg-background border border-border/50 rounded-xl hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={(e) => {
                            const input = e.currentTarget.querySelector('input');
                            if (input && 'showPicker' in input) {
                              try { (input as any).showPicker(); } catch (err) { console.warn(err); }
                            }
                          }}
                        >
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                            <Calendar size={11} className="text-muted-foreground" />
                            Inicio
                          </label>
                          <div className="text-xs font-bold text-foreground truncate pl-1">
                            {item.startDate ? (() => {
                              try {
                                const d = parseISO(item.startDate);
                                return isNaN(d.getTime()) ? '---' : format(d, 'dd/MM');
                              } catch { return '---'; }
                            })() : '---'}
                          </div>
                          <Input
                            type="date"
                            value={item.startDate || ""}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => handleUpdateItemDates(item.panelId, e.target.value, item.endDate || "")}
                            onClick={(e) => {
                              e.stopPropagation();
                              if ('showPicker' in e.currentTarget) {
                                try { (e.currentTarget as any).showPicker(); } catch (err) { console.warn(err); }
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 shadow-none ring-offset-transparent focus-visible:ring-0"
                          />
                        </div>

                        {/* End Date */}
                        <div
                          className="relative group flex flex-col gap-1 p-2 bg-background border border-border/50 rounded-xl hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={(e) => {
                            const input = e.currentTarget.querySelector('input');
                            if (input && 'showPicker' in input) {
                              try { (input as any).showPicker(); } catch (err) { console.warn(err); }
                            }
                          }}
                        >
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                            <Calendar size={11} className="text-muted-foreground" />
                            Fin
                          </label>
                          <div className="text-xs font-bold text-foreground truncate pl-1">
                            {item.endDate ? (() => {
                              try {
                                const d = parseISO(item.endDate);
                                return isNaN(d.getTime()) ? '---' : format(d, 'dd/MM');
                              } catch { return '---'; }
                            })() : '---'}
                          </div>
                          <Input
                            type="date"
                            value={item.endDate || ""}
                            min={item.startDate || new Date().toISOString().split('T')[0]}
                            onChange={(e) => handleUpdateItemDates(item.panelId, item.startDate || "", e.target.value)}
                            onClick={(e) => {
                              e.stopPropagation();
                              if ('showPicker' in e.currentTarget) {
                                try { (e.currentTarget as any).showPicker(); } catch (err) { console.warn(err); }
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 shadow-none ring-offset-transparent focus-visible:ring-0"
                          />
                        </div>
                      </div>


                    </div>
                  </motion.div>
                ))}

                {/* Promotional Card to Encourage Adding More Panels */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col rounded-xl border border-dashed border-primary/40 bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-sm hover:shadow-md transition-all justify-between items-center text-center gap-4 min-h-[220px] overflow-hidden group hover:border-primary cursor-pointer"
                  onClick={() => setIsCartOpen(false)}
                >
                  <div className="relative mt-2">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 group-hover:scale-175 transition-transform animate-pulse" />
                    <div className="relative w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-300">
                      <PlusCircle size={24} className="text-primary" />
                    </div>
                  </div>

                  <div className="space-y-1.5 z-10">
                    <p className="font-bold text-sm text-foreground">¿Quieres multiplicar tu alcance?</p>
                    <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
                      El <span className="text-primary font-bold">87% de las campañas exitosas</span> combinan más de 3 paneles. ¡Agrega otra ubicación y potencia tu impacto!
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-background border-primary/30 text-primary hover:bg-primary/5 hover:border-primary transition-all font-bold text-xs uppercase tracking-wider py-4 rounded-xl shadow-sm"
                  >
                    + Añadir más Paneles
                  </Button>
                </motion.div>
              </div>
            )}
          </div>

          {/* MOBILE BOTTOM BAR (Only visible on small screens when cart has items) */}
          {cartItems.length > 0 && !checkoutSuccess && (
            <div className="md:hidden p-4 border-t border-border bg-background shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-10 pb-safe">
              <Button
                disabled={isCheckingOut}
                size="xl"
                onClick={() => {
                  setIsCheckingOut(true);
                  router.push('/checkout');
                  setTimeout(() => setIsCheckingOut(false), 1000);
                }}
                className="w-full font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-[0_10px_25px_-5px_hsl(var(--primary)/0.4)]"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span>Proceder al Registro y Pago</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </Button>
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
              {cartItems.map((summaryItem) => (
                <div key={summaryItem.panelId} className="flex justify-between items-center px-5 py-3.5 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="font-bold text-sm text-foreground truncate uppercase tracking-tight">{summaryItem.panelCode}</p>
                    <p className="text-xs text-muted-foreground truncate font-medium">{summaryItem.address}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] font-black text-primary bg-primary/10 border-primary/20 px-1.5 py-0.5 rounded uppercase">{summaryItem.days} días</Badge>
                      <p className="text-[10px] text-muted-foreground font-bold tracking-tight">
                        {summaryItem.startDate ? (() => {
                          try {
                            const d = parseISO(summaryItem.startDate);
                            return isNaN(d.getTime()) ? '---' : format(d, 'dd/MM');
                          } catch { return '---'; }
                        })() : '---'} al {summaryItem.endDate ? (() => {
                          try {
                            const d = parseISO(summaryItem.endDate);
                            return isNaN(d.getTime()) ? '---' : format(d, 'dd/MM');
                          } catch { return '---'; }
                        })() : '---'}
                      </p>
                    </div>
                  </div>
                  <p className="font-black text-sm text-foreground whitespace-nowrap">S/ {summaryItem.totalPrice.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
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
                      <p className="text-2xl font-black text-foreground tracking-tighter">
                        S/ {Number(cartTotal.toFixed(2).split('.')[0]).toLocaleString()}
                      </p>
                      <p className="text-base font-black text-foreground opacity-60">
                        .{cartTotal.toFixed(2).split('.')[1]}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border-border">
                    <CreditCard size={10} />
                    Cotización
                  </Badge>
                </div>
              </div>
              <Button
                disabled={isCheckingOut}
                size="xl"
                onClick={() => {
                  setIsCheckingOut(true);
                  router.push('/checkout');
                  setTimeout(() => setIsCheckingOut(false), 1000);
                }}
                className="w-full font-black text-sm shadow-[0_15px_30px_-10px_hsl(var(--primary)/0.5)] flex items-center justify-center gap-3 group"
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
              </Button>
              <p className="text-center text-[10px] text-muted-foreground mt-3 font-medium italic">
                * Precios incluyen IGV. Sujeto a disponibilidad.
              </p>
            </div>
          </div>
        )}
      </Dialog>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {showToast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-[300] bg-foreground text-background px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-border min-w-[300px]"
          >
            <div className="bg-emerald-600 p-1 rounded-full">
              <CheckCircle2 size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm leading-tight">{showToast.message}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCartOpen(true);
                setSelectedStructure(null);
                setShowToast({ show: false, message: "" });
              }}
              className="bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 hover:text-white border-white/10"
            >
              Ver Campaña
            </Button>
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
              className="flex items-center gap-4 shadow-[0_20px_50px_-10px_hsl(var(--primary)/0.7)] group"
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
