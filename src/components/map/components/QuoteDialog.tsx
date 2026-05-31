"use client";

import React from "react";
import { format } from "date-fns";
import { FileText, Loader2, Check, Copy, X, Link as LinkIcon } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface QuoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (downloadPdf: boolean) => void;
  isSavingQuote: boolean;
  quoteCampaignName: string;
  setQuoteCampaignName: (val: string) => void;
  quoteClientName: string;
  setQuoteClientName: (val: string) => void;
  quoteSuccess: boolean;
  setQuoteSuccess: (val: boolean) => void;
  quoteRecoveryUrl: string;
  copiedLink: boolean;
  setCopiedLink: (val: boolean) => void;
}

export default function QuoteDialog({
  isOpen,
  onClose,
  onSubmit,
  isSavingQuote,
  quoteCampaignName,
  setQuoteCampaignName,
  quoteClientName,
  setQuoteClientName,
  quoteSuccess,
  setQuoteSuccess,
  quoteRecoveryUrl,
  copiedLink,
  setCopiedLink,
}: QuoteDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      hideCloseButton
      className="max-w-md p-6 bg-card border border-border rounded-dialog shadow-2xl relative overflow-hidden"
    >
      {/* Modal Header */}
      <div className="flex justify-between items-center pb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <FileText className="text-primary" size={20} />
          <h3 className="text-base font-black text-foreground uppercase tracking-wider">Guardar y Cotizar</h3>
        </div>
        {!isSavingQuote && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-border flex items-center justify-center"
          >
            <X size={16} />
          </Button>
        )}
      </div>

      {!quoteSuccess ? (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ingresa los datos para registrar tu campaña. Podrás descargar un PDF formal o generar un enlace para reanudar tu compra más tarde.
          </p>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-wider">Nombre de la Campaña</label>
            <Input
              required
              type="text"
              value={quoteCampaignName}
              onChange={(e) => setQuoteCampaignName(e.target.value)}
              placeholder={`ej. Campaña JMT - ${format(new Date(), 'MMM yyyy')}`}
              className="w-full text-sm font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-wider">Nombre del Cliente / Empresa</label>
            <Input
              type="text"
              value={quoteClientName}
              onChange={(e) => setQuoteClientName(e.target.value)}
              placeholder="ej. Mi Empresa S.A.C. (Opcional)"
              className="w-full text-sm font-semibold"
            />
          </div>

          <div className="flex flex-col gap-2.5 mt-6">
            <Button
              type="button"
              disabled={isSavingQuote || !quoteCampaignName.trim()}
              size="xl"
              onClick={() => onSubmit(true)}
              className="w-full font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {isSavingQuote ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando tu documento...</span>
                </>
              ) : (
                <>
                  <FileText size={16} />
                  <span>Descargar Cotización en PDF</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline-primary"
              disabled={isSavingQuote || !quoteCampaignName.trim()}
              size="xl"
              onClick={() => onSubmit(false)}
              className="w-full font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <LinkIcon size={16} />
              <span>Guardar y Obtener Enlace</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center border border-emerald-200">
            <Check className="text-emerald-500 w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-lg text-foreground uppercase tracking-tight">¡Cotización Guardada!</h4>
            <p className="text-xs text-muted-foreground max-w-[280px]">
              El PDF se ha descargado de manera automática. Puedes enviar el siguiente enlace para reanudar la compra.
            </p>
          </div>

          {/* Share Link field */}
          <div className="w-full flex items-center gap-2 bg-muted/50 p-2.5 rounded-input border border-border/80">
            <input
              readOnly
              type="text"
              value={quoteRecoveryUrl}
              className="flex-1 bg-transparent text-xs font-mono text-foreground focus:outline-none select-all truncate pl-1"
            />
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                navigator.clipboard.writeText(quoteRecoveryUrl);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className={cn(
                "hover:bg-background shrink-0 border flex items-center justify-center",
                copiedLink ? "text-emerald-500 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20" : "text-muted-foreground"
              )}
              title="Copiar Enlace"
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>

          <Button
            size="lg"
            onClick={() => {
              onClose();
              setQuoteSuccess(false);
              setQuoteCampaignName("");
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-4 mt-2"
          >
            Cerrar
          </Button>
        </div>
      )}
    </Dialog>
  );
}
