/* =====================================================================
 * PlanDeEstudio.js (diagrama de clases)
 * Atributos: idPlanDeEstudio, cantidadMaterias.
 * Relaciones: Carrera 1 ◆── 1 PlanDeEstudio (composición).
 * Métodos:    agregarMaterias(), quitarMaterias(), getIdPlanDeEstudio().
 *
 * El plan maneja la estructura curricular (límite de materias, RF03/RF06).
 * Las materias quedan en la Carrera, que es el todo de la composición
 * Carrera ◆ Materia del diagrama; el plan controla cuántas se incorporan.
 * ===================================================================== */

class PlanDeEstudio {
  /** @param {Carrera} carrera  Carrera dueña del plan (la crea en su constructor). */
  constructor({ idPlanDeEstudio, cantidadMaterias }, carrera) {
    this.idPlanDeEstudio = idPlanDeEstudio;
    this.cantidadMaterias = cantidadMaterias;   // límite de materias del plan (RF03)
    this.carrera = carrera;
  }

  /** Fuera del DS01 (RF06 "Asociar materia con carrera"). Retorna void. */
  agregarMaterias(materias) {
    const nuevas = materias.filter(m => !this.carrera._materias.includes(m));
    if (this.carrera._materias.length + nuevas.length > this.cantidadMaterias) {
      throw new Error(`El plan ${this.idPlanDeEstudio} admite como máximo ${this.cantidadMaterias} materias.`);
    }
    this.carrera._materias.push(...nuevas);
  }

  /** Fuera del DS01 (RF06). Retorna void. */
  quitarMaterias(materias) {
    this.carrera._materias = this.carrera._materias.filter(m => !materias.includes(m));
  }

  /** Usado por Carrera.obtenerIdPlanDeEstudio(). Retorna int. */
  getIdPlanDeEstudio() {
    return this.idPlanDeEstudio;
  }
}
