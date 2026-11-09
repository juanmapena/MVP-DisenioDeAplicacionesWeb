/* =====================================================================
 * Clase.js (diagrama de clases)
 * Atributos: idClase, numeroDeClase, fecha, tema.
 * Relaciones: Comision 1 ◆── N Clase (composición);
 *             Docente 1 ── N Clase (asociación);
 *             Clase 1 ◆── N Asistencia (fuera del alcance del MVP).
 * Métodos:    modificarFecha(), registrarAsistencia().
 * En CU-05 la usa Comisión para conocer al docente titular.
 * ===================================================================== */

class Clase {
  /**
   * @param {Comision} datos.comision  Todo de la composición.
   * @param {Docente}  datos.docente   Docente que dicta la clase.
   */
  constructor({ idClase, comision, docente, numeroDeClase, fecha, tema }) {
    this.idClase = idClase;
    this.numeroDeClase = numeroDeClase;
    this.fecha = fecha;
    this.tema = tema;
    this.comision = comision;   // extremo "1" de la composición
    this.docente = docente;     // extremo "1" de la asociación
    comision._clases.push(this);
    docente._clases.push(this);
  }

  /** Fuera del DS01. Retorna void. */
  modificarFecha(fecha) {
    this.fecha = fecha;
  }

  /** Fuera del DS01 (RF08: Asistencia no se implementa en el MVP). */
  registrarAsistencia() {
    fueraDelAlcanceDelMVP('Clase.registrarAsistencia');
  }
}
