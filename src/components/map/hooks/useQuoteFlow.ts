"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cartStore";

const supabase = createClient();

interface UseQuoteFlowProps {
  onOpenCart: () => void;
  onTriggerToast: (message: string) => void;
}

export function useQuoteFlow({ onOpenCart, onTriggerToast }: UseQuoteFlowProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const cartItems = useCartStore((state) => state.items);
  const cartTotal = useCartStore((state) => state.items.reduce((total, item) => total + item.totalPrice, 0));

  const [isCampaignLoading, setIsCampaignLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [quoteCampaignName, setQuoteCampaignName] = useState("");
  const [quoteClientName, setQuoteClientName] = useState("");
  const [quoteClientEmail, setQuoteClientEmail] = useState("");
  const [quoteClientPhone, setQuoteClientPhone] = useState("");
  const [quoteClientDocType, setQuoteClientDocType] = useState("DNI");
  const [quoteClientDocNumber, setQuoteClientDocNumber] = useState("");
  const [showLinkBanner, setShowLinkBanner] = useState(false);
  const [isLinkingCampaign, setIsLinkingCampaign] = useState(false);
  const [quoteId, setQuoteId] = useState("");
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [quoteRecoveryUrl, setQuoteRecoveryUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const quoteDocRef = useRef<HTMLDivElement>(null);
  const loadedCampaignIdRef = useRef<string | null>(null);

  // Cargar usuario actual para pre-llenar datos
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, company_name, phone, email, document_type, document_number")
            .eq("id", user.id)
            .maybeSingle();
          if (profile) {
            setQuoteClientName(profile.company_name || profile.full_name || "");
            setQuoteClientEmail(profile.email || user.email || "");
            setQuoteClientPhone(profile.phone || "");
            setQuoteClientDocType(profile.document_type || "DNI");
            setQuoteClientDocNumber(profile.document_number || "");
          } else {
            setQuoteClientEmail(user.email || "");
          }
        }
      } catch (err) {
        console.warn("Error fetching user session for quote:", err);
      }
    };
    fetchUser();
  }, []);

  // Rehidratar campaña compartida desde la URL ?campaign=UUID
  const campaignIdParam = searchParams?.get("campaign");
  useEffect(() => {
    if (campaignIdParam && campaignIdParam !== loadedCampaignIdRef.current) {
      loadedCampaignIdRef.current = campaignIdParam;
      const loadSharedCampaign = async () => {
        setIsCampaignLoading(true);
        try {
          const { data, error } = await supabase
            .from("saved_campaigns")
            .select("*")
            .eq("id", campaignIdParam)
            .maybeSingle();

          if (error) throw error;

          if (data && Array.isArray(data.items)) {
            // Set cart items in store
            useCartStore.setState({ items: data.items });
            setQuoteId(data.id);
            setQuoteCampaignName(data.campaign_name || "");
            setQuoteClientName(data.client_name || "");

            // Prefill with campaign's saved contact details if any
            if (data.client_email) setQuoteClientEmail(data.client_email);
            if (data.client_phone) setQuoteClientPhone(data.client_phone);
            if (data.client_document_type) setQuoteClientDocType(data.client_document_type);
            if (data.client_document_number) setQuoteClientDocNumber(data.client_document_number);

            // Open the cart modal
            onOpenCart();
            // Trigger toast
            onTriggerToast("Se ha cargado la campaña cotizada");

            // Check if we should show the banner to link guest quote to user
            const { data: { user } } = await supabase.auth.getUser();
            if (user && !data.user_id) {
              setShowLinkBanner(true);
            }
          } else {
            console.error("Campaña no encontrada o vacía");
            alert("La cotización que intentas cargar no existe o ha expirado.");
          }
        } catch (err) {
          console.error("Error cargando campaña compartida:", err);
          alert("Ocurrió un error al cargar la cotización.");
        } finally {
          setIsCampaignLoading(false);
          // Limpiar el parámetro de URL
          try {
            const params = new URLSearchParams(window.location.search);
            params.delete("campaign");
            const newSearch = params.toString();
            router.replace(`${pathname}${newSearch ? `?${newSearch}` : ''}`);
          } catch (e) {
            console.warn("Could not clean campaign URL param:", e);
          }
        }
      };
      loadSharedCampaign();
    }
  }, [campaignIdParam, pathname, router, onOpenCart, onTriggerToast]);

  // Vincular campaña invitada al usuario registrado
  const handleLinkCampaignToUser = async () => {
    if (!currentUser || !quoteId) return;
    setIsLinkingCampaign(true);
    try {
      const { error } = await supabase
        .from("saved_campaigns")
        .update({ user_id: currentUser.id })
        .eq("id", quoteId);

      if (error) throw error;

      onTriggerToast("Cotización vinculada a tu cuenta");
      setShowLinkBanner(false);
    } catch (err) {
      console.error("Error al vincular cotización:", err);
      alert("No se pudo vincular la cotización a tu cuenta.");
    } finally {
      setIsLinkingCampaign(false);
    }
  };

  // Manejar el guardado e impresión de la cotización
  const handleSaveAndDownloadQuote = async (downloadPdf: boolean = true) => {
    if (isSavingQuote) return;
    setIsSavingQuote(true);
    setCopiedLink(false);

    const defaultCampaignName = quoteCampaignName.trim() || `Campaña JMT - ${format(new Date(), "MMM yyyy")}`;
    const defaultClientName = quoteClientName.trim() || (currentUser ? "Cliente Registrado" : "Cliente Invitado");

    try {
      // 1. Guardar en base de datos
      const { data, error } = await supabase
        .from("saved_campaigns")
        .insert({
          user_id: currentUser?.id || null,
          campaign_name: defaultCampaignName,
          client_name: defaultClientName,
          items: cartItems,
          total_amount: cartTotal,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("No se recibieron datos de la campaña guardada.");

      // 2. Establecer URL de recuperación e ID
      const recoveryUrl = `${window.location.origin}${pathname}?campaign=${data.id}`;
      setQuoteId(data.id);
      setQuoteRecoveryUrl(recoveryUrl);
      setQuoteCampaignName(defaultCampaignName);
      setQuoteClientName(defaultClientName);

      if (downloadPdf) {
        // 3. Esperar que React renderice el componente off-screen con el código QR e ID correctos
        await new Promise((resolve) => setTimeout(resolve, 800));

        const element = quoteDocRef.current;
        if (!element) {
          throw new Error("El documento de cotización no está disponible para captura.");
        }

        // 4. Capturar con html2canvas
        const canvas = await html2canvas(element, {
          scale: 2, // Buena resolución para impresión
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);

        // 5. Generar PDF retrato en A4
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const imgWidth = 210; // Ancho A4 en mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
        pdf.save(`cotizacion-${defaultCampaignName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
      }

      setQuoteSuccess(true);
    } catch (err: any) {
      console.error("Error al guardar y cotizar campaña:", err);
      alert(err.message || "Ocurrió un error al guardar la campaña.");
    } finally {
      setIsSavingQuote(false);
    }
  };

  return {
    isCampaignLoading,
    currentUser,
    isQuoteDialogOpen,
    setIsQuoteDialogOpen,
    quoteCampaignName,
    setQuoteCampaignName,
    quoteClientName,
    setQuoteClientName,
    quoteClientEmail,
    setQuoteClientEmail,
    quoteClientPhone,
    setQuoteClientPhone,
    quoteClientDocType,
    setQuoteClientDocType,
    quoteClientDocNumber,
    setQuoteClientDocNumber,
    showLinkBanner,
    setShowLinkBanner,
    isLinkingCampaign,
    quoteId,
    isSavingQuote,
    quoteSuccess,
    setQuoteSuccess,
    quoteRecoveryUrl,
    copiedLink,
    setCopiedLink,
    quoteDocRef,
    handleSaveAndDownloadQuote,
    handleLinkCampaignToUser,
  };
}
