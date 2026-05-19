"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Map as MapIcon, Users, Maximize, Navigation, List, ShoppingCart, CheckCircle2, ChevronLeft, ChevronRight, WifiOff, RefreshCw } from "lucide-react";
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

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
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

  // Reset to loading whenever the active panel changes
  useEffect(() => {
    if (selectedStructure) {
      setImageStatus('loading');
    }
  }, [selectedStructure, activePanelIndex]);

  if (!selectedStructure) return null;

  const currentActivePanel = selectedStructure.panels[activePanelIndex] || selectedStructure.panels[0];

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
                  <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                      key={currentActivePanel.id}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                      }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.6}
                      onDragStart={(e) => e.stopPropagation()}
                      onDragEnd={(e, { offset, velocity }) => {
                        const swipeThreshold = 50;
                        const swipeVelocity = 0.5;
                        if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > swipeVelocity) {
                          if (offset.x < 0) {
                            // Swipe Left -> Next Image
                            const newIndex = (activePanelIndex + 1) % selectedStructure.panels.length;
                            handlePanelChange(newIndex);
                          } else {
                            // Swipe Right -> Prev Image
                            const newIndex = (activePanelIndex - 1 + selectedStructure.panels.length) % selectedStructure.panels.length;
                            handlePanelChange(newIndex);
                          }
                        }
                      }}
                      className="absolute inset-0 cursor-grab active:cursor-grabbing"
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

                  {/* Custom Slider Navigation - Arrows */}
                  {selectedStructure.panels.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          const newIndex = (activePanelIndex - 1 + selectedStructure.panels.length) % selectedStructure.panels.length;
                          handlePanelChange(newIndex);
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 shadow-lg hidden md:flex"
                      >
                        <ChevronLeft size={20} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          const newIndex = (activePanelIndex + 1) % selectedStructure.panels.length;
                          handlePanelChange(newIndex);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 shadow-lg hidden md:flex"
                      >
                        <ChevronRight size={20} />
                      </Button>

                      {/* Pagination Bullets */}
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/35 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 shadow-sm">
                        {selectedStructure.panels.map((_, idx) => {
                          const isActive = activePanelIndex === idx;
                          return (
                            <Button
                              key={idx}
                              variant="ghost"
                              onClick={() => handlePanelChange(idx)}
                              className="relative h-2 min-w-0 p-0 flex items-center justify-center cursor-pointer transition-all duration-300 bg-transparent hover:bg-transparent rounded-full"
                              style={{ width: isActive ? "18px" : "8px" }}
                            >
                              {isActive ? (
                                <motion.div
                                  layoutId="activeBullet"
                                  className="absolute inset-0 bg-white rounded-full"
                                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-white/40 hover:bg-white/60 transition-colors" />
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-card to-transparent z-10" />
                </div>

                {/* Info Content - Scrollable on Desktop */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="px-6 py-4 space-y-5 md:flex-1 md:overflow-y-auto md:custom-scrollbar pb-[calc(8.5rem+env(safe-area-inset-bottom))] md:pb-20"
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
                      {selectedStructure.reference && <p className="text-muted-foreground text-sm italic">Ref: {selectedStructure.reference}</p>}
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="bg-gradient-to-br from-muted to-background border border-border rounded-3xl p-5 flex flex-col gap-4 shadow-sm mb-2 md:hidden">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{numberOfDays > 0 ? `Inversión total (${numberOfDays} días)` : "Inversión diaria"}</span>
                      <div className="flex flex-row items-start gap-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight whitespace-nowrap">S/&nbsp;{Math.floor(getDisplayPrice(currentFinalDailyPrice)).toLocaleString()}</span>
                          <span className="text-muted-foreground text-sm font-bold">.{(getDisplayPrice(currentFinalDailyPrice) % 1).toFixed(2).split('.')[1]}</span>
                        </div>
                        <div className="flex flex-col gap-2 mt-1">
                          <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider leading-none">Incl. IGV</span>
                          <Badge className="text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 uppercase tracking-wider w-fit">
                            DISPONIBLE
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="border-b border-border pb-6" />

                  <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
                      <Users size={18} className="text-muted-foreground/80" />
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">Alcance</span>
                        <p className="font-bold text-xl text-foreground mt-1">{currentActivePanel.audience ? currentActivePanel.audience.toLocaleString() : '125,000+'}</p>
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
                      <Maximize size={18} className="text-muted-foreground/80" />
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">Medidas</span>
                        <p className="font-bold text-xl text-foreground mt-1">{currentActivePanel.width && currentActivePanel.height ? `${currentActivePanel.width}x${currentActivePanel.height}m` : '12x4m'}</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-4">
                    {currentActivePanel.traffic_view && (
                      <div className="bg-muted/50 border border-border rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Navigation size={18} className="text-muted-foreground/80" />
                          <h4 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">Visibilidad</h4>
                        </div>
                        <p className="text-sm text-foreground/90 font-medium leading-relaxed">{currentActivePanel.traffic_view}</p>
                      </div>
                    )}
                    <div className="bg-muted/50 border border-border rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <List size={18} className="text-muted-foreground/80" />
                        <h4 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">Especificaciones</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">Código</span><span className="text-foreground font-bold">{currentActivePanel.panel_code || 'N/A'}</span></div>
                        <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">Material</span><span className="text-foreground font-bold">Lona Frontlit</span></div>
                        <div className="flex justify-between py-1"><span className="text-muted-foreground">Iluminación</span><span className="text-foreground font-bold">Reflector LED</span></div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 md:left-auto md:w-[45%] px-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-6 bg-card z-40 border-t border-border flex flex-col md:flex-row items-center gap-4">
              {/* Desktop Price Display - 50% width split: Label Left, Price Right */}
              <div className="hidden md:flex w-1/2 items-center gap-4 h-14 border-r border-border pr-6">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-tight">Inversión</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider leading-tight">
                      {numberOfDays > 0 ? "Total" : "Diaria"}
                    </span>
                    {numberOfDays > 0 && (
                      <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                        {numberOfDays} {numberOfDays === 1 ? 'Día' : 'Días'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-4xl font-black text-foreground tracking-tight whitespace-nowrap">
                      S/&nbsp;{Math.floor(getDisplayPrice(currentFinalDailyPrice)).toLocaleString()}
                    </span>
                    <span className="text-muted-foreground text-sm font-bold">
                      .{(getDisplayPrice(currentFinalDailyPrice) % 1).toFixed(2).split('.')[1]}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs font-semibold uppercase bg-muted px-2 py-0.5 rounded-lg border border-border whitespace-nowrap">
                    Incl. IGV
                  </span>
                </div>
              </div>

              {/* Action Button - 50% width */}
              <Button
                variant={currentIsInCart ? "secondary" : "default"}
                size="xl"
                className="w-full md:w-1/2 font-bold text-xs uppercase tracking-wider shadow-md gap-3"
                onClick={() => {
                  if (currentIsInCart) { onOpenCart(); return; }

                  // Logic to ensure we always have valid dates and days for the cart
                  let actualDays = numberOfDays || 1;
                  let actualStart = activeStartDate;
                  let actualEnd = activeEndDate;

                  // Use the pending filter dates if they form a valid range
                  if (startDate && endDate) {
                    const s = new Date(startDate);
                    const e = new Date(endDate);
                    const d = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
                    if (d > 0) {
                      actualDays = d;
                      actualStart = startDate;
                      actualEnd = endDate;
                    }
                  }

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
                <AnimatePresence mode="wait">
                  {currentIsInCart ? (
                    <motion.div key="in-cart" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-3">
                      <CheckCircle2 size={22} className="text-emerald-600" />
                      <span>Ir al Carrito</span>
                    </motion.div>
                  ) : (
                    <motion.div key="add-to-cart" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-3">
                      <ShoppingCart size={22} />
                      <span>Añadir al Carrito</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
    </Dialog>
  );
}
