/* =====================================================================
 * app.js — Arranque del MVP
 * Arma el repositorio, el controlador de la sesión y el Form, y conecta el
 * panel "Demo". Se carga último, cuando todas las clases ya están definidas.
 *
 * El panel Demo es una utilidad de la presentación: NO forma parte de CU-05.
 * ===================================================================== */

(function () {
  let repositorio = null;
  let form = null;

  const raiz = document.getElementById('app');
  const panel = document.getElementById('panel-demo');
  const botonReiniciar = document.getElementById('demo-reiniciar');
  const botonOcuparCupo = document.getElementById('demo-ocupar-cupo');
  const estadoDemo = document.getElementById('demo-estado');

  /** Crea (o vuelve a crear) todos los datos y muestra el ingreso simulado. */
  function arrancar() {
    if (form) form.desconectar();
    repositorio = crearBaseDeDatos();
    const estudiantes = repositorio.estudiantes.map(e => Mapeador.estudiante(e));
    form = new FormInscripcion(raiz, {
      controladorSesion: new ControladorInscripcion(repositorio),
      crearControlador: () => new ControladorInscripcion(repositorio),   // uno por trámite (punto 9)
      estudiantes
    });
    form.mostrarLogin(estudiantes);
  }

  /* ------------------------------ panel Demo ------------------------------ */

  // El botón de A12 solo tiene sentido en el resumen (inscripciones APROBADAS).
  raiz.addEventListener('form:pantalla', e => {
    botonOcuparCupo.disabled = e.detail !== 'resumen';
  });

  botonReiniciar.addEventListener('click', () => {
    arrancar();
    estadoDemo.textContent = 'Datos reiniciados.';
    panel.open = false;   // se pliega para no tapar la pantalla
  });

  /**
   * Utilidad de la demo para mostrar A12 (msjs. 66 a 71): "otro estudiante"
   * ocupa los cupos de las comisiones del resumen. Usa Comision.restarCupo(),
   * el método que ya existe, hasta dejar cupoDisponible en 0. Al confirmar, el
   * paso 12 vuelve a verificar el cupo y la inscripción pasa a RECHAZADA.
   */
  botonOcuparCupo.addEventListener('click', () => {
    const etiquetas = form.comisionesDelResumen().map(id => {
      const com = repositorio.buscarComisionPorId(id);
      while (com.verificarCupo()) com.restarCupo();
      return com.etiqueta;
    });
    estadoDemo.textContent = etiquetas.length
      ? `Sin cupo: ${etiquetas.join(', ')}. Ahora tocá "Confirmar inscripción".`
      : 'No hay comisiones en el resumen.';
    panel.open = false;
  });

  arrancar();
})();
