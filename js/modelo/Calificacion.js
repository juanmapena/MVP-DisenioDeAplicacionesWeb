/* =====================================================================
 * Calificacion.js (diagrama de clases)
 * Atributos: idCalificacion, nota (double), observacion (string).
 * Relaciones: Materia 1 ◆── N Calificacion (composición);
 *             TipoCalificacion (APROBADO / PROMOCION / APLAZO).
 * Métodos:    editarObservacion(), agregarObservacion().
 * ===================================================================== */

class Calificacion {
  /**
   * @param {object} datos
   * @param {Materia} datos.materia  Todo de la composición: la calificación se registra en él.
   */
  constructor({ idCalificacion, materia, nota, tipo, observacion = '' }) {
    if (!Object.values(TipoCalificacion).includes(tipo)) {
      throw new Error(`TipoCalificacion inválido: ${tipo}`);
    }
    this.idCalificacion = idCalificacion;
    this.nota = nota;
    this.observacion = observacion;
    this.tipo = tipo;            // relación con el enum TipoCalificacion
    this.materia = materia;      // extremo "1" de la composición
    materia._calificaciones.push(this);
  }

  /** Fuera del DS01. Retorna void. */
  editarObservacion(texto) {
    this.observacion = texto;
  }

  /** Fuera del DS01. Retorna void. */
  agregarObservacion(texto) {
    this.observacion = this.observacion ? `${this.observacion} ${texto}` : texto;
  }
}
