"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Map as MapIcon, Users, Maximize, Navigation, List, ShoppingCart, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

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

export default function StructureDetailModal({
  selectedStructure,
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
  if (!selectedStructure) return null;

  const currentActivePanel = selectedStructure.panels[activePanelIndex] || selectedStructure.panels[0];

  return (
    <AnimatePresence>
      {selectedStructure && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[140]"
          />

          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 md:top-[5%] md:left-[5%] md:w-[90vw] md:h-[90vh] md:rounded-[2rem] z-[150] bg-[#0e162b] text-white flex flex-col md:flex-row overflow-hidden shadow-2xl md:border md:border-white/10"
          >
            {/* Header with Close Button */}
            <div className="absolute top-0 left-0 right-0 z-30 flex justify-between items-center p-4">
              <div className="text-white font-bold tracking-tight shadow-sm px-4 py-1.5 bg-black/40 rounded-full text-xs backdrop-blur-md border border-white/10">
                {currentActivePanel.panel_code || selectedStructure.code}
              </div>
              <button
                onClick={onClose}
                className="bg-black/50 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-black/70 transition-all hover:scale-110 active:scale-95 border border-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Container for Image and Info - Scrolls on mobile, split on desktop */}
              <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar flex flex-col md:flex-row md:overflow-hidden">
                {/* Image Container - Static on Desktop */}
                <div className="relative h-[45vh] md:h-full w-full md:w-[55%] bg-[#1a233a] shrink-0 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentActivePanel.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="absolute inset-0"
                    >
                      {currentActivePanel.photo_url ? (
                        <Image src={currentActivePanel.photo_url} alt={selectedStructure.address} fill className="object-cover" priority />
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full text-white/30 bg-[#1a233a]">
                          <MapIcon size={48} className="mb-2 opacity-20" />
                          <span className="text-sm font-medium">Vista no disponible</span>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Custom Slider Navigation - Arrows */}
                  {selectedStructure.panels.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newIndex = (activePanelIndex - 1 + selectedStructure.panels.length) % selectedStructure.panels.length;
                          setActivePanelIndex(newIndex);
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white p-2 rounded-full text-[#0e162b] hover:bg-white/90 transition-all shadow-lg active:scale-90"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newIndex = (activePanelIndex + 1) % selectedStructure.panels.length;
                          setActivePanelIndex(newIndex);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white p-2 rounded-full text-[#0e162b] hover:bg-white/90 transition-all shadow-lg active:scale-90"
                      >
                        <ChevronRight size={24} />
                      </button>

                      {/* Pagination Bullets */}
                      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                        {selectedStructure.panels.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActivePanelIndex(idx)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activePanelIndex === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0e162b] to-transparent z-10" />
                </div>

                {/* Info Content - Scrollable on Desktop */}
                <div className="px-6 py-4 space-y-5 md:flex-1 md:overflow-y-auto md:custom-scrollbar md:pb-20">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-primary/30">
                        {currentActivePanel.media_type || "Estática"}
                      </span>
                      <span className="bg-white/5 text-white/70 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-white/10">
                        {currentActivePanel.format || "Panel"}
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">{selectedStructure.address}</h2>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-primary font-medium text-sm">
                        <MapPin size={16} />
                        <span>{selectedStructure.district}</span>
                      </div>
                      {selectedStructure.reference && <p className="text-white/50 text-sm italic">Ref: {selectedStructure.reference}</p>}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-6 flex justify-between items-end shadow-inner mb-2 md:hidden">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{numberOfDays > 0 ? `Inversión total (${numberOfDays} días)` : "Inversión diaria"}</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white tracking-tighter">S/ {Math.floor(getDisplayPrice(currentFinalDailyPrice)).toLocaleString()}</span>
                        <div className="flex flex-col">
                          <span className="text-white/40 text-[10px] font-bold uppercase leading-none">.{(getDisplayPrice(currentFinalDailyPrice) % 1).toFixed(2).split('.')[1]}</span>
                          <span className="text-primary text-[8px] font-black uppercase leading-none mt-1">Incl. IGV</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">DISPONIBLE</div>
                  </div>

                  <div className="border-b border-white/10 pb-6" />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
                      <Users size={18} className="text-primary" />
                      <div>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Alcance</span>
                        <p className="font-bold text-xl text-white">{currentActivePanel.audience ? currentActivePanel.audience.toLocaleString() : '125,000+'}</p>
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
                      <Maximize size={18} className="text-primary" />
                      <div>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Medidas</span>
                        <p className="font-bold text-xl text-white">{currentActivePanel.width && currentActivePanel.height ? `${currentActivePanel.width}x${currentActivePanel.height}m` : '12x4m'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {currentActivePanel.traffic_view && (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Navigation size={18} className="text-primary" />
                          <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Visibilidad</h4>
                        </div>
                        <p className="text-sm text-white/90 font-medium">{currentActivePanel.traffic_view}</p>
                      </div>
                    )}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <List size={18} className="text-primary" />
                        <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Especificaciones</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex justify-between py-1 border-b border-white/5"><span className="text-white/40">Código</span><span className="text-white font-bold">{currentActivePanel.panel_code || 'N/A'}</span></div>
                        <div className="flex justify-between py-1 border-b border-white/5"><span className="text-white/40">Material</span><span className="text-white font-bold">Lona Frontlit</span></div>
                        <div className="flex justify-between py-1"><span className="text-white/40">Iluminación</span><span className="text-white font-bold">Reflector LED</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="h-22 md:h-12" />
                </div>
              </div>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 md:left-auto md:w-[45%] p-6 bg-[#0e162b] pt-4 z-40 border-t border-white/10 flex flex-col md:flex-row items-center gap-4">
              {/* Desktop Price Display - 50% width split: Label Left, Price Right */}
              <div className="hidden md:flex w-1/2 items-center justify-between h-14 border-r border-white/5 pr-6">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] leading-tight">Inversión</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-black text-white uppercase tracking-widest leading-tight">
                      {numberOfDays > 0 ? "Total" : "Diaria"}
                    </span>
                    {numberOfDays > 0 && (
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        {numberOfDays} {numberOfDays === 1 ? 'Día' : 'Días'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-4xl font-black text-white tracking-tighter">
                      S/ {Math.floor(getDisplayPrice(currentFinalDailyPrice)).toLocaleString()}
                    </span>
                    <span className="text-white/40 text-sm font-bold">
                      .{(getDisplayPrice(currentFinalDailyPrice) % 1).toFixed(2).split('.')[1]}
                    </span>
                  </div>
                  <span className="text-primary text-[8px] font-black uppercase bg-primary/10 px-1.5 py-1 rounded border border-primary/20 whitespace-nowrap">
                    Incl. IGV
                  </span>
                </div>
              </div>

              {/* Action Button - 50% width */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                className={`w-full md:w-1/2 h-14 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl ${currentIsInCart ? "bg-white/10 text-white border border-white/20" : "bg-primary text-white"}`}
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

                  // If still no dates, use some sensible defaults (today to 30 days from now)
                  if (!actualStart || !actualEnd) {
                    const now = new Date();
                    actualStart = now.toISOString().split('T')[0];
                    const future = new Date();
                    future.setDate(future.getDate() + 30);
                    actualEnd = future.toISOString().split('T')[0];
                    actualDays = 30;
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
                      <CheckCircle2 size={22} className="text-primary" />
                      <span>Ir al Carrito</span>
                    </motion.div>
                  ) : (
                    <motion.div key="add-to-cart" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-3">
                      <ShoppingCart size={22} />
                      <span>Añadir al Carrito</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
