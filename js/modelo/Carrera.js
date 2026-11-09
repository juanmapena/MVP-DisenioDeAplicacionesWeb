/* =====================================================================
 * Carrera.js (diagrama de clases)
 * Atributos: idCarrera, nombre, duracionEstimada, estado (boolean).
 * Relaciones: Carrera 1 ◆── 1 PlanDeEstudio (composición);
 *             Carrera 1 ◆── N Materia (composición);
 *             Carrera 1 ◆── N SolicitudCertificado (composición);
 *             Carrera 1 ◇── N Estudiante (agregación).
 * Métodos:    modificarEstado(), obtenerIdPlanDeEstudio().
 * ===================================================================== */

class Carrera {
  constructor({ idCarrera, nombre, duracionEstimada, estado = true, plan }) {
    this.idCarrera = idCarrera;
    this.nombre = nombre;
    this.duracionEstimada = duracionEstimada;
    this.estado = estado;
    // Extremos "N" de las relaciones (los completan PlanDeEstudio.agregarMaterias,
    // Estudiante y SolicitudCertificado.generarCertificado).
    this._materias = [];
    this._estudiantes = [];
    this._solicitudes = [];
    // Composición 1 a 1: el plan se crea con la carrera y no existe fuera de ella.
    this.planDeEstudio = new PlanDeEstudio(plan, this);
  }

  /** Lecturas de las relaciones (copias). */
  get materias()    { return [...this._materias]; }
  get estudiantes() { return [...this._estudiantes]; }
  get solicitudes() { return [...this._solicitudes]; }

  /** Fuera del DS01 (RF03). Retorna void. */
  modificarEstado(estado) {
    this.estado = Boolean(estado);
  }

  /** Fuera del DS01. Retorna int. */
  obtenerIdPlanDeEstudio() {
    return this.planDeEstudio.getIdPlanDeEstudio();
  }
}
