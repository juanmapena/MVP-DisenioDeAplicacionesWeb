/* =====================================================================
 * Materia.js (diagrama de clases)
 * Atributos: idMateria, nombre, descripcion, cargaHoraria, anio, estado (boolean).
 * Relaciones: Carrera 1 ◆── N Materia (composición);
 *             Materia 1 ◆── N Comision, Calificacion, Inscripcion (composiciones);
 *             MateriaCorrelativa: relación recursiva N a N con extremos
 *             "requiere" y "habilita".
 * Métodos:    modificarCargaHoraria(), cambiarAnio(), esCorrelativaDe().
 *
 * estado es boolean, como en el diagrama: true = materia activa.
 * "Ofertada" no es un valor de enum: significa que tiene comisiones abiertas.
 * ===================================================================== */

class Materia {
  /**
   * @param {Materia[]} datos.requiere  Materias que hay que tener aprobadas para cursarla.
   */
  constructor({ idMateria, nombre, descripcion = '', cargaHoraria, anio, estado = true, requiere = [] }) {
    this.idMateria = idMateria;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.cargaHoraria = cargaHoraria;
    this.anio = anio;
    this.estado = estado;
    // Extremos "N" de las composiciones (los completan Comision, Calificacion
    // y Estudiante.confirmarSolicitudDeInscripcion respectivamente).
    this._comisiones = [];
    this._calificaciones = [];
    this._inscripciones = [];
    // Relación recursiva MateriaCorrelativa.
    this._requiere = [...requiere];
    this._habilita = [];
    requiere.forEach(m => m._habilita.push(this));
  }

  /** Lecturas de las relaciones (copias, para no exponer las colecciones). */
  get comisiones()     { return [...this._comisiones]; }
  get calificaciones() { return [...this._calificaciones]; }
  get inscripciones()  { return [...this._inscripciones]; }
  get requiere()       { return [...this._requiere]; }
  get habilita()       { return [...this._habilita]; }

  /**
   * DS01 msj. 47 (Ctrl → mat, paso 8). Retorna boolean: cumpleCorrelativas.
   * Se cumple si cada materia del extremo "requiere" tiene, en el historial
   * recibido, una calificación APROBADO o PROMOCION.
   * La pertenencia de una calificación a la materia requerida se resuelve con la
   * composición Materia ◆ Calificación (req.calificaciones), sin navegar de
   * Calificación hacia Materia.
   */
  esCorrelativaDe(historial) {
    return this._requiere.every(req =>
      historial.some(cal =>
        req._calificaciones.includes(cal) &&
        (cal.tipo === TipoCalificacion.APROBADO || cal.tipo === TipoCalificacion.PROMOCION)
      )
    );
  }

  /** Fuera del DS01 (RF04). Retorna void. */
  modificarCargaHoraria(cargaHoraria) {
    if (!(cargaHoraria > 0)) throw new Error('La carga horaria debe ser positiva.');
    this.cargaHoraria = cargaHoraria;
  }

  /** Fuera del DS01 (RF04). Retorna void. */
  cambiarAnio(anio) {
    if (!Number.isInteger(anio) || anio < 1) throw new Error('El año debe ser un entero positivo.');
    this.anio = anio;
  }
}
