"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cartStore";

interface CampaignNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export default function CampaignNameModal({
  isOpen,
  onClose,
  onConfirm,
}: CampaignNameModalProps) {
  const currentStoreName = useCartStore((state) => state.campaignName);
  const defaultName = `Campaña JMT - ${format(new Date(), "MMM yyyy")}`;
  const [name, setName] = useState(currentStoreName || "");

  useEffect(() => {
    if (isOpen) {
      setName(currentStoreName || "");
    }
  }, [isOpen, currentStoreName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || defaultName;
    onConfirm(finalName);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      hideCloseButton
      className="max-w-md p-6 bg-card border border-border rounded-dialog relative overflow-hidden"
    >
      {/* Modal Header */}
      <div className="flex justify-between items-center pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl text-primary flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-foreground uppercase tracking-wider">
              Nombre de tu Campaña
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium">
              Asigna un nombre para identificarla fácilmente
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onConfirm(name.trim() || defaultName)}
          className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-wider">
            Nombre de la Campaña
          </label>
          <Input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`ej. ${defaultName}`}
            className="w-full text-sm font-semibold h-12"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            size="xl"
            className="w-full font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 h-13 shadow-[0_10px_25px_-5px_hsl(var(--primary)/0.4)]"
          >
            <span>Continuar a Ubicaciones</span>
            <ArrowRight size={16} />
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
