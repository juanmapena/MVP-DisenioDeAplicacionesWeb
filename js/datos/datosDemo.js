/* =====================================================================
 * datosDemo.js — Datos semilla del MVP (repositorio en memoria)
 *
 * crearBaseDeDatos() arma TODO desde cero con las entidades del modelo y
 * devuelve el repositorio. Llamarla de nuevo reinicia los datos (botón
 * "Reiniciar demo").
 *
 * Período vigente: PERIODO_VIGENTE ("2C 2026"). Todas las comisiones
 * cargadas pertenecen a ese período.
 *
 * "OFERTADA" / "ASOCIADA" y "DISPONIBLE" / "LLENA" NO son enums: Materia y
 * Comisión mantienen estado:boolean (diagrama del TP1).
 *   - OFERTADA = la materia tiene comisiones abiertas; ASOCIADA = no tiene.
 *   - LLENA    = cupoDisponible === 0; DISPONIBLE = cupoDisponible > 0.
 * ===================================================================== */

function crearBaseDeDatos() {

  /* ------------------------------------------------------------------
   * Carreras y planes de estudio (Carrera ◆ PlanDeEstudio, 1 a 1)
   * ------------------------------------------------------------------ */
  const tecnicatura = new Carrera({
    idCarrera: 1, nombre: 'Tecnicatura en Desarrollo Web', duracionEstimada: 3,
    plan: { idPlanDeEstudio: 101, cantidadMaterias: 20 }
  });
  const licenciatura = new Carrera({
    idCarrera: 2, nombre: 'Licenciatura en Administración', duracionEstimada: 4,
    plan: { idPlanDeEstudio: 201, cantidadMaterias: 32 }
  });

  /* ------------------------------------------------------------------
   * Materias (cada una pertenece a una sola carrera: sin transversales)
   * ------------------------------------------------------------------ */
  const informatica = new Materia({ idMateria: 1, nombre: 'Informática general', cargaHoraria: 64, anio: 1,
    descripcion: 'Fundamentos de sistemas de computación y herramientas informáticas.' });
  const matematica  = new Materia({ idMateria: 2, nombre: 'Matemática', cargaHoraria: 96, anio: 1,
    descripcion: 'Álgebra, funciones y lógica aplicadas a la programación.' });
  const programacion1 = new Materia({ idMateria: 3, nombre: 'Programación I', cargaHoraria: 96, anio: 1,
    descripcion: 'Algoritmos, estructuras de control y primeros programas.' });
  const programacion2 = new Materia({ idMateria: 4, nombre: 'Programación II', cargaHoraria: 96, anio: 2,
    descripcion: 'Programación orientada a objetos.', requiere: [programacion1] });
  const baseDeDatos1 = new Materia({ idMateria: 5, nombre: 'Base de Datos I', cargaHoraria: 64, anio: 2,
    descripcion: 'Modelo relacional y SQL.', requiere: [informatica] });
  const ingles = new Materia({ idMateria: 6, nombre: 'Inglés técnico', cargaHoraria: 32, anio: 1,
    descripcion: 'Lectura comprensiva de textos técnicos en inglés.' });   // ASOCIADA: sin comisiones (A5)
  const contabilidad1 = new Materia({ idMateria: 7, nombre: 'Contabilidad I', cargaHoraria: 64, anio: 1,
    descripcion: 'Principios contables y registración.' });

  // Asociar materia con carrera (RF06): el plan controla el límite y la
  // Carrera queda como el todo de la composición Carrera ◆ Materia.
  tecnicatura.planDeEstudio.agregarMaterias(
    [informatica, matematica, programacion1, programacion2, baseDeDatos1, ingles]);
  licenciatura.planDeEstudio.agregarMaterias([contabilidad1]);

  /* ------------------------------------------------------------------
   * Docentes (titulares: Comisión ◆ Clase ── Docente)
   * ------------------------------------------------------------------ */
  const docente = (id, nombre, apellido, especialidad) => new Docente({
    idDocente: id, legajo: `D-${id}`, nombre, apellido, especialidad,
    email: `${nombre}.${apellido}@universidad.edu.ar`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''),
    nombreUsuario: `${nombre[0]}${apellido}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  });
  const marioPerez       = docente(1, 'Mario',   'Pérez',     'Sistemas');
  const rominaGarcia     = docente(2, 'Romina',  'García',    'Sistemas');
  const susanaRodriguez  = docente(3, 'Susana',  'Rodríguez', 'Matemática');
  const estebanMendoza   = docente(4, 'Esteban', 'Mendoza',   'Matemática');
  const lauraSosa        = docente(5, 'Laura',   'Sosa',      'Programación');
  const diegoMartinez    = docente(6, 'Diego',   'Martínez',  'Programación');
  const paulaBenitez     = docente(7, 'Paula',   'Benítez',   'Bases de datos');
  const ricardoAlvarez   = docente(8, 'Ricardo', 'Álvarez',   'Contabilidad');

  /* ------------------------------------------------------------------
   * Comisiones del período vigente, cada una con su primera Clase
   * (el docente de esa clase es el titular que muestra la oferta).
   * ------------------------------------------------------------------ */
  let idClase = 0;
  const comision = (datos, titular) => {
    const com = new Comision(datos);
    new Clase({
      idClase: ++idClase, comision: com, docente: titular, numeroDeClase: 1,
      fecha: new Date(2026, 7, 10), tema: 'Presentación de la materia'
    });
    return com;
  };

  // Informática general (OFERTADA)
  const INF_GE_1 = comision({ idComision: 11, etiqueta: 'INF_GE_1', materia: informatica, turno: Turno.MANANA,
    dia: 'Martes', nroAula: 101, cupoMaximo: 30, cupoDisponible: 20 }, marioPerez);       // DISPONIBLE
  const INF_GE_2 = comision({ idComision: 12, etiqueta: 'INF_GE_2', materia: informatica, turno: Turno.TARDE,
    dia: 'Miércoles', nroAula: 102, cupoMaximo: 25, cupoDisponible: 0 }, rominaGarcia);    // LLENA (escenario 2)

  // Matemática (OFERTADA)
  const MAT_1 = comision({ idComision: 21, etiqueta: 'MAT_1', materia: matematica, turno: Turno.TARDE,
    dia: 'Lunes - Miércoles', nroAula: 201, cupoMaximo: 30, cupoDisponible: 8 }, susanaRodriguez);
  const MAT_2 = comision({ idComision: 22, etiqueta: 'MAT_2', materia: matematica, turno: Turno.NOCHE,
    dia: 'Martes - Jueves', nroAula: 202, cupoMaximo: 25, cupoDisponible: 13 }, estebanMendoza);
    // MAT_2 queda con 12 después de registrar a Lucas.

  // Una comisión para cada una de las demás materias (OFERTADAS), salvo Inglés técnico (ASOCIADA)
  const PRO_1_1 = comision({ idComision: 31, etiqueta: 'PRO_1_1', materia: programacion1, turno: Turno.MANANA,
    dia: 'Lunes - Jueves', nroAula: 301, cupoMaximo: 35, cupoDisponible: 15 }, lauraSosa);
  const PRO_2_1 = comision({ idComision: 41, etiqueta: 'PRO_2_1', materia: programacion2, turno: Turno.NOCHE,
    dia: 'Viernes', nroAula: 302, cupoMaximo: 30, cupoDisponible: 12 }, diegoMartinez);
  const BD_1_1  = comision({ idComision: 51, etiqueta: 'BD_1_1', materia: baseDeDatos1, turno: Turno.TARDE,
    dia: 'Jueves', nroAula: 401, cupoMaximo: 30, cupoDisponible: 10 }, paulaBenitez);     // escenario 4: hay cupo
  const CON_1_1 = comision({ idComision: 71, etiqueta: 'CON_1_1', materia: contabilidad1, turno: Turno.MANANA,
    dia: 'Lunes', nroAula: 501, cupoMaximo: 40, cupoDisponible: 25 }, ricardoAlvarez);

  /* ------------------------------------------------------------------
   * Historial académico (Calificación es parte de su Materia)
   * ------------------------------------------------------------------ */
  let idCalificacion = 0;
  const calificacion = (materia, nota, tipo) =>
    new Calificacion({ idCalificacion: ++idCalificacion, materia, nota, tipo });

  const carolinaProg1 = calificacion(programacion1, 9, TipoCalificacion.PROMOCION);
  const lucasProg1    = calificacion(programacion1, 7, TipoCalificacion.APROBADO);
  const lucasInfo     = calificacion(informatica,   8, TipoCalificacion.PROMOCION);

  /* ------------------------------------------------------------------
   * Estudiantes de la Tecnicatura (Carrera ◇ Estudiante)
   * ------------------------------------------------------------------ */
  const carolina = new Estudiante({
    idEstudiante: 1, legajo: '1001', nombre: 'Carolina', apellido: 'Gómez', documento: 40111222,
    email: 'carolina.gomez@alumnos.edu.ar', nombreUsuario: 'cgomez', estado: true,
    carrera: tecnicatura, calificaciones: [carolinaProg1]
  });
  const lucas = new Estudiante({
    idEstudiante: 2, legajo: '1002', nombre: 'Lucas', apellido: 'Fernández', documento: 40333444,
    email: 'lucas.fernandez@alumnos.edu.ar', nombreUsuario: 'lfernandez', estado: true,
    carrera: tecnicatura, calificaciones: [lucasProg1, lucasInfo]
  });
  const valentina = new Estudiante({
    idEstudiante: 3, legajo: '1003', nombre: 'Valentina', apellido: 'Ruiz', documento: 40555666,
    email: 'valentina.ruiz@alumnos.edu.ar', nombreUsuario: 'vruiz', estado: false,   // inactiva (A3)
    carrera: tecnicatura, calificaciones: []
  });

  /* ------------------------------------------------------------------
   * Repositorio en memoria
   * ------------------------------------------------------------------ */
  const estudiantes = [carolina, lucas, valentina];
  const carreras    = [tecnicatura, licenciatura];
  const docentes    = [marioPerez, rominaGarcia, susanaRodriguez, estebanMendoza,
                       lauraSosa, diegoMartinez, paulaBenitez, ricardoAlvarez];
  const materias    = carreras.flatMap(c => c.materias);
  const comisiones  = materias.flatMap(m => m.comisiones);

  const repositorio = Object.freeze({
    periodoVigente: PERIODO_VIGENTE,

    /** Listados (copias). */
    get estudiantes()   { return [...estudiantes]; },
    get carreras()      { return [...carreras]; },
    get docentes()      { return [...docentes]; },
    get materias()      { return [...materias]; },
    get comisiones()    { return [...comisiones]; },

    /** Búsqueda por legajo (Usuario.legajo es string). Retorna Estudiante o null. */
    buscarEstudiantePorLegajo(legajo) {
      return estudiantes.find(e => e.legajo === String(legajo)) ?? null;
    },

    /** Búsqueda por idMateria. Retorna Materia o null. */
    buscarMateriaPorId(idMateria) {
      return materias.find(m => m.idMateria === Number(idMateria)) ?? null;
    },

    /** Búsqueda por idComision. Retorna Comision o null. */
    buscarComisionPorId(idComision) {
      return comisiones.find(c => c.idComision === Number(idComision)) ?? null;
    }
  });
  // Las inscripciones no se guardan en el repositorio: por la composición
  // Estudiante ◆ Inscripción viven dentro de cada Estudiante.

  /* ------------------------------------------------------------------
   * Inscripción previa de Lucas en MAT_2 (escenario 3).
   * Se arma con los mismos métodos que usa el DS01 y recorre solo
   * transiciones válidas del DE01; la Inscripción guarda únicamente el
   * estado final (FINALIZADA), sin historial.
   * ------------------------------------------------------------------ */
  const insLucas = lucas.inscribirAMaterias(tecnicatura.materias);   // EN_CURSO
  insLucas.cambiarEstado(EstadoInscripcion.VALIDADA);                // EN_CURSO → VALIDADA
  lucas.confirmarSolicitudDeInscripcion(matematica, MAT_2);          // VALIDADA → PENDIENTE
  insLucas.cambiarEstado(EstadoInscripcion.APROBADA);                // PENDIENTE → APROBADA
  lucas.confirmarInscripcion();   // APROBADA → CONFIRMADA → agregarEstudiante(lucas), restarCupo(),
                                  // comprobante → FINALIZADA (queda dentro de Lucas)

  return repositorio;
}
