"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, parseISO, differenceInDays } from "date-fns";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  ShoppingCart,
  X,
  CheckCircle2,
  MapPin,
  Map as MapIcon,
  Trash2,
  Calendar,
  PlusCircle,
  FileText,
  Loader2,
  CreditCard,
  ChevronRight,
} from "lucide-react";

interface MapCartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onQuoteClick: () => void;
}

export default function MapCartSidebar({
  isOpen,
  onClose,
  onQuoteClick,
}: MapCartSidebarProps) {
  const router = useRouter();
  const cartItems = useCartStore((state) => state.items);
  const removeCartItem = useCartStore((state) => state.removeItem);
  const cartItemCount = useCartStore((state) => state.getTotalItems());
  const cartTotal = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.totalPrice, 0)
  );

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const defaultEnd = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  })();

  const handleUpdateItemDates = (
    panelId: string,
    start: string,
    end: string
  ) => {
    const item = cartItems.find((i) => i.panelId === panelId);
    if (!item) return;

    const newStart = start || item.startDate || today;
    const newEnd = end || item.endDate || defaultEnd;

    try {
      const s = parseISO(newStart);
      const e = parseISO(newEnd);

      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        useCartStore.getState().updateItem(panelId, {
          startDate: newStart,
          endDate: newEnd,
        });
        return;
      }

      let diff = differenceInDays(e, s);

      if (diff < 1) {
        diff = 1;
        const correctedEnd = addDays(s, 1).toISOString().split("T")[0];
        useCartStore.getState().updateItem(panelId, {
          startDate: newStart,
          endDate: correctedEnd,
          days: 1,
          totalPrice: Math.round(item.dailyPrice * 1 * 1.18 * 100) / 100,
        });
        return;
      }

      useCartStore.getState().updateItem(panelId, {
        startDate: newStart,
        endDate: newEnd,
        days: diff,
        totalPrice: Math.round(item.dailyPrice * diff * 1.18 * 100) / 100,
      });
    } catch (error) {
      console.error("Error updating dates:", error);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
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
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              Tu Campaña
            </h2>
            <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {cartItemCount}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
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
                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">
                  ¡Pedido Recibido!
                </h3>
                <p className="text-sm text-muted-foreground max-w-[240px] mx-auto font-medium leading-relaxed">
                  Tu solicitud de reserva para{" "}
                  <span className="text-foreground font-bold">
                    {cartItems.length} ubicaciones
                  </span>{" "}
                  ha sido enviada con éxito.
                </p>
              </div>
              <div className="bg-muted/50 p-4 rounded-xl w-full border border-border/50 text-xs text-muted-foreground">
                Un asesor de JMT se pondrá en contacto contigo en breve para
                finalizar los detalles técnicos y contractuales.
              </div>
              <Button
                size="xl"
                onClick={() => {
                  setCheckoutSuccess(false);
                  onClose();
                }}
                className="w-full bg-foreground hover:bg-foreground/90 text-background font-black text-sm uppercase tracking-widest shadow-xl"
              >
                Volver
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
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
                  Tu Campaña está vacía
                </h3>
                <p className="text-sm text-muted-foreground max-w-[220px] mx-auto font-medium leading-relaxed">
                  Selecciona ubicaciones estratégicas en el mapa para tu campaña.
                </p>
              </div>
              <Button
                onClick={onClose}
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
                  {/* Image */}
                  <div className="relative w-full h-[180px] md:h-full md:row-span-2 shrink-0 bg-muted border-b md:border-b-0 md:border-r border-border/10">
                    {item.photoUrl ? (
                      <Image
                        src={item.photoUrl}
                        alt={item.address}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-brand-blue">
                        <MapIcon size={20} className="opacity-20" />
                      </div>
                    )}
                  </div>

                  {/* Top row: Basic info */}
                  <div className="p-3 md:p-4 flex flex-col gap-1.5 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-bold text-sm text-foreground leading-tight line-clamp-2">
                        {item.address}
                      </p>
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
                      <Badge
                        variant="secondary"
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                      >
                        {item.panelCode}
                      </Badge>
                      <p className="font-bold text-sm text-foreground">
                        S/ {item.totalPrice.toLocaleString("es-PE", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Bottom row: Dates */}
                  <div className="px-3 pb-3 md:px-4 md:pb-4 md:pt-0 flex flex-col gap-3 min-w-0">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Start Date */}
                      <div
                        className="relative group flex flex-col gap-1 p-2 bg-background border border-border/50 rounded-xl hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={(e) => {
                          const input = e.currentTarget.querySelector("input");
                          if (input && "showPicker" in input) {
                            try {
                              (input as any).showPicker();
                            } catch (err) {
                              console.warn(err);
                            }
                          }
                        }}
                      >
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                          <Calendar size={11} className="text-muted-foreground" />
                          Inicio
                        </label>
                        <div className="text-xs font-bold text-foreground truncate pl-1">
                          {item.startDate
                            ? (() => {
                              try {
                                const d = parseISO(item.startDate);
                                return isNaN(d.getTime())
                                  ? "---"
                                  : format(d, "dd/MM");
                              } catch {
                                return "---";
                              }
                            })()
                            : "---"}
                        </div>
                        <Input
                          type="date"
                          value={item.startDate || ""}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) =>
                            handleUpdateItemDates(
                              item.panelId,
                              e.target.value,
                              item.endDate || ""
                            )
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            if ("showPicker" in e.currentTarget) {
                              try {
                                (e.currentTarget as any).showPicker();
                              } catch (err) {
                                console.warn(err);
                              }
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 shadow-none ring-offset-transparent focus-visible:ring-0"
                        />
                      </div>

                      {/* End Date */}
                      <div
                        className="relative group flex flex-col gap-1 p-2 bg-background border border-border/50 rounded-xl hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={(e) => {
                          const input = e.currentTarget.querySelector("input");
                          if (input && "showPicker" in input) {
                            try {
                              (input as any).showPicker();
                            } catch (err) {
                              console.warn(err);
                            }
                          }
                        }}
                      >
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                          <Calendar size={11} className="text-muted-foreground" />
                          Fin
                        </label>
                        <div className="text-xs font-bold text-foreground truncate pl-1">
                          {item.endDate
                            ? (() => {
                              try {
                                const d = parseISO(item.endDate);
                                return isNaN(d.getTime())
                                  ? "---"
                                  : format(d, "dd/MM");
                              } catch {
                                return "---";
                              }
                            })()
                            : "---"}
                        </div>
                        <Input
                          type="date"
                          value={item.endDate || ""}
                          min={
                            item.startDate ||
                            new Date().toISOString().split("T")[0]
                          }
                          onChange={(e) =>
                            handleUpdateItemDates(
                              item.panelId,
                              item.startDate || "",
                              e.target.value
                            )
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            if ("showPicker" in e.currentTarget) {
                              try {
                                (e.currentTarget as any).showPicker();
                              } catch (err) {
                                console.warn(err);
                              }
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 shadow-none ring-offset-transparent focus-visible:ring-0"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Promotional Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col rounded-xl border border-dashed border-primary/40 bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-sm hover:shadow-md transition-all justify-between items-center text-center gap-4 min-h-[220px] overflow-hidden group hover:border-primary cursor-pointer"
                onClick={onClose}
              >
                <div className="relative mt-2">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 transition-transform animate-pulse" />
                  <div className="relative w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 transition-transform duration-300">
                    <PlusCircle size={24} className="text-primary" />
                  </div>
                </div>

                <div className="space-y-1.5 z-10">
                  <p className="font-bold text-sm text-foreground">
                    ¿Quieres multiplicar tu alcance?
                  </p>
                  <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
                    El{" "}
                    <span className="text-primary font-bold">
                      87% de las campañas exitosas
                    </span>{" "}
                    combinan más de 3 paneles. ¡Agrega otra ubicación y potencia
                    tu impacto!
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

        {/* MOBILE BOTTOM BAR */}
        {cartItems.length > 0 && !checkoutSuccess && (
          <div className="md:hidden p-4 border-t border-border bg-background shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-10 pb-safe">
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                size="xl"
                onClick={onQuoteClick}
                className="w-[35%] h-14 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 border-primary/30 text-primary bg-background hover:bg-primary/5 hover:border-primary shrink-0 transition-all shadow-sm rounded-xl"
              >
                <FileText size={16} />
                <span>Cotizar</span>
              </Button>

              <Button
                disabled={isCheckingOut}
                size="xl"
                onClick={() => {
                  setIsCheckingOut(true);
                  router.push("/checkout");
                  setTimeout(() => setIsCheckingOut(false), 1000);
                }}
                className="flex-1 h-14 font-black text-sm flex items-center justify-center gap-1 shadow-[0_10px_25px_-5px_hsl(var(--primary)/0.4)]"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <span>Proceder al Pago</span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Payment Summary */}
      {cartItems.length > 0 && !checkoutSuccess && (
        <div className="hidden md:flex w-full md:w-[340px] shrink-0 flex-col bg-muted/20">
          <div className="p-5 border-b border-border shrink-0">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
              Resumen del Pedido
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {cartItemCount}{" "}
              {cartItemCount === 1
                ? "panel seleccionado"
                : "paneles seleccionados"}
            </p>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {cartItems.map((summaryItem) => (
              <div
                key={summaryItem.panelId}
                className="flex justify-between items-center px-5 py-3.5 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="font-bold text-sm text-foreground truncate uppercase tracking-tight">
                    {summaryItem.panelCode}
                  </p>
                  <p className="text-xs text-muted-foreground truncate font-medium">
                    {summaryItem.address}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-black text-primary bg-primary/10 border-primary/20 px-1.5 py-0.5 rounded uppercase"
                    >
                      {summaryItem.days} días
                    </Badge>
                    <p className="text-[10px] text-muted-foreground font-bold tracking-tight">
                      {summaryItem.startDate
                        ? (() => {
                          try {
                            const d = parseISO(summaryItem.startDate);
                            return isNaN(d.getTime())
                              ? "---"
                              : format(d, "dd/MM");
                          } catch {
                            return "---";
                          }
                        })()
                        : "---"}{" "}
                      al{" "}
                      {summaryItem.endDate
                        ? (() => {
                          try {
                            const d = parseISO(summaryItem.endDate);
                            return isNaN(d.getTime())
                              ? "---"
                              : format(d, "dd/MM");
                          } catch {
                            return "---";
                          }
                        })()
                        : "---"}
                    </p>
                  </div>
                </div>
                <p className="font-black text-sm text-foreground whitespace-nowrap">
                  S/{" "}
                  {summaryItem.totalPrice.toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            ))}
          </div>

          <div className="p-5 border-t border-border bg-card/80 backdrop-blur-md shrink-0">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground font-bold">
                  S/{" "}
                  {(cartTotal / 1.18).toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>IGV (18%)</span>
                <span className="text-foreground font-bold">
                  S/{" "}
                  {(cartTotal - cartTotal / 1.18).toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="pt-3 border-t border-border/50 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-1">
                    Inversión Total
                  </p>
                  <div className="flex items-baseline gap-0.5">
                    <p className="text-2xl font-black text-foreground tracking-tighter">
                      S/{" "}
                      {Number(cartTotal.toFixed(2).split(".")[0]).toLocaleString()}
                    </p>
                    <p className="text-base font-black text-foreground opacity-60">
                      .{cartTotal.toFixed(2).split(".")[1]}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border-border"
                >
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
                router.push("/checkout");
                setTimeout(() => setIsCheckingOut(false), 1000);
              }}
              className="w-full font-black text-sm shadow-[0_15px_30px_-10px_hsl(var(--primary)/0.5)] flex items-center justify-center gap-3 group"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span className="tracking-widest text-xs">
                    Procesando...
                  </span>
                </>
              ) : (
                <>
                  <span>Proceder al Pago</span>
                  <ChevronRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </Button>

            <Button
              size="xl"
              onClick={onQuoteClick}
              className="w-full mt-2.5 bg-primary text-white hover:bg-primary/90 text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>Guardar y Cotizar</span>
            </Button>

            <p className="text-center text-[10px] text-muted-foreground mt-2 leading-relaxed font-medium max-w-[280px] mx-auto">
              Guarda tu selección en la web y descarga un PDF con un enlace de
              recuperación para pagar después.
            </p>

            <p className="text-center text-[10px] text-muted-foreground mt-3 font-medium italic">
              * Precios incluyen IGV. Sujeto a disponibilidad.
            </p>
          </div>
        </div>
      )}
    </Dialog>
  );
}
