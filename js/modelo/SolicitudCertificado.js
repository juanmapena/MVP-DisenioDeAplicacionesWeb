/* =====================================================================
 * SolicitudCertificado.js (diagrama de clases + DE03)
 * Atributos: nroTramite, fecha, destinatario, fechaEntrega, fechaVencimiento.
 * Relaciones: Carrera 1 ◆── N SolicitudCertificado (composición);
 *             Estudiante 1 ── N SolicitudCertificado (asociación);
 *             TipoCertificado y EstadoSolicitud.
 * Métodos:    «create» crear(fecha), generarCertificado(), cambiarEstado(),
 *             estaVigente(), descargar().
 *
 * En CU-05 se usa para el comprobante de inscripción (inclusión del CU12,
 * DS01 msjs. 80 a 84): SOLICITADO → EMITIDO → ENTREGADO.
 * ===================================================================== */

class SolicitudCertificado {
  static #ultimoNroTramite = 1000;
  #estado;

  constructor(fecha) {
    this.nroTramite = ++SolicitudCertificado.#ultimoNroTramite;
    this.fecha = fecha;
    this.destinatario = null;
    this.fechaEntrega = null;
    this.fechaVencimiento = null;
    this.tipo = null;         // relación con TipoCertificado (se define al generar)
    this.estudiante = null;   // extremo "1" de la asociación con Estudiante
    this.carrera = null;      // extremo "1" de la composición con Carrera
    this.#estado = EstadoSolicitud.SOLICITADO;
  }

  /** DS01 msj. 80: «create» crear(fecha:Date), enviado por est. Retorna la nueva solicitud (SOLICITADO). */
  static crear(fecha) {
    if (!(fecha instanceof Date) || isNaN(fecha)) {
      throw new Error('SolicitudCertificado.crear: la fecha no es válida.');
    }
    return new SolicitudCertificado(fecha);
  }

  /** Estado actual (solo lectura). */
  get estado() { return this.#estado; }

  /** Aplica una transición del DE03 (tramo usado por el MVP). Retorna void. */
  cambiarEstado(estado) {
    const permitidos = TransicionesSolicitud[this.#estado] ?? [];
    if (!permitidos.includes(estado)) {
      throw new Error(`Transición inválida en el trámite ${this.nroTramite}: ${this.#estado} → ${estado} (DE03).`);
    }
    this.#estado = estado;
  }

  /**
   * DS01 msj. 81: generarCertificado(est:Estudiante, car:Carrera, mat:Materia). Retorna void.
   * SOLICITADO → EMITIDO.
   */
  generarCertificado(est, car, mat) {
    // Detalle de implementación: crear(fecha) no recibe el tipo. Si llega una
    // materia, el certificado es el comprobante de inscripción (INSCRIPCION);
    // si no, es el de estudiante regular (CU-10).
    this.tipo = mat ? TipoCertificado.INSCRIPCION : TipoCertificado.ESTUDIANTE_REGULAR;
    // Detalle de implementación: el comprobante de inscripción no tiene un
    // destinatario elegido por el estudiante; se usa el valor por defecto de
    // CU-10 (flujo A7.1). No vence (fechaVencimiento = null).
    this.destinatario = 'A quien corresponda';
    this.estudiante = est;
    this.carrera = car;
    est._solicitudes.push(this);   // asociación Estudiante ── SolicitudCertificado
    car._solicitudes.push(this);   // composición Carrera ◆ SolicitudCertificado
    this.cambiarEstado(EstadoSolicitud.EMITIDO);
  }

  /** Fuera del DS01 (CU-10, flujo A15). Retorna boolean. */
  estaVigente() {
    return this.fechaVencimiento === null || this.fechaVencimiento >= new Date();
  }

  /**
   * DS01 msj. 83: descargar(). Retorna void. EMITIDO → ENTREGADO.
   * El modelo registra la entrega; el archivo lo arma la vista con los datos
   * del comprobante (el modelo no toca el navegador).
   */
  descargar() {
    if (!this.estaVigente()) {
      throw new Error(`El certificado del trámite ${this.nroTramite} está vencido.`);
    }
    this.fechaEntrega = new Date();
    this.cambiarEstado(EstadoSolicitud.ENTREGADO);
  }
}
