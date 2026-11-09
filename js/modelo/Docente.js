/* =====================================================================
 * Docente.js — hereda de Usuario (diagrama de clases)
 * Atributos: idDocente, especialidad.
 * Relaciones: Docente 1 ── N Clase (asociación: dicta las clases);
 *             implementa Modificable y Registrable.
 * En CU-05 solo se usa como titular de la comisión (Comisión ◆ Clase ── Docente).
 * ===================================================================== */

class Docente extends Usuario {
  constructor({ idDocente, especialidad, ...datosUsuario }) {
    super(datosUsuario);
    this.idDocente = idDocente;
    this.especialidad = especialidad;
    this._clases = [];   // extremo "N" de la asociación con Clase (lo completa Clase)
  }

  /** Clases que dicta (lectura de la asociación; copia para no exponer la colección). */
  get clases() { return [...this._clases]; }

  /** Fuera del DS01 (módulo Docente). */
  consultarMaterias()               { fueraDelAlcanceDelMVP('Docente.consultarMaterias'); }
  /** Fuera del DS01 (módulo Docente). */
  consultarComisiones()             { fueraDelAlcanceDelMVP('Docente.consultarComisiones'); }
  /** Fuera del DS01 (módulo Docente). */
  consultarEstudiantesInscriptos()  { fueraDelAlcanceDelMVP('Docente.consultarEstudiantesInscriptos'); }
  /** Fuera del DS01 (RF08). */
  registrarAsistencias()            { fueraDelAlcanceDelMVP('Docente.registrarAsistencias'); }
  /** Fuera del DS01 (RF10). */
  publicarInformacionAcademica()    { fueraDelAlcanceDelMVP('Docente.publicarInformacionAcademica'); }
  /** Interfaz Modificable. Fuera del DS01 (RF09). */
  modificarCalificaciones()         { fueraDelAlcanceDelMVP('Docente.modificarCalificaciones'); }
  /** Interfaz Registrable. Fuera del DS01 (RF09). */
  registrarCalificaciones()         { fueraDelAlcanceDelMVP('Docente.registrarCalificaciones'); }
}
