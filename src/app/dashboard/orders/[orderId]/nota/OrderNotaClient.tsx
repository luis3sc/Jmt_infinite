'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { Download, Printer, ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import { Logo } from '@/components/ui/Logo'

interface OrderNotaClientProps {
  order: any
}

export default function OrderNotaClient({ order }: OrderNotaClientProps) {
  const documentRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)
  const [scale, setScale] = useState(1)
  const [docHeight, setDocHeight] = useState(743)

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return
      const parentWidth = containerRef.current.clientWidth
      // Subtracting padding (48px for p-6, 32px for p-4)
      const availableWidth = parentWidth - 48
      const newScale = availableWidth < 1050 ? Math.max(0.25, availableWidth / 1050) : 1
      setScale(newScale)

      if (documentRef.current) {
        setDocHeight(documentRef.current.clientHeight || 743)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    // Run after a short delay to ensure correct parent width measurements
    const timer = setTimeout(handleResize, 100)

    // Observe changes to document size to update container height dynamically
    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    if (documentRef.current) {
      resizeObserver.observe(documentRef.current)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
      clearTimeout(timer)
    }
  }, [])

  // 1. Datos del cliente e identificación
  const shortId = order.id.slice(0, 8).toUpperCase()
  const issueDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    : '-'

  const profile = order.profiles
  const clientName = profile?.company_name || profile?.full_name || 'CLIENTE DIRECTO'
  const documentType = profile?.document_type || 'RUC'
  const documentNumber = profile?.document_number || '-'
  const phone = profile?.phone || '-'
  const email = profile?.email || '-'
  const contactName = profile?.full_name || '-'
  const receiptTypeLabel = profile?.receipt_type === 'factura' ? 'FACTURA' : 'BOLETA'

  // 2. Extraer dinámicamente el nombre del proveedor asociado
  const firstBooking = order.bookings?.[0]
  const providerName =
    firstBooking?.panels?.structures?.organizations?.name?.toUpperCase() || 'JMT OUTDOORS'

  // Motivo de campaña general
  const motive = firstBooking?.campaign_name || 'U.CONTINENTAL'

  // 3. Cálculos de subtotales e impuestos
  const totalAmount = order.total_amount || 0
  const subTotal = totalAmount / 1.18
  const igv = totalAmount - subTotal

  // 4. Calcular tiempo entre fechas (meses y días)
  const getDuration = (startDateStr: string, endDateStr: string) => {
    if (!startDateStr || !endDateStr) return { months: '-', days: '-' }
    const start = new Date(startDateStr)
    const end = new Date(endDateStr)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // inclusive

    const months = Math.floor(diffDays / 30)
    const remainingDays = diffDays % 30

    return {
      months: months > 0 ? String(months) : '-',
      days: remainingDays > 0 ? String(remainingDays) : '-',
    }
  }

  // 5. Descargar PDF con html2canvas y jsPDF
  const handleDownloadPDF = async () => {
    if (!documentRef.current) return
    setGenerating(true)
    try {
      const element = documentRef.current

      // Esperar brevemente para asegurar que los renders y fuentes se asienten
      await new Promise((resolve) => setTimeout(resolve, 100))

      const canvas = await html2canvas(element, {
        scale: 2.5, // Mayor resolución para nitidez en impresión
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.98)

      const imgWidth = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const finalPageHeight = Math.max(210, imgHeight)

      // A4 Landscape: 297mm ancho x (mínimo 210mm alto, o dinámico si es más largo)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [imgWidth, finalPageHeight],
      })

      // Centrar verticalmente en la hoja si es menor que el alto de página
      let yOffset = 0
      if (imgHeight < finalPageHeight) {
        yOffset = (finalPageHeight - imgHeight) / 2
      }

      pdf.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight, undefined, 'FAST')
      pdf.save(`nota-pedido-${shortId}.pdf`)
    } catch (err) {
      console.error('Error al generar el PDF:', err)
      alert('Ocurrió un error al generar el archivo. Por favor, intenta usar la opción de Imprimir.')
    } finally {
      setGenerating(false)
    }
  }

  // 6. Imprimir nativamente
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans print:bg-white print:text-black">
      {/* BARRA DE ACCIONES (Oculta al imprimir) */}
      <div className="w-full bg-slate-900 text-white shadow-md py-3 px-4 flex items-center justify-between sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/orders"
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Volver</span>
          </Link>
          <div className="hidden sm:block h-4 w-[1px] bg-slate-700" />
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-xs font-bold text-slate-400">PEDIDO:</span>
            <span className="text-xs font-mono font-bold bg-slate-800 px-2 py-0.5 rounded text-[#00e165]">
              #{shortId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-semibold transition-all active:scale-95 border border-slate-700 cursor-pointer"
          >
            <Printer size={14} className="text-slate-300" />
            <span>Imprimir / Guardar</span>
          </button>
          <button
            disabled={generating}
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#00e165] hover:bg-[#00c554] text-slate-950 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {generating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generando...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Descargar PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CONTENEDOR CENTRAL DE LA NOTA */}
      <div
        ref={containerRef}
        className="flex-1 flex justify-center items-start p-6 print:p-0 overflow-auto"
      >
        <div
          style={{
            width: `${1050 * scale}px`,
            height: `${docHeight * scale}px`,
            position: 'relative',
          }}
          className="print:w-auto print:h-auto"
        >
          <div
            ref={documentRef}
            className="w-[1050px] min-w-[1050px] min-h-[743px] bg-white text-black p-8 border border-slate-200 shadow-lg rounded-sm print:shadow-none print:border-none print:p-4 print:mx-auto absolute left-0 top-0 origin-top-left print:relative print:transform-none"
            style={{
              transform: `scale(${scale})`,
              contentVisibility: 'auto',
            }}
          >
            {/* LOGO DE AGUA DECORATIVO (Solo pantalla) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.015] pointer-events-none print:hidden">
              <Logo isPrint width={500} className="w-[500px]" />
            </div>

            {/* CABECERA (JMT Logo - Título - Calidad) */}
            <div className="grid grid-cols-[250px_1fr_250px] border border-black mb-4">
              {/* Logo box */}
              <div className="p-4 border-r border-black flex flex-col items-center justify-center bg-slate-50/50">
                <svg
                  id="Capa_1"
                  version="1.1"
                  viewBox="0 0 1125.2 173.4"
                  className="h-7 w-auto max-w-full object-contain"
                >
                  <rect fill="#1b203e" x="417" y="8.2" width="233" height="152.7" />
                  <polygon fill="#ffffff" points="1026.6 160.9 481.9 160.9 574.1 8.2 1120 8.2 1026.6 160.9" />
                  <polygon fill="#1b203e" points="490.4 156.1 1024.2 156.1 1111.5 12.9 576.8 12.9 490.4 156.1" />
                  <polygon fill="#ffffff" points="469.4 160.9 6.4 160.9 6.4 8.2 563 8.2 469.4 160.9" />
                  <polygon fill="#1b203e" points="11.2 156 466.8 156 554.5 13 11.2 13 11.2 156" />
                  <polygon fill="#ffffff" points="232.8 94.9 251.2 94.9 251.2 107.5 270.9 107.5 270.9 60.9 249 60.9 256.4 40.7 292.3 40.7 292.3 128.3 232.8 128.3 232.8 94.9" />
                  <polygon fill="#ffffff" points="300.6 128.3 321 128.3 321 69.4 340.2 122.6 363.3 122.6 384.3 69.4 384.3 128.3 405.7 128.3 405.7 40.7 374.5 40.7 354.1 99.2 332.4 40.7 300.6 40.7 300.6 128.3" />
                  <polygon fill="#ffffff" points="413.6 60.6 442.4 60.6 442.4 128.3 465.6 128.3 465.6 60.6 483.3 60.6 490.4 40.7 413.6 40.7 413.6 60.6" />
                  <path fill="#55b04d" d="M160.5,119.3c-11.1-3.2-18.3-12-38.4-38.3-20.1-26.3-32.7-37.9-49.3-39.2-14-1.1-26.6,2.9-36.2,13.7,9.2-5.7,17.8-8.5,31.2-4.6,11.1,3.2,21.4,15.6,38.3,38.1,16.8,22.6,32.8,38,49.4,39.3,14,1.1,26.6-2.9,36.2-13.7-9.2,5.7-17.8,8.5-31.2,4.6Z" />
                  <path fill="#55b04d" d="M80.4,62.4c-14.5-14.5-27.8-11.7-36.6-8-8.8,3.6-22,16.8-18,39,4.1,22.9,23.3,33,35.3,34.7,12,1.7,24.4-1,36.8-11.7-12.9,7.5-32.4,5.7-43.4-4.8-11.2-10.7-15.4-25.5-9.6-38,6.7-14.3,24.5-17.8,35.4-11.2Z" />
                  <path fill="#55b04d" d="M147.7,107.7c14.5,14.5,27.8,11.7,36.6,8,8.8-3.6,22-16.8,18-39-4.1-22.9-23.3-33-35.3-34.7-12-1.7-24.4,1-36.8,11.7,12.9-7.5,32.4-5.7,43.4,4.8,11.2,10.7,15.4,25.5,9.6,38-6.7,14.3-24.5,17.8-35.4,11.2Z" />
                  <path fill="#55b04d" d="M101.1,87.2c-8.5,10.3-16.2,18.5-23.4,21.7-7.3,3.3-14.8,3.2-24.2-2.3,6.6,7.5,16.6,12.4,29,11.5,12.3-1,20.6-6.8,29.6-16.8l-11-14.1Z" />
                  <path fill="#55b04d" d="M145.6,52c-12.2,1-20.6,6.8-29.6,16.7l11,14.1c8.5-10.3,16.1-18.4,23.3-21.6,7.3-3.3,14.8-3.2,24.2,2.3-6.6-7.5-16.6-12.4-29-11.5Z" />
                  <polygon fill="#ffffff" points="889.6 59.8 917.4 59.8 917.4 125.3 939.9 125.3 939.9 59.8 957 59.8 963.8 40.6 889.6 40.6 889.6 59.8" />
                  <rect fill="#ffffff" x="572.3" y="40.6" width="22.5" height="84.7" />
                  <rect fill="#ffffff" x="751.1" y="40.6" width="22.5" height="84.7" />
                  <rect fill="#ffffff" x="863.9" y="40.6" width="22.5" height="84.7" />
                  <polygon fill="#ffffff" points="601.7 125.3 622.1 125.3 622.1 76.2 662.6 125.3 680.2 125.3 680.2 40.6 659.1 40.6 659.1 88 621.8 40.6 601.7 40.6 601.7 125.3" />
                  <polygon fill="#ffffff" points="780.5 125.3 800.9 125.3 800.9 76.2 841.4 125.3 859 125.3 859 40.6 837.8 40.6 837.8 88 800.6 40.6 780.5 40.6 780.5 125.3" />
                  <polygon fill="#ffffff" points="708.9 74.7 708.9 59.6 741.2 59.6 749 40.6 686.7 40.6 686.7 125.3 708.9 125.3 708.9 94.1 727 94.1 734.9 74.7 708.9 74.7" />
                  <polygon fill="#ffffff" points="989.6 106.3 989.6 91.4 1021.5 91.4 1021.5 73.7 989.6 73.7 989.6 59.6 1030.5 59.6 1030.5 40.6 967.4 40.6 967.4 125.3 1033 125.3 1033 106.3 989.6 106.3" />
                  <path fill="#ffffff" d="M1053.5,40.6c.2,0,.4,0,.6,0,2.1.2,3.8,1.1,5.4,2.4.7.7,1.4,1.4,1.9,2.2.6.9,1,1.8,1.2,2.8.3,1.3.4,2.7.2,4.1-.2,1.5-.7,2.9-1.6,4.2-1,1.5-2.4,2.7-4,3.5-1.2.6-2.4.9-3.7,1-1,0-1.9,0-2.9-.2-1.3-.3-2.5-.7-3.5-1.5-1.4-1-2.6-2.2-3.4-3.7-.7-1.2-1.1-2.6-1.1-4,0-.7,0-1.5,0-2.2.2-1.5.7-2.9,1.5-4.1,1.3-1.9,2.9-3.3,5.1-4,.9-.3,1.7-.5,2.7-.5,0,0,0,0,.1,0,.5,0,.9,0,1.4,0ZM1052.8,59.8c4.8.1,9.1-4.1,9-9.2-.1-4.6-4.1-8.9-9.3-8.8-4.6.2-8.7,4.1-8.7,9.2,0,4.7,4.1,8.9,9,8.8Z" />
                  <path fill="#ffffff" d="M1053.8,51.4c.2.1.4.2.6.4.5.3.8.8,1.1,1.3.4.8.8,1.6,1.2,2.4.3.6.6,1.1.9,1.8-.4,0-.7,0-1.1,0-.3,0-.7,0-1,0v5.4h-1.8v-12.9s0,0,.1,0c1.3,0,2.5,0,3.8,0,.8,0,1.7.2,2.4.5,1.4.6,2.1,1.9,2,3.4-.2,1.4-.9,2.3-2.2,2.8-.3.1-.6.2-1,.3,0,0,0,0-.1,0ZM1050.5,45.9v4.4c.4,0,.7,0,1.1,0,.6,0,1.2,0,1.8-.1.8-.1,1.3-.6,1.6-1.3.1-.4.1-.8,0-1.3,0-.6-.4-1.1-1-1.4-.3-.1-.6-.2-1-.3-.8,0-1.7,0-2.5,0,0,0,0,0,0,0Z" />
                </svg>
              </div>

              {/* Title box */}
              <div className="p-2 border-r border-black flex flex-col items-center justify-center text-center">
                <h1 className="text-xl font-bold uppercase tracking-[0.15em] leading-tight">
                  Nota de Pedido
                </h1>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                  Alquiler
                </p>
              </div>

              {/* Provider/Quality code box */}
              <div className="p-3 flex flex-col items-center justify-center text-center bg-slate-50/50">
                <p className="text-xs font-extrabold text-slate-900 tracking-tight">
                  {providerName}
                </p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Código: GC-F-005
                </p>
              </div>
            </div>

            {/* METADATOS (Cliente - Central - OC/Detalle) */}
            <div className="grid grid-cols-[380px_380px_1fr] gap-3 mb-4">
              {/* Cliente (Directo) */}
              <div className="border border-black p-2 text-[10px] relative bg-white min-h-[110px]">
                <span className="absolute top-0 right-0 px-2 py-0.5 bg-slate-100 border-l border-b border-black font-extrabold text-[8px] uppercase tracking-wider">
                  Directo
                </span>
                <p className="font-extrabold text-slate-400 uppercase tracking-widest text-[8px] mb-1.5 border-b border-slate-100 pb-0.5">
                  Datos del Cliente
                </p>
                <div className="space-y-0.5">
                  <p className="truncate">
                    <strong className="inline-block w-24">CLIENTE:</strong> {clientName}
                  </p>
                  <p>
                    <strong className="inline-block w-24">{documentType}:</strong> {documentNumber}
                  </p>
                  <p className="truncate">
                    <strong className="inline-block w-24">DIRECCIÓN:</strong> LIMA, PERÚ
                  </p>
                  <p className="truncate">
                    <strong className="inline-block w-24">CONTACTO:</strong> {contactName}
                  </p>
                  <p>
                    <strong className="inline-block w-24">TELÉFONO:</strong> {phone}
                  </p>
                </div>
              </div>

              {/* Central de Medios (Indirecto) */}
              <div className="border border-black p-2 text-[10px] relative bg-white min-h-[110px]">
                <span className="absolute top-0 right-0 px-2 py-0.5 bg-slate-50 border-l border-b border-black font-extrabold text-[8px] uppercase tracking-wider text-slate-400">
                  Indirecto
                </span>
                <p className="font-extrabold text-slate-400 uppercase tracking-widest text-[8px] mb-1.5 border-b border-slate-100 pb-0.5">
                  Central de Medios
                </p>
                <div className="space-y-0.5 text-zinc-400">
                  <p>
                    <strong className="inline-block w-24 text-slate-500">CENTRAL:</strong> -
                  </p>
                  <p>
                    <strong className="inline-block w-24 text-slate-500">RUC:</strong> -
                  </p>
                  <p>
                    <strong className="inline-block w-24 text-slate-500">DIRECCIÓN:</strong> -
                  </p>
                  <p>
                    <strong className="inline-block w-24 text-slate-500">CONTACTO:</strong> -
                  </p>
                  <p>
                    <strong className="inline-block w-24 text-slate-500">TELEFONO:</strong> -
                  </p>
                </div>
              </div>

              {/* Datos del Pedido */}
              <div className="border border-black p-2 text-[10px] bg-white min-h-[110px] flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                  <p className="col-span-2 border-b border-slate-100 pb-0.5 mb-1">
                    <strong className="text-[9px] uppercase tracking-wider font-extrabold">
                      NÚMERO OC: JMT-{shortId}
                    </strong>
                  </p>
                  <p>
                    <strong className="text-slate-500">EMISIÓN:</strong> {issueDate}
                  </p>
                  <p>
                    <strong className="text-slate-500">MONEDA:</strong> SOLES (S/)
                  </p>
                  <p>
                    <strong className="text-slate-500">PAGO:</strong> CULQI
                  </p>
                  <p>
                    <strong className="text-slate-500">EMISOR:</strong> WEB
                  </p>
                  <p>
                    <strong className="text-slate-500">DOCUMENTO:</strong> {receiptTypeLabel}
                  </p>
                  <p>
                    <strong className="text-slate-500">MODALIDAD:</strong> DIGITAL
                  </p>
                </div>
              </div>
            </div>

            {/* PRODUCTO Y MOTIVO */}
            <div className="grid grid-cols-2 border border-black text-[10px] mb-4 divide-x divide-black bg-slate-50/30">
              <div className="p-1.5 px-3 flex items-center gap-2">
                <strong className="text-slate-500 uppercase tracking-wider">Producto:</strong>
                <span className="font-extrabold text-slate-900">DIGITAL (DOOH)</span>
              </div>
              <div className="p-1.5 px-3 flex items-center gap-2">
                <strong className="text-slate-500 uppercase tracking-wider">Motivo General:</strong>
                <span className="font-extrabold uppercase">{motive}</span>
              </div>
            </div>

            {/* TABLA: DETALLE DE COMPRA */}
            <div className="flex-1 flex flex-col mb-4 overflow-hidden border border-black bg-white">
              <div className="bg-slate-900 text-white text-[9px] font-bold uppercase tracking-wider grid grid-cols-12 border-b border-black py-2 text-center items-center">
                <div className="col-span-2 text-left pl-3">Distrito</div>
                <div className="col-span-3 text-left">Ubicación</div>
                <div className="col-span-1">Medida</div>
                <div className="col-span-1">Código</div>
                <div className="col-span-1">Cara</div>
                <div className="col-span-1">Cant.</div>
                <div className="col-span-2">Vigencia</div>
                <div className="col-span-1 text-right pr-3">Total</div>
              </div>

              <div className="divide-y divide-slate-200">
                {order.bookings?.map((b: any, idx: number) => {
                  const p = b.panels
                  const panelCode = p?.panel_code || 'CODE'
                  const district = p?.structures?.district || 'LIMA'
                  const address = p?.structures?.address || 'AVENIDA'
                  const format = p?.format || 'PANTALLA LED'
                  const width = p?.width ? `${p.width}m` : '12.0m'
                  const height = p?.height ? `${p.height}m` : '6.0m'
                  const face = p?.face || 'A'
                  const amount = b.amount || 0

                  const dateRange =
                    b.start_date && b.end_date
                      ? `${new Date(b.start_date).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                      })} al ${new Date(b.end_date).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                      })}`
                      : '-'

                  return (
                    <div
                      key={b.id || idx}
                      className="grid grid-cols-12 py-2.5 text-[9.5px] text-center hover:bg-slate-50 items-center transition-colors"
                    >
                      <div className="col-span-2 text-left pl-3 font-bold">{district}</div>
                      <div className="col-span-3 text-left pr-2">
                        <p className="truncate font-medium text-slate-700">{address}</p>
                        <p className="text-[8px] text-slate-400 font-extrabold uppercase mt-0.5">
                          {format}
                        </p>
                      </div>
                      <div className="col-span-1 text-slate-500 font-mono">
                        {width}x{height}
                      </div>
                      <div className="col-span-1 font-mono font-bold bg-slate-100 text-slate-700 py-0.5 rounded text-[8.5px] w-fit mx-auto px-1.5 border border-slate-200">
                        {panelCode}
                      </div>
                      <div className="col-span-1 font-semibold">{face}</div>
                      <div className="col-span-1">1</div>
                      <div className="col-span-2 font-medium text-slate-600">{dateRange}</div>
                      <div className="col-span-1 text-right pr-3 font-black text-slate-900">
                        S/ {amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* OBSERVACIONES Y TOTALES */}
            <div className="grid grid-cols-[1fr_280px] gap-4 mb-4">
              {/* Observaciones */}
              <div className="border border-black p-2.5 text-[9px] flex flex-col justify-between bg-white">
                <strong className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Observaciones:
                </strong>
                <p className="text-slate-500 italic leading-relaxed">
                  Campaña contratada a través de JMT Marketplace. Pauta sujeta a validación y aprobación de contenidos conforme a las normas de seguridad vial y los términos de servicio vigentes de JMT Outdoors.
                </p>
              </div>

              {/* Totales */}
              <div className="border border-black text-[10px] divide-y divide-black bg-white">
                <div className="flex justify-between py-1.5 px-3">
                  <strong className="text-slate-500 uppercase">Sub Total:</strong>
                  <span className="font-semibold text-slate-700">
                    S/ {subTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 px-3">
                  <strong className="text-slate-500 uppercase">IGV 18%:</strong>
                  <span className="font-semibold text-slate-700">
                    S/ {igv.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-2 px-3 bg-slate-900 text-white font-extrabold">
                  <span className="uppercase tracking-wider">Importe Total:</span>
                  <span className="text-xs">
                    S/ {totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* LEYENDA LEGAL IMPORTANTE */}
            <div className="border border-black p-2.5 bg-slate-50 text-[8px] leading-relaxed text-slate-500 mb-6">
              <strong className="text-[8.5px] text-slate-800 uppercase block mb-1 font-extrabold tracking-wide">
                Importante:
              </strong>
              <p className="mb-1 uppercase font-bold text-slate-600">
                La firma de este documento compromete a todas las partes a respetar las condiciones impresas sobre este contrato.
              </p>
              <ul className="list-disc pl-3.5 space-y-0.5 font-medium">
                <li>
                  Una vez firmado el documento, el cliente solo podrá dejar sin efecto asumiendo una penalidad del 50% del monto no consumido = (Importe Total - Importe Consumido) / 2.
                </li>
                <li>
                  El cliente deberá entregar los materiales 7 días antes del inicio de la pauta para poder asegurar el inicio de esta. La pauta empezará indefectiblemente de acuerdo a la fecha indicada en este documento.
                </li>
                <li>
                  El cliente solo tendrá prioridad para renovar confirmando la permanencia 30 días antes del fin de contrato; de lo contrario, se considerarán elementos disponibles al finalizar el periodo contratado.
                </li>
                <li>
                  Ante cualquier consulta, inquietud, queja o reclamo, puede comunicarse a través del correo electrónico{' '}
                  <strong className="text-slate-750">servicio.atencionalcliente@jmtoutdoors.com.pe</strong>.
                </li>
              </ul>
            </div>

            {/* FIRMAS FOOTER */}
            <div className="grid grid-cols-3 gap-12 text-center pt-8 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-white">
              <div className="flex flex-col items-center">
                <div className="w-full border-t border-dashed border-slate-300 mb-2" />
                <span>Firma y Sello Cliente (Directo)</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full border-t border-dashed border-slate-300 mb-2" />
                <span>Firma y Sello de la Agencia</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full border-t border-dashed border-slate-300 mb-2" />
                <span>Firma y Sello Asesor Comercial</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
