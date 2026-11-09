/* =====================================================================
 * mapeador.js — Convierte entidades en objetos planos y congelados.
 * El ControladorInscripcion solo devuelve estos objetos a la vista, así la
 * vista no recibe entidades y no puede ejecutar lógica de negocio.
 * Solo LEE atributos y relaciones: no llama métodos del dominio.
 * ===================================================================== */

/** Congela un objeto y todo lo que contiene. */
function congelarProfundo(obj) {
  Object.values(obj).forEach(v => {
    if (v && typeof v === 'object' && !Object.isFrozen(v)) congelarProfundo(v);
  });
  return Object.freeze(obj);
}

const Mapeador = Object.freeze({

  /** Estudiante → contexto académico del encabezado. */
  estudiante(est) {
    return congelarProfundo({
      legajo: est.legajo,
      nombre: `${est.nombre} ${est.apellido}`,
      carrera: est.carrera ? est.carrera.nombre : '—',
      activo: est.estado === true
    });
  },

  /** Comisión → fila de la oferta (etiqueta, turno, día/s, titular, cupos). */
  comision(com) {
    const titular = com.titular;
    return congelarProfundo({
      idComision: com.idComision,
      etiqueta: com.etiqueta,
      idMateria: com.materia.idMateria,
      materia: com.materia.nombre,
      turno: com.turno,
      dias: com.dia,
      aula: com.nroAula,
      titular: titular ? `${titular.nombre} ${titular.apellido}` : 'A designar',
      cupoMaximo: com.cupoMaximo,
      cupoDisponible: com.cupoDisponible,
      llena: com.cupoDisponible === 0          // "LLENA" = cupoDisponible 0 (no es enum)
    });
  },

  /** Materia → ítem de la oferta, con sus comisiones abiertas. */
  materia(mat) {
    const abiertas = mat.comisiones.filter(c => c.estado === true);
    return congelarProfundo({
      idMateria: mat.idMateria,
      nombre: mat.nombre,
      descripcion: mat.descripcion,
      cargaHoraria: mat.cargaHoraria,
      anio: mat.anio,
      correlativas: mat.requiere.map(r => r.nombre),
      tieneComisiones: abiertas.length > 0,    // "OFERTADA" / "ASOCIADA" (A5), no es enum
      comisiones: abiertas.map(c => Mapeador.comision(c))
    });
  },

  /**
   * Requisitos de una materia (relación "requiere") marcados como aprobados o
   * no, para "Ver correlatividades". Usa la misma regla que
   * Materia.esCorrelativaDe(): el requisito está aprobado si el historial tiene
   * una calificación de esa materia (composición Materia ◆ Calificación) con
   * tipo APROBADO o PROMOCION. Así la vista solo dibuja.
   */
  requisitos(mat, historial) {
    return congelarProfundo(mat.requiere.map(req => ({
      idMateria: req.idMateria,
      nombre: req.nombre,
      aprobada: historial.some(cal =>
        req.calificaciones.includes(cal) &&
        (cal.tipo === TipoCalificacion.APROBADO || cal.tipo === TipoCalificacion.PROMOCION))
    })));
  },

  /** Inscripción → estado y datos para resumen / resultados. com es opcional. */
  inscripcion(ins, com = null) {
    return congelarProfundo({
      idInscripcion: ins.idInscripcion,
      fecha: ins.fecha.toISOString(),
      estado: ins.estado,
      idMateria: ins.materia ? ins.materia.idMateria : null,
      materia: ins.materia ? ins.materia.nombre : null,
      comision: com ? Mapeador.comision(com) : null
    });
  },

  /** SolicitudCertificado + Inscripción + Comisión → datos del comprobante. */
  comprobante(sol, ins, com) {
    return congelarProfundo({
      nroTramite: sol.nroTramite,
      tipo: sol.tipo,
      estado: sol.estado,
      fechaEmision: sol.fecha.toISOString(),
      fechaEntrega: sol.fechaEntrega ? sol.fechaEntrega.toISOString() : null,
      destinatario: sol.destinatario,
      estudiante: `${sol.estudiante.nombre} ${sol.estudiante.apellido}`,
      legajo: sol.estudiante.legajo,
      carrera: sol.carrera.nombre,
      periodo: PERIODO_VIGENTE,
      inscripcion: Mapeador.inscripcion(ins, com)
    });
  }
});
