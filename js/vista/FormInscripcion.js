/* =====================================================================
 * FormInscripcion.js — <<boundary>> de CU-05 "Inscribirse a materias"
 *
 * Solo muestra datos y llama al controlador. No conoce entidades ni reglas
 * de negocio: recibe objetos planos del ControladorInscripcion y le devuelve
 * referencias planas.
 *
 * Mensajes del DS01 que maneja:
 *  - Eventos del actor (manejadores): inscribirAMaterias (1),
 *    seleccionarMateria (21), seleccionarComision (22),
 *    cancelarSolicitudDeInscripcion (23), confirmarSolicitudDeInscripcion (30),
 *    cancelarInscripcion (55), confirmarInscripcion (62).
 *  - Automensajes, con las firmas del DS01 (un parámetro):
 *    mostrarMotivo(motivo) (12, 17, 39, 44, 51, 71, 77),
 *    mostrarOferta(materias) (20), mostrarMensaje(mensaje) (29, 61),
 *    mostrarResumen(ins) (54), mostrarComprobante(ins) (88).
 *  - Pantallas que no están en el DS01: mostrarLogin y mostrarTramitesOnline.
 *
 * Punto 9 (acordado): un ControladorInscripcion por trámite. Por cada materia
 * marcada, el Form repite el flujo desde el msj. 2. Hay un único botón
 * "Confirmar solicitud"; mostrarResumen y mostrarComprobante se llaman una vez
 * por trámite y cada llamada suma su parte a la misma pantalla.
 * ===================================================================== */

/** Escapa texto antes de insertarlo como HTML. */
function esc(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

class FormInscripcion {
  #raiz;
  #sesion;              // ControladorInscripcion de la sesión (login y consultas)
  #crearControlador;    // fábrica: un ControladorInscripcion nuevo por trámite
  #estudiantes;         // estudiantes planos para el ingreso simulado

  #est = null;          // estudiante plano de la sesión
  #oferta = [];         // materias planas del msj. 19
  #ctrlOferta = null;   // controlador del trámite cuya Inscripción está VALIDADA
  #insOferta = null;    // ins plana del msj. 19 (la usa el msj. 24)
  #seleccion = new Map();   // idMateria → idComision (materias marcadas)

  // Trámites del lote en curso: [{ ctrl, materia, resultado }]. Los
  // automensajes toman de acá los datos extra (materia, requisitos, estado).
  #tramites = [];
  #tramiteActual = null;    // índice del trámite que se está mostrando
  #lote = 0;                // cada lote dibuja su propia pantalla de resumen/resultado
  #modoResultado = null;    // 'exito' | 'motivo' | 'mixto'
  #estadoMensaje = null;    // estado que acompaña a mostrarMensaje (A6/A11)

  #ocupado = false;
  #alHacerClic;
  #alCambiar;

  /**
   * @param {HTMLElement} raiz
   * @param {object} deps  { controladorSesion, crearControlador, estudiantes }
   */
  constructor(raiz, { controladorSesion, crearControlador, estudiantes }) {
    this.#raiz = raiz;
    this.#sesion = controladorSesion;
    this.#crearControlador = crearControlador;
    this.#estudiantes = estudiantes;
    // Delegación de eventos: un solo oyente por tipo, según data-accion.
    this.#alHacerClic = e => this.#despacharClic(e);
    this.#alCambiar = e => this.#despacharCambio(e);
    raiz.addEventListener('click', this.#alHacerClic);
    raiz.addEventListener('change', this.#alCambiar);
  }

  /** Quita los oyentes (lo usa "Reiniciar datos" antes de crear otro Form). */
  desconectar() {
    this.#raiz.removeEventListener('click', this.#alHacerClic);
    this.#raiz.removeEventListener('change', this.#alCambiar);
    this.#cerrarModal();
  }

  /** Para el panel Demo: comisiones de las inscripciones del resumen actual. */
  comisionesDelResumen() {
    return this.#tramites
      .filter(t => t.resultado && !t.resultado.motivo && t.resultado.ins.estado === EstadoInscripcion.APROBADA)
      .map(t => t.resultado.ins.comision.idComision);
  }

  /* ==================================================================
   * Pantallas fuera del DS01
   * ================================================================== */

  /** Ingreso simulado: una tarjeta por estudiante. */
  mostrarLogin(estudiantes = this.#estudiantes) {
    this.#est = null;
    this.#pintar('login', `
      ${this.#encabezado({ conMenu: false })}
      <main class="pagina pagina--login">
        <h1 class="titulo">Ingresar al sistema</h1>
        <p class="texto-secundario">Autenticación simulada: elegí con qué estudiante ingresar.</p>
        <div class="tarjetas-login">
          ${estudiantes.map(e => `
            <article class="tarjeta tarjeta--login">
              <h2 class="tarjeta__titulo">${esc(e.nombre)}</h2>
              <p class="dato">Legajo: <b>${esc(e.legajo)}</b></p>
              <p class="dato">Carrera: <b>${esc(e.carrera)}</b></p>
              <p class="dato">Estado: <b>${e.activo ? 'Activo' : 'Inactivo'}</b></p>
              <button class="boton boton--primario" data-accion="ingresar" data-legajo="${esc(e.legajo)}">
                Ingresar como ${esc(e.nombre.split(' ')[0])}
              </button>
            </article>`).join('')}
        </div>
      </main>`);
  }

  /** Trámites online (paso 1 de CU-05). Textos de la maqueta "Paso 1". */
  mostrarTramitesOnline() {
    const fila = (texto, boton, { vineta = false, negrita = false } = {}) => `
      <div class="tramites__nombre ${vineta ? 'tramites__nombre--vineta' : ''} ${negrita ? 'tramites__nombre--negrita' : ''}">${texto}</div>
      <div class="tramites__accion">${boton}</div>`;
    const secundario = (accion, texto, extra = '') =>
      `<button class="boton boton--secundario boton--chico" data-accion="${accion}" ${extra}>${texto}</button>`;
    const fueraDeAlcance = (nombre, texto = 'Consultar') =>
      secundario('fuera-alcance', texto, `data-nombre="${esc(nombre)}"`);

    this.#pintar('tramites', `
      ${this.#encabezado()}
      <main class="pagina">
        ${this.#riel()}
        <section class="contenido">
          <h1 class="titulo">Trámites online</h1>
          <div class="tramites">
            ${fila('Inscripción', `<button class="boton boton--primario boton--chico" data-accion="inscribir">Inscribirse a materias</button>`, { negrita: true })}
            ${fila('Consultar estado de inscripciones', secundario('consultar-estado', 'Consultar'), { vineta: true })}
            ${fila('Consultar comisiones', secundario('consultar-comisiones', 'Consultar'), { vineta: true })}
            <div class="tramites__separador"></div>
            ${fila('Consultar asistencias', fueraDeAlcance('Consultar asistencias'))}
            ${fila('Consultar calificaciones', fueraDeAlcance('Consultar calificaciones'))}
            ${fila('Consultar historial académico', fueraDeAlcance('Consultar historial académico'))}
            ${fila('Solicitar Certificado', '')}
            ${fila('Alumno regular', fueraDeAlcance('Solicitar certificado de alumno regular', 'Solicitar certificado'), { vineta: true })}
            ${fila('Inscripción a materias', fueraDeAlcance('Solicitar certificado de inscripción a materias', 'Solicitar certificado'), { vineta: true })}
          </div>
        </section>
        ${this.#contexto()}
      </main>`);
  }

  /* ==================================================================
   * Automensajes del DS01
   * ================================================================== */

  /**
   * DS01 msj. 20: mostrarOferta(materias:List<Materia>) — pasos 4 a 6.
   * Recibe las materias planas (con sus comisiones) del msj. 19. Solo las de
   * la carrera del estudiante: no hay buscador por código.
   */
  mostrarOferta(materias) {
    this.#oferta = materias;
    this.#pintarOferta();
  }

  /** Redibuja la oferta ya recibida (al marcar materias o elegir comisiones). No es el msj. 20. */
  #pintarOferta() {
    const materias = this.#oferta;
    const bloques = materias.map(m => this.#bloqueMateria(m)).join('');
    this.#pintar('oferta', `
      ${this.#encabezado()}
      <main class="pagina">
        ${this.#riel()}
        <section class="contenido">
          <h1 class="titulo">Inscripción a materias</h1>
          ${this.#insOferta ? `<p class="estado-tramite">Estado de la inscripción: ${this.#etiqueta(this.#insOferta.estado)}</p>` : ''}
          <div class="oferta">${bloques}</div>
        </section>
        ${this.#contexto()}
        <div class="pie-botones pie-botones--pagina">
          <button class="boton boton--secundario" data-accion="cancelar-solicitud">Cancelar</button>
          <button class="boton boton--primario" data-accion="confirmar-solicitud" ${this.#seleccion.size ? '' : 'disabled'}>Confirmar solicitud</button>
        </div>
      </main>`);
  }

  /**
   * DS01 msj. 54: mostrarResumen(ins:Inscripcion) — pasos 7 a 10.
   * Recibe UNA inscripción (APROBADA). Con varias materias se llama una vez por
   * trámite y cada llamada suma su tarjeta a la misma pantalla.
   */
  mostrarResumen(ins) {
    this.#asegurarMarco('resumen', () => `
      ${this.#encabezado()}
      <main class="pagina">
        ${this.#riel()}
        <section class="contenido contenido--ancho">
          <h1 class="titulo">Inscripción a materias</h1>
          ${this.#datosPersonales()}
          <div class="tarjetas-resumen"></div>
          <div class="pie-botones">
            <button class="boton boton--secundario" data-accion="cancelar-inscripcion">Cancelar</button>
            <button class="boton boton--primario" data-accion="confirmar-inscripcion">Confirmar inscripción</button>
          </div>
        </section>
      </main>`);
    const c = ins.comision;
    this.#agregar('.tarjetas-resumen', `
      <article class="tarjeta tarjeta--resumen">
        <h2 class="tarjeta__titulo">${esc(ins.materia)}</h2>
        <p class="tarjeta__subtitulo">Comisión elegida: <b>${esc(c.etiqueta)}</b></p>
        <p class="dato">Turno: <b>${esc(this.#turno(c.turno))}</b></p>
        <p class="dato">Días: <b>${esc(c.dias)}</b></p>
        <p class="dato">Titular de cátedra: <b>${esc(c.titular)}</b></p>
        ${this.#etiqueta(ins.estado)}
      </article>`);
  }

  /**
   * DS01 msjs. 12, 17, 39, 44, 51, 71, 77: mostrarMotivo(motivo:String).
   * Pantallas de rechazo de las maquetas A3, A4, A8 y A12. Los datos extra
   * (materia, inscripción, requisitos) salen del trámite que se está mostrando.
   * En un resultado mixto suma una columna; si no, dibuja la pantalla completa.
   */
  mostrarMotivo(motivo) {
    const indice = this.#tramiteActual;
    const tramite = indice === null ? null : this.#tramites[indice];
    if (this.#modoResultado === 'mixto') {
      this.#asegurarMarcoMixto();
      this.#agregar('.resultado', this.#bloqueMotivo(motivo, tramite, indice, { conMateria: true }));
      return;
    }
    this.#pintar('motivo', this.#marcoResultado(
      `<div class="resultado">${this.#bloqueMotivo(motivo, tramite, indice, { conMateria: false })}</div>`));
  }

  /**
   * DS01 msjs. 29 y 61: mostrarMensaje(mensaje:String).
   * Ventana centrada sobre la pantalla velada (maquetas A6 y A11).
   */
  mostrarMensaje(mensaje) {
    this.#abrirModal(`
      <p class="modal__texto">${esc(mensaje)}</p>
      ${this.#estadoMensaje ? this.#etiqueta(this.#estadoMensaje) : ''}
      <button class="boton boton--primario" data-accion="ir-home">Ir al home</button>`);
  }

  /**
   * DS01 msj. 88: mostrarComprobante(ins:Inscripcion) — paso 12.
   * Recibe UNA inscripción (FINALIZADA). Si todo el lote salió bien, la primera
   * llamada dibuja la pantalla de éxito de la maqueta y cada llamada suma la
   * etiqueta de su materia; en un resultado mixto suma una columna.
   */
  mostrarComprobante(ins) {
    const indice = this.#tramiteActual;
    if (this.#modoResultado === 'mixto') {
      this.#asegurarMarcoMixto();
      this.#agregar('.resultado', `
        <div class="resultado__bloque">
          <h2 class="resultado__titulo">¡Tu inscripción se completó exitosamente para: <b>${esc(ins.materia)}</b>!</h2>
          <p class="resultado__detalle">Visualizá el resumen de los datos de la inscripción tramitada.</p>
          ${this.#etiqueta(ins.estado)}
          <div class="resultado__botones">
            <button class="boton boton--secundario" data-accion="ver-detalle" data-indice="${indice}">Ver detalle</button>
            <button class="boton boton--primario" data-accion="descargar" data-indice="${indice}">Descargar certificado</button>
          </div>
        </div>`);
      return;
    }
    this.#asegurarMarco('comprobante', () => this.#marcoResultado(`
      <div class="resultado">
        <div class="resultado__bloque">
          <h2 class="resultado__titulo">¡Tu inscripción se completó exitosamente!</h2>
          <p class="resultado__detalle">Visualizá el resumen de los datos de la inscripción tramitada.</p>
          <div class="resultado__etiquetas"></div>
          <div class="resultado__botones">
            <button class="boton boton--secundario" data-accion="ver-detalle">Ver detalle</button>
            <button class="boton boton--primario" data-accion="descargar">Descargar certificado</button>
          </div>
        </div>
      </div>`));
    this.#agregar('.resultado__etiquetas', this.#etiqueta(ins.estado, ins.materia));
  }

  /* ==================================================================
   * Eventos del actor (manejadores)
   * ================================================================== */

  /** Ingreso simulado (previo al DS01). */
  ingresar(legajo) {
    const est = this.#sesion.iniciarSesion(legajo);
    if (!est) return this.#aviso(`No se encontró el legajo ${legajo}.`);
    this.#est = est;
    this.mostrarTramitesOnline();
  }

  /** DS01 msj. 1: inscribirAMaterias() — botón "Inscribirse a materias" (paso 1). */
  inscribirAMaterias() {
    this.#descartarTramites();
    this.#seleccion.clear();
    const ctrl = this.#crearControlador();
    const r = ctrl.iniciarInscripcion({ legajo: this.#est.legajo });     // msj. 2 (→ 3 a 19)
    this.#tramites = [{ ctrl, materia: null, resultado: r }];
    if (r.motivo) {                                                       // A3 / A4
      this.#nuevoLote('motivo');
      this.#tramiteActual = 0;
      return this.mostrarMotivo(r.motivo);                                // msj. 12 / 17
    }
    this.#ctrlOferta = ctrl;
    this.#insOferta = r.ins;                                              // decisión 4: ins del msj. 19
    this.mostrarOferta(r.materias);                                       // msj. 20
  }

  /**
   * DS01 msj. 21: seleccionarMateria(mat:Materia) — marca o desmarca una materia (paso 5).
   * Recibe la materia plana ({ idMateria }) y alterna su selección.
   */
  seleccionarMateria(mat) {
    const m = this.#oferta.find(x => x.idMateria === Number(mat.idMateria));
    if (!m) return;
    if (this.#seleccion.has(m.idMateria)) {
      this.#seleccion.delete(m.idMateria);
    } else {
      if (!m.tieneComisiones) return this.#mostrarSinComisiones();     // A5: solo vista
      this.#seleccion.set(m.idMateria, m.comisiones[0].idComision);
    }
    this.#pintarOferta();
  }

  /**
   * DS01 msj. 22: seleccionarComision(com:Comision) — elige la comisión de una materia (paso 5).
   * Recibe la comisión plana ({ idComision }); la materia sale de la oferta.
   */
  seleccionarComision(com) {
    const idComision = Number(com.idComision);
    const m = this.#oferta.find(x => x.comisiones.some(c => c.idComision === idComision));
    if (!m || !this.#seleccion.has(m.idMateria)) return;
    this.#seleccion.set(m.idMateria, idComision);
    this.#pintarOferta();
  }

  /** DS01 msj. 23: cancelarSolicitudDeInscripcion() — A6. */
  cancelarSolicitudDeInscripcion() {
    const r = this.#ctrlOferta.cancelarSolicitudDeInscripcion(this.#insOferta);   // msj. 24 (→ 25 a 28)
    this.#tramites = [];
    this.#ctrlOferta = null;
    this.#estadoMensaje = r.ins.estado;
    this.mostrarMensaje(TextosMensaje.SOLICITUD_CANCELADA);                      // msj. 29
  }

  /**
   * DS01 msj. 30: confirmarSolicitudDeInscripcion() — pasos 6 a 10.
   * Aviso de 1 s con PENDIENTE y, por cada materia marcada, un trámite:
   * el primero usa la Inscripción ya VALIDADA; los demás repiten desde el msj. 2.
   */
  async confirmarSolicitudDeInscripcion() {
    const elegidas = this.#oferta
      .filter(m => this.#seleccion.has(m.idMateria))
      .map(m => ({ materia: m, idComision: this.#seleccion.get(m.idMateria) }));
    if (!elegidas.length) return;

    await this.#avisoDeEstado(TextosMensaje.VALIDANDO, EstadoInscripcion.PENDIENTE);

    this.#tramites = [];
    elegidas.forEach((sel, i) => {
      let ctrl = this.#ctrlOferta;
      if (i > 0) {                                                         // nuevo trámite: desde el msj. 2
        ctrl = this.#crearControlador();
        const r = ctrl.iniciarInscripcion({ legajo: this.#est.legajo });   // msjs. 2 a 19
        if (r.motivo) {                                                    // no debería ocurrir: mismas validaciones
          this.#tramites.push({ ctrl, materia: sel.materia, resultado: r });
          return;
        }
        this.mostrarOferta(r.materias);                                    // msj. 20
      }
      const resultado = ctrl.confirmarSolicitudDeInscripcion(              // msj. 31 (→ 32 a 53)
        { idMateria: sel.materia.idMateria }, { idComision: sel.idComision });
      this.#tramites.push({ ctrl, materia: sel.materia, resultado });
    });
    this.#ctrlOferta = null;
    this.#insOferta = null;
    this.#seleccion.clear();

    const aprobadas = this.#tramites.filter(t => !t.resultado.motivo);
    if (!aprobadas.length) return this.#mostrarResultado();                // msjs. 39 / 44 / 51
    this.#nuevoLote('resumen');
    this.#tramites.forEach((t, i) => {
      if (t.resultado.motivo) return;                                      // los rechazos se muestran al final
      this.#tramiteActual = i;
      this.mostrarResumen(t.resultado.ins);                                // msj. 54, una vez por trámite
    });
  }

  /** DS01 msj. 55: cancelarInscripcion() — A11 (sin descontar cupo). */
  cancelarInscripcion() {
    let ultimo = null;
    this.#tramites
      .filter(t => !t.resultado.motivo && t.resultado.ins.estado === EstadoInscripcion.APROBADA)
      .forEach(t => {
        ultimo = t.ctrl.cancelarInscripcion(t.resultado.ins);              // msj. 56 (→ 57 a 60)
        t.resultado = ultimo;
      });
    this.#tramites = [];
    this.#estadoMensaje = ultimo && ultimo.ins.estado;
    this.mostrarMensaje(TextosMensaje.INSCRIPCION_CANCELADA);              // msj. 61
  }

  /**
   * DS01 msj. 62: confirmarInscripcion() — pasos 11 y 12.
   * Aviso de 1 s con CONFIRMADA; cada controlador confirma su propia
   * Inscripción, en el orden de los trámites.
   */
  async confirmarInscripcion() {
    await this.#avisoDeEstado(TextosMensaje.REGISTRANDO, EstadoInscripcion.CONFIRMADA);
    this.#tramites
      .filter(t => !t.resultado.motivo && t.resultado.ins.estado === EstadoInscripcion.APROBADA)
      .forEach(t => {
        t.resultado = t.ctrl.confirmarInscripcion();                       // msj. 63 (→ 64 a 87)
      });
    this.#mostrarResultado();                                              // msj. 88 / 71 / 77
  }

  /* ==================================================================
   * Despacho de eventos (delegación con data-accion)
   * ================================================================== */

  #despacharClic(e) {
    const el = e.target.closest('[data-accion]');
    if (!el || !this.#raiz.contains(el) || el.disabled) return;
    if (el.matches('input, select')) return;     // los maneja "change"
    if (this.#ocupado) return;
    const d = el.dataset;
    const indice = d.indice === undefined ? null : Number(d.indice);
    const acciones = {
      'ingresar':              () => this.ingresar(d.legajo),
      'cambiar-estudiante':    () => this.#cambiarDeEstudiante(),
      'menu-usuario':          () => this.#menuUsuario(),
      'ir-home':               () => this.#irAlHome(),
      'fuera-alcance':         () => this.#fueraDeAlcance(d.nombre),
      'inscribir':             () => this.inscribirAMaterias(),
      'consultar-estado':      () => this.#mostrarEstadoDeInscripciones(),
      'consultar-comisiones':  () => this.#mostrarComisiones(),
      'ver-materia':           () => this.#mostrarDetalleMateria(Number(d.id)),
      'cancelar-solicitud':    () => this.cancelarSolicitudDeInscripcion(),
      'confirmar-solicitud':   () => this.confirmarSolicitudDeInscripcion(),
      'cancelar-inscripcion':  () => this.cancelarInscripcion(),
      'confirmar-inscripcion': () => this.confirmarInscripcion(),
      'ver-oferta-materias':   () => { this.#cerrarModal(); this.#pintarOferta(); },
      'ver-oferta-comisiones': () => this.inscribirAMaterias(),     // reintento = trámite nuevo
      'ver-inscripciones':     () => this.#mostrarEstadoDeInscripciones(),
      'ver-correlatividades':  () => this.#mostrarCorrelatividades(indice),
      'ver-detalle':           () => this.#mostrarDetalle(indice),
      'descargar':             () => this.#descargar(indice),
      'cerrar-modal':          () => this.#cerrarModal()
    };
    const accion = acciones[d.accion];
    if (accion) {
      e.preventDefault();
      this.#ejecutar(accion);
    }
  }

  #despacharCambio(e) {
    const el = e.target.closest('[data-accion]');
    if (!el || this.#ocupado) return;
    if (el.dataset.accion === 'seleccionar-materia') {
      this.#ejecutar(() => this.seleccionarMateria({ idMateria: Number(el.dataset.id) }));       // msj. 21
    } else if (el.dataset.accion === 'seleccionar-comision') {
      this.#ejecutar(() => this.seleccionarComision({ idComision: Number(el.value) }));          // msj. 22
    }
  }

  /** Ejecuta una acción y muestra cualquier error inesperado sin romper la pantalla. */
  async #ejecutar(accion) {
    try {
      await accion();
    } catch (error) {
      this.#ocupado = false;
      this.#cerrarAvisoDeEstado();
      console.error(error);
      this.#abrirModal(`<p class="modal__texto">Ocurrió un error: ${esc(error.message)}</p>
        <button class="boton boton--primario" data-accion="ir-home">Ir al home</button>`);
    }
  }

  /* ==================================================================
   * Resultado del lote
   * ================================================================== */

  /**
   * Decide la pantalla final y llama a los automensajes una vez por trámite:
   * todas exitosas → pantalla de éxito (paso 12); un solo rechazo → pantalla
   * del motivo; si no, columnas lado a lado (maqueta A8 mixta).
   */
  #mostrarResultado() {
    const rechazos = this.#tramites.filter(t => t.resultado.motivo).length;
    const exitos = this.#tramites.length - rechazos;
    this.#nuevoLote(!rechazos ? 'exito' : (rechazos === 1 && !exitos ? 'motivo' : 'mixto'));
    this.#tramites.forEach((t, i) => {
      this.#tramiteActual = i;
      if (t.resultado.motivo) this.mostrarMotivo(t.resultado.motivo);    // msjs. 39/44/51/71/77
      else this.mostrarComprobante(t.resultado.ins);                      // msj. 88
    });
  }

  /** Bloque de rechazo con el título, el texto y el botón de la maqueta. */
  #bloqueMotivo(motivo, tramite, indice, { conMateria }) {
    const t = TextosMotivo[motivo];
    const materia = tramite && tramite.materia ? tramite.materia.nombre : null;
    const titulo = conMateria && materia
      ? `Lamentablemente, tu inscripción no pudo completarse para: <b>${esc(materia)}</b>`
      : esc(t.titulo);
    const items = t.items ? `<ul class="resultado__lista">${t.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
    const primario = (accion, texto, extra = '') =>
      `<button class="boton boton--primario" data-accion="${accion}" ${extra}>${texto}</button>`;
    const botones = {
      NO_HABILITADO:            primario('ir-home', 'Ir al home'),
      SIN_OFERTA:               primario('ir-home', 'Ir al home'),
      SIN_CUPO:                 primario('ver-oferta-comisiones', 'Ver oferta de comisiones'),
      YA_INSCRIPTO:             primario('ver-inscripciones', 'Ver inscripciones confirmadas'),
      CORRELATIVAS_INCUMPLIDAS: primario('ver-correlatividades', 'Ver correlatividades', `data-indice="${indice}"`),
      FALLA_REGISTRO:           primario('ir-home', 'Ir al home')
    }[motivo];
    const estado = tramite && tramite.resultado ? tramite.resultado.ins.estado : null;
    return `
      <div class="resultado__bloque">
        <h2 class="resultado__titulo">${titulo}</h2>
        <p class="resultado__detalle ${items ? 'resultado__detalle--izquierda' : ''}">${esc(t.detalle)}</p>
        ${items}
        ${this.#etiqueta(estado)}
        <div class="resultado__botones">${botones}</div>
      </div>`;
  }

  /* ==================================================================
   * Pantallas y ventanas auxiliares (solo vista)
   * ================================================================== */

  /** A5: la materia elegida no tiene comisiones (maqueta A4 original). Sin mensajes del dominio. */
  #mostrarSinComisiones() {
    this.#pintar('sin-comisiones', this.#marcoResultado(`
      <div class="resultado">
        <div class="resultado__bloque">
          <h2 class="resultado__titulo">Lamentablemente, tu inscripción no pudo completarse.</h2>
          <p class="resultado__detalle">${esc(TextosMensaje.MATERIA_SIN_COMISIONES)}</p>
          <div class="resultado__botones">
            <button class="boton boton--secundario" data-accion="ver-oferta-materias">Ver oferta de materias</button>
            <button class="boton boton--primario" data-accion="ir-home">Ir al home</button>
          </div>
        </div>
      </div>`));
  }

  /** A4 bis "Ver detalle" de la materia, con los datos de la oferta (sin llamar al controlador). */
  #mostrarDetalleMateria(idMateria) {
    const m = this.#oferta.find(x => x.idMateria === idMateria);
    if (!m) return;
    this.#abrirModal(`
      <h2 class="modal__titulo">${esc(m.nombre)}</h2>
      <p class="dato">Código: <b>${esc(m.idMateria)}</b></p>
      <p class="dato">Año: <b>${esc(m.anio)}°</b></p>
      <p class="dato">Carga horaria: <b>${esc(m.cargaHoraria)} h</b></p>
      <p class="dato">Descripción: <b>${esc(m.descripcion)}</b></p>
      <p class="dato">Correlativas: <b>${m.correlativas.length ? esc(m.correlativas.join(', ')) : 'No tiene'}</b></p>
      <button class="boton boton--primario" data-accion="cerrar-modal">Cerrar</button>`);
  }

  /** "Ver correlatividades": dibuja cada requisito como lo marcó el mapeador. */
  #mostrarCorrelatividades(indice) {
    const t = this.#tramites[indice];
    if (!t || !t.resultado.correlativas) return;
    this.#abrirModal(`
      <h2 class="modal__titulo">Correlatividades de ${esc(t.materia.nombre)}</h2>
      <ul class="lista-requisitos">
        ${t.resultado.correlativas.map(req => req.aprobada
          ? `<li class="requisito requisito--ok">✓ ${esc(req.nombre)} — <b>Aprobada</b></li>`
          : `<li class="requisito requisito--falta">✗ ${esc(req.nombre)} — <b>No aprobada</b></li>`).join('')}
      </ul>
      <button class="boton boton--primario" data-accion="cerrar-modal">Cerrar</button>`);
  }

  /** "Ver detalle" del comprobante (paso 12): estado actual, sin historial. */
  #mostrarDetalle(indice) {
    const lista = this.#comprobantes(indice);
    this.#abrirModal(`
      <h2 class="modal__titulo">Detalle de la inscripción</h2>
      ${lista.map(c => {
        const i = c.inscripcion, com = i.comision;
        return `<div class="detalle">
          <p class="detalle__materia">${esc(i.materia)} ${this.#etiqueta(i.estado)}</p>
          <p class="dato">Comprobante N°: <b>${esc(c.nroTramite)}</b></p>
          <p class="dato">Comisión: <b>${esc(com.etiqueta)}</b> · Aula: <b>${esc(com.aula)}</b></p>
          <p class="dato">Turno: <b>${esc(this.#turno(com.turno))}</b> · Días: <b>${esc(com.dias)}</b></p>
          <p class="dato">Titular de cátedra: <b>${esc(com.titular)}</b></p>
        </div>`;
      }).join('')}
      <button class="boton boton--primario" data-accion="cerrar-modal">Cerrar</button>`);
  }

  /**
   * "Descargar certificado": arma el archivo HTML con los datos de la
   * SolicitudCertificado de tipo INSCRIPCION que dejó el msj. 83 (descargar()).
   */
  #descargar(indice) {
    const lista = this.#comprobantes(indice);
    if (!lista.length) return;
    const html = this.#documentoComprobante(lista);
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante-inscripcion-${lista.map(c => c.nroTramite).join('-')}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  #documentoComprobante(lista) {
    const c0 = lista[0];
    const filas = lista.map(c => {
      const i = c.inscripcion, com = i.comision;
      return `<tr><td>${esc(c.nroTramite)}</td><td>${esc(i.materia)}</td><td>${esc(com.etiqueta)}</td>
        <td>${esc(com.aula)}</td><td>${esc(this.#turno(com.turno))}</td><td>${esc(com.dias)}</td>
        <td>${esc(com.titular)}</td><td>${esc(this.#fecha(c.fechaEmision))}</td><td>${esc(TextosEstado[i.estado])}</td></tr>`;
    }).join('');
    return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Comprobante de inscripción a materias</title>
<style>body{font-family:Arial,sans-serif;color:#333;margin:40px}h1{font-weight:400}
table{border-collapse:collapse;width:100%;margin-top:16px}td,th{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:13px}
th{background:#f2f5fb}.pie{margin-top:24px;font-size:12px;color:#666}</style></head><body>
<h1>Comprobante de inscripción a materias</h1>
<p>Estudiante: <b>${esc(c0.estudiante)}</b> — Legajo: <b>${esc(c0.legajo)}</b></p>
<p>Carrera: <b>${esc(c0.carrera)}</b> — Período: <b>${esc(c0.periodo)}</b></p>
<p>Destinatario: <b>${esc(c0.destinatario)}</b> — Tipo de certificado: <b>${esc(c0.tipo)}</b></p>
<table><thead><tr><th>Comprobante N°</th><th>Materia</th><th>Comisión</th><th>Aula</th><th>Turno</th><th>Día/s</th>
<th>Titular de cátedra</th><th>Fecha</th><th>Estado</th></tr></thead>
<tbody>${filas}</tbody></table>
<p class="pie">Documento generado por el MVP de CU-05 (Diseño de Aplicaciones Web, 2C 2026). Sin validez institucional.</p>
</body></html>`;
  }

  /** Comprobantes de los trámites exitosos del lote (todos o el de un índice). */
  #comprobantes(indice) {
    const ts = indice === null ? this.#tramites : [this.#tramites[indice]];
    return ts.filter(t => t && t.resultado && t.resultado.comprobante).map(t => t.resultado.comprobante);
  }

  /** Consultar estado de inscripciones: todas las del estudiante con su estado actual. */
  #mostrarEstadoDeInscripciones() {
    this.#descartarTramites();
    const lista = this.#sesion.consultarEstadoDeInscripciones();
    const filas = lista.length ? lista.slice().reverse().map(i => `
      <tr><td>${esc(i.idInscripcion)}</td><td>${esc(i.materia ?? '— (sin materia elegida)')}</td>
      <td>${esc(this.#fecha(i.fecha))}</td><td>${this.#etiqueta(i.estado)}</td></tr>`).join('')
      : '<tr><td colspan="4">Todavía no tenés inscripciones.</td></tr>';
    this.#pantallaConsulta('Estado de inscripciones', `
      <table class="tabla-consulta"><thead><tr><th>N°</th><th>Materia</th><th>Fecha</th><th>Estado</th></tr></thead>
      <tbody>${filas}</tbody></table>
      <p class="nota">Se muestra el estado actual de cada inscripción. El motivo de un rechazo no se guarda (Inscripción no tiene ese atributo).</p>`);
  }

  /** Consultar comisiones: la oferta completa de la carrera (RF12). */
  #mostrarComisiones() {
    this.#descartarTramites();
    const lista = this.#sesion.consultarComisiones();
    const filas = lista.map(c => `
      <tr><td>${esc(c.materia)}</td><td><b>${esc(c.etiqueta)}</b></td><td>${esc(this.#turno(c.turno))}</td>
      <td>${esc(c.dias)}</td><td>${esc(c.titular)}</td><td>${esc(c.aula)}</td><td>${c.cupoDisponible}</td></tr>`).join('');
    this.#pantallaConsulta('Comisiones', `
      <table class="tabla-consulta"><thead><tr><th>Materia</th><th>Comisión</th><th>Turno</th><th>Día/s</th>
      <th>Titular de cátedra</th><th>Aula</th><th>Cupos disponibles</th></tr></thead><tbody>${filas}</tbody></table>`);
  }

  #pantallaConsulta(titulo, cuerpo) {
    this.#pintar('consulta', `
      ${this.#encabezado()}
      <main class="pagina">
        ${this.#riel()}
        <section class="contenido contenido--ancho">
          <h1 class="titulo">${esc(titulo)}</h1>
          ${this.#datosPersonales()}
          <div class="consulta">${cuerpo}</div>
          <div class="pie-botones">
            <button class="boton boton--primario" data-accion="ir-home">Ir al home</button>
          </div>
        </section>
      </main>`);
  }

  #fueraDeAlcance(nombre) {
    this.#aviso(`"${nombre}" no forma parte de este MVP, que implementa solo CU-05 "Inscribirse a materias".`);
  }

  #menuUsuario() {
    this.#abrirModal(`
      <p class="modal__texto">${esc(this.#est.nombre)}</p>
      <p class="dato">Legajo: <b>${esc(this.#est.legajo)}</b> · ${esc(this.#est.carrera)}</p>
      <div class="resultado__botones">
        <button class="boton boton--secundario" data-accion="cerrar-modal">Volver</button>
        <button class="boton boton--primario" data-accion="cambiar-estudiante">Cambiar de estudiante</button>
      </div>`);
  }

  #cambiarDeEstudiante() {
    this.#cerrarModal();
    this.#descartarTramites();
    this.#sesion.cerrarSesion();
    this.mostrarLogin();
  }

  #irAlHome() {
    this.#cerrarModal();
    this.#descartarTramites();
    this.mostrarTramitesOnline();
  }

  /** Si el estudiante sale a mitad del trámite, cada controlador cancela lo que quedó abierto. */
  #descartarTramites() {
    this.#tramites.forEach(t => t.ctrl.descartarTramiteEnCurso());
    if (this.#ctrlOferta && !this.#tramites.some(t => t.ctrl === this.#ctrlOferta)) {
      this.#ctrlOferta.descartarTramiteEnCurso();
    }
    this.#tramites = [];
    this.#tramiteActual = null;
    this.#ctrlOferta = null;
    this.#insOferta = null;
  }

  /* ==================================================================
   * Piezas de la pantalla
   * ================================================================== */

  #pintar(nombre, html) {
    this.#cerrarModal();
    this.#raiz.innerHTML = html;
    this.#raiz.dataset.pantalla = nombre;
    this.#raiz.dataset.lote = String(this.#lote);
    window.scrollTo(0, 0);
    this.#raiz.dispatchEvent(new CustomEvent('form:pantalla', { detail: nombre, bubbles: true }));
  }

  /** Empieza un lote nuevo de resumen/resultado (los automensajes suman a su pantalla). */
  #nuevoLote(modo) {
    this.#lote++;
    this.#modoResultado = modo;
    this.#tramiteActual = null;
  }

  /** Dibuja el marco de la pantalla solo la primera vez dentro del lote. */
  #asegurarMarco(nombre, crearHtml) {
    if (this.#raiz.dataset.pantalla !== nombre || this.#raiz.dataset.lote !== String(this.#lote)) {
      this.#pintar(nombre, crearHtml());
    }
  }

  #asegurarMarcoMixto() {
    this.#asegurarMarco('resultado-mixto', () =>
      this.#marcoResultado('<div class="resultado resultado--mixto"></div>'));
  }

  #agregar(selector, html) {
    this.#raiz.querySelector(selector).insertAdjacentHTML('beforeend', html);
  }

  /** Marco común de las pantallas de resultado: título + "Datos personales". */
  #marcoResultado(cuerpo) {
    return `
      ${this.#encabezado()}
      <main class="pagina">
        ${this.#riel()}
        <section class="contenido contenido--ancho">
          <h1 class="titulo">Inscripción a materias</h1>
          ${this.#datosPersonales()}
          ${cuerpo}
        </section>
      </main>`;
  }

  #encabezado({ conMenu = true } = {}) {
    const item = (texto, accion, activo = false, extra = '') =>
      `<button class="menu__item ${activo ? 'menu__item--activo' : ''}" data-accion="${accion}" ${extra}>${texto}</button>`;
    return `
      <header class="encabezado">
        <nav class="menu" aria-label="Menú principal">
          ${conMenu ? `
            ${item('Inicio', 'fuera-alcance', false, 'data-nombre="Inicio"')}
            ${item('Calendario académico', 'fuera-alcance', false, 'data-nombre="Calendario académico"')}
            ${item('Trámites online', 'ir-home', true)}
            ${item('Información personal', 'fuera-alcance', false, 'data-nombre="Información personal"')}` : ''}
        </nav>
        <button class="avatar" ${conMenu ? 'data-accion="menu-usuario"' : 'disabled'} aria-label="Menú del usuario">
          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
            <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/>
            <path d="M4.5 20c.8-3.6 3.9-6 7.5-6s6.7 2.4 7.5 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
      </header>`;
  }

  /** Barra gris vertical de las maquetas (decorativa). */
  #riel() {
    return '<div class="riel" aria-hidden="true"><span class="riel__pulgar"></span></div>';
  }

  /** Contexto académico arriba a la derecha (Trámites online y selección). */
  #contexto() {
    const e = this.#est;
    return `
      <aside class="contexto">
        <p>Estudiante: <b>${esc(e.nombre)}</b></p>
        <p>Carrera: <b>${esc(e.carrera)}</b></p>
        <p>Estado: <b>${e.activo ? 'Activo' : 'Inactivo'}</b></p>
      </aside>`;
  }

  /** "Datos personales" de las pantallas de resumen y resultado. */
  #datosPersonales() {
    const e = this.#est;
    return `
      <div class="datos-personales">
        <h2 class="subtitulo">Datos personales</h2>
        <p>Estudiante: <b>${esc(e.nombre)}</b></p>
        <p>Carrera: <b>${esc(e.carrera)}</b></p>
      </div>`;
  }

  /** Bloque de una materia en la oferta: checkbox, nombre, "Ver detalle", tabla, select y cupos. */
  #bloqueMateria(m) {
    const marcada = this.#seleccion.has(m.idMateria);
    const id = m.idMateria;
    const encabezado = `
      <div class="materia__cabecera">
        <label class="casilla">
          <input type="checkbox" data-accion="seleccionar-materia" data-id="${id}" ${marcada ? 'checked' : ''}
                 aria-label="Marcar ${esc(m.nombre)}">
          <span class="casilla__marca" aria-hidden="true"></span>
        </label>
        <span class="materia__nombre">${esc(m.nombre)}</span>
        <button class="enlace" data-accion="ver-materia" data-id="${id}">Ver detalle</button>
      </div>`;
    if (!m.tieneComisiones) {
      return `<div class="materia materia--sin-comisiones ${marcada ? '' : 'materia--atenuada'}">${encabezado}
        <p class="materia__aviso">Sin comisiones en oferta para este período.</p></div>`;
    }
    const cs = m.comisiones;
    const fila = (titulo, valores, negrita = false) => `
      <tr class="${negrita ? 'fila--negrita' : ''}">
        <th scope="row"><span class="circulito" aria-hidden="true"></span>${titulo}</th>
        ${valores.map(v => `<td>${esc(v)}</td>`).join('')}
      </tr>`;
    const elegida = cs.find(c => c.idComision === this.#seleccion.get(id)) ?? cs[0];
    return `
      <div class="materia ${marcada ? '' : 'materia--atenuada'}">
        ${encabezado}
        <div class="materia__cuerpo">
          <div class="tabla-envoltura">
            <table class="tabla-comisiones">
              <tbody>
                ${fila('Comisión', cs.map(c => c.etiqueta), true)}
                ${fila('Turno', cs.map(c => this.#turno(c.turno)))}
                ${fila('Día/s', cs.map(c => c.dias))}
                ${fila('Titular de cátedra', cs.map(c => c.titular))}
              </tbody>
            </table>
          </div>
          <div class="materia__eleccion">
            <select class="selector" data-accion="seleccionar-comision" data-id="${id}" ${marcada ? '' : 'disabled'}
                    aria-label="Comisión de ${esc(m.nombre)}">
              ${cs.map(c => `<option value="${c.idComision}" ${c === elegida ? 'selected' : ''}>${esc(c.etiqueta)}</option>`).join('')}
            </select>
            <p class="cupos">Cupos disponibles: <b>${elegida.cupoDisponible}</b></p>
          </div>
        </div>
      </div>`;
  }

  /** Etiqueta de color con el estado de la Inscripción (DE01). */
  #etiqueta(estado, prefijo = null) {
    if (!estado) return '';
    const texto = TextosEstado[estado] ?? estado;
    return `<span class="etiqueta etiqueta--${esc(estado.toLowerCase())}">${prefijo ? esc(prefijo) + ': ' : ''}${esc(texto)}</span>`;
  }

  #turno(turno) {
    return { 'MAÑANA': 'Mañana', 'TARDE': 'Tarde', 'NOCHE': 'Noche' }[turno] ?? turno;
  }

  #fecha(iso) {
    return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  /* ---------------------------- ventanas ---------------------------- */

  #abrirModal(contenido) {
    this.#cerrarModal();
    const capa = document.createElement('div');
    capa.className = 'capa capa--atenuada';
    capa.dataset.capa = 'modal';
    capa.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${contenido}</div>`;
    this.#raiz.appendChild(capa);
    const boton = capa.querySelector('button');
    if (boton) boton.focus();
  }

  #cerrarModal() {
    const capa = this.#raiz.querySelector('[data-capa="modal"]');
    if (capa) capa.remove();
  }

  /** Aviso breve con un solo botón "Aceptar". */
  #aviso(texto) {
    this.#abrirModal(`<p class="modal__texto">${esc(texto)}</p>
      <button class="boton boton--primario" data-accion="cerrar-modal">Aceptar</button>`);
  }

  /** Aviso de 1 segundo con la etiqueta de estado (PENDIENTE / CONFIRMADA). */
  #avisoDeEstado(texto, estado) {
    this.#ocupado = true;
    const capa = document.createElement('div');
    capa.className = 'capa capa--atenuada';
    capa.dataset.capa = 'aviso';
    capa.innerHTML = `<div class="modal modal--aviso" role="status" aria-live="polite">
      <span class="girador" aria-hidden="true"></span>
      <p class="modal__texto">${esc(texto)}</p>
      ${this.#etiqueta(estado)}
    </div>`;
    document.body.appendChild(capa);
    return new Promise(resolver => setTimeout(() => {
      this.#cerrarAvisoDeEstado();
      this.#ocupado = false;
      resolver();
    }, 1000));
  }

  #cerrarAvisoDeEstado() {
    document.querySelectorAll('[data-capa="aviso"]').forEach(c => c.remove());
  }
}
