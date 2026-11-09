/* =====================================================================
 * enums.js — Enumeraciones del dominio
 * Fuente: diagrama de clases del TP1 + extensiones justificadas de la
 * Segunda parte (DE01 para EstadoInscripcion, DE03 para EstadoSolicitud).
 * Se cargan primero: todo el modelo depende de estos valores.
 * ===================================================================== */

/**
 * Estados de la Inscripción (DE01).
 * Diagrama de clases: PENDIENTE, APROBADA, EN CURSO, RECHAZADA, FINALIZADA, CANCELADA.
 * Extensiones justificadas (DS01 msj. 18 y 65 / DE01): VALIDADA y CONFIRMADA.
 * "EN CURSO" se escribe EN_CURSO porque un identificador no admite espacios.
 */
const EstadoInscripcion = Object.freeze({
  EN_CURSO:   'EN_CURSO',
  VALIDADA:   'VALIDADA',
  PENDIENTE:  'PENDIENTE',
  APROBADA:   'APROBADA',
  CONFIRMADA: 'CONFIRMADA',
  FINALIZADA: 'FINALIZADA',
  RECHAZADA:  'RECHAZADA',
  CANCELADA:  'CANCELADA'
});

/**
 * Transiciones válidas del DE01. Inscripcion.cambiarEstado() rechaza cualquier otra.
 * FINALIZADA, RECHAZADA y CANCELADA son estados finales (sin salidas).
 */
const TransicionesInscripcion = Object.freeze({
  [EstadoInscripcion.EN_CURSO]:   Object.freeze([EstadoInscripcion.VALIDADA,   EstadoInscripcion.RECHAZADA]),  // A3, A4
  [EstadoInscripcion.VALIDADA]:   Object.freeze([EstadoInscripcion.PENDIENTE,  EstadoInscripcion.CANCELADA]),  // A6
  [EstadoInscripcion.PENDIENTE]:  Object.freeze([EstadoInscripcion.APROBADA,   EstadoInscripcion.RECHAZADA]),  // A8
  [EstadoInscripcion.APROBADA]:   Object.freeze([EstadoInscripcion.CONFIRMADA, EstadoInscripcion.CANCELADA]),  // A11
  [EstadoInscripcion.CONFIRMADA]: Object.freeze([EstadoInscripcion.FINALIZADA, EstadoInscripcion.RECHAZADA]),  // A12
  [EstadoInscripcion.FINALIZADA]: Object.freeze([]),
  [EstadoInscripcion.RECHAZADA]:  Object.freeze([]),
  [EstadoInscripcion.CANCELADA]:  Object.freeze([])
});

/** Tipos de certificado (diagrama de clases). */
const TipoCertificado = Object.freeze({
  ESTUDIANTE_REGULAR: 'ESTUDIANTE_REGULAR',
  INSCRIPCION:        'INSCRIPCION'
});

/**
 * Estados de la SolicitudCertificado.
 * Diagrama de clases: SOLICITADO, ENTREGADO, VENCIDO, RECHAZADO, CANCELADO.
 * Extensión justificada por el DE03: EMITIDO.
 */
const EstadoSolicitud = Object.freeze({
  SOLICITADO: 'SOLICITADO',
  EMITIDO:    'EMITIDO',
  ENTREGADO:  'ENTREGADO',
  VENCIDO:    'VENCIDO',
  RECHAZADO:  'RECHAZADO',
  CANCELADO:  'CANCELADO'
});

/**
 * Transiciones de la SolicitudCertificado que usa el MVP (tramo del DE03 que
 * recorre el comprobante de CU-05): SOLICITADO → EMITIDO → ENTREGADO.
 * El resto del DE03 pertenece a CU-10 y queda fuera del alcance del MVP.
 */
const TransicionesSolicitud = Object.freeze({
  [EstadoSolicitud.SOLICITADO]: Object.freeze([EstadoSolicitud.EMITIDO]),
  [EstadoSolicitud.EMITIDO]:    Object.freeze([EstadoSolicitud.ENTREGADO]),
  [EstadoSolicitud.ENTREGADO]:  Object.freeze([])
});

/** Turnos de dictado de una Comisión (diagrama de clases). */
const Turno = Object.freeze({
  MANANA: 'MAÑANA',
  TARDE:  'TARDE',
  NOCHE:  'NOCHE'
});

/** Condición académica de una Calificación (diagrama de clases). */
const TipoCalificacion = Object.freeze({
  APROBADO:  'APROBADO',
  PROMOCION: 'PROMOCION',
  APLAZO:    'APLAZO'
});

/**
 * Detalle de implementación: el diagrama no tiene un atributo de período.
 * Todas las comisiones cargadas en el MVP pertenecen a este período vigente
 * (decisión documentada en la justificación).
 */
const PERIODO_VIGENTE = '2C 2026';
