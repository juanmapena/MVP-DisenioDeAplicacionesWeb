# MVP — CU-05 "Inscribirse a materias"

Trabajo Práctico Integral, Segunda parte — Actividad 4 (Producto Mínimo Viable).
Diseño de Aplicaciones Web · Comisión 01-3966 · 2C 2026.

El MVP implementa el caso de uso CU-05 tal como lo modelan nuestro **DS01 "Inscribirse a Materia"** (88 mensajes) y nuestro **DE01 "Inscripción"**. Respeta el diagrama de clases del TP1 y las pantallas aprobadas.

---

## 1. Cómo abrirlo

1. Descomprimí la carpeta `mvp-inscripcion`.
2. Abrí **`index.html` con doble clic**. Funciona en Chrome, Firefox, Edge y Safari.
3. No hace falta servidor, instalación ni internet:
   - No se usan módulos ES ni `fetch`: son `<script>` clásicos cargados en orden.
   - Los datos están en memoria (`js/datos/datosDemo.js`).
   - Sin internet, la tipografía Open Sans se reemplaza por la fuente del sistema.
4. En la pantalla de ingreso, elegí un estudiante (autenticación simulada).

Recargar la página o tocar **Demo → Reiniciar datos** vuelve todo al estado inicial.

---

## 2. Estructura de carpetas

```
mvp-inscripcion/
├── index.html                      Página única; carga los scripts en orden
├── README.md
├── css/
│   └── estilos.css                 Estilo de las maquetas del TP1; etiquetas de estado; versión para celular
└── js/
    ├── modelo/                     MODELO (entidades y enums del diagrama de clases)
    │   ├── enums.js                EstadoInscripcion (8), TransicionesInscripcion (DE01), EstadoSolicitud, TransicionesSolicitud,
    │   │                           TipoCertificado, Turno, TipoCalificacion, PERIODO_VIGENTE
    │   ├── Usuario.js              Abstracta; iniciarSesion, cerrarSesion, estaActivo; fueraDelAlcanceDelMVP()
    │   ├── Estudiante.js           Mensajes 3, 6, 8, 13, 25, 32, 45, 57 y 64 (y 65 a 86 por dentro)
    │   ├── Docente.js              Titular de las comisiones
    │   ├── Carrera.js              Plan, materias, estudiantes y solicitudes
    │   ├── PlanDeEstudio.js        Límite de materias del plan
    │   ├── Materia.js              esCorrelativaDe (mensaje 47); correlativas "requiere" / "habilita"
    │   ├── Comision.js             verificarCupo, estaInscripto, agregarEstudiante, restarCupo (mensajes 35, 40, 66, 72, 78)
    │   ├── Clase.js                Une Comisión y Docente
    │   ├── Calificacion.js         Historial académico
    │   ├── Inscripcion.js          crear (mensaje 4) y cambiarEstado (DE01); solo el estado actual
    │   └── SolicitudCertificado.js Comprobante (mensajes 80 a 84): SOLICITADO → EMITIDO → ENTREGADO
    ├── datos/
    │   └── datosDemo.js            crearBaseDeDatos(): datos semilla y búsquedas por legajo, materia y comisión
    ├── control/                    CONTROL
    │   ├── motivos.js              NO_HABILITADO, SIN_OFERTA, SIN_CUPO, YA_INSCRIPTO, CORRELATIVAS_INCUMPLIDAS, FALLA_REGISTRO
    │   ├── mapeador.js             Entidades → objetos planos congelados (la vista nunca recibe entidades)
    │   └── ControladorInscripcion.js  <<control>>: mensajes 2, 24, 31, 56 y 63
    ├── vista/                      VISTA
    │   ├── textos.js               Textos exactos de las maquetas
    │   └── FormInscripcion.js      <<boundary>>: eventos del actor y automensajes mostrar*()
    └── app.js                      ARRANQUE: repositorio, controlador de sesión, Form y panel Demo
```

**Orden de carga** (en `index.html`): enums → Usuario → Estudiante y Docente → resto del modelo → datos → control → vista → `app.js`.
Los scripts clásicos comparten el ámbito global y se ejecutan en el orden del documento. Además, una clase tiene que estar definida antes de que otra la extienda (`class Estudiante extends Usuario`).

**Patrón Boundary–Control–Entity**, como en el DS01:
Estudiante (actor) → `FormInscripcion` (boundary) → `ControladorInscripcion` (control) → entidades.

---

## 3. Requisito del MVP → dónde está

| Requisito (enunciado, Actividad 4) | Dónde está |
|---|---|
| Autenticación simulada: elegir un estudiante válido | Pantalla de ingreso (`FormInscripcion.mostrarLogin`) → `ControladorInscripcion.iniciarSesion(legajo)` → `Usuario.iniciarSesion()` |
| Mostrar el contexto académico | Arriba a la derecha: Estudiante, Carrera y Estado (`#contexto`); "Datos personales" en resumen y resultados |
| Oferta: materias disponibles | `Estudiante.buscarMaterias()` (mensaje 13) → `mostrarOferta` (mensaje 20) |
| Oferta: comisiones, docentes, horarios, cupos | Tabla de cada materia: Comisión, Turno, Día/s, Titular de cátedra (`Comision.titular`, por Comisión ◆ Clase ── Docente) y "Cupos disponibles" |
| Verificación de correlatividades | `Estudiante.consultarHistorialAcademico()` + `Materia.esCorrelativaDe(historial)` (mensajes 45 a 48) |
| Verificación de inscripción previa | `Comision.estaInscripto(est)` (mensajes 40 y 41), que revisa todas las comisiones de la materia |
| Verificación de cupo disponible | `Comision.verificarCupo()` en el paso 8 (mensaje 35) y de nuevo en el paso 12 (mensaje 66) |
| Verificación de materia perteneciente a la carrera | `Estudiante.validarCarreraDeEstudiante(car, est)` (mensaje 8) y la oferta, que solo trae materias del plan de la carrera (mensajes 3 y 13). No hay buscador por código |
| Mostrar los estados Pendiente, Aprobada y Rechazada | Aviso de 1 s con **Pendiente** (paso 7); tarjetas del resumen con **Aprobada**; pantallas de rechazo con **Rechazada**. También se muestran Validada, Confirmada, Finalizada y Cancelada |
| Escenarios (al menos 2) | Los 4: éxito, sin cupo, ya inscripto y correlativas (sección 4) |

---

## 4. Escenarios: cómo reproducirlos

### Orden de la demo (5 minutos)

**2 → 4 → 3 → 1.** Después, **"Reiniciar datos"** y el **resultado mixto**.
La guía también está en el botón **Demo**, abajo a la izquierda.

| # | Escenario | Cómo reproducirlo | Resultado (estados del DE01) |
|---|---|---|---|
| 2 | Comisión sin cupo | Carolina → *Inscribirse a materias* → marcar **Informática general**, comisión **INF_GE_2** (0 cupos) → *Confirmar solicitud* | EN_CURSO → VALIDADA → PENDIENTE → **RECHAZADA** · SIN_CUPO · botón "Ver oferta de comisiones" |
| 4 | Correlativas incumplidas | Carolina → marcar **Base de Datos I** → *Confirmar solicitud* → *Ver correlatividades* | … → PENDIENTE → **RECHAZADA** · CORRELATIVAS_INCUMPLIDAS · el modal muestra "Informática general — No aprobada" |
| 3 | Estudiante ya inscripto | Avatar → *Cambiar de estudiante* → Lucas → marcar **Matemática** (MAT_1 o MAT_2) → *Confirmar solicitud* | … → PENDIENTE → **RECHAZADA** · YA_INSCRIPTO · "Ver inscripciones confirmadas" muestra su inscripción FINALIZADA en MAT_2 |
| 1 | Inscripción exitosa | Carolina → marcar **Informática general (INF_GE_1)** y **Matemática (MAT_1)** → *Confirmar solicitud* → *Confirmar inscripción* | Cada trámite: EN_CURSO → VALIDADA → PENDIENTE → APROBADA → CONFIRMADA → **FINALIZADA** · cupos 20 → 19 y 8 → 7 · "Ver detalle" y "Descargar certificado" |
| — | Resultado mixto | **Demo → Reiniciar datos** → Carolina → **Matemática** + **Base de Datos I** → confirmar los dos pasos | Matemática **FINALIZADA** y Base de Datos I **RECHAZADA**, en columnas lado a lado |

Si el mixto se hace después del escenario 1 sin reiniciar, Matemática da YA_INSCRIPTO, que es lo correcto. Por eso va primero "Reiniciar datos".

### Flujos alternativos

| Flujo | Cómo reproducirlo | Resultado |
|---|---|---|
| A3 – No habilitado | Ingresar como **Valentina** (inactiva) → *Inscribirse a materias* | EN_CURSO → **RECHAZADA** · NO_HABILITADO |
| A4 – Sin oferta | No se reproduce con estos datos: las dos carreras tienen oferta (decisión del equipo). Está implementado y probado cerrando todas las comisiones | EN_CURSO → **RECHAZADA** · SIN_OFERTA |
| A5 – Materia sin comisiones | Marcar **Inglés técnico** | Pantalla A5, solo de vista; la inscripción sigue **VALIDADA**. "Ver oferta de materias" vuelve a la oferta |
| A6 – Cancela la solicitud | En la oferta → *Cancelar* | VALIDADA → **CANCELADA** · modal "Tu solicitud de inscripción fue cancelada con éxito" |
| A11 – Cancela la inscripción | En el resumen → *Cancelar* | APROBADA → **CANCELADA**, sin descontar cupo · modal "Tu inscripción fue cancelada con éxito" |
| A12 – Cupo agotado al registrar | Llegar al resumen → **Demo → "Simular que otro estudiante ocupa el último cupo (A12)"** → *Confirmar inscripción* | CONFIRMADA → **RECHAZADA** · FALLA_REGISTRO, sin descontar cupo (mensajes 66 a 71) |

### Datos semilla (período vigente "2C 2026")

| Estudiante | Legajo | Estado | Historial |
|---|---|---|---|
| Carolina Gómez | 1001 | Activa | Aprobó Programación I |
| Lucas Fernández | 1002 | Activo | Aprobó Programación I e Informática general; inscripción **FINALIZADA** en MAT_2 |
| Valentina Ruiz | 1003 | Inactiva | — |

| Materia (Tecnicatura en Desarrollo Web) | Requiere | Comisiones (cupos disponibles) |
|---|---|---|
| Informática general | — | INF_GE_1 (20, Mario Pérez) · INF_GE_2 (**0**, Romina García) |
| Matemática | — | MAT_1 (8, Susana Rodríguez) · MAT_2 (12, Esteban Mendoza) |
| Programación I | — | PRO_1_1 (15) |
| Programación II | Programación I | PRO_2_1 (12) |
| Base de Datos I | Informática general | BD_1_1 (10) |
| Inglés técnico | — | **sin comisiones** |

La Licenciatura en Administración tiene Contabilidad I (CON_1_1). Los cupos de las demás comisiones, las aulas y cuatro de los docentes son inventados.

---

## 5. Trazabilidad: paso de CU-05 → mensaje del DS01 → método → estado del DE01

| Paso / flujo | Mensajes | Método (clase) | Estado de la Inscripción |
|---|---|---|---|
| 1. Elige "Inscribirse a materias" | 1, 2 | `FormInscripcion.inscribirAMaterias()` → `ControladorInscripcion.iniciarInscripcion(est)` | — |
| 2. Se crea la Inscripción | 3, 4, 5 | `Estudiante.inscribirAMaterias(materias)` → `Inscripcion.crear(fecha)` | **EN_CURSO** |
| 3. Valida la habilitación | 6, 7 | `Estudiante.validarEstudianteHabilitado(est)` (usa `estaActivo()`) | EN_CURSO |
| 4. Valida la carrera | 8, 9 | `Estudiante.validarCarreraDeEstudiante(car, est)` | EN_CURSO |
| A3 | 10, 11, 12 | `Inscripcion.cambiarEstado(RECHAZADA)` → `{motivo: NO_HABILITADO}` → `FormInscripcion.mostrarMotivo` | **RECHAZADA** |
| 4. Busca la oferta | 13, 14 | `Estudiante.buscarMaterias()` | EN_CURSO |
| A4 | 15, 16, 17 | `cambiarEstado(RECHAZADA)` → `{motivo: SIN_OFERTA}` → `mostrarMotivo` | **RECHAZADA** |
| 4. Muestra la oferta | 18, 19, 20 | `cambiarEstado(VALIDADA)` → `{materias, ins}` → `FormInscripcion.mostrarOferta(materias)` | **VALIDADA** |
| A5 | — | Solo vista (`#mostrarSinComisiones`) | VALIDADA |
| 5. Elige materia y comisión | 21, 22 | `FormInscripcion.seleccionarMateria(mat)`, `seleccionarComision(com)` | VALIDADA |
| A6 | 23 a 29 | `Form.cancelarSolicitudDeInscripcion()` → `Ctrl.cancelarSolicitudDeInscripcion(ins)` → `Estudiante.cancelarSolicitudDeInscripcion(ins)` → `cambiarEstado(CANCELADA)` → `mostrarMensaje` | **CANCELADA** |
| 6. "Confirmar solicitud" | 30, 31, 32 | `Form.confirmarSolicitudDeInscripcion()` → `Ctrl.confirmarSolicitudDeInscripcion(mat, com)` → `Estudiante.confirmarSolicitudDeInscripcion(mat, com)` | VALIDADA |
| 7. Pendiente | 33, 34 | `cambiarEstado(PENDIENTE)` (dentro de Estudiante) | **PENDIENTE** |
| 8. Cupo | 35, 36 | `Comision.verificarCupo()` | PENDIENTE |
| A8 – sin cupo | 37, 38, 39 | `cambiarEstado(RECHAZADA)` → `SIN_CUPO` → `mostrarMotivo` | **RECHAZADA** |
| 8. Inscripción previa | 40, 41 | `Comision.estaInscripto(est)` | PENDIENTE |
| A8 – ya inscripto | 42, 43, 44 | `cambiarEstado(RECHAZADA)` → `YA_INSCRIPTO` → `mostrarMotivo` | **RECHAZADA** |
| 8. Correlatividades | 45 a 48 | `Estudiante.consultarHistorialAcademico()` → `Materia.esCorrelativaDe(historial)` | PENDIENTE |
| A8 – correlativas | 49, 50, 51 | `cambiarEstado(RECHAZADA)` → `CORRELATIVAS_INCUMPLIDAS` → `mostrarMotivo` | **RECHAZADA** |
| 9. Aprobada | 52 | `cambiarEstado(APROBADA)` | **APROBADA** |
| 10. Resumen | 53, 54 | `{ins}` → `FormInscripcion.mostrarResumen(ins)`, una vez por trámite | APROBADA |
| A11 | 55 a 61 | `Form.cancelarInscripcion()` → `Ctrl.cancelarInscripcion(ins)` → `Estudiante.cancelarInscripcion(ins)` → `cambiarEstado(CANCELADA)` → `mostrarMensaje` | **CANCELADA** |
| 11. "Confirmar inscripción" | 62 a 65 | `Form.confirmarInscripcion()` → `Ctrl.confirmarInscripcion()` → `Estudiante.confirmarInscripcion()` → `cambiarEstado(CONFIRMADA)` | **CONFIRMADA** |
| 12. Vuelve a verificar el cupo | 66, 67 | `Comision.verificarCupo()` (desde Estudiante) | CONFIRMADA |
| A12 – cupo agotado | 68 a 71 | `cambiarEstado(RECHAZADA)` → `rechazada` → `FALLA_REGISTRO` → `mostrarMotivo` | **RECHAZADA** |
| 12. Registra | 72, 73 | `Comision.agregarEstudiante(est)` | CONFIRMADA |
| A12 – falla del registro | 74 a 77 | `cambiarEstado(RECHAZADA)` → `rechazada` → `FALLA_REGISTRO` → `mostrarMotivo` | **RECHAZADA** |
| 12. Descuenta el cupo | 78, 79 | `Comision.restarCupo()` | CONFIRMADA |
| 12. Comprobante (CU12) | 80 a 84 | `SolicitudCertificado.crear(fecha)` → `generarCertificado(est, car, mat)` → `descargar()` | CONFIRMADA |
| 12. Finaliza | 85 a 88 | `cambiarEstado(FINALIZADA)` → `ins` → `{ins, comprobante}` → `FormInscripcion.mostrarComprobante(ins)` | **FINALIZADA** |

Todos los cambios de estado pasan por `Inscripcion.cambiarEstado()`, que rechaza con un error cualquier transición fuera del DE01:
- EN_CURSO → VALIDADA | RECHAZADA
- VALIDADA → PENDIENTE | CANCELADA
- PENDIENTE → APROBADA | RECHAZADA
- APROBADA → CONFIRMADA | CANCELADA
- CONFIRMADA → FINALIZADA | RECHAZADA

FINALIZADA, RECHAZADA y CANCELADA son finales.

---

## 6. Extensiones y detalles de implementación (para la justificación de decisiones)

Todas estas decisiones fueron aprobadas por el equipo. En el código, cada detalle está marcado con el comentario `// Detalle de implementación:`.

### 6.1 Extensiones del modelo justificadas en la Segunda parte

| # | Extensión | Justificación |
|---|---|---|
| E1 | `EstadoInscripcion` con **VALIDADA** y **CONFIRMADA** (8 valores) | Las usan el DS01 (mensajes 18 y 65) y el DE01. En el CU-05 corregido, Aprobada significa "validaciones cumplidas" y la confirmación del estudiante corresponde a Confirmada |
| E2 | "EN CURSO" se escribe **EN_CURSO** | Un identificador no admite espacios; el significado no cambia |
| E3 | `EstadoSolicitud` con **EMITIDO** | Lo usa el DE03; el comprobante recorre SOLICITADO → EMITIDO → ENTREGADO |
| E4 | `Usuario.estaActivo():boolean` | La usa el DE03; `validarEstudianteHabilitado` la usa en el paso 3 |
| E5 | `validarRequisitosDeInscripcion()` se detalla en `validarEstudianteHabilitado`, `validarCarreraDeEstudiante` y `buscarMaterias` | Así lo modela el DS01. El método del diagrama se conserva y compone esas validaciones |
| E6 | `seleccionarMateria` y `seleccionarComision` son manejadores del Form | En el DS01 son eventos del actor hacia el Form (mensajes 21 y 22). En Estudiante quedan como métodos fuera de alcance |

### 6.2 Arquitectura y contratos entre capas

| # | Detalle | Justificación |
|---|---|---|
| D1 | `FormInscripcion` y `ControladorInscripcion` no figuran en el diagrama de clases | Son las clases de análisis <<boundary>> y <<control>> del DS01 (patrón BCE), no clases del dominio |
| D2 | Los métodos del controlador figuran como `:void` en el DS01, pero devuelven el valor de la flecha punteada como objeto plano (mensajes 11, 16, 19, 28, 38, 43, 50, 53, 60, 70, 76 y 87) | Es la forma de llevar a código el retorno dibujado en el DS01 |
| D3 | La vista recibe objetos planos y congelados (`mapeador.js`) y devuelve referencias planas (`{legajo}`, `{idMateria}`, `{idComision}`, `{idInscripcion}`); el controlador las resuelve a sus entidades | La vista no puede ejecutar lógica de negocio, y las llamadas a las entidades usan exactamente las firmas del DS01 |
| D4 | El retorno del mensaje 19 es `{materias, ins}` | El Form necesita `ins` para el mensaje 24 (A6) |
| D5 | **Un `ControladorInscripcion` por trámite** (una Inscripción cada uno) y uno aparte para la sesión | El DS01 muestra la interacción de una Inscripción, y `confirmarInscripcion()` no recibe parámetros |
| D6 | Con varias materias, el Form repite el flujo desde el mensaje 2 por cada materia marcada. Las validaciones de los pasos 3 y 4 se repiten y dan el mismo resultado. Hay un único "Confirmar solicitud" | Nota del DS01 ("los pasos 5 a 12 se repiten por cada una") y la maqueta de pasos 2 a 6 |
| D7 | `Estudiante.confirmarInscripcion()` toma el **primer trámite en APROBADA**. El Form confirma en ese orden y cada controlador verifica, antes de delegar, que sea el suyo | El método no recibe parámetros, como en el DS01 |
| D8 | Reintentar después de RECHAZADA es un trámite nuevo, con una Inscripción nueva | RECHAZADA es un estado final del DE01 |
| D9 | `descartarTramiteEnCurso()`: al salir a mitad del trámite se cancela lo que quedó VALIDADA (camino de A6) o APROBADA (camino de A11) | Ninguna Inscripción queda abierta; usa solo transiciones del DE01 |

### 6.3 Dentro de las entidades

| # | Detalle | Justificación |
|---|---|---|
| D10 | `Estudiante` recuerda sus trámites `{ins, mat, com}` | Inscripción no se relaciona con Comisión en el diagrama; la comisión elegida hace falta en los mensajes 66, 72, 78 y 81 |
| D11 | `Estudiante` guarda las materias del plan recibidas en el mensaje 3 | `buscarMaterias()` (mensaje 13) no recibe parámetros |
| D12 | `Estudiante` guarda las referencias a sus calificaciones | No hay relación Estudiante–Calificación; hace falta para `consultarHistorialAcademico()` |
| D13 | `Comision` guarda la lista de estudiantes registrados con `agregarEstudiante(est)` | No hay relación Comisión–Estudiante; la necesitan `agregarEstudiante` y `estaInscripto` |
| D14 | `Comision.estaInscripto(est)` revisa **todas las comisiones de su materia** | Regla del CU: "inscripto en alguna comisión de esa materia en el período vigente" |
| D15 | `PERIODO_VIGENTE = "2C 2026"`: todas las comisiones cargadas son de ese período | Ninguna clase tiene un atributo de período |
| D16 | Las materias del plan son las de la Carrera (Carrera ◆ Materia); `PlanDeEstudio.agregarMaterias()` controla el límite | PlanDeEstudio no se relaciona con Materia en el diagrama |
| D17 | `car` del mensaje 8 es la carrera del estudiante; la validación exige que esté activa y que el estudiante pertenezca a ella | Cumple "materia perteneciente a la carrera", junto con la oferta filtrada por plan |
| D18 | Habilitado = `estaActivo()` | La documentación del paso 3 no está modelada |
| D19 | `buscarMaterias()` devuelve las materias activas del plan. Cuáles tienen comisiones abiertas se lee de cada Materia: si ninguna tiene, es A4; si se elige una sin comisiones, es A5 | Nota actualizada del mensaje 13 del DS01 |
| D20 | La Inscripción nace en EN_CURSO dentro de `crear(fecha)` | Es la transición inicial del DE01; el DS01 no muestra `cambiarEstado` en el mensaje 4 |
| D21 | La Materia se asocia a la Inscripción en el mensaje 32; en EN_CURSO y VALIDADA todavía no tiene materia | La Inscripción se crea antes de elegir la materia (mensajes 3 y 4) |
| D22 | `Inscripcion.cambiarEstado()` valida contra `TransicionesInscripcion`; la Inscripción guarda **solo su estado actual**, sin historial | DE01 |
| D23 | Titular = docente de la primera Clase de la comisión | Comisión ◆ Clase ── Docente; el diagrama no tiene el concepto de "titular" |
| D24 | La etiqueta `INF_GE_1` es un dato de presentación; el identificador sigue siendo `idComision` (int) | Maquetas aprobadas |
| D25 | Horario = Turno + Día/s | Igual que las maquetas; el turno funciona como franja horaria |
| D26 | `generarCertificado(est, car, mat)` define el tipo (INSCRIPCION si recibe una materia) y el destinatario "A quien corresponda", y registra la solicitud en Estudiante y Carrera | `crear(fecha)` no recibe el tipo; el valor por defecto sale del flujo A7.1 de CU-10 |
| D27 | `descargar()` registra la entrega (ENTREGADO); el archivo HTML lo arma la vista con esos datos | El modelo no toca el navegador. "Descargar certificado" baja **un comprobante único por lote** |
| D28 | "Ver correlatividades": el mapeador marca cada requisito como aprobado o no, con la misma regla que `esCorrelativaDe()` | `esCorrelativaDe()` devuelve solo un boolean; la vista solo dibuja |
| D29 | `Estudiante.consultarComisiones()` habilitado (RF12) | Lo usa "Consultar comisiones" de Trámites online, para que el controlador no haga lógica de dominio |
| D30 | Las inscripciones viven dentro de cada Estudiante; el repositorio no las guarda | Composición Estudiante ◆ Inscripción; así no hay mensajes fuera del DS01 |
| D31 | La inscripción previa de Lucas se arma con los mismos métodos del DS01 y recorre solo transiciones válidas | Datos semilla coherentes con el DE01 |
| D32 | Colecciones con prefijo `_` (extremos "N" de las relaciones) que solo completan los constructores, leídas con *getters* que devuelven copias; atributos privados `#` para el estado de Inscripción y Solicitud, `cupoDisponible`, los estudiantes de la Comisión y los trámites y calificaciones del Estudiante | Encapsulamiento: solo se modifican por los métodos del diagrama |
| D33 | Los métodos del diagrama que CU-05 no usa existen, pero llaman a `fueraDelAlcanceDelMVP()` | Respetan el diagrama sin implementar otros casos de uso |
| D34 | Login simulado: `iniciarSesion()` sin contraseña; no se cargan contraseñas | El enunciado pide autenticación simulada (en producción, RNF06) |

### 6.4 Vista

| # | Detalle | Justificación |
|---|---|---|
| D35 | Los automensajes tienen las firmas del DS01, con un parámetro. `mostrarResumen(ins)` y `mostrarComprobante(ins)` se llaman **una vez por trámite** y cada llamada suma su parte a la misma pantalla. Los datos extra de `mostrarMotivo(motivo)` salen del estado del Form | Firmas del DS01 |
| D36 | `mostrarOferta` corre solo en el mensaje 20; para redibujar al marcar materias se usa el privado `#pintarOferta` | Trazabilidad: cada llamada a `mostrarOferta` es un mensaje 20 |
| D37 | Aviso de 1 s "Estamos validando tu solicitud…" con **Pendiente**, antes de llamar al controlador; igual con "Estamos registrando tu inscripción…" y **Confirmada** | PENDIENTE y CONFIRMADA son transitorios y el enunciado pide mostrar Pendiente |
| D38 | Pantalla final según el resultado: todas bien → éxito (paso 12); un solo rechazo → pantalla del motivo; si no → columnas lado a lado | Maquetas del paso 12, de A8/A12 y del A8 mixto |
| D39 | A4 bis "Ver detalle" de la materia y A5 son solo de vista, sin mensajes del dominio | Usan los datos de la oferta ya recibida |
| D40 | Etiquetas de color con el estado actual en la oferta, el resumen, los resultados, los avisos y las consultas | El enunciado pide mostrar los estados; sin historial |
| D41 | Pantallas "Estado de inscripciones" y "Comisiones", avisos de "fuera de alcance" y menú del avatar con "Cambiar de estudiante" | No tenían maqueta; usan el mismo estilo |
| D42 | Textos: los de las maquetas, palabra por palabra. El de SIN_OFERTA (A4) lo definió el equipo; el de la maqueta A4 original quedó para el A5 | La maqueta A4 habla de "la materia", que corresponde al A5 |

### 6.5 Utilidades de la presentación (NO son parte del CU)

| Utilidad | Qué hace |
|---|---|
| Botón **Demo** (abajo a la izquierda) | Guía de escenarios. Tiene borde punteado y la aclaración "No forman parte del caso de uso" |
| **"Simular que otro estudiante ocupa el último cupo (A12)"** | Solo en el resumen. Llama a `Comision.restarCupo()`, el método que ya existe, hasta dejar en 0 la comisión elegida, para mostrar el A12 con el cupo agotado (mensajes 66 a 71). No cambia nada del CU |
| **"Reiniciar datos"** | Vuelve a llamar a `crearBaseDeDatos()` y muestra el ingreso |

---

## 7. Pruebas realizadas

- **Navegador (Chrome con Playwright, archivo local y sin internet):** 31 comprobaciones de punta a punta. Cubren los 4 escenarios en el orden de la demo, el mixto de 2 y de 3 materias, A3, A5, A6, A11, A12, la descarga, los detalles, las consultas y la vista de celular. Sin errores en la consola.
- **Traza de métodos:** se registró cada llamada en el navegador en todos los escenarios. Las secuencias coinciden con el DS01.
- **Firmas:** las 36 firmas del DS01 existen en la clase indicada y con la cantidad de parámetros correcta. El enum tiene los 8 estados del DE01, y las 54 transiciones fuera del DE01 se rechazan con un error.
- **Modelo, datos y controlador (Node):** 55 + 17 + 28 comprobaciones, más el A4 forzado.
