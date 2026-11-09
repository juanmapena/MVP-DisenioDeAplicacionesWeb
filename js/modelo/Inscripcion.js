/* =====================================================================
 * Inscripcion.js (diagrama de clases + DE01)
 * Atributos: idInscripcion, fecha.
 * Relaciones: Estudiante 1 ◆── N Inscripcion (composición);
 *             Materia 1 ◆── N Inscripcion (composición);
 *             EstadoInscripcion (estado actual).
 * Métodos:    «create» crear(fecha), cambiarEstado(estado).
 *
 * Guarda SOLO su estado actual: no hay historial de estados.
 * Todo cambio de estado pasa por cambiarEstado(), que aplica el DE01.
 * ===================================================================== */

class Inscripcion {
  static #ultimoId = 0;
  #estado;

  constructor(fecha) {
    this.idInscripcion = ++Inscripcion.#ultimoId;
    this.fecha = fecha;
    // Transición inicial del DE01: la Inscripción nace EN_CURSO (DS01 msj. 4,
    // sin cambiarEstado).
    this.#estado = EstadoInscripcion.EN_CURSO;
    // Extremo "1" de la composición Materia ◆ Inscripción.
    // Detalle de implementación: en EN_CURSO y VALIDADA todavía no hay materia
    // elegida; se asocia en el msj. 32 (Estudiante.confirmarSolicitudDeInscripcion).
    this.materia = null;
  }

  /** DS01 msj. 4: «create» crear(fecha:Date), enviado por est. Retorna la nueva Inscripcion (EN_CURSO). */
  static crear(fecha) {
    if (!(fecha instanceof Date) || isNaN(fecha)) {
      throw new Error('Inscripcion.crear: la fecha no es válida.');
    }
    return new Inscripcion(fecha);
  }

  /** Estado actual (solo lectura). */
  get estado() { return this.#estado; }

  /**
   * DS01 msjs. 10, 15, 18, 26, 33, 37, 42, 49, 52, 58, 65, 68, 74, 85.
   * Aplica una transición del DE01; cualquier otra lanza un error. Retorna void.
   */
  cambiarEstado(estado) {
    if (!Object.values(EstadoInscripcion).includes(estado)) {
      throw new Error(`Estado de inscripción inexistente: ${estado}`);
    }
    if (!TransicionesInscripcion[this.#estado].includes(estado)) {
      throw new Error(`Transición inválida en la inscripción ${this.idInscripcion}: ${this.#estado} → ${estado} (DE01).`);
    }
    this.#estado = estado;
  }
}
