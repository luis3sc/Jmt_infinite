import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones | JMT Outdoors Marketplace",
  description: "Términos y condiciones de uso de la plataforma de publicidad exterior digital (DOOH) de JMT Outdoors S.A.C.",
};

export default function TerminosPage() {
  return (
    <article className="space-y-8">
      {/* Page Header */}
      <header className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
          Términos y Condiciones de Uso
        </h1>
        <p className="text-sm text-primary font-semibold uppercase tracking-wider">
          Plataforma Marketplace JMT Outdoors
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Fecha de última actualización: 27 de mayo de 2026
        </p>
      </header>

      {/* Main content body */}
      <div className="space-y-6 text-slate-700 leading-relaxed text-sm md:text-base">
        <p>
          Los presentes Términos y Condiciones (en adelante, los &ldquo;Términos&rdquo;) regulan el acceso y uso de la plataforma marketplace, sitio web, software y servicios asociados (en adelante, la &ldquo;Plataforma&rdquo;) de titularidad de <strong>JMT OUTDOORS S.A.C.</strong>, empresa debidamente constituida bajo las leyes de la República del Perú, con RUC N° [Insertar RUC] y domicilio legal en [Insertar Dirección Legal, Lima, Perú] (en adelante, &ldquo;JMT Outdoors&rdquo;, &ldquo;nosotros&rdquo; o &ldquo;la Empresa&rdquo;).
        </p>

        <p>
          El uso de los servicios de la Plataforma está dirigido únicamente a personas mayores de edad con capacidad legal para contratar. Al registrarse, acceder o utilizar la Plataforma para adquirir, programar o exhibir publicidad exterior digital (DOOH), el usuario (en adelante, el &ldquo;Usuario&rdquo;, &ldquo;Anunciante&rdquo; o &ldquo;Cliente&rdquo;) acepta expresamente estar sujeto a estos Términos.
        </p>

        <hr className="border-slate-200 my-8" />

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-primary font-extrabold">1.</span> Naturaleza del Servicio y Rol de la Empresa
          </h2>
          <div className="pl-6 space-y-3">
            <p>
              <strong>1.1. Descripción del Servicio:</strong> La Plataforma es un marketplace automatizado que permite a los Usuarios gestionar la compra de espacios publicitarios, subir y formatear contenido multimedia y exhibirlo en un inventario de pantallas digitales (LED, tótems, etc.) ubicadas en territorio peruano.
            </p>
            <p>
              <strong>1.2. Doble Rol de JMT Outdoors:</strong> JMT Outdoors actúa como operador directo y propietario de gran parte de las pantallas ofertadas. No obstante, en caso la Plataforma ofrezca inventario de empresas terceras (aliados comerciales), JMT Outdoors actuarará exclusivamente como intermediario tecnológico para facilitar la reserva y conexión, no asumiendo responsabilidad solidaria por la infraestructura física o las omisiones de dichas empresas terceras.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-primary font-extrabold">2.</span> Procedimiento de Reserva y Fases de Campaña
          </h2>
          <div className="pl-6 space-y-4">
            <p>
              El proceso de compra y exhibición se rige bajo un modelo de auto-servicio, sujeto a disponibilidad y aprobación. El estado de la reserva se divide en cuatro (4) fases:
            </p>
            
            <div className="grid gap-3 mt-4">
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 transition-all hover:bg-slate-100/70">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 mb-2">
                  Reservado
                </span>
                <p className="text-sm text-slate-700">
                  El Usuario selecciona las pantallas, fechas, sube el arte (contenido) y procesa el pago o garantía. En esta fase, el Usuario puede cancelar o modificar su reserva sin costo alguno.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 transition-all hover:bg-slate-100/70">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 mb-2">
                  Confirmado
                </span>
                <p className="text-sm text-slate-700">
                  El equipo o sistema automatizado de JMT Outdoors revisa y aprueba el arte y la disponibilidad del espacio. Una vez en esta fase, no se admiten cancelaciones, cambios ni devoluciones de dinero.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 transition-all hover:bg-slate-100/70">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 mb-2">
                  Activado
                </span>
                <p className="text-sm text-slate-700">
                  El anuncio se encuentra en rotación activa en la(s) pantalla(s) elegida(s).
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 transition-all hover:bg-slate-100/70">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 mb-2">
                  Finalizado
                </span>
                <p className="text-sm text-slate-700">
                  La campaña concluye según el periodo programado y el sistema genera los reportes o métricas (Proof of Play) correspondientes.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 italic mt-2">
              <strong>Nota:</strong> JMT Outdoors no garantiza que el arte será aprobado ni que las pantallas estén disponibles hasta que la reserva pase a la fase &ldquo;Confirmado&rdquo;.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-primary font-extrabold">3.</span> Tarifas, Métodos de Pago y Devoluciones
          </h2>
          <div className="pl-6 space-y-3">
            <p>
              <strong>3.1. Medios de Pago Locales:</strong> La Plataforma procesa pagos en Soles (S/) o Dólares (US$) a través de pasarelas seguras. Aceptamos tarjetas de crédito/débito, transferencias bancarias y billeteras digitales (Yape, Plin). JMT Outdoors no almacena datos de tarjetas de crédito.
            </p>
            <p>
              <strong>3.2. Cobro e Impuestos:</strong> Todos los precios publicados en la Plataforma se muestran con el Impuesto General a las Ventas (IGV). La facturación electrónica se emitirá conforme a la normativa de la SUNAT una vez procesado el pago. En pagos con billeteras digitales o transferencias, la reserva no iniciará su fase de &ldquo;Confirmado&rdquo; hasta la validación de los fondos.
            </p>
            <p>
              <strong>3.3. Rechazos y Devoluciones:</strong> Si JMT Outdoors rechaza una reserva por incumplimiento de políticas de contenido o indisponibilidad técnica antes de la fase de confirmación, se procederá al extorno total del dinero. Para pagos con tarjeta, el tiempo del extorno dependerá exclusivamente de la entidad bancaria del Usuario (típicamente entre 15 y 30 días hábiles).
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-primary font-extrabold">4.</span> Restricciones de Contenido y Normativa OOH Peruana
          </h2>
          <div className="pl-6 space-y-3">
            <p>
              El Anunciante es el único responsable legal del contenido exhibido. Está estrictamente prohibido y será causal de rechazo inmediato o baja del anuncio (sin derecho a reembolso), la publicación de contenido que vulnere la ley peruana, incluyendo pero no limitándose a:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>Normativa OOH:</strong> Anuncios que incumplan la Ordenanza N° 2348-2021 (o normativas distritales equivalentes en Lima y provincias), la cual prohíbe el uso de transiciones rápidas, destellos (&ldquo;flashes&rdquo;) o niveles de luminosidad excesiva que puedan deslumbrar o causar distracción peligrosa al tránsito vehicular.
              </li>
              <li>
                <strong>Restricciones de Ubicación:</strong> Publicidad de bebidas alcohólicas o productos de tabaco a menos de quinientos (500) metros de instituciones educativas, conforme a la normativa de salud y protección al menor.
              </li>
              <li>
                <strong>Contenido Prohibido:</strong> Material ilegal, discriminatorio, difamatorio, obsceno, discursos de odio, noticias falsas, o publicidad que constituya competencia desleal y/o publicidad engañosa (Decreto Legislativo N° 1044 de INDECOPI).
              </li>
            </ul>
            <p className="mt-2">
              JMT Outdoors se reserva el derecho irrestricto de apagar la pantalla o retirar el anuncio inmediatamente si una autoridad municipal o gubernamental notifica una infracción, eximiendo a JMT Outdoors de cualquier responsabilidad o penalidad por lucro cesante frente al Cliente.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-primary font-extrabold">5.</span> Propiedad Intelectual e Indemnidad
          </h2>
          <div className="pl-6 space-y-3">
            <p>
              <strong>5.1. Propiedad de la Plataforma:</strong> Todo el código, diseño, marca, software y algoritmos de la Plataforma pertenecen a JMT Outdoors. Se prohíbe la ingeniería inversa, copia o uso indebido de los recursos del sitio.
            </p>
            <p>
              <strong>5.2. Propiedad del Contenido:</strong> El Usuario declara bajo juramento contar con todos los derechos de autor, uso de imagen y licencias sobre las piezas gráficas o videos subidos. El Usuario otorga a JMT Outdoors una licencia de uso temporal exclusiva para la reproducción de dicho contenido en las Pantallas.
            </p>
            <p>
              En caso de que un tercero (incluyendo INDECOPI) inicie un reclamo o acción legal contra JMT Outdoors por infracción de derechos de propiedad intelectual, derechos de imagen o competencia desleal derivados del contenido del Anunciante, el Usuario asume la obligación de mantener indemne a JMT Outdoors, asumiendo todos los costos legales y multas aplicables.
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-primary font-extrabold">6.</span> Disponibilidad, Fallas Técnicas y Garantías
          </h2>
          <div className="pl-6 space-y-3">
            <p>
              La Plataforma y las Pantallas pueden presentar limitaciones de disponibilidad por mantenimiento, cortes de fluido eléctrico, fallas de conectividad de los ISP o factores climáticos.
            </p>
            <p>
              En caso de que un anuncio no se exhiba por problemas atribuibles a la infraestructura de JMT Outdoors (falla de hardware/software de la pantalla), JMT Outdoors compensará al Usuario únicamente por las emisiones no realizadas (<em>missed plays</em>), ya sea mediante una extensión de tiempo de la campaña, créditos en la Plataforma a favor del Usuario, o la devolución proporcional del dinero abonado, a elección de JMT Outdoors.
            </p>
          </div>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-primary font-extrabold">7.</span> Libro de Reclamaciones y Atención al Cliente
          </h2>
          <div className="pl-6 space-y-3">
            <p>
              Conforme a lo establecido en el Código de Protección y Defensa del Consumidor (Ley N° 29571), JMT Outdoors pone a disposición de sus Usuarios un Libro de Reclamaciones Virtual al cual se puede acceder desde el pie de página de la Plataforma. Para consultas o soporte operativo, los Usuarios pueden escribir a: <a href="mailto:soporte@jmtoutdoors.com.pe" className="text-primary hover:underline font-bold">soporte@jmtoutdoors.com.pe</a>.
            </p>
          </div>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-primary font-extrabold">8.</span> Protección de Datos Personales
          </h2>
          <div className="pl-6 space-y-3">
            <p>
              En cumplimiento de la Ley N° 29733, Ley de Protección de Datos Personales y su Reglamento, el Usuario autoriza expresamente a JMT Outdoors a recopilar y tratar sus datos personales (nombres, correos, información de facturación) en su banco de datos para la ejecución del servicio y el envío de comunicaciones comerciales. El Usuario puede ejercer sus derechos ARCO enviando una solicitud a <a href="mailto:privacidad@jmtoutdoors.com.pe" className="text-primary hover:underline font-bold">privacidad@jmtoutdoors.com.pe</a>.
            </p>
          </div>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-primary font-extrabold">9.</span> Ley Aplicable y Jurisdicción
          </h2>
          <div className="pl-6 space-y-3">
            <p>
              Los presentes Términos se rigen bajo las leyes de la República del Perú. Cualquier controversia, disputa o reclamo derivado de la interpretación o ejecución de estos Términos que no pueda ser resuelto mediante trato directo, será sometido a la jurisdicción exclusiva de los Jueces y Tribunales del Distrito Judicial de Lima Cercado (Lima, Perú).
            </p>
          </div>
        </section>
      </div>
    </article>
  );
}
