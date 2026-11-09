/* =====================================================================
 * ControladorInscripcion.js — <<control>> de CU-05 "Inscribirse a materias"
 *
 * Coordina el DS01: pregunta y delega en las entidades, sin lógica de dominio.
 *
 * Decisiones del equipo (Prompts 1 a 4):
 * - Un ControladorInscripcion por trámite (una Inscripción cada uno). El Form
 *   repite el flujo desde el msj. 2 por cada materia marcada.
 * - Los métodos del DS01 figuran como ":void", pero devuelven el valor de la
 *   flecha punteada del DS01 como objeto plano congelado (decisión 3).
 * - A la vista nunca se le entregan entidades: recibe objetos de Mapeador y
 *   devuelve referencias planas ({ legajo }, { idMateria }, { idComision },
 *   { idInscripcion }) que el controlador resuelve a las entidades que ya
 *   conoce antes de delegar. Así las llamadas a las entidades usan exactamente
 *   las firmas del DS01.
 * ===================================================================== */

class ControladorInscripcion {
  #repo;
  // Detalle de implementación: el controlador recuerda los objetos de su trámite
  // porque los mensajes posteriores del DS01 los usan sin recibirlos
  // (confirmarInscripcion() no tiene parámetros; msjs. 10, 35, 40, 47, 52).
  #est = null;        // msj. 2
  #ins = null;        // msj. 5
  #materias = [];     // msj. 14 (oferta del trámite)
  #mat = null;        // msj. 31
  #com = null;        // msj. 31

  /** @param {object} repositorio  Resultado de crearBaseDeDatos(). */
  constructor(repositorio) {
    this.#repo = repositorio;
  }

  /* ==================================================================
   * Autenticación simulada (previa al DS01)
   * ================================================================== */

  /** Login simulado: busca por legajo y llama a Usuario.iniciarSesion(). Retorna el estudiante plano o null. */
  iniciarSesion(legajo) {
    const est = this.#repo.buscarEstudiantePorLegajo(legajo);
    if (!est || !est.iniciarSesion()) return null;
    this.#est = est;
    return Mapeador.estudiante(est);
  }

  /** Cierra la sesión simulada (Usuario.cerrarSesion()). Retorna void. */
  cerrarSesion() {
    if (this.#est) this.#est.cerrarSesion();
    this.#est = null;
  }

  /* ==================================================================
   * Pasos 1 a 4 — Inicio, validación del estudiante y oferta
   * ================================================================== */

  /**
   * DS01 msj. 2: iniciarInscripcion(est:Estudiante):void — CU-05 pasos 2 a 4, A3, A4.
   * Delega msjs. 3 a 18 y devuelve el retorno del DS01:
   *   msj. 11 → { motivo: NO_HABILITADO, ins }   (A3)
   *   msj. 16 → { motivo: SIN_OFERTA, ins }      (A4)
   *   msj. 19 → { materias, ins }                 (oferta; incluye las materias sin comisiones, A5)
   */
  iniciarInscripcion(est) {
    if (this.#ins) {
      throw new Error('Este controlador ya tiene un trámite: se usa un ControladorInscripcion por Inscripción.');
    }
    const e = this.#resolverEstudiante(est);
    this.#est = e;
    const car = e.carrera;

    // msjs. 3–5: crea la Inscripción (EN_CURSO) con las materias del plan de su carrera.
    const ins = e.inscribirAMaterias(car.materias);
    this.#ins = ins;

    const estudianteHabilitado = e.validarEstudianteHabilitado(e);   // msjs. 6–7  (paso 3)
    const carreraValidada = e.validarCarreraDeEstudiante(car, e);    // msjs. 8–9  (paso 4)
    if (!estudianteHabilitado || !carreraValidada) {                 // break A3
      ins.cambiarEstado(EstadoInscripcion.RECHAZADA);                // msj. 10
      return this.#respuesta({ motivo: Motivo.NO_HABILITADO });      // msj. 11
    }

    const materias = e.buscarMaterias();                             // msjs. 13–14 (paso 4)
    // Guarda del break A4 (nota del msj. 13): hayComisiones = al menos una
    // materia tiene una comisión abierta.
    const hayComisiones = materias.some(m => m.comisiones.some(c => c.estado === true));
    if (!hayComisiones) {                                            // break A4
      ins.cambiarEstado(EstadoInscripcion.RECHAZADA);                // msj. 15
      return this.#respuesta({ motivo: Motivo.SIN_OFERTA });         // msj. 16
    }

    ins.cambiarEstado(EstadoInscripcion.VALIDADA);                   // msj. 18
    this.#materias = materias;
    return this.#respuesta({                                         // msj. 19
      materias: materias.map(m => Mapeador.materia(m))
    });
  }

  /* ==================================================================
   * Pasos 5 a 9 — Selección y confirmación de la solicitud
   * ================================================================== */

  /**
   * DS01 msj. 24: cancelarSolicitudDeInscripcion(ins:Inscripcion):void — A6.
   * Delega msjs. 25 a 27 (VALIDADA → CANCELADA) y devuelve el msj. 28.
   */
  cancelarSolicitudDeInscripcion(ins) {
    const i = this.#resolverInscripcion(ins);
    this.#est.cancelarSolicitudDeInscripcion(i);                     // msjs. 25–27
    return this.#respuesta({ estado: EstadoInscripcion.CANCELADA }); // msj. 28
  }

  /**
   * DS01 msj. 31: confirmarSolicitudDeInscripcion(mat:Materia, com:Comision):void — pasos 6 a 10, A8.
   * Una vez por trámite (por materia marcada). Valida en el orden del DS01 y
   * corta en la primera que falla:
   *   msj. 38 → { motivo: SIN_CUPO, ins }
   *   msj. 43 → { motivo: YA_INSCRIPTO, ins }
   *   msj. 50 → { motivo: CORRELATIVAS_INCUMPLIDAS, ins, correlativas }
   *   msj. 53 → { ins }   (APROBADA, para el resumen)
   */
  confirmarSolicitudDeInscripcion(mat, com) {
    this.#exigirInscripcion();
    const m = this.#materias.find(x => x.idMateria === Number(mat.idMateria));
    if (!m) throw new Error(`La materia ${mat.idMateria} no está en la oferta de este trámite.`);
    const c = m.comisiones.find(x => x.idComision === Number(com.idComision) && x.estado === true);
    if (!c) throw new Error(`La comisión ${com.idComision} no es una comisión abierta de ${m.nombre}.`);
    this.#mat = m;
    this.#com = c;
    const e = this.#est;
    const ins = this.#ins;

    e.confirmarSolicitudDeInscripcion(m, c);                         // msjs. 32–34 (pasos 6–7: PENDIENTE)

    // Paso 8: cupo → inscripción previa → correlatividades.
    const hayCupo = c.verificarCupo();                               // msjs. 35–36
    if (!hayCupo) {                                                  // break A8 – sin cupo
      ins.cambiarEstado(EstadoInscripcion.RECHAZADA);                // msj. 37
      return this.#respuesta({ motivo: Motivo.SIN_CUPO });           // msj. 38
    }

    const yaInscripto = c.estaInscripto(e);                          // msjs. 40–41
    if (yaInscripto) {                                               // break A8 – inscripción previa
      ins.cambiarEstado(EstadoInscripcion.RECHAZADA);                // msj. 42
      return this.#respuesta({ motivo: Motivo.YA_INSCRIPTO });       // msj. 43
    }

    const historial = e.consultarHistorialAcademico();               // msjs. 45–46
    const cumpleCorrelativas = m.esCorrelativaDe(historial);         // msjs. 47–48
    if (!cumpleCorrelativas) {                                       // break A8 – correlatividades
      ins.cambiarEstado(EstadoInscripcion.RECHAZADA);                // msj. 49
      return this.#respuesta({                                       // msj. 50
        motivo: Motivo.CORRELATIVAS_INCUMPLIDAS,
        // Detalle de implementación: esCorrelativaDe() devuelve solo un boolean.
        // Para informar "qué requisitos no cumple" (CU-05, A8), el mapeador
        // marca cada materia de la relación "requiere" como aprobada o no con
        // el historial del msj. 46.
        correlativas: Mapeador.requisitos(m, historial)
      });
    }

    ins.cambiarEstado(EstadoInscripcion.APROBADA);                   // msj. 52 (paso 9)
    return this.#respuesta({});                                      // msj. 53 (paso 10: resumen)
  }

  /* ==================================================================
   * Pasos 10 a 12 — Confirmación de la inscripción
   * ================================================================== */

  /**
   * DS01 msj. 56: cancelarInscripcion(ins:Inscripcion):void — A11.
   * Delega msjs. 57 a 59 (APROBADA → CANCELADA, sin descontar cupo) y devuelve el msj. 60.
   */
  cancelarInscripcion(ins) {
    const i = this.#resolverInscripcion(ins);
    this.#est.cancelarInscripcion(i);                                // msjs. 57–59
    return this.#respuesta({ estado: EstadoInscripcion.CANCELADA }); // msj. 60
  }

  /**
   * DS01 msj. 63: confirmarInscripcion():void — pasos 11 y 12, A12.
   * Delega en est.confirmarInscripcion() (msjs. 64 a 86): CONFIRMADA →
   * verificarCupo → agregarEstudiante → restarCupo → comprobante → FINALIZADA.
   * El cupo se descuenta solo después de agregarEstudiante() (RNF07).
   *   msjs. 70 / 76 → { motivo: FALLA_REGISTRO, ins }   (A12, RECHAZADA, sin descontar cupo)
   *   msj. 87       → { ins, comprobante }               (FINALIZADA)
   */
  confirmarInscripcion() {
    this.#exigirInscripcion();
    const e = this.#est;
    // Detalle de implementación (punto 9): Estudiante.confirmarInscripcion()
    // toma el primer trámite en APROBADA. Antes de delegar se comprueba que sea
    // el de este controlador, para no tocar otra Inscripción.
    const primeraAprobada = e.inscripciones.find(i => i.estado === EstadoInscripcion.APROBADA);
    if (primeraAprobada !== this.#ins) {
      throw new Error('Los trámites se confirman en orden: este no es el primero en APROBADA.');
    }

    const ins = e.confirmarInscripcion();                            // msjs. 64–86

    if (ins !== this.#ins) {
      throw new Error('La Inscripción confirmada no corresponde a este trámite.');
    }
    if (ins.estado === EstadoInscripcion.RECHAZADA) {                // A12: msjs. 69–70 o 75–76
      return this.#respuesta({ motivo: Motivo.FALLA_REGISTRO });
    }

    // Comprobante (inclusión del CU12, msjs. 80–84): es la última solicitud de
    // tipo INSCRIPCION del estudiante (asociación Estudiante ── SolicitudCertificado).
    const sol = e.solicitudes.filter(s => s.tipo === TipoCertificado.INSCRIPCION).at(-1);
    return this.#respuesta({                                         // msj. 87
      comprobante: Mapeador.comprobante(sol, ins, this.#com)
    });
  }

  /* ==================================================================
   * Fuera del DS01
   * ================================================================== */

  /**
   * Si el estudiante sale a mitad del trámite: cancela lo que quedó VALIDADA
   * (camino de A6) o APROBADA (camino de A11), delegando en el Estudiante.
   * Las demás situaciones ya son finales o no quedan abiertas. Retorna la
   * inscripción plana o null.
   */
  descartarTramiteEnCurso() {
    const ins = this.#ins;
    if (!ins) return null;
    if (ins.estado === EstadoInscripcion.VALIDADA) {
      this.#est.cancelarSolicitudDeInscripcion(ins);                 // como msjs. 25–27
    } else if (ins.estado === EstadoInscripcion.APROBADA) {
      this.#est.cancelarInscripcion(ins);                            // como msjs. 57–59
    }
    return Mapeador.inscripcion(ins, this.#com);
  }

  /** Caso de uso "Consultar estado de inscripciones" (Trámites online). Retorna inscripciones planas. */
  consultarEstadoDeInscripciones() {
    this.#exigirSesion();
    return Object.freeze(this.#est.consultarEstadoDeInscripciones().map(i => Mapeador.inscripcion(i)));
  }

  /** Caso de uso "Consultar comisiones" (Trámites online, RF12). Retorna comisiones planas. */
  consultarComisiones() {
    this.#exigirSesion();
    return Object.freeze(this.#est.consultarComisiones().map(c => Mapeador.comision(c)));
  }

  /* ==================================================================
   * Privados del controlador (no son mensajes del DS01)
   * ================================================================== */

  /** Arma el retorno plano y le agrega siempre el estado actual de la Inscripción. */
  #respuesta(datos) {
    return congelarProfundo({ ...datos, ins: Mapeador.inscripcion(this.#ins, this.#com) });
  }

  /** Referencia plana { legajo } → Estudiante (repositorio). */
  #resolverEstudiante(est) {
    const legajo = est && est.legajo;
    const e = this.#repo.buscarEstudiantePorLegajo(legajo);
    if (!e) throw new Error(`No existe un estudiante con legajo ${legajo}.`);
    return e;
  }

  /** Referencia plana { idInscripcion } → la Inscripción de este trámite. */
  #resolverInscripcion(ins) {
    this.#exigirInscripcion();
    if (!ins || Number(ins.idInscripcion) !== this.#ins.idInscripcion) {
      throw new Error('La inscripción indicada no es la de este trámite.');
    }
    return this.#ins;
  }

  #exigirInscripcion() {
    if (!this.#ins) throw new Error('Primero hay que iniciar la inscripción (msj. 2).');
  }

  #exigirSesion() {
    if (!this.#est) throw new Error('No hay una sesión iniciada.');
  }
}
