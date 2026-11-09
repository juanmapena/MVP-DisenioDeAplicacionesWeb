/* =====================================================================
 * Usuario.js — Clase abstracta (diagrama de clases)
 * Atributos: legajo, nombre, apellido, documento, email, fechaNacimiento,
 *            telefono, estado (boolean), nombreUsuario, contrasenia.
 * Métodos:   iniciarSesion(), cerrarSesion()
 *            + estaActivo():boolean (extensión justificada por el DE03).
 * ===================================================================== */

/**
 * Los métodos del diagrama que pertenecen a otros casos de uso (CU-10, módulo
 * Docente, etc.) existen en las clases para respetar el diagrama, pero el MVP
 * cubre solo CU-05: si se los llama, avisan que están fuera de alcance.
 */
function fueraDelAlcanceDelMVP(metodo) {
  throw new Error(`${metodo}: pertenece a otro caso de uso y está fuera del alcance del MVP (CU-05).`);
}

class Usuario {
  constructor({ legajo, nombre, apellido, documento, email, fechaNacimiento,
                telefono, estado = true, nombreUsuario, contrasenia = null }) {
    if (new.target === Usuario) {
      throw new Error('Usuario es abstracta: instanciá Estudiante, Docente o PersonalAdministrativo.');
    }
    this.legajo = legajo;
    this.nombre = nombre;
    this.apellido = apellido;
    this.documento = documento;
    this.email = email;
    this.fechaNacimiento = fechaNacimiento;
    this.telefono = telefono;
    this.estado = estado;              // boolean: activo/inactivo en la plataforma
    this.nombreUsuario = nombreUsuario;
    // Detalle de implementación: la autenticación del MVP es simulada (enunciado,
    // Actividad 4), así que no se cargan contraseñas. En producción se guardaría
    // un hash (RNF06).
    this.contrasenia = contrasenia;
  }

  /** Previo al DS01 (login simulado). Retorna boolean: sesión iniciada. */
  iniciarSesion() {
    // Detalle de implementación: autenticación simulada; se elige un usuario de
    // la lista y la sesión se considera iniciada. La habilitación para
    // inscribirse se valida después, en el paso 3 (msj. 6).
    return true;
  }

  /** Fuera del DS01. Retorna void. */
  cerrarSesion() {
    // Autenticación simulada: no hay sesión que destruir en el modelo.
  }

  /** Extensión justificada (DE03). Usado por validarEstudianteHabilitado (msj. 6). Retorna boolean. */
  estaActivo() {
    return this.estado === true;
  }
}
