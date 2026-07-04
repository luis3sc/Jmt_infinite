'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Trash2, Download, Play, AlertTriangle,
  Loader2, Check, Copy, ExternalLink, Calendar, MapPin,
  ChevronDown, ChevronUp, FileText
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import { format } from 'date-fns'

import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cartStore'
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Dialog } from '@/components/ui/Dialog'
import QuotePDFDocument from '@/components/map/QuotePDFDocument'

const supabase = createClient()

interface QuotesListProps {
  initialQuotes: any[]
  userProfile?: any
}

export function QuotesList({ initialQuotes, userProfile }: QuotesListProps) {
  const router = useRouter()
  const [quotes, setQuotes] = useState(initialQuotes)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string[]>([])

  // PDF Generation States
  const [downloadingQuote, setDownloadingQuote] = useState<any>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const pdfDocRef = useRef<HTMLDivElement>(null)

  // Cart Conflict Modal States
  const [quoteToResume, setQuoteToResume] = useState<any>(null)
  const [showConflictModal, setShowConflictModal] = useState(false)

  // Delete Quote Modal States
  const [quoteToDelete, setQuoteToDelete] = useState<any>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Copy Link Visual State
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const filteredQuotes = quotes.filter(q => {
    const matchSearch = q.campaign_name.toLowerCase().includes(search.toLowerCase()) ||
      q.id.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  // Trigger download PDF for a specific quote
  const handleDownloadPdfClick = (quote: any) => {
    if (isGeneratingPdf) return
    setDownloadingQuote(quote)
    setIsGeneratingPdf(true)
  }

  // Effect to capture and download PDF off-screen
  useEffect(() => {
    if (!downloadingQuote || !isGeneratingPdf) return

    const generatePdf = async () => {
      try {
        // Wait for offscreen render
        await new Promise((resolve) => setTimeout(resolve, 800))

        const element = pdfDocRef.current
        if (!element) throw new Error("Document ref not ready")

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        })

        const imgData = canvas.toDataURL("image/jpeg", 0.95)

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        })

        const imgWidth = 210
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight, undefined, "FAST")
        pdf.save(`cotizacion-${downloadingQuote.campaign_name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`)
      } catch (err) {
        console.error("Error generating PDF:", err)
        alert("Ocurrió un error al generar el PDF.")
      } finally {
        setIsGeneratingPdf(false)
        setDownloadingQuote(null)
      }
    }

    generatePdf()
  }, [downloadingQuote, isGeneratingPdf])

  // Resume purchase logic
  const handleResumeClick = (quote: any) => {
    const cartItemsCount = useCartStore.getState().items.length
    if (cartItemsCount > 0) {
      setQuoteToResume(quote)
      setShowConflictModal(true)
    } else {
      executeResume(quote)
    }
  }

  const executeResume = (quote: any) => {
    useCartStore.getState().clearCart()
    // Redirect to map with campaign id in URL to rehydrate
    router.push(`/map?campaign=${quote.id}`)
  }

  // Delete quote logic
  const handleDeleteClick = (quote: any) => {
    setQuoteToDelete(quote)
    setShowDeleteModal(true)
  }

  const executeDelete = async () => {
    if (!quoteToDelete) return
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('saved_campaigns')
        .delete()
        .eq('id', quoteToDelete.id)

      if (error) throw error

      setQuotes(prev => prev.filter(q => q.id !== quoteToDelete.id))
      setShowDeleteModal(false)
      setQuoteToDelete(null)
    } catch (err) {
      console.error("Error deleting quote:", err)
      alert("No se pudo eliminar la cotización.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCopyLink = (quoteId: string) => {
    const recoveryUrl = `${window.location.origin}/map?campaign=${quoteId}`
    navigator.clipboard.writeText(recoveryUrl)
    setCopiedQuoteId(quoteId)
    setTimeout(() => setCopiedQuoteId(null), 2000)
  }

  return (
    <div className="space-y-6 pb-24 relative">

      {/* TOOLBAR */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nombre o ID de campaña..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-card border-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:bg-muted/10 h-auto"
          />
        </div>
      </div>

      {/* TABLE HEADER - desktop only */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 border-b border-border/50">
        <p className="col-span-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Código</p>
        <p className="col-span-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nombre de Campaña</p>
        <p className="col-span-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fecha</p>
        <p className="col-span-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pantallas</p>
        <p className="col-span-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Inversión</p>
      </div>

      {/* ROWS */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredQuotes.length > 0 ? filteredQuotes.map((quote, i) => {
            const isExpanded = expanded.includes(quote.id)
            const shortId = quote.id.slice(0, 8).toUpperCase()
            const items = quote.items || []

            return (
              <motion.div
                key={quote.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className="rounded-lg border border-border bg-card hover:bg-muted/10 hover:border-primary transition-all overflow-hidden"
              >
                {/* MAIN ROW */}
                <Button
                  variant="ghost"
                  onClick={() => toggleExpand(quote.id)}
                  className="w-full text-left block h-auto p-0 hover:bg-transparent rounded-none"
                >
                  {/* DESKTOP LAYOUT */}
                  <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-4 items-center">
                    {/* ID */}
                    <div className="col-span-2">
                      <p className="font-mono text-xs font-bold text-foreground">
                        #{shortId}
                      </p>
                    </div>

                    {/* Campaign Name */}
                    <div className="col-span-4">
                      <p className="text-xs font-bold text-foreground truncate max-w-[250px]">
                        {quote.campaign_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[200px]">
                        Cliente: {quote.client_name}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        {new Date(quote.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </p>
                    </div>

                    {/* Screen count */}
                    <div className="col-span-2">
                      <p className="text-xs text-foreground font-semibold">
                        {items.length} {items.length === 1 ? 'pantalla' : 'pantallas'}
                      </p>
                    </div>

                    {/* Total investment */}
                    <div className="col-span-2 text-right flex items-center justify-end gap-2">
                      <span className="text-sm font-black text-foreground">
                        S/ {quote.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                      {isExpanded
                        ? <ChevronUp size={14} className="text-muted-foreground shrink-0" />
                        : <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                      }
                    </div>
                  </div>

                  {/* MOBILE LAYOUT */}
                  <div className="md:hidden flex flex-col gap-2.5 p-4">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-mono text-xs font-bold text-foreground bg-muted/80 px-2 py-0.5 rounded border border-border">
                        #{shortId}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {new Date(quote.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-foreground leading-tight">{quote.campaign_name}</h4>
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Cliente: {quote.client_name}</p>
                    </div>

                    <div className="flex justify-between items-end pt-2 border-t border-border/50 mt-0.5">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        {items.length} {items.length === 1 ? 'pantalla' : 'pantallas'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-foreground">
                          S/ {quote.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                        {isExpanded
                          ? <ChevronUp size={14} className="text-muted-foreground shrink-0" />
                          : <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                        }
                      </div>
                    </div>
                  </div>
                </Button>

                {/* EXPANDED DETAIL */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-border/50 bg-muted/10"
                    >
                      <div className="px-4 py-5 space-y-4">
                        {/* Items list */}
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Detalle de pantallas cotizadas</p>
                          <div className="space-y-1.5">
                            {items.map((item: any, idx: number) => {
                              const startF = item.startDate ? format(new Date(item.startDate), 'dd/MM/yyyy') : '---'
                              const endF = item.endDate ? format(new Date(item.endDate), 'dd/MM/yyyy') : '---'
                              return (
                                <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2.5 px-3 rounded-lg bg-card border border-border text-xs">
                                  <div className="flex items-center gap-2">
                                    <MapPin size={11} className="text-muted-foreground shrink-0" />
                                    <span className="font-bold text-foreground">{item.panelCode}</span>
                                    {item.width && item.height && (
                                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-semibold font-mono">
                                        {Number(item.width).toFixed(2)}x{Number(item.height).toFixed(2)}m
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground font-medium">
                                    <Calendar size={10} className="shrink-0" />
                                    <span>{startF} al {endF} ({item.days} d)</span>
                                  </div>
                                  <p className="sm:text-right font-black text-foreground">S/ {item.totalPrice?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-2 border-t border-border/40">
                          <Button
                            onClick={() => handleResumeClick(quote)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-sm"
                          >
                            <Play size={13} fill="currentColor" />
                            Reanudar Compra
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => handleDownloadPdfClick(quote)}
                            disabled={isGeneratingPdf && downloadingQuote?.id === quote.id}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest border-border text-foreground hover:bg-muted"
                          >
                            {isGeneratingPdf && downloadingQuote?.id === quote.id ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                Generando PDF...
                              </>
                            ) : (
                              <>
                                <Download size={13} />
                                Descargar PDF
                              </>
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            onClick={() => handleCopyLink(quote.id)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                          >
                            {copiedQuoteId === quote.id ? (
                              <>
                                <Check size={13} className="text-emerald-500" />
                                Enlace Copiado
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                Copiar Enlace
                              </>
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            onClick={() => handleDeleteClick(quote)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 border border-transparent hover:border-red-200 sm:ml-auto"
                          >
                            <Trash2 size={13} />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          }) : (
            <div className="py-20 text-center border border-dashed border-border rounded-lg bg-muted/10">
              <Search size={28} className="text-muted-foreground mx-auto mb-4" strokeWidth={1} />
              <p className="text-sm font-black text-foreground uppercase tracking-tight mb-1">Sin resultados</p>
              <p className="text-xs text-muted-foreground mb-5">No se encontraron cotizaciones con tu criterio de búsqueda.</p>
              <Button
                variant="link"
                onClick={() => setSearch('')}
                className="text-[10px] font-black text-primary uppercase tracking-widest h-auto p-0"
              >
                Limpiar búsqueda
              </Button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* OFF-SCREEN PDF GENERATOR */}
      {downloadingQuote && (
        <QuotePDFDocument
          campaignName={downloadingQuote.campaign_name}
          clientName={downloadingQuote.client_name}
          clientEmail={userProfile?.email || ''}
          clientPhone={userProfile?.phone || ''}
          clientDocType={userProfile?.document_type || 'DNI/RUC'}
          clientDocNumber={userProfile?.document_number || ''}
          items={downloadingQuote.items}
          totalAmount={downloadingQuote.total_amount}
          recoveryUrl={`${window.location.origin}/map?campaign=${downloadingQuote.id}`}
          quoteId={downloadingQuote.id}
          documentRef={pdfDocRef}
        />
      )}

      {/* CONFIRM CONFLICT MODAL */}
      <Dialog
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        className="max-w-md p-6 bg-card border border-border rounded-2xl  relative overflow-hidden"
      >
        <div className="flex items-center gap-3 text-amber-500 mb-4 border-b border-border/50 pb-3">
          <AlertTriangle size={24} />
          <h3 className="text-base font-black uppercase tracking-wider text-foreground">Confirmar Reemplazo</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-6">
          Tienes paneles seleccionados actualmente en tu carrito de compras. Al continuar y reanudar esta cotización, tu selección actual se reemplazará. ¿Deseas proceder?
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={() => setShowConflictModal(false)}
            className="font-bold text-xs uppercase tracking-wider py-3"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              setShowConflictModal(false)
              if (quoteToResume) {
                executeResume(quoteToResume)
              }
            }}
            className="bg-primary text-white font-bold text-xs uppercase tracking-wider py-3 px-5"
          >
            Sí, Reemplazar y Continuar
          </Button>
        </div>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        className="max-w-md p-6 bg-card border border-border rounded-2xl  relative overflow-hidden"
      >
        <div className="flex items-center gap-3 text-red-500 mb-4 border-b border-border/50 pb-3">
          <Trash2 size={22} />
          <h3 className="text-base font-black uppercase tracking-wider text-foreground">Eliminar Cotización</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-6">
          ¿Estás seguro de que deseas eliminar permanentemente la cotización <strong className="text-foreground">"{quoteToDelete?.campaign_name}"</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            disabled={isDeleting}
            onClick={() => setShowDeleteModal(false)}
            className="font-bold text-xs uppercase tracking-wider py-3"
          >
            Cancelar
          </Button>
          <Button
            disabled={isDeleting}
            onClick={executeDelete}
            className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider py-3 px-5 flex items-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </Button>
        </div>
      </Dialog>

    </div>
  )
}
