import type { Metadata } from "next";
import { RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "Políticas de Cambios y Devoluciones | JMT Outdoors",
  description: "Conoce nuestras políticas de cambio de campaña, cancelaciones y devoluciones de servicios en la plataforma JMT Outdoors.",
};

export default function PoliticasCambioPage() {
  return (
    <article className="space-y-8">
      {/* Page Header */}
      <header className="border-b border-slate-200 pb-6 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <RefreshCw size={24} />
          </div>
          <p className="text-sm text-primary font-semibold uppercase tracking-wider">
            Políticas de Cambio y Devoluciones
          </p>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Políticas de Cambios
        </h1>
        <p className="text-xs text-slate-400">
          Fecha de última actualización: 27 de mayo de 2026
        </p>
      </header>

      {/* Main content body */}
      <div className="space-y-6 text-slate-700 leading-relaxed text-sm md:text-base">
        {/* 1. Naturaleza del Servicio */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">1. Naturaleza del Servicio e Inventario</h2>
          <p className="mb-4">
            El cliente reconoce que los espacios publicitarios digitales se reservan por fechas y horas específicas. Al confirmarse una reserva, dicho inventario queda bloqueado, impidiendo su venta a terceros. Por tanto, los cambios o cancelaciones están sujetos a penalidades según la anticipación con la que se soliciten.
          </p>
        </section>

        {/* 2. Cambios y Reprogramaciones */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">2. Cambios y Reprogramaciones (Modificación de Fechas)</h2>
          <p className="mb-3">
            El cliente podrá solicitar la reprogramación de los días de exhibición bajo las siguientes condiciones:
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-4 text-slate-700">
            <li>
              <strong>Con más de 7 días calendario de anticipación al inicio de la campaña:</strong> La reprogramación no tendrá costo adicional, sujeta a la disponibilidad de la misma pantalla u otra de similar valor comercial.
            </li>
            <li>
              <strong>Entre 3 y 7 días calendario de anticipación:</strong> Se aplicará una penalidad del 20% del valor de los días modificados por concepto de recargo operativo y bloqueo de inventario.
            </li>
            <li>
              <strong>Menos de 72 horas antes del inicio o durante la campaña:</strong> No se aceptan cambios ni reprogramaciones. Los días no utilizados se considerarán devengados al 100%.
            </li>
          </ul>
        </section>

        {/* 3. Cancelaciones y Devoluciones */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">3. Cancelaciones y Devoluciones Monetarias</h2>
          <p className="mb-3">
            De conformidad con las excepciones al derecho de resolución en servicios de ejecución inmediata o con reserva de fecha específica, las devoluciones de dinero se procesarán de la siguiente manera:
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-4 text-slate-700">
            <li>
              <strong>Cancelación total con más de 7 días de anticipación:</strong> Se reembolsará el 100% del monto abonado, descontando únicamente las comisiones de la pasarela de pagos (tarjetas de crédito/débito o transferencias interbancarias).
            </li>
            <li>
              <strong>Cancelación entre 3 y 7 días de anticipación:</strong> Se reembolsará el 50% del monto total de la reserva.
            </li>
            <li>
              <strong>Cancelación con menos de 72 horas de anticipación:</strong> No aplica devolución ni reembolso de dinero.
            </li>
          </ul>
        </section>

        {/* 4. Excepciones */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">4. Excepciones por Fallas Técnicas o Fuerza Mayor</h2>
          <p className="mb-3">
            En cumplimiento de la idoneidad del servicio exigida por Indecopi, si la pantalla digital contratada presenta fallas técnicas, apagones, vandalismo o eventos de fuerza mayor que impidan la correcta difusión del anuncio:
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-4 text-slate-700">
            <li>
              <strong>Compensación de tiempo:</strong> JMT OUTDOORS repondrá las horas o días de exhibición afectados en la misma pantalla o en una de iguales características, previo acuerdo con el cliente.
            </li>
            <li>
              <strong>Nota de Crédito o Reembolso:</strong> Si la reposición no es técnicamente viable o la campaña pierde vigencia (por ejemplo, un evento con fecha fija), se emitirá una nota de crédito a favor del cliente o se gestionará el reembolso proporcional al tiempo de falla, sin penalidad alguna para el usuario.
            </li>
          </ul>
        </section>

        {/* 5. Responsabilidad por el Contenido */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">5. Responsabilidad por el Contenido (Artes y Videos)</h2>
          <p className="mb-3">
            Es responsabilidad exclusiva del cliente cargar los materiales audiovisuales respetando las especificaciones técnicas proporcionadas en la web y la normativa peruana vigente (Ley de Represión de la Competencia Desleal - DL 1044).
          </p>
          <p className="mb-4">
            Si una campaña no se exhibe o se retrasa porque el archivo del cliente no cumple con el formato técnico, tiene contenido explícito, ofensivo o infringe derechos de autor, no habrá lugar a devolución ni reprogramación, corriendo los días de reserva como vigentes.
          </p>
        </section>

        {/* 6. Procedimiento */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">6. Procedimiento para Solicitar Cambios o Devoluciones</h2>
          <p className="mb-3">
            Toda solicitud deberá ser canalizada formalmente por el titular de la compra mediante el correo electrónico de soporte: <a href="mailto:soporte@jmtoutdoors.com.pe" className="text-primary hover:underline">soporte@jmtoutdoors.com.pe</a> o a través del formulario de contacto de la web, adjuntando:
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-4 text-slate-700">
            <li>Número de orden de compra o código de reserva.</li>
            <li>RUC o DNI del contratante.</li>
            <li>Sustento o motivo de la solicitud.</li>
          </ul>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p>
              <strong>Plazo de respuesta:</strong> De acuerdo con la normativa peruana, JMT OUTDOORS emitirá una respuesta formal en un plazo máximo de 15 días hábiles contados a partir del día siguiente de recibida la solicitud. Los reembolsos aprobados se verán reflejados en la cuenta del cliente en un periodo de 7 a 30 días, dependiendo del banco emisor de la tarjeta.
            </p>
          </div>
        </section>

        {/* Support Callout */}
        <div className="border border-primary/20 bg-primary/5 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900">¿Necesitas ayuda con tu campaña?</h3>
            <p className="text-xs text-slate-500">Nuestro equipo de soporte técnico y comercial está listo para asistirte.</p>
          </div>
          <a
            href="mailto:soporte@jmtoutdoors.com.pe"
            className="inline-flex justify-center items-center px-4 py-2 text-xs font-bold bg-primary hover:bg-primary/95 text-white rounded-lg transition-colors cursor-pointer"
          >
            Contactar Soporte
          </a>
        </div>
      </div>
    </article>
  );
}
