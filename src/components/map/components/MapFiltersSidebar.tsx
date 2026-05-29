"use client";

import React from "react";
import { Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

interface FilterOptions {
  mediaTypes: string[];
  prices: number[];
  audiences: number[];
}

interface Filters {
  audience: number | null;
  mediaType: string;
  minPrice: number | null;
  maxPrice: number | null;
  poi: { category: string; maxDistance: number } | null;
}

interface MapFiltersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: (val: Filters) => void;
  filterOptions: FilterOptions;
  onApply: () => void;
  onReset: () => void;
}

export default function MapFiltersSidebar({
  isOpen,
  onClose,
  filters,
  setFilters,
  filterOptions,
  onApply,
  onReset,
}: MapFiltersSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                  onClick={onClose}
                  className="rounded-2xl text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col gap-8 p-6">
                  {/* Media Type */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                        Tipo de Medio
                      </label>
                      <Button
                        variant="link"
                        onClick={onReset}
                        className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider h-auto p-0 hover:underline"
                      >
                        Limpiar Todo
                      </Button>
                    </div>
                    <Select
                      value={filters.mediaType}
                      onChange={(e) =>
                        setFilters({ ...filters, mediaType: e.target.value })
                      }
                      className="bg-muted/50 rounded-[calc(var(--radius)*0.6875)] px-5 py-4 font-bold border-border"
                    >
                      <option value="">Todos los tipos</option>
                      {filterOptions.mediaTypes.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Daily Price Range */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                      Rango de Inversión Diaria
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        value={filters.minPrice || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            minPrice: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="bg-muted/50 rounded-[calc(var(--radius)*0.6875)] px-5 py-4 font-bold border-border"
                      >
                        <option value="">Mínimo</option>
                        {filterOptions.prices.map((p) => (
                          <option key={`min-${p}`} value={p}>
                            S/ {p}
                          </option>
                        ))}
                      </Select>
                      <Select
                        value={filters.maxPrice || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            maxPrice: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="bg-muted/50 rounded-[calc(var(--radius)*0.6875)] px-5 py-4 font-bold border-border"
                      >
                        <option value="">Máximo</option>
                        {filterOptions.prices.map((p) => (
                          <option key={`max-${p}`} value={p}>
                            S/ {p}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Potential Audience */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                      Alcance Potencial (Audiencia)
                    </label>
                    <Select
                      value={filters.audience || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          audience: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="bg-muted/50 rounded-[calc(var(--radius)*0.6875)] px-5 py-4 font-bold border-border"
                    >
                      <option value="">Cualquier alcance</option>
                      {filterOptions.audiences.map((a) => (
                        <option key={a} value={a}>
                          {a.toLocaleString()}+ impactos
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Near POI */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                      Puntos de Interés Cercanos (POI)
                    </label>
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
                              maxDistance: filters.poi?.maxDistance || 300,
                            },
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
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                          Radio de Búsqueda
                        </label>
                        <span className="text-xs font-extrabold text-primary">
                          {filters.poi.maxDistance} metros
                        </span>
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
                                maxDistance: val,
                              },
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
                    onClick={onApply}
                    size="xl"
                    className="w-full font-black text-xs uppercase tracking-[0.2em] mt-2 shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.5)]"
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
