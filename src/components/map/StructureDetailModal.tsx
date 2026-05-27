"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, Map as MapIcon, Users, Maximize, Navigation, List, ShoppingCart, CheckCircle2,
  ChevronLeft, ChevronRight, WifiOff, RefreshCw, Eye, Timer, Image as ImageIcon, Calendar, Clock,
  Landmark, ShoppingBag, GraduationCap, School, Dumbbell, HeartPulse, Plane, Store, Fuel, Car,
  Sparkles, Pill, Utensils, Trees, PhoneCall
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";

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

interface StructureDetailModalProps {
  selectedStructure: Structure | null;
  onClose: () => void;
  activePanelIndex: number;
  setActivePanelIndex: (index: number) => void;
  numberOfDays: number;
  startDate: string;
  endDate: string;
  activeStartDate: string;
  activeEndDate: string;
  currentFinalDailyPrice: number;
  currentIsInCart: boolean;
  onAddToCart: (item: any) => void;
  onOpenCart: () => void;
  getDisplayPrice: (price: number) => number;
}

const fadeVariants = {
  enter: {
    opacity: 0,
  },
  center: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

const getPanelTabName = (panel: Panel, index: number) => {
  if (panel.face) {
    const faceStr = panel.face.trim();
    if (/^(cara|vista|lado|face)/i.test(faceStr)) return faceStr;
    return `Cara ${faceStr}`;
  }
  if (panel.panel_code) {
    const codeParts = panel.panel_code.trim().split(" ");
    const suffix = codeParts[codeParts.length - 1];
    if (suffix && suffix.length <= 2) return `Cara ${suffix}`;
    return panel.panel_code;
  }
  return `Cara ${String.fromCharCode(65 + index)}`;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 25
    }
  },
} as const;

const POI_CATEGORIES: Record<string, { label: string; icon: React.ComponentType<any> }> = {
  "Banco": { label: "Banco / ATM", icon: Landmark },
  "Centro Comercial": { label: "Centro Comercial", icon: ShoppingBag },
  "Universidad": { label: "Universidad", icon: GraduationCap },
  "Colegio": { label: "Colegio / Inicial", icon: School },
  "Gimnasio / Deporte": { label: "Gimnasio / Deporte", icon: Dumbbell },
  "Hospital / Clínica": { label: "Hospital / Clínica", icon: HeartPulse },
  "Aeropuerto": { label: "Aeropuerto", icon: Plane },
  "Mercado / Supermercado": { label: "Supermercado / Mercado", icon: Store },
  "Grifo": { label: "Grifo / Gasolinera", icon: Fuel },
  "Showroom de Carros": { label: "Showroom de Carros", icon: Car },
  "Carwash": { label: "Car Wash", icon: Sparkles },
  "Botica / Farmacia": { label: "Botica / Farmacia", icon: Pill },
  "Restaurantes / Cafés": { label: "Restaurante / Café / Bar", icon: Utensils },
  "Parque": { label: "Parque", icon: Trees },
  "Cultura / Atracción": { label: "Centro Cultural", icon: Landmark },
  "Telecomunicaciones": { label: "Telecomunicaciones", icon: PhoneCall },
  "Entretenimiento": { label: "Entretenimiento", icon: Sparkles },
  "Kiosco": { label: "Kiosco", icon: Store },
  "Aseguradora": { label: "Aseguradora", icon: Landmark },
  "Retail / Comercio": { label: "Retail / Comercio", icon: ShoppingBag }
};

export default function StructureDetailModal({
  selectedStructure: propSelectedStructure,
  onClose,
  activePanelIndex,
  setActivePanelIndex,
  numberOfDays,
  startDate,
  endDate,
  activeStartDate,
  activeEndDate,
  currentFinalDailyPrice,
  currentIsInCart,
  onAddToCart,
  onOpenCart,
  getDisplayPrice,
}: StructureDetailModalProps) {
  // Track image load state for skeleton + error UI
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [isMobile, setIsMobile] = useState(false);
  const [direction, setDirection] = useState(0); // 1 = next, -1 = prev
  const [detailTab, setDetailTab] = useState<"info" | "especificaciones" | "puntos_de_interes">("info");

  // Local state for dynamic cotizador dates, inheriting from parent search values or defaulting to a 1-day window
  const todayStr = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  const defaultEndStr = React.useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  const [localStartDate, setLocalStartDate] = useState(startDate || activeStartDate || todayStr);
  const [localEndDate, setLocalEndDate] = useState(endDate || activeEndDate || defaultEndStr);

  // Sync with global search dates ONLY when the modal opens or parent dates actually change, preventing local change overrides
  useEffect(() => {
    if (propSelectedStructure) {
      setLocalStartDate(startDate || activeStartDate || todayStr);
      setLocalEndDate(endDate || activeEndDate || defaultEndStr);
    }
  }, [propSelectedStructure, startDate, endDate, activeStartDate, activeEndDate, todayStr, defaultEndStr]);

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    if (diff > 0) {
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    return 1;
  };

  const localNumberOfDays = calculateDays(localStartDate, localEndDate);

  // Handle mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cache the selectedStructure to prevent UI layout shift or null exceptions during the exit animation
  const [cachedStructure, setCachedStructure] = useState<Structure | null>(null);

  useEffect(() => {
    if (propSelectedStructure) {
      setCachedStructure(propSelectedStructure);
    }
  }, [propSelectedStructure]);

  const selectedStructure = propSelectedStructure || cachedStructure;

  const nearbyPois = React.useMemo(() => {
    if (!selectedStructure?.poi_details?.por_categoria) return [];

    const allPois: Array<{
      nombre: string;
      distancia_metros: number;
      categoryKey: string;
      categoryLabel: string;
      icon: any;
    }> = [];

    Object.entries(selectedStructure.poi_details.por_categoria).forEach(([categoryName, list]) => {
      if (!Array.isArray(list) || list.length === 0) return;

      const cat = POI_CATEGORIES[categoryName] || { label: categoryName, icon: Landmark };
      const minDistance = Math.min(...list.map(item => item.distancia_metros));

      // Gather unique names for this category
      const uniqueNames = Array.from(new Set(list.map(item => item.nombre).filter(Boolean)));

      let formattedNames = "";
      if (uniqueNames.length > 0) {
        const sliceNames = uniqueNames.slice(0, 3);
        formattedNames = sliceNames.join(", ");
        if (uniqueNames.length > 3) {
          formattedNames += "...";
        }
      } else {
        formattedNames = cat.label;
      }

      allPois.push({
        nombre: formattedNames,
        distancia_metros: minDistance,
        categoryKey: categoryName,
        categoryLabel: cat.label,
        icon: cat.icon
      });
    });

    return allPois.sort((a, b) => a.distancia_metros - b.distancia_metros);
  }, [selectedStructure?.poi_details]);

  // Reset to loading whenever the active panel changes
  useEffect(() => {
    if (selectedStructure) {
      setImageStatus('loading');
    }
  }, [selectedStructure, activePanelIndex]);

  if (!selectedStructure) return null;

  const currentActivePanel = selectedStructure.panels[activePanelIndex] || selectedStructure.panels[0];

  // Price calculations including IGV (18%) using local cotizador state
  const dailyPriceWithIGV = Math.round(currentFinalDailyPrice * 1.18 * 100) / 100;
  const totalPriceWithIGV = localNumberOfDays > 0 ? Math.round(currentFinalDailyPrice * localNumberOfDays * 1.18 * 100) / 100 : dailyPriceWithIGV;

  const isDigital = currentActivePanel?.media_type?.toUpperCase() === "DIGITAL";

  // Dynamic B2C parameters based on database media_type
  const materialLabel = isDigital ? "Tecnología" : "Material";
  const materialValue = isDigital ? "Pantalla LED Inteligente" : "Lona Frontlit / Banner PVC";

  const frequencyLabel = "Frecuencia";
  const frequencyValue = isDigital
    ? "Spot de 7s (Cada 3 min, 480 pasadas/día)"
    : "Exposición 24/7 Permanente";

  const formatsLabel = "Formatos";
  const formatsValue = isDigital
    ? "MP4 (Video), JPG, PNG"
    : "Diseño Físico (PDF, AI, PSD)";

  const lightingLabel = "Iluminación";
  const lightingValue = isDigital
    ? "Brillo Inteligente / Regulable"
    : "Reflectores LED Alta Potencia";

  const resolutionLabel = "Resolución";
  const resolutionValue = currentActivePanel?.resolution_width && currentActivePanel?.resolution_height
    ? `${currentActivePanel.resolution_width}x${currentActivePanel.resolution_height}px`
    : "Alta Definición (HD)";

  // Generación dinámica inteligente de resoluciones recomendadas B2C en base a medidas y orientación
  const getDesignResolution = () => {
    if (currentActivePanel?.resolution_width && currentActivePanel?.resolution_height) {
      return `${currentActivePanel.resolution_width}x${currentActivePanel.resolution_height} px`;
    }

    const w = currentActivePanel?.width ? Number(currentActivePanel.width) : 12;
    const h = currentActivePanel?.height ? Number(currentActivePanel.height) : 6;

    // Si es vertical, aspecto vertical
    if (w < h) {
      if (isDigital) {
        return "720x1280 px (9:16)";
      } else {
        return "1080x1920 px (9:16)";
      }
    }

    // Si es horizontal
    if (isDigital) {
      if (w === 12 && h === 6) return "1280x640 px";
      if (w === 12 && h === 4) return "1280x427 px";
      const targetHeight = Math.round(1280 * (h / w));
      return `1280x${targetHeight} px`;
    } else {
      if (w === 12 && h === 6) return "1920x960 px ";
      if (w === 12 && h === 4) return "1920x640 px ";
      const targetHeight = Math.round(1920 * (h / w));
      return `1920x${targetHeight} px`;
    }
  };

  const handlePanelChange = (newIndex: number) => {
    let dir = 1;
    if (newIndex === 0 && activePanelIndex === selectedStructure.panels.length - 1) {
      dir = 1; // Wrap next
    } else if (newIndex === selectedStructure.panels.length - 1 && activePanelIndex === 0) {
      dir = -1; // Wrap prev
    } else if (newIndex < activePanelIndex) {
      dir = -1;
    }
    setDirection(dir);
    setActivePanelIndex(newIndex);
  };

  return (
    <Dialog
      isOpen={!!propSelectedStructure}
      onClose={onClose}
      variant="fullscreen-mobile"
      hideCloseButton={true}
      noScroll={true}
      className="md:flex-row p-0 overflow-hidden"
    >
      {/* Mobile Drag Handle Indicator (Left Edge) */}
      {isMobile && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-16 rounded-full bg-foreground/15 z-50 pointer-events-none" />
      )}

      <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] md:top-6 right-4 md:right-6 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="bg-background/80 hover:bg-muted backdrop-blur-sm border border-border shadow-sm text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <X size={20} />
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Container for Image and Info - Scrolls on mobile, split on desktop */}
        <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar flex flex-col md:flex-row md:overflow-hidden">
          {/* Image Container - Static on Desktop */}
          <div className="relative h-[45vh] md:h-full w-full md:w-[55%] bg-muted shrink-0 overflow-hidden select-none">
            {/* Structure Code Badge inside Image (scrolls up out of view on mobile, static on desktop) */}
            <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] left-4 md:top-6 md:left-6 z-30 text-white font-semibold tracking-wide shadow-sm px-4 py-1.5 bg-black/40 rounded-full text-xs backdrop-blur-md border border-white/10 animate-fade-in">
              {currentActivePanel.panel_code || selectedStructure.code}
            </div>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={currentActivePanel.id}
                variants={fadeVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  opacity: { duration: 0.3 }
                }}
                className="absolute inset-0"
              >
                {/* Skeleton while loading */}
                {imageStatus === 'loading' && currentActivePanel.photo_url && (
                  <div className="absolute inset-0 bg-muted z-10 overflow-hidden">
                    <div className="w-full h-full bg-shimmer animate-shimmer" />
                  </div>
                )}

                {/* Network error state */}
                {imageStatus === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted z-10">
                    <WifiOff size={36} className="text-muted-foreground/30" />
                    <p className="text-muted-foreground text-sm font-medium text-center px-8 leading-relaxed">
                      Sin conexión a internet.<br />Revisa tu señal e inténtalo de nuevo.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImageStatus('loading')}
                      className="text-xs font-bold mt-1 shadow-sm"
                    >
                      <RefreshCw size={13} />
                      Reintentar
                    </Button>
                  </div>
                )}

                {currentActivePanel.photo_url ? (
                  <Image
                    src={currentActivePanel.photo_url}
                    alt={selectedStructure.address}
                    fill
                    draggable={false}
                    className={`object-cover pointer-events-none transition-opacity duration-500 ${imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                    sizes="(max-width: 768px) 100vw, 55vw"
                    priority
                    onLoad={() => setImageStatus('loaded')}
                    onError={() => setImageStatus('error')}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground bg-muted">
                    <MapIcon size={48} className="mb-2 opacity-20" />
                    <span className="text-sm font-medium">Vista no disponible</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Premium Face Selection Tabs */}
            {selectedStructure.panels.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1 bg-black/55 backdrop-blur-md rounded-full border border-white/10 shadow-lg max-w-[90%] overflow-x-auto no-scrollbar">
                {selectedStructure.panels.map((panel, idx) => {
                  const tabName = getPanelTabName(panel, idx);
                  const isActive = activePanelIndex === idx;
                  return (
                    <button
                      key={panel.id}
                      type="button"
                      onClick={() => handlePanelChange(idx)}
                      className={`relative px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-300 whitespace-nowrap outline-none select-none ${isActive
                        ? "text-black font-extrabold"
                        : "text-white/70 hover:text-white font-bold"
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTabBg"
                          className="absolute inset-0 bg-white rounded-full"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{tabName}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-card to-transparent z-10" />
          </div>

          {/* Info Content - Scrollable on Desktop */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="px-6 py-4 space-y-5 md:flex-1 md:overflow-y-auto md:custom-scrollbar pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-24"
          >
            <motion.div variants={itemVariants} className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="uppercase tracking-wider">
                  {currentActivePanel.media_type || "Estática"}
                </Badge>
                <Badge variant="secondary" className="uppercase tracking-wider">
                  {currentActivePanel.format || "Panel"}
                </Badge>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight tracking-tight">{selectedStructure.address}</h2>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm">
                  <MapPin size={16} />
                  <span>{selectedStructure.district}</span>
                </div>

              </div>
            </motion.div>

            {/* DYNAMIC QUOTER & CAMPAIGN SUMMARY */}
            <motion.div variants={itemVariants} className="w-full bg-primary/[0.03] border border-primary/20 rounded-2xl p-4 md:p-6 space-y-4 shadow-[0_8px_30px_-6px_rgba(59,130,246,0.08)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <Calendar size={18} className="animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-wider">Cotizador de Campaña</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Desde</label>
                  <input
                    type="date"
                    value={localStartDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setLocalStartDate(e.target.value);
                      if (localEndDate && new Date(e.target.value) > new Date(localEndDate)) {
                        setLocalEndDate("");
                      }
                    }}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker();
                      } catch (err) { }
                    }}
                    onFocus={(e) => {
                      try {
                        e.currentTarget.showPicker();
                      } catch (err) { }
                    }}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Hasta</label>
                  <input
                    type="date"
                    value={localEndDate}
                    min={localStartDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setLocalEndDate(e.target.value)}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker();
                      } catch (err) { }
                    }}
                    onFocus={(e) => {
                      try {
                        e.currentTarget.showPicker();
                      } catch (err) { }
                    }}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground cursor-pointer"
                  />
                </div>
              </div>



              <div className="animate-fade-in">

                <div className="bg-background/60 border border-border/50 rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-5 md:gap-8 transition-all duration-300">
                  {/* Column 1: Dynamic Quoted Price */}
                  <div className="flex flex-col shrink-0 min-w-[150px]">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">Presupuesto</span>
                    <p className="text-3xl font-black text-foreground tracking-tight leading-none">
                      S/ {totalPriceWithIGV.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs font-bold text-muted-foreground mt-1.5">
                      S/ {dailyPriceWithIGV.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="font-medium text-muted-foreground/80">x {localNumberOfDays} {localNumberOfDays === 1 ? 'día' : 'días'}</span>
                    </p>
                    <div className="text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider mt-2">
                      * Incluye IGV (18%)
                    </div>
                  </div>

                  {/* Vertical/Horizontal Divider */}
                  <div className="hidden md:block w-px h-16 bg-border/80 self-stretch" />
                  <div className="md:hidden w-full h-px bg-border/80" />

                  {/* Column 2: Dynamic Reach & Impact metrics */}
                  <div className="flex flex-col gap-2.5 text-[13px] font-bold text-muted-foreground flex-1">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <p className="leading-tight">
                        <span className="text-foreground font-black text-base tracking-tight">
                          {(currentActivePanel.audience ? Math.round((currentActivePanel.audience / 30) * (localNumberOfDays || 1)) : 4100 * (localNumberOfDays || 1)).toLocaleString('en-US')}
                        </span>{" "}
                        <span className="font-semibold text-muted-foreground text-xs">personas alcanzadas</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/45 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary/70"></span>
                      </span>
                      <p className="leading-tight">
                        <span className="text-foreground font-black text-base tracking-tight">
                          {isDigital ? `${(480 * (localNumberOfDays || 1)).toLocaleString('en-US')}` : 'Exposición'}
                        </span>{" "}
                        <span className="font-semibold text-muted-foreground text-xs">{isDigital ? 'reproducciones estimadas' : 'permanente 24/7'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="w-full flex flex-col gap-4 mt-2">
              <div className="w-full h-px bg-border/60" />

              {/* Premium Underlined Tab switcher (No padding, border-b style) */}
              <div className="flex border-b border-border/80 gap-6 w-full relative z-10">
                <button
                  type="button"
                  onClick={() => setDetailTab("info")}
                  className={`pb-2 text-xs font-black uppercase tracking-wider relative transition-all duration-300 ${detailTab === "info"
                      ? "text-primary font-black"
                      : "text-muted-foreground hover:text-foreground font-bold"
                    }`}
                >
                  Info
                  {detailTab === "info" && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab("especificaciones")}
                  className={`pb-2 text-xs font-black uppercase tracking-wider relative transition-all duration-300 ${detailTab === "especificaciones"
                      ? "text-primary font-black"
                      : "text-muted-foreground hover:text-foreground font-bold"
                    }`}
                >
                  Especificaciones
                  {detailTab === "especificaciones" && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab("puntos_de_interes")}
                  className={`pb-2 text-xs font-black uppercase tracking-wider relative transition-all duration-300 ${detailTab === "puntos_de_interes"
                      ? "text-primary font-black"
                      : "text-muted-foreground hover:text-foreground font-bold"
                    }`}
                >
                  Puntos de Interés
                  {detailTab === "puntos_de_interes" && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              </div>

              {detailTab === "info" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6 animate-fade-in mt-1">
                  {/* Cerca de */}
                  {(selectedStructure.reference || currentActivePanel.traffic_view) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">Cerca de</span>
                        <span className="text-sm text-muted-foreground leading-snug">
                          {selectedStructure.reference || currentActivePanel.traffic_view}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Reproducciones diarias */}
                  <div className="flex items-start gap-3">
                    <Eye className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">Reproducciones diarias</span>
                      <span className="text-sm text-muted-foreground">
                        {isDigital ? "480 pasadas" : "24/7 Permanente"}
                      </span>
                    </div>
                  </div>

                  {/* Alcance diario */}
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">Alcance diario</span>
                      <span className="text-sm text-muted-foreground">
                        {currentActivePanel.audience ? Math.round(currentActivePanel.audience / 30).toLocaleString() : '4,100'} impactos
                      </span>
                    </div>
                  </div>

                  {/* Tamaño de pantalla */}
                  <div className="flex items-start gap-3">
                    <Maximize className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">Tamaño físico</span>
                      <span className="text-sm text-muted-foreground">
                        {currentActivePanel.width && currentActivePanel.height ? `${currentActivePanel.width}m x ${currentActivePanel.height}m` : '12m x 6m'}
                      </span>
                    </div>
                  </div>

                  {/* Horario de operación */}
                  {isDigital && currentActivePanel.operating_start_time && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">Horario de operación</span>
                        <span className="text-sm text-muted-foreground">
                          {currentActivePanel.operating_start_time.substring(0, 5)} - {currentActivePanel.operating_end_time === '00:00:00' ? '12:00 AM' : currentActivePanel.operating_end_time?.substring(0, 5)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {detailTab === "especificaciones" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6 animate-fade-in mt-1">
                  {/* Medidas del arte */}
                  <div className="flex items-start gap-3">
                    <ImageIcon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">Resolución / Medidas</span>
                      <span className="text-sm text-muted-foreground">
                        {getDesignResolution()}
                      </span>
                    </div>
                  </div>

                  {/* Duración de la reproducción */}
                  {isDigital && (
                    <div className="flex items-start gap-3">
                      <Timer className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">Duración del spot</span>
                        <span className="text-sm text-muted-foreground">
                          {currentActivePanel.slot_duration_seconds ? `${currentActivePanel.slot_duration_seconds}s` : '7s'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Formatos permitidos */}
                  <div className="flex items-start gap-3">
                    <List className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">Formatos permitidos</span>
                      <span className="text-sm text-muted-foreground leading-snug">
                        {isDigital ? "Video MP4 o Imágenes PNG / JPG" : "Lona impresa de Banner PVC o Lona Frontlit"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === "puntos_de_interes" && (
                <div className="animate-fade-in mt-1">
                  {nearbyPois.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center bg-muted/20 border border-border/40 rounded-2xl">
                      <MapIcon className="w-10 h-10 text-muted-foreground/30 animate-pulse" />
                      <p className="text-sm font-bold text-muted-foreground">Sin puntos de interés cercanos</p>
                      <p className="text-xs text-muted-foreground/80 max-w-[240px]">No se registraron locales comerciales ni servicios en un radio de 500m.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6">
                      {nearbyPois.map((poi, idx) => {
                        const Icon = poi.icon;
                        return (
                          <div key={`${poi.nombre}-${idx}`} className="flex items-start gap-3 min-w-0">
                            <Icon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="flex flex-col min-w-0 w-full">
                              <span className="text-sm font-semibold text-foreground truncate w-full" title={poi.categoryLabel}>{poi.categoryLabel}</span>
                              <span className="text-sm text-muted-foreground leading-snug truncate w-full" title={poi.nombre}>
                                {poi.nombre} <span className="text-[11px] text-primary font-bold ml-1 whitespace-nowrap">({poi.distancia_metros} m)</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 md:left-auto md:w-[45%] px-6 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-6 bg-card/95 backdrop-blur-md z-40 border-t border-border flex items-center shadow-[0_-10px_30px_rgba(0,0,0,0.04)]">
        {currentIsInCart ? (
          <div className="flex gap-3 w-full animate-fade-in">
            <Button
              variant="outline"
              size="xl"
              className="hidden md:flex flex-1 font-black text-xs uppercase tracking-[0.1em] border-primary/20 text-foreground hover:bg-muted"
              onClick={onClose}
            >
              Seguir Comprando
            </Button>
            <Button
              variant="default"
              size="xl"
              className="flex-1 font-black text-xs uppercase tracking-[0.1em] shadow-md gap-2"
              onClick={onOpenCart}
            >
              <ShoppingCart size={16} />
              Ver Campaña
            </Button>
          </div>
        ) : (
          <div className="flex gap-3 w-full animate-fade-in">
            <Button
              variant="outline"
              size="xl"
              className="hidden md:flex flex-1 font-black text-xs uppercase tracking-[0.15em] border-primary/20 text-foreground hover:bg-muted"
              onClick={onClose}
            >
              Seguir Comprando
            </Button>
            <Button
              variant="default"
              size="xl"
              className="flex-1 w-full md:w-auto font-black text-xs uppercase tracking-[0.15em] shadow-md gap-2.5 shrink-0 cursor-pointer"
              onClick={() => {
                // Logic to ensure we always have valid dates and days for the cart
                let actualDays = localNumberOfDays || 1;
                let actualStart = localStartDate;
                let actualEnd = localEndDate;

                // If still no dates, default to 1 day (today only)
                if (!actualStart || !actualEnd) {
                  const now = new Date();
                  actualStart = now.toISOString().split('T')[0];
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  actualEnd = tomorrow.toISOString().split('T')[0];
                  actualDays = 1;
                }

                onAddToCart({
                  panelId: currentActivePanel.id,
                  structureId: selectedStructure.id,
                  panelCode: currentActivePanel.panel_code || selectedStructure.code,
                  address: selectedStructure.address,
                  district: selectedStructure.district,
                  photoUrl: currentActivePanel.photo_url || "",
                  dailyPrice: currentFinalDailyPrice,
                  startDate: actualStart,
                  endDate: actualEnd,
                  days: actualDays,
                  totalPrice: Math.round(currentFinalDailyPrice * actualDays * 1.18 * 100) / 100,
                  format: currentActivePanel.format || "",
                  mediaType: currentActivePanel.media_type || ""
                });
              }}
            >
              <motion.div key="add-to-cart" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-2.5 justify-center w-full font-extrabold">
                <ShoppingCart size={18} />
                <span>Añadir a Campaña</span>
              </motion.div>
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
