"use client";

import React, { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import BottomNavbar from "./BottomNavbar";
import MapCartSidebar from "@/components/map/components/MapCartSidebar";
import QuoteDialog from "@/components/map/components/QuoteDialog";
import QuotePDFDocument from "@/components/map/QuotePDFDocument";
import { useQuoteFlow } from "@/components/map/hooks/useQuoteFlow";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/Button";

interface GlobalLayoutWrapperProps {
  children: React.ReactNode;
}

export default function GlobalLayoutWrapper({ children }: GlobalLayoutWrapperProps) {
  const pathname = usePathname();
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const setIsCartOpen = useCartStore((state) => state.setIsCartOpen);
  const cartItems = useCartStore((state) => state.items);
  const cartTotal = useCartStore((state) => state.items.reduce((total, item) => total + item.totalPrice, 0));

  // Close cart sidebar when route changes (e.g. to /checkout)
  React.useEffect(() => {
    setIsCartOpen(false);
  }, [pathname, setIsCartOpen]);

  const [showToast, setShowToast] = useState({ show: false, message: "" });

  const triggerToast = useCallback((message: string) => {
    setShowToast({ show: true, message });
    setTimeout(() => setShowToast({ show: false, message: "" }), 3000);
  }, []);

  // Hook de Cotización
  const {
    isCampaignLoading,
    currentUser,
    isQuoteDialogOpen,
    setIsQuoteDialogOpen,
    quoteCampaignName,
    setQuoteCampaignName,
    quoteClientName,
    setQuoteClientName,
    quoteClientEmail,
    quoteClientPhone,
    quoteClientDocType,
    setQuoteClientDocType,
    quoteClientDocNumber,
    setQuoteClientDocNumber,
    quoteId,
    isSavingQuote,
    quoteSuccess,
    setQuoteSuccess,
    quoteRecoveryUrl,
    copiedLink,
    setCopiedLink,
    quoteDocRef,
    handleSaveAndDownloadQuote,
  } = useQuoteFlow({
    onOpenCart: useCallback(() => setIsCartOpen(true), [setIsCartOpen]),
    onTriggerToast: triggerToast,
  });

  return (
    <>
      {children}

      {/* Persistent Bottom Navigation Bar */}
      <BottomNavbar />

      {/* Global Campaign Cart Sidebar */}
      <MapCartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onQuoteClick={useCallback(() => {
          setQuoteSuccess(false);
          setIsQuoteDialogOpen(true);
        }, [setQuoteSuccess, setIsQuoteDialogOpen])}
      />

      {/* Global Quote Dialog */}
      <QuoteDialog
        isOpen={isQuoteDialogOpen}
        onClose={useCallback(() => setIsQuoteDialogOpen(false), [setIsQuoteDialogOpen])}
        onSubmit={handleSaveAndDownloadQuote}
        isSavingQuote={isSavingQuote}
        quoteCampaignName={quoteCampaignName}
        setQuoteCampaignName={setQuoteCampaignName}
        quoteClientName={quoteClientName}
        setQuoteClientName={setQuoteClientName}
        quoteSuccess={quoteSuccess}
        setQuoteSuccess={setQuoteSuccess}
        quoteRecoveryUrl={quoteRecoveryUrl}
        copiedLink={copiedLink}
        setCopiedLink={setCopiedLink}
      />

      {/* Off-screen Document for PDF quote generation */}
      <QuotePDFDocument
        campaignName={quoteCampaignName || "Campaña JMT"}
        clientName={quoteClientName || "Cliente"}
        clientEmail={quoteClientEmail || currentUser?.email || ""}
        clientPhone={quoteClientPhone || ""}
        clientDocType={quoteClientDocType || "DNI/RUC"}
        clientDocNumber={quoteClientDocNumber || ""}
        items={cartItems}
        totalAmount={cartTotal}
        recoveryUrl={quoteRecoveryUrl}
        quoteId={quoteId || "TEMP"}
        documentRef={quoteDocRef}
      />

      {/* Global Campaign Loader Overlay */}
      {isCampaignLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[500] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-bold text-foreground uppercase tracking-widest animate-pulse">
            Cargando cotización...
          </p>
        </div>
      )}

      {/* Global Toast Notification */}
      <AnimatePresence>
        {showToast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] bg-foreground text-background px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-border min-w-[300px]"
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
                setShowToast({ show: false, message: "" });
              }}
              className="bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 hover:text-white border-white/10"
            >
              Ver Campaña
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
