/* =====================================================================
 * motivos.js — Motivos que el DS01 devuelve a la vista para mostrarMotivo()
 * (msjs. 11, 16, 38, 43, 50, 70 y 76).
 * Son mensajes de la interfaz: NO son un atributo de Inscripción (la
 * Inscripción no guarda el motivo del rechazo). El texto para la pantalla
 * está en vista/textos.js.
 * ===================================================================== */

const Motivo = Object.freeze({
  NO_HABILITADO:            'NO_HABILITADO',            // A3  (msj. 11)
  SIN_OFERTA:               'SIN_OFERTA',               // A4  (msj. 16)
  SIN_CUPO:                 'SIN_CUPO',                 // A8  (msj. 38)
  YA_INSCRIPTO:             'YA_INSCRIPTO',             // A8  (msj. 43)
  CORRELATIVAS_INCUMPLIDAS: 'CORRELATIVAS_INCUMPLIDAS', // A8  (msj. 50)
  FALLA_REGISTRO:           'FALLA_REGISTRO'            // A12 (msjs. 70 y 76)
});
