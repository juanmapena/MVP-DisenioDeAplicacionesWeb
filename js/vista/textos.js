/* =====================================================================
 * textos.js — Textos de pantalla, tomados de las maquetas aprobadas del TP1
 * (sección 7: "Diseño de pantalla Inscribirse a materias").
 * La vista traduce cada Motivo y cada mensaje del DS01 a estos textos.
 * ===================================================================== */

const TextosMotivo = Object.freeze({
  // Maqueta A3
  NO_HABILITADO: Object.freeze({
    titulo: 'Lamentablemente, tu inscripción no pudo completarse.',
    detalle: 'La inscripción no logró confirmarse por alguno de los siguientes motivos. Recomendamos verificar:',
    items: Object.freeze(['Tu situación de regularidad.', 'Que tu documentación esté actualizada y completa.'])
  }),
  // A4: ninguna materia de la carrera tiene comisiones abiertas (texto definido por el equipo)
  SIN_OFERTA: Object.freeze({
    titulo: 'Lamentablemente, tu inscripción no pudo completarse.',
    detalle: 'Te informamos que tu carrera no posee materias en oferta para este período.'
  }),
  // Maqueta A8 – sin cupo
  SIN_CUPO: Object.freeze({
    titulo: 'Lamentablemente, tu inscripción no pudo completarse.',
    detalle: 'La inscripción no logró confirmarse debido a que no hay más cupos disponibles para la comisión seleccionada.'
  }),
  // Maqueta A8 – inscripción previa
  YA_INSCRIPTO: Object.freeze({
    titulo: 'Lamentablemente, tu inscripción no pudo completarse.',
    detalle: 'Verificamos que ya se registra una inscripción a la misma materia en este período de inscripción.'
  }),
  // Maqueta A8 – correlatividades
  CORRELATIVAS_INCUMPLIDAS: Object.freeze({
    titulo: 'Lamentablemente, tu inscripción no pudo completarse.',
    detalle: 'Verificamos que las materias correlativas correspondientes no están aprobadas.'
  }),
  // Maqueta A12
  FALLA_REGISTRO: Object.freeze({
    titulo: 'Ha ocurrido un error inesperado',
    detalle: 'La inscripción no logró confirmarse, recomendamos reintentar la operación.'
  })
});

const TextosMensaje = Object.freeze({
  SOLICITUD_CANCELADA:   'Tu solicitud de inscripción fue cancelada con éxito',   // A6 (msj. 29)
  INSCRIPCION_CANCELADA: 'Tu inscripción fue cancelada con éxito',                // A11 (msj. 61)
  // A5 (maqueta A4 original, referida a una materia): solo vista, sin mensajes del dominio.
  MATERIA_SIN_COMISIONES: 'Te informamos que la materia por la que estás consultando no posee comisiones en oferta. Volvé a consultar el siguiente cuatrimestre.',
  VALIDANDO:   'Estamos validando tu solicitud…',     // aviso de 1 s con PENDIENTE (msj. 30)
  REGISTRANDO: 'Estamos registrando tu inscripción…', // aviso de 1 s con CONFIRMADA (msj. 62)
  EXITO:       '¡Tu inscripción se completó exitosamente!'
});

/** Etiquetas visibles de los estados del DE01. */
const TextosEstado = Object.freeze({
  EN_CURSO:   'En curso',
  VALIDADA:   'Validada',
  PENDIENTE:  'Pendiente',
  APROBADA:   'Aprobada',
  CONFIRMADA: 'Confirmada',
  FINALIZADA: 'Finalizada',
  RECHAZADA:  'Rechazada',
  CANCELADA:  'Cancelada'
});
