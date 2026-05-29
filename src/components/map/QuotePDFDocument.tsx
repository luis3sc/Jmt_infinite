'use client'

import React from 'react'
import { Calendar, MapPin, Phone, Globe } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface CartItem {
  panelId: string
  panelCode: string
  address: string
  district: string
  dailyPrice: number
  startDate: string
  endDate: string
  days: number
  totalPrice: number
  format: string
  mediaType: string
  width?: number | null
  height?: number | null
}

interface QuotePDFDocumentProps {
  campaignName: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  clientDocType?: string
  clientDocNumber?: string
  items: CartItem[]
  totalAmount: number
  recoveryUrl: string
  quoteId: string
  documentRef: React.RefObject<HTMLDivElement | null>
}

export default function QuotePDFDocument({
  campaignName,
  clientName,
  clientEmail = '-',
  clientPhone = '-',
  clientDocType = 'RUC/DNI',
  clientDocNumber = '-',
  items,
  totalAmount,
  recoveryUrl,
  quoteId,
  documentRef
}: QuotePDFDocumentProps) {
  const shortId = quoteId.slice(0, 8).toUpperCase()
  const todayStr = format(new Date(), 'dd/MM/yyyy')

  const subTotal = totalAmount / 1.18
  const igv = totalAmount - subTotal

  // Generate QR Code URL using api.qrserver.com
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(recoveryUrl)}`

  return (
    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      <div
        ref={documentRef}
        className="bg-white text-black p-8 border border-slate-200"
        style={{
          width: '800px',
          minHeight: '1130px',
          boxSizing: 'border-box',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {/* HEADER SECTION */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
          {/* Logo & Contact details */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2">
              {/* SVG JMT Logo */}
              <svg viewBox="0 0 1125.2 173.4" className="h-8 w-auto" style={{ maxHeight: '32px' }}>
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
                <path fill="#ffffff" d="M1053.8,51.4c.2.1.4.2.6.4.5.3.8.8,1.1,1.3.4.8.8,1.6,1.2,2.4.3.6.6,1.1.9,1.8-.4,0-.7,0-1.1,0-.3,0-.7,0-1,0-.1,0-.2,0-.2-.2-.5-1.1-1-2.2-1.5-3.3-.3-.6-.6-1.2-1.2-1.6-.3-.2-.6-.4-1-.4-.4,0-.7,0-1.1,0v5.4h-1.8v-12.9s0,0,.1,0c1.3,0,2.5,0,3.8,0,.8,0,1.7.2,2.4.5,1.4.6,2.1,1.9,2,3.4-.2,1.4-.9,2.3-2.2,2.8-.3.1-.6.2-1,.3,0,0,0,0-.1,0ZM1050.5,45.9v4.4c.4,0,.7,0,1.1,0,.6,0,1.2,0,1.8-.1.8-.1,1.3-.6,1.6-1.3.1-.4.1-.8,0-1.3,0-.6-.4-1.1-1-1.4-.3-.1-.6-.2-1-.3-.8,0-1.7,0-2.5,0,0,0,0,0,0,0Z" />
              </svg>

            </div>
            {/* Contact details */}
            <div className="flex flex-col gap-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-slate-400 shrink-0" />
                <span>Av. Casimiro Ulloa 333, Miraflores, Lima</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone size={12} className="text-slate-400 shrink-0" />
                <span>+51 980 246 408 / +51 953 451 061</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold shrink-0 text-[12px]">@</span>
                <span>jmtoutdoors</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe size={12} className="text-slate-400 shrink-0" />
                <span>www.jmtoutdoors.com.pe</span>
              </div>
            </div>
          </div>

          {/* Document Title & Code */}
          <div className="text-right flex flex-col items-end gap-1">
            <h1 className="text-2xl font-black tracking-widest text-slate-900 uppercase">Cotización</h1>
            <div className="bg-slate-100 border border-slate-300 rounded px-3 py-1 font-mono text-sm font-bold text-slate-800">
              N° {shortId}
            </div>
          </div>
        </div>

        {/* METADATA SECTION */}
        <div className="grid grid-cols-2 gap-8 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
          {/* Client Details */}
          <div className="flex flex-col gap-1 text-xs">
            <h3 className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1.5">Datos del Cliente</h3>
            <p className="truncate"><strong className="inline-block w-20 text-slate-500">Señor(es):</strong> <span className="font-semibold text-slate-800">{clientName}</span></p>
            <p className="truncate"><strong className="inline-block w-20 text-slate-500">Contacto:</strong> {clientEmail}</p>
            <p className="truncate"><strong className="inline-block w-20 text-slate-500">Teléfono:</strong> {clientPhone}</p>
            <p className="truncate"><strong className="inline-block w-20 text-slate-500">Dirección:</strong> LIMA, PERÚ</p>
          </div>

          {/* Quote details */}
          <div className="flex flex-col gap-1 text-xs">
            <h3 className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1.5">Detalles de Cotización</h3>
            <p><strong className="inline-block w-24 text-slate-500">Campaña:</strong> <span className="font-semibold text-slate-800">{campaignName}</span></p>
            <p><strong className="inline-block w-24 text-slate-500">Fecha Emisión:</strong> {todayStr}</p>
            <p><strong className="inline-block w-24 text-slate-500">Documento:</strong> {clientDocType}: {clientDocNumber}</p>
            <p><strong className="inline-block w-24 text-slate-500">Moneda:</strong> SOLES (S/)</p>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="border border-slate-300 rounded-lg overflow-hidden bg-white mb-6">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3 text-center border-b border-slate-300 w-12">Cant.</th>
                <th className="py-2.5 px-3 border-b border-slate-300">Descripción de Ubicación</th>
                <th className="py-2.5 px-3 text-right border-b border-slate-300 w-28">P. Unitario</th>
                <th className="py-2.5 px-3 text-right border-b border-slate-300 w-28">Importe (S/.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => {
                const startDateFormatted = item.startDate ? (() => {
                  try {
                    return format(parseISO(item.startDate), 'dd/MM/yyyy');
                  } catch { return item.startDate; }
                })() : '---';

                const endDateFormatted = item.endDate ? (() => {
                  try {
                    return format(parseISO(item.endDate), 'dd/MM/yyyy');
                  } catch { return item.endDate; }
                })() : '---';

                return (
                  <tr key={item.panelId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-800 border-r border-slate-200">1</td>
                    <td className="py-3 px-3 border-r border-slate-200">
                      <div className="font-bold text-slate-900 uppercase tracking-tight">{item.address}</div>
                      <div className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5">
                        {item.mediaType} ({item.format}) {item.width && item.height && ` - ${Number(item.width).toFixed(2)}x${Number(item.height).toFixed(2)}m`} - CÓD: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200 text-slate-700">{item.panelCode}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                        <Calendar size={10} className="text-slate-400 shrink-0" />
                        <span>Periodo: <strong>{startDateFormatted}</strong> al <strong>{endDateFormatted}</strong> ({item.days} {item.days === 1 ? 'día' : 'días'})</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-600 border-r border-slate-200 whitespace-nowrap">
                      S/ {item.dailyPrice.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / día
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      S/ {item.totalPrice.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* BOTTOM SECTION: NOTES + TOTALS + QR */}
        <div className="grid grid-cols-[1fr_260px] gap-6 items-start">
          {/* Notes and QR Code */}
          <div className="flex flex-col gap-4">
            {/* Legal / Important notes */}
            <div className="border border-slate-200 p-3 rounded-lg bg-slate-50 text-[10px] text-slate-500 leading-relaxed">
              <strong className="text-[10.5px] text-slate-800 uppercase block mb-1 font-extrabold tracking-wide">
                Condiciones Comerciales:
              </strong>
              <ul className="list-disc pl-4 space-y-1 font-medium">
                <li>Precios de cotización válidos por un plazo de 7 días naturales.</li>
                <li>La disponibilidad de las ubicaciones está sujeta al orden de confirmación de pago.</li>
                <li>Esta cotización incluye el Impuesto General a las Ventas (IGV 18%).</li>
                <li>Para reanudar tu compra y proceder al pago, puedes utilizar el enlace digital o escanear el código QR.</li>
              </ul>
            </div>

            {/* QR Recovery Section */}
            <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-lg border border-dashed border-slate-300">
              <img
                src={qrCodeUrl}
                alt="QR Recuperación"
                width={80}
                height={80}
                className="bg-white p-1 border border-slate-200 rounded shadow-sm shrink-0"
              />
              <div className="text-[10px]">
                <strong className="text-slate-800 uppercase block font-black mb-0.5 tracking-tight">¿Listo para comprar?</strong>
                <p className="text-slate-500 mb-1 leading-tight">Escanea este código QR o usa el siguiente enlace para reabrir tu campaña en el navegador con tus paneles y fechas guardadas.</p>
                <span className="font-mono text-[8px] text-primary break-all hover:underline">{recoveryUrl}</span>
              </div>
            </div>
          </div>

          {/* Summary calculations */}
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs divide-y divide-slate-200">
            <div className="flex justify-between py-2 px-3">
              <strong className="text-slate-500 uppercase font-bold text-[10px]">Sub Total (Neto):</strong>
              <span className="font-semibold text-slate-700">
                S/ {subTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-2 px-3">
              <strong className="text-slate-500 uppercase font-bold text-[10px]">IGV (18%):</strong>
              <span className="font-semibold text-slate-700">
                S/ {igv.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {/* Highlighted total in yellow like the reference proforma */}
            <div className="flex justify-between py-2.5 px-3 bg-yellow-300 text-slate-950 font-black text-sm uppercase border-t border-slate-400">
              <span className="tracking-wider">Importe Total:</span>
              <span>
                S/ {totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER NOTICE */}
        <div className="text-center text-[9px] text-slate-400 mt-10 border-t border-slate-100 pt-4">
          JMT Marketplace © 2026. Todos los derechos reservados.
        </div>
      </div>
    </div>
  )
}
