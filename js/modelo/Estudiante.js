/* =====================================================================
 * Estudiante.js — hereda de Usuario (diagrama de clases + DS01)
 * Atributos: idEstudiante.
 * Relaciones: Carrera 1 ◇── N Estudiante (agregación);
 *             Estudiante 1 ◆── N Inscripcion (composición);
 *             Estudiante 1 ── N SolicitudCertificado (asociación);
 *             Estudiante 1 ── N Asistencia (fuera del alcance del MVP).
 *
 * Métodos del DS01 (CU-05), con sus firmas:
 *   inscribirAMaterias, validarEstudianteHabilitado, validarCarreraDeEstudiante,
 *   buscarMaterias, cancelarSolicitudDeInscripcion, confirmarSolicitudDeInscripcion,
 *   consultarHistorialAcademico, cancelarInscripcion, confirmarInscripcion.
 * validarRequisitosDeInscripcion() del diagrama se detalla en las tres
 * validaciones del DS01 (extensión justificada).
 * ===================================================================== */

class Estudiante extends Usuario {
  /**
   * Detalle de implementación: trámites en curso, uno por Inscripción, con la
   * materia y la comisión elegidas ({ ins, mat, com }). Inscripción no se
   * relaciona con Comisión en el diagrama, así que el Estudiante recuerda la
   * comisión elegida durante el trámite (la necesitan los msjs. 66, 72, 78 y 81).
   */
  #tramites = [];

  /**
   * Detalle de implementación: materias del plan recibidas en inscribirAMaterias()
   * (msj. 3), que luego filtra buscarMaterias() (msj. 13).
   */
  #materiasDelPlan = [];

  /**
   * Detalle de implementación: el diagrama no relaciona Estudiante con
   * Calificación (Calificación es parte de Materia). El Estudiante guarda las
   * referencias a sus calificaciones para responder consultarHistorialAcademico().
   */
  #calificaciones = [];

  /**
   * @param {Carrera}        datos.carrera         Carrera del estudiante (agregación).
   * @param {Calificacion[]} datos.calificaciones  Historial académico.
   */
  constructor({ idEstudiante, carrera, calificaciones = [], ...datosUsuario }) {
    super(datosUsuario);
    this.idEstudiante = idEstudiante;
    this.carrera = carrera;           // extremo "1" de la agregación
    this._inscripciones = [];         // extremo "N" de la composición con Inscripcion
    this._solicitudes = [];           // extremo "N" de la asociación con SolicitudCertificado
    this.#calificaciones = [...calificaciones];
    carrera._estudiantes.push(this);
  }

  /** Lecturas de las relaciones (copias). */
  get inscripciones() { return [...this._inscripciones]; }
  get solicitudes()   { return [...this._solicitudes]; }

  /* ------------------------------------------------------------------
   * Pasos 1 a 4: inicio, validación del estudiante y oferta
   * ------------------------------------------------------------------ */

  /**
   * DS01 msj. 3: inscribirAMaterias(materias:List<Materia>):Inscripcion.
   * Crea la Inscripción (msj. 4, «create» → EN_CURSO) y la retorna (msj. 5).
   */
  inscribirAMaterias(materias) {
    this.#materiasDelPlan = [...materias];
    const ins = Inscripcion.crear(new Date());            // msj. 4
    this._inscripciones.push(ins);                         // composición Estudiante ◆ Inscripción
    this.#tramites.push({ ins, mat: null, com: null });
    return ins;                                            // msj. 5
  }

  /**
   * DS01 msj. 6: validarEstudianteHabilitado(est:Estudiante):boolean.
   * Paso 3: el estudiante está habilitado si está activo (estaActivo()).
   */
  validarEstudianteHabilitado(est) {
    // Detalle de implementación: la documentación del paso 3 no está modelada;
    // la habilitación se toma del estado del Usuario.
    return est.estaActivo();
  }

  /**
   * DS01 msj. 8: validarCarreraDeEstudiante(car:Carrera, est:Estudiante):boolean.
   * Paso 4: la carrera está activa, es la del estudiante y el estudiante
   * pertenece a ella (agregación Carrera ◇ Estudiante).
   */
  validarCarreraDeEstudiante(car, est) {
    return Boolean(car) &&
           car.estado === true &&
           est.carrera === car &&
           car.estudiantes.includes(est);
  }

  /**
   * DS01 msj. 13: buscarMaterias():List<Materia>.
   * Devuelve las materias activas del plan de su carrera (las recibidas en el
   * msj. 3). Cuáles tienen comisiones abiertas se lee de cada Materia
   * (Materia ◆ Comisión con estado = true): si ninguna tiene → A4; si el
   * estudiante elige una sin comisiones → A5 (nota del msj. 13 del DS01).
   */
  buscarMaterias() {
    return this.#materiasDelPlan.filter(m => m.estado === true);
  }

  /* ------------------------------------------------------------------
   * Pasos 5 a 9: selección y confirmación de la solicitud
   * ------------------------------------------------------------------ */

  /**
   * DS01 msj. 25: cancelarSolicitudDeInscripcion(ins:Inscripcion):void.
   * A6: VALIDADA → CANCELADA (msj. 26).
   */
  cancelarSolicitudDeInscripcion(ins) {
    this.#verificarPropia(ins);
    ins.cambiarEstado(EstadoInscripcion.CANCELADA);        // msj. 26
  }

  /**
   * DS01 msj. 32: confirmarSolicitudDeInscripcion(mat:Materia, com:Comision):void.
   * Asocia la Inscripción a la materia, recuerda la comisión y la pasa a
   * PENDIENTE (msj. 33).
   */
  confirmarSolicitudDeInscripcion(mat, com) {
    if (com.materia !== mat) {
      throw new Error(`La comisión ${com.etiqueta} no pertenece a ${mat.nombre}.`);
    }
    // Detalle de implementación: el trámite que se confirma es el último creado
    // que todavía no tiene materia (un ControladorInscripcion por trámite; el Form
    // repite el flujo desde el msj. 2 por cada materia marcada).
    const tramite = [...this.#tramites].reverse()
      .find(t => t.mat === null && t.ins.estado === EstadoInscripcion.VALIDADA);
    if (!tramite) {
      throw new Error('No hay una inscripción VALIDADA esperando la elección de materia.');
    }
    tramite.mat = mat;
    tramite.com = com;                                     // recuerda la comisión elegida
    tramite.ins.materia = mat;                             // composición Materia ◆ Inscripción
    mat._inscripciones.push(tramite.ins);
    tramite.ins.cambiarEstado(EstadoInscripcion.PENDIENTE); // msj. 33
  }

  /**
   * DS01 msj. 45: consultarHistorialAcademico():List<Calificacion>.
   * Retorna una copia del historial (msj. 46).
   */
  consultarHistorialAcademico() {
    return [...this.#calificaciones];
  }

  /* ------------------------------------------------------------------
   * Pasos 10 a 12: confirmación de la inscripción
   * ------------------------------------------------------------------ */

  /**
   * DS01 msj. 57: cancelarInscripcion(ins:Inscripcion):void.
   * A11: APROBADA → CANCELADA (msj. 58). No se descuenta cupo.
   */
  cancelarInscripcion(ins) {
    this.#verificarPropia(ins);
    ins.cambiarEstado(EstadoInscripcion.CANCELADA);        // msj. 58
  }

  /**
   * DS01 msj. 64: confirmarInscripcion():Inscripcion.
   * CONFIRMADA (65) → verificarCupo (66) → agregarEstudiante (72) →
   * restarCupo (78) → comprobante (80 a 84) → FINALIZADA (85).
   * Si falla el cupo o el registro (A12): RECHAZADA (68 / 74) y retorna la
   * inscripción rechazada (69 / 75). Si sale bien, retorna ins (86).
   */
  confirmarInscripcion() {
    // Detalle de implementación: el método no recibe parámetros, así que toma el
    // primer trámite en APROBADA. El Form confirma los trámites en ese mismo
    // orden y cada controlador verifica que la Inscripción devuelta sea la suya.
    const tramite = this.#tramites.find(t => t.ins.estado === EstadoInscripcion.APROBADA);
    if (!tramite) {
      throw new Error('No hay una inscripción APROBADA para confirmar.');
    }
    const { ins, mat, com } = tramite;

    ins.cambiarEstado(EstadoInscripcion.CONFIRMADA);       // msj. 65

    const hayCupo = com.verificarCupo();                   // msjs. 66–67
    if (!hayCupo) {                                        // A12 – cupo agotado
      ins.cambiarEstado(EstadoInscripcion.RECHAZADA);      // msj. 68
      return ins;                                          // msj. 69: rechazada
    }

    const registrada = com.agregarEstudiante(this);        // msjs. 72–73
    if (!registrada) {                                     // A12 – falla del registro
      ins.cambiarEstado(EstadoInscripcion.RECHAZADA);      // msj. 74
      return ins;                                          // msj. 75: rechazada
    }

    com.restarCupo();                                      // msjs. 78–79

    // Inclusión del CU12: comprobante de la inscripción.
    const sol = SolicitudCertificado.crear(new Date());    // msj. 80 (SOLICITADO)
    sol.generarCertificado(this, this.carrera, mat);       // msjs. 81–82 (EMITIDO)
    sol.descargar();                                       // msjs. 83–84 (ENTREGADO)

    ins.cambiarEstado(EstadoInscripcion.FINALIZADA);       // msj. 85
    return ins;                                            // msj. 86
  }

  /* ------------------------------------------------------------------
   * Métodos del diagrama fuera del DS01
   * ------------------------------------------------------------------ */

  /**
   * Diagrama de clases. En la Segunda parte se detalla en los msjs. 6, 8 y 13
   * del DS01; se conserva como composición de esas validaciones. Retorna boolean.
   */
  validarRequisitosDeInscripcion() {
    return this.validarEstudianteHabilitado(this) &&
           this.validarCarreraDeEstudiante(this.carrera, this);
  }

  /** En el DS01 (msj. 21) es un evento del actor hacia FormInscripcion: no se usa sobre est. */
  seleccionarMateria()  { fueraDelAlcanceDelMVP('Estudiante.seleccionarMateria'); }

  /** En el DS01 (msj. 22) es un evento del actor hacia FormInscripcion: no se usa sobre est. */
  seleccionarComision() { fueraDelAlcanceDelMVP('Estudiante.seleccionarComision'); }

  /** Fuera del DS01. Retorna Carrera. */
  consultarCarrera() { return this.carrera; }

  /** Fuera del DS01. Retorna List<Calificacion>. */
  consultarCalificaciones() { return this.consultarHistorialAcademico(); }

  /** Fuera del DS01 ("Consultar estado de inscripciones"). Retorna List<Inscripcion>. */
  consultarEstadoDeInscripciones() { return this.inscripciones; }

  /**
   * Fuera del DS01: caso de uso "Consultar comisiones" (RF12), usado por
   * Trámites online. Retorna List<Comision>: las comisiones abiertas de las
   * materias activas de su carrera.
   */
  consultarComisiones() {
    return this.carrera.materias
      .filter(m => m.estado === true)
      .flatMap(m => m.comisiones)
      .filter(c => c.estado === true);
  }
  /** Fuera del DS01 (RF15). */
  consultarAsistencias()                { fueraDelAlcanceDelMVP('Estudiante.consultarAsistencias'); }
  /** Fuera del DS01 (CU-10). */
  solicitarCertificado()                { fueraDelAlcanceDelMVP('Estudiante.solicitarCertificado'); }
  /** Fuera del DS01 (CU-10). */
  verDetalleDeSolicitudDeCertificado()  { fueraDelAlcanceDelMVP('Estudiante.verDetalleDeSolicitudDeCertificado'); }
  /** Fuera del DS01 (CU-10). El comprobante de CU-05 se descarga en el msj. 83. */
  descargarCertificado()                { fueraDelAlcanceDelMVP('Estudiante.descargarCertificado'); }

  /* ------------------------------------------------------------------ */

  /**
   * Detalle de implementación: verificación privada (no es un método del
   * diagrama) que usan las dos cancelaciones: la Inscripción es de este estudiante.
   */
  #verificarPropia(ins) {
    if (!this._inscripciones.includes(ins)) {
      throw new Error(`La inscripción ${ins.idInscripcion} no pertenece a este estudiante.`);
    }
  }
}
