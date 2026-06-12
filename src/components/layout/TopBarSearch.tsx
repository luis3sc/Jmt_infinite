"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Search, X, MapPin, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";

interface TopBarSearchProps {
  searchQuery: string;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  onSearch: () => void;
  suggestions: any[];
  showSuggestions: boolean;
  onSelectSuggestion: (lng: number, lat: number, placeName: string, suggestion?: any) => void;
  onLocationSearch: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const formatDateLabel = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return dateStr;
};

export default function TopBarSearch({
  searchQuery,
  onLocationSearch,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onSearch,
  suggestions,
  showSuggestions,
  onSelectSuggestion,
  onFocus,
  onBlur,
}: TopBarSearchProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex items-center gap-1.5 bg-background/60 backdrop-blur-md border border-border/80 px-2 py-1.5 rounded-input shadow-sm w-full md:max-w-[460px] lg:max-w-[580px] xl:max-w-[640px] mx-auto transition-all duration-300">
      
      {/* Search Input – grows to fill all available space */}
      <div className="flex-1 flex items-center gap-2 pl-2 relative min-w-0">
        <Search className="text-muted-foreground/60 shrink-0" size={15} />
        <input
          type="text"
          placeholder="Buscar distritos, avenidas, soportes..."
          value={searchQuery || ""}
          onChange={(e) => onLocationSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          className="bg-transparent border-none text-xs font-semibold focus:outline-none text-foreground w-full h-[40px] md:h-[44px] placeholder:text-muted-foreground/60 min-w-0"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onLocationSearch("")}
            className="absolute right-2 p-1 hover:bg-muted rounded-full text-muted-foreground transition-colors shrink-0"
          >
            <X size={13} />
          </button>
        )}

        {/* Autocomplete Suggestions */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-2 bg-background border border-border rounded-card shadow-xl z-[110] overflow-hidden max-h-[300px] overflow-y-auto"
            >
              {suggestions.map((s: any, idx: number) => (
                <button
                  key={s.id || idx}
                  type="button"
                  onClick={() => {
                    const [lng, lat] = s.center || [0, 0];
                    onSelectSuggestion(lng, lat, s.place_name, s);
                  }}
                  className="w-full text-left px-4 py-3 text-xs hover:bg-muted/80 transition-colors flex items-start gap-2 border-b border-border/40 last:border-b-0"
                >
                  <MapPin className="text-muted-foreground shrink-0 mt-0.5" size={14} />
                  <div>
                    <p className="font-bold text-foreground">{s.text}</p>
                    <p className="text-[10px] text-muted-foreground">{s.place_name}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="hidden lg:block h-7 w-px bg-border/80 shrink-0" />

      {/* Date Range – visible on lg+ */}
      <div className="hidden lg:flex items-center gap-1 px-1 shrink-0">
        {/* Desde */}
        <div className="relative flex items-center gap-1.5 cursor-pointer group h-[44px] px-2">
          <div className="pointer-events-none flex items-center gap-1">
            <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter leading-none whitespace-nowrap">
              Desde
            </span>
            <span className={cn(
              "text-[11px] font-bold whitespace-nowrap min-w-[60px]",
              startDate ? "text-foreground" : "text-muted-foreground/40"
            )}>
              {startDate ? formatDateLabel(startDate) : "Seleccionar"}
            </span>
          </div>
          <Input
            type="date"
            value={startDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setStartDate(e.target.value)}
            onClick={(e) => {
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
              if (!isMobile && 'showPicker' in e.currentTarget) {
                try { (e.currentTarget as any).showPicker(); } catch (err) { console.warn(err); }
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 shadow-none ring-offset-transparent focus-visible:ring-0 bg-transparent border-none"
          />
        </div>

        <div className="h-4 w-px bg-border mx-0.5 shrink-0" />

        {/* Hasta */}
        <div className="relative flex items-center gap-1.5 cursor-pointer group h-[44px] px-2">
          <div className="pointer-events-none flex items-center gap-1">
            <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter leading-none whitespace-nowrap">
              Hasta
            </span>
            <span className={cn(
              "text-[11px] font-bold whitespace-nowrap min-w-[60px]",
              endDate ? "text-foreground" : "text-muted-foreground/40"
            )}>
              {endDate ? formatDateLabel(endDate) : "Seleccionar"}
            </span>
          </div>
          <Input
            type="date"
            value={endDate}
            min={startDate || new Date().toISOString().split('T')[0]}
            onChange={(e) => setEndDate(e.target.value)}
            onClick={(e) => {
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
              if (!isMobile && 'showPicker' in e.currentTarget) {
                try { (e.currentTarget as any).showPicker(); } catch (err) { console.warn(err); }
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 shadow-none ring-offset-transparent focus-visible:ring-0 bg-transparent border-none"
          />
        </div>
      </div>

      {/* Date compact for md (tablet: show only labels, no pickers visible inline) */}
      <div className="hidden md:flex lg:hidden items-center gap-1 px-1 shrink-0">
        <div className="relative flex items-center gap-1 cursor-pointer group h-[44px] px-1">
          <div className="pointer-events-none flex items-center gap-1">
            <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter leading-none">Desde</span>
            <span className={cn("text-[10px] font-bold whitespace-nowrap", startDate ? "text-foreground" : "text-muted-foreground/40")}>
              {startDate ? formatDateLabel(startDate) : "—"}
            </span>
          </div>
          <Input
            type="date"
            value={startDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setStartDate(e.target.value)}
            onClick={(e) => {
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
              if (!isMobile && 'showPicker' in e.currentTarget) {
                try { (e.currentTarget as any).showPicker(); } catch (err) { console.warn(err); }
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 shadow-none ring-offset-transparent focus-visible:ring-0 bg-transparent border-none"
          />
        </div>
        <span className="text-muted-foreground/40 text-[10px] shrink-0">→</span>
        <div className="relative flex items-center gap-1 cursor-pointer group h-[44px] px-1">
          <div className="pointer-events-none flex items-center gap-1">
            <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter leading-none">Hasta</span>
            <span className={cn("text-[10px] font-bold whitespace-nowrap", endDate ? "text-foreground" : "text-muted-foreground/40")}>
              {endDate ? formatDateLabel(endDate) : "—"}
            </span>
          </div>
          <Input
            type="date"
            value={endDate}
            min={startDate || new Date().toISOString().split('T')[0]}
            onChange={(e) => setEndDate(e.target.value)}
            onClick={(e) => {
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
              if (!isMobile && 'showPicker' in e.currentTarget) {
                try { (e.currentTarget as any).showPicker(); } catch (err) { console.warn(err); }
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 shadow-none ring-offset-transparent focus-visible:ring-0 bg-transparent border-none"
          />
        </div>
      </div>

      {/* Search Button */}
      <Button
        onClick={() => onSearch()}
        size="icon-lg"
        className="flex items-center justify-center cursor-pointer shrink-0 ml-1"
      >
        <Search size={17} strokeWidth={3} />
        <span className="sr-only">Buscar</span>
      </Button>
    </div>
  );
}
