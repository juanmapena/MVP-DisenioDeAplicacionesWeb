/* =====================================================================
 * Comision.js (diagrama de clases)
 * Atributos: idComision, dia, cupoDisponible, cupoMaximo, nroAula, estado (boolean).
 * Relaciones: Materia 1 ◆── N Comision (composición);
 *             Comision 1 ◆── N Clase (composición);
 *             Turno (MAÑANA / TARDE / NOCHE).
 * Métodos:    verificarCupo(), agregarEstudiante(), quitarEstudiante(),
 *             ampliarCupo(), estaInscripto(), restarCupo().
 *
 * estado es boolean, como en el diagrama: true = comisión abierta.
 * "Llena" no es un valor de enum: significa cupoDisponible === 0.
 * ===================================================================== */

class Comision {
  /** Detalle de implementación: estudiantes registrados con agregarEstudiante(est). */
  #estudiantes = [];
  #cupoDisponible;

  /**
   * @param {Materia} datos.materia  Todo de la composición.
   * @param {string}  datos.etiqueta Rótulo visible (ej. "INF_GE_1").
   */
  constructor({ idComision, materia, dia, turno, cupoMaximo, cupoDisponible = cupoMaximo,
                nroAula, estado = true, etiqueta }) {
    if (!Object.values(Turno).includes(turno)) {
      throw new Error(`Turno inválido: ${turno}`);
    }
    if (cupoDisponible < 0 || cupoDisponible > cupoMaximo) {
      throw new Error(`Cupo inválido en la comisión ${idComision}.`);
    }
    this.idComision = idComision;
    this.dia = dia;                 // ej. "Lunes - Miércoles": se muestra como "Día/s"
    this.cupoMaximo = cupoMaximo;
    this.#cupoDisponible = cupoDisponible;
    this.nroAula = nroAula;
    this.estado = estado;
    this.turno = turno;             // relación con el enum Turno
    this.materia = materia;         // extremo "1" de la composición
    this._clases = [];              // extremo "N" de la composición con Clase (lo completa Clase)
    // Detalle de implementación: la etiqueta visible de la comisión (ej. INF_GE_1)
    // es un dato de presentación de las maquetas aprobadas; el identificador del
    // modelo sigue siendo idComision (int).
    this.etiqueta = etiqueta ?? String(idComision);
    materia._comisiones.push(this);
  }

  /** Lectura de cupoDisponible: solo se modifica con restarCupo/ampliarCupo/quitarEstudiante. */
  get cupoDisponible() { return this.#cupoDisponible; }

  /** Clases de la comisión (lectura de la composición; copia). */
  get clases() { return [...this._clases]; }

  /**
   * Docente titular de la comisión.
   * Detalle de implementación: el diagrama no relaciona Comisión con Docente;
   * el titular se obtiene recorriendo Comisión ◆ Clase ── Docente y se toma el
   * docente de la primera clase (por número de clase).
   */
  get titular() {
    const primera = [...this._clases].sort((a, b) => a.numeroDeClase - b.numeroDeClase)[0];
    return primera ? primera.docente : null;
  }

  /** DS01 msj. 35 (Ctrl → com, paso 8) y msj. 66 (est → com, paso 12). Retorna boolean: hayCupo. */
  verificarCupo() {
    return this.#cupoDisponible > 0;
  }

  /**
   * DS01 msj. 40 (Ctrl → com, paso 8). Retorna boolean: yaInscripto.
   * Regla de CU-05: el estudiante ya está inscripto en ALGUNA comisión de esa
   * materia en el período vigente.
   */
  estaInscripto(est) {
    // Detalle de implementación: revisa todas las comisiones de su materia
    // (Materia ◆ Comisión), no solo esta, para respetar la regla del CU.
    // Todas las comisiones cargadas pertenecen a PERIODO_VIGENTE ("2C 2026"),
    // así que no hace falta filtrar por período.
    return this.materia.comisiones.some(c => c.#estudiantes.includes(est));
  }

  /** DS01 msj. 72 (est → com, paso 12). Retorna boolean: registrada. */
  agregarEstudiante(est) {
    // Falla del registro (A12): comisión cerrada o estudiante ya registrado en ella.
    if (!this.estado || this.#estudiantes.includes(est)) {
      return false;
    }
    this.#estudiantes.push(est);
    return true;
  }

  /** Fuera del DS01 (lo usaría "Cancelar inscripción"). Libera la vacante. Retorna boolean. */
  quitarEstudiante(est) {
    const i = this.#estudiantes.indexOf(est);
    if (i === -1) return false;
    this.#estudiantes.splice(i, 1);
    if (this.#cupoDisponible < this.cupoMaximo) this.#cupoDisponible++;
    return true;
  }

  /** Fuera del DS01 (gestión de comisiones). Retorna void. */
  ampliarCupo(n) {
    if (!Number.isInteger(n) || n <= 0) throw new Error('ampliarCupo: n debe ser un entero positivo.');
    this.cupoMaximo += n;
    this.#cupoDisponible += n;
  }

  /** DS01 msj. 78 (est → com, paso 12). Solo se llama después de agregarEstudiante(). Retorna void. */
  restarCupo() {
    if (this.#cupoDisponible === 0) {
      throw new Error(`restarCupo: la comisión ${this.etiqueta} no tiene cupo para descontar.`);
    }
    this.#cupoDisponible--;
  }
}
