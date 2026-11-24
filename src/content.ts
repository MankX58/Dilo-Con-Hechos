import type { LogroCriterio } from "./engine/rubric";

export type Tramo = [texto: string, tipo: "" | "v" | "q" | "d" | "r"];

export interface Perfil {
  /** Cómo lo diría cualquier persona: «En un negocio o vendiendo». */
  label: string;
  /** Ejemplos concretos que ayudan a reconocerse en la opción. */
  ejemplos: string[];
  /** Pregunta que abre la caja de texto cuando se elige esta opción. */
  pregunta: string;
  /** Comienzos de frase para quien no sabe cómo arrancar (nunca la respuesta completa). */
  arranques: string[];
  /** Título que aparece en la hoja de vida sobre el logro. */
  rol: string;
  tarea: string;
  logro: Tramo[];
  preguntas: Record<LogroCriterio, string>;
}

export const PERFILES = {
  ventas: {
    label: "En un negocio o vendiendo", ejemplos: ["Tienda", "Almacén", "Puesto en la calle", "Domicilios"], rol: "Ventas y atención al cliente",
    pregunta: "¿Qué hacías en ese negocio?", arranques: ["Atendía…", "Vendía…", "Cobraba…", "Ayudaba en el negocio de…"],
    tarea: "Atendía clientes en la tienda de mi tía.",
    logro: [["Atendí", "v"], [" ", ""], ["a unos 40 clientes al día", "d"], [" ", ""], ["en la tienda de mi familia en Bello", "q"], [" y ", ""], ["cerré el cuadre de caja sin faltantes durante 2 años", "r"], [".", ""]],
    preguntas: { verbo: "¿Qué hacías exactamente: atendías, vendías, cobrabas, organizabas el inventario?", concreto: "¿Dónde era y para quién trabajabas?", dato: "¿Cuántos clientes atendías en un día normal? ¿Cuánto tiempo trabajaste ahí?", resultado: "¿Qué salía bien gracias a ti? ¿La caja cuadraba, los clientes volvían, se vendía más?" },
  },
  cuidado: {
    label: "Cuidando a alguien o en la casa", ejemplos: ["Niños", "Abuelos", "Una persona enferma", "Oficios de la casa"], rol: "Cuidado de personas",
    pregunta: "¿A quién cuidabas o qué hacías en la casa?", arranques: ["Cuidaba a…", "Me encargaba de…", "Acompañaba a…", "Preparaba…"],
    tarea: "Cuidaba a mi abuela.",
    logro: [["Organicé", "v"], [" ", ""], ["los medicamentos y las citas médicas de un familiar adulto mayor", "q"], [" ", ""], ["durante 3 años, con 4 tomas diarias", "d"], [", ", ""], ["sin olvidar ninguna dosis", "r"], [".", ""]],
    preguntas: { verbo: "¿Qué hacías: organizabas horarios, preparabas comidas, acompañabas a citas?", concreto: "¿A quién cuidabas y qué tareas eran tuyas?", dato: "¿Cuánto tiempo lo hiciste? ¿Cuántas personas o cuántas tareas al día?", resultado: "¿Qué mejoró o se mantuvo gracias a ti: la salud, la puntualidad, el orden?" },
  },
  comunidad: {
    label: "En mi barrio, iglesia o un grupo", ejemplos: ["Junta de Acción Comunal", "Iglesia", "Grupo juvenil", "Voluntariado"], rol: "Trabajo comunitario",
    pregunta: "¿Qué hacías en ese grupo?", arranques: ["Participaba en…", "Ayudé a organizar…", "Colaboraba con…", "Recogía…"],
    tarea: "Ayudaba en la junta de acción comunal.",
    logro: [["Coordiné", "v"], [" con la Junta de Acción Comunal ", ""], ["3 jornadas", "d"], [" ", ""], ["de limpieza en mi barrio", "q"], [", ", ""], ["logrando que participaran 60 vecinos", "r"], [".", ""]],
    preguntas: { verbo: "¿Qué hiciste tú: convocaste, organizaste, enseñaste, recogiste fondos?", concreto: "¿Con qué grupo u organización, y en qué barrio o vereda?", dato: "¿Cuántas personas participaron? ¿Cuántas actividades hicieron?", resultado: "¿Qué cambió en el barrio o en el grupo gracias a esa actividad?" },
  },
  estudio: {
    label: "En el colegio, el SENA o un curso", ejemplos: ["Proyecto", "Feria", "Práctica", "Curso"], rol: "Proyecto de estudio",
    pregunta: "¿Qué hiciste en ese proyecto o curso?", arranques: ["En el colegio hice…", "Con mi grupo organizamos…", "En el SENA aprendí a…", "Presenté…"],
    tarea: "Hice un proyecto en el colegio.",
    logro: [["Organicé", "v"], [" con 3 compañeros ", ""], ["una feria de emprendimiento en el colegio", "q"], [", donde ", ""], ["12 grupos vendieron sus productos", "d"], [" y ", ""], ["recaudamos $300.000 para la salida pedagógica", "r"], [".", ""]],
    preguntas: { verbo: "¿Cuál fue tu papel: diseñaste, presentaste, investigaste, coordinaste?", concreto: "¿Qué proyecto era y en qué institución?", dato: "¿Cuántas personas había en el equipo? ¿Cuánto duró? ¿Cuánto dinero o cuántos asistentes?", resultado: "¿Qué se logró: una nota, un premio, un producto terminado, dinero recogido?" },
  },
  campo: {
    label: "En el campo o en un oficio", ejemplos: ["Finca", "Cosecha", "Construcción", "Taller"], rol: "Trabajo de campo y oficios",
    pregunta: "¿Qué hacías en ese trabajo?", arranques: ["Trabajé en la finca…", "Recogía…", "Ayudaba con…", "Arreglaba…"],
    tarea: "Trabajé en la cosecha de café.",
    logro: [["Recolecté", "v"], [" ", ""], ["en promedio 80 kilos de café al día", "d"], [" durante 2 cosechas ", ""], ["en una finca de Ciudad Bolívar", "q"], [", ", ""], ["cumpliendo siempre la meta semanal del grupo", "r"], [".", ""]],
    preguntas: { verbo: "¿Qué hacías: recolectabas, sembrabas, empacabas, llevabas registros?", concreto: "¿Qué cultivo u oficio era, y en qué municipio o vereda?", dato: "¿Cuántos kilos, bultos, piezas o días? ¿Por cuánto tiempo?", resultado: "¿Cumpliste metas? ¿Mejoró la calidad o se perdió menos?" },
  },
  deporte: {
    label: "En el deporte, el arte o la música", ejemplos: ["Equipo del barrio", "Danza", "Banda", "Teatro"], rol: "Deporte y cultura",
    pregunta: "¿Qué hacías en ese equipo o grupo?", arranques: ["Jugaba en…", "Entrenaba…", "Me presenté en…", "Enseñaba a…"],
    tarea: "Jugaba en el equipo de fútbol del barrio.",
    logro: [["Entrené", "v"], [" ", ""], ["3 veces por semana durante 2 años", "d"], [" ", ""], ["con el equipo de fútbol del barrio", "q"], [" y, como capitán, organicé los turnos de 18 jugadores ", ""], ["para que nadie se quedara sin jugar", "r"], [".", ""]],
    preguntas: { verbo: "¿Qué hacías tú: entrenabas, organizabas, enseñabas, presentabas?", concreto: "¿Con qué grupo, en qué lugar y qué papel tenías?", dato: "¿Cuántas veces por semana, cuántas personas o cuánto tiempo?", resultado: "¿Qué lograron: un torneo, una presentación, que el grupo se mantuviera?" },
  },
  otro: {
    label: "Otra cosa que hice", ejemplos: ["Un emprendimiento propio", "Eventos de la familia", "Cualquier actividad"], rol: "Otras experiencias",
    pregunta: "¿Qué hacías?", arranques: ["Hice…", "Me encargaba de…", "Ayudaba a…", "Organicé…"],
    tarea: "Ayudaba a organizar las reuniones de la familia.",
    logro: [["Organicé", "v"], [" ", ""], ["4 reuniones familiares de unas 30 personas", "d"], [", ", ""], ["coordinando la comida y el presupuesto", "q"], [", y ", ""], ["logré que todo saliera sin pasarnos de lo que teníamos", "r"], [".", ""]],
    preguntas: { verbo: "¿Qué hacías tú exactamente: organizabas, preparabas, vendías, enseñabas?", concreto: "¿Dónde era, con quién o para quién?", dato: "¿Cuántas veces, cuántas personas o por cuánto tiempo?", resultado: "¿Qué salió bien gracias a ti?" },
  },
} satisfies Record<string, Perfil>;
export type PerfilId = keyof typeof PERFILES;

export type Situacion = "parecido" | "otra" | "ninguna";
export const SITUACIONES: { id: Situacion; titulo: string; detalle: string }[] = [
  { id: "parecido", titulo: "Sí, en algo parecido", detalle: "Ya hice tareas como las de esta vacante." },
  { id: "otra", titulo: "He trabajado, pero en otra cosa", detalle: "Tengo experiencia, aunque no en este puesto." },
  { id: "ninguna", titulo: "Todavía no he trabajado", detalle: "Este sería mi primer empleo." },
];
/** Orden de perfiles: quien no ha trabajado ve primero experiencias que no son empleos. */
export const ordenPerfiles = (s: Situacion | null): PerfilId[] =>
  s === "ninguna" ? ["estudio", "cuidado", "comunidad", "deporte", "ventas", "campo", "otro"] : ["ventas", "campo", "cuidado", "comunidad", "estudio", "deporte", "otro"];

/** Ubica una experiencia (por ejemplo, la de una hoja de vida subida) en el tipo más probable. La persona puede cambiarlo. */
export function adivinarOrigen(texto: string): PerfilId {
  const t = texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const reglas: [PerfilId, RegExp][] = [
    ["cuidado", /\b(cuid|ninera|nino|abuel|enferm|adulto mayor|oficios de la casa|hogar|aseo de casa)/],
    ["campo", /\b(finca|cosech|cultiv|sembr|ganad|construcc|obra|mamposter|taller|mecanic|soldad|carpinter|electric|plomer|recolect)/],
    ["estudio", /\b(colegio|sena|universidad|practica|pasantia|proyecto de grado|feria|semillero|curso|estudiante)/],
    ["comunidad", /\b(junta|iglesia|voluntari|comunidad|fundacion|grupo juvenil|parroquia|lider comunitari)/],
    ["deporte", /\b(equipo|futbol|deport|entren|danza|banda|teatro|musica|arte)/],
    ["ventas", /\b(tienda|venta|vend|cliente|almacen|negocio|caja|cajer|bodega|mesero|restaurante|panaderia|supermercado|empresa|distribuidora|auxiliar|asesor|domicili|miscelanea|droguer|mercanc|pedido)/],
  ];
  return reglas.find(([, re]) => re.test(t))?.[0] ?? "otro";
}

export const SECTORES = {
  comercio: "Comercio y ventas",
  logistica: "Logística y transporte",
  industria: "Industria y producción",
  servicios: "Atención y servicios",
  comida: "Comida y hotelería",
  campo: "Campo",
  obra: "Construcción y mantenimiento",
  cuidado: "Cuidado de personas",
  oficina: "Oficina y tecnología",
} as const;
export type Sector = keyof typeof SECTORES;

export interface Vacante {
  titulo: string; lugar: string; sector: Sector; busca: string[]; pregunta: string;
  /** raíces sin tildes para reconocer que una respuesta habla de la vacante */
  claves: string[];
}
/** Vacantes de práctica: cargos típicos de primer empleo en las subregiones de Antioquia. No son ofertas reales.
 *  Sus preguntas no deben repetir las de la prueba final ni la pregunta base: lo verifica rubric.test.ts. */
export const VACANTES = {
  vendedor: { titulo: "Vendedor/a de mostrador", lugar: "Almacén de ropa · Centro de Medellín", sector: "comercio", busca: ["Atención al cliente", "Metas de venta", "Manejo de inventario"], pregunta: "Cuéntame de una vez que convenciste a alguien o lograste una venta difícil.", claves: ["venta", "vend", "client", "atend", "meta", "convenc", "inventari", "producto"] },
  cajero: { titulo: "Cajero/a", lugar: "Supermercado · Bello", sector: "comercio", busca: ["Manejo de dinero", "Cuadre de caja", "Rapidez con orden"], pregunta: "Cuéntame de una vez que tuviste que manejar dinero o cuentas y todo tenía que cuadrar.", claves: ["dinero", "plata", "caja", "cuadr", "cuenta", "cobr", "pago", "rapid", "orden"] },
  mercaderista: { titulo: "Mercaderista o impulsador/a", lugar: "Cadena de supermercados · Envigado", sector: "comercio", busca: ["Exhibición de productos", "Rotación de inventario", "Trato con clientes"], pregunta: "Cuéntame de una vez que lograste que algo se viera mejor o se vendiera más por cómo lo organizaste.", claves: ["exhib", "producto", "orden", "organiz", "vend", "rot", "client", "gondol", "estant"] },
  bodega: { titulo: "Auxiliar de bodega", lugar: "Centro logístico · Itagüí", sector: "logistica", busca: ["Orden", "Inventarios", "Cargue y despacho"], pregunta: "Cuéntame de una vez que organizaste algo que estaba en desorden o encontraste un error a tiempo.", claves: ["orden", "organiz", "inventari", "bodega", "carg", "despach", "cont", "error"] },
  domiciliario: { titulo: "Domiciliario/a en moto o bicicleta", lugar: "Plataforma de domicilios · Valle de Aburrá", sector: "logistica", busca: ["Entregas a tiempo", "Conocer la ciudad", "Trato amable"], pregunta: "Cuéntame de una vez que cumpliste con una entrega o un horario aunque algo se complicó en el camino.", claves: ["entreg", "pedido", "ruta", "direcc", "tiempo", "hora", "client", "moto", "bici", "domicil"] },
  carga: { titulo: "Auxiliar de carga aérea", lugar: "Terminal de carga · Rionegro", sector: "logistica", busca: ["Cargue y descargue", "Seguir procedimientos", "Trabajo por turnos"], pregunta: "Cuéntame de una vez que seguiste un procedimiento al pie de la letra para que nada saliera mal.", claves: ["carg", "descarg", "procedim", "paso", "turno", "revis", "etiquet", "cuidado", "segur"] },
  confeccion: { titulo: "Operario/a de confección", lugar: "Planta textil · Itagüí", sector: "industria", busca: ["Precisión", "Ritmo de producción", "Calidad"], pregunta: "Cuéntame de una vez que hiciste un trabajo que exigía mucha precisión o cuidado con el detalle.", claves: ["precis", "detalle", "cuidado", "calidad", "cos", "maquina", "ritmo", "produc"] },
  produccion: { titulo: "Operario/a de producción", lugar: "Planta de lácteos · San Pedro de los Milagros", sector: "industria", busca: ["Seguir instrucciones", "Control de calidad", "Higiene"], pregunta: "Cuéntame de una vez que tuviste que hacer la misma tarea muchas veces sin bajar la calidad.", claves: ["instruc", "calidad", "proceso", "produc", "maquina", "higien", "revis", "empac", "leche"] },
  servicio: { titulo: "Agente de servicio al cliente", lugar: "Contact center · Medellín", sector: "servicios", busca: ["Comunicación clara", "Paciencia", "Solución de quejas"], pregunta: "Cuéntame de una vez que tuviste que explicarle algo difícil a alguien hasta que lo entendió.", claves: ["explic", "client", "escuch", "pacien", "queja", "comunic", "resolv", "habl"] },
  recepcion: { titulo: "Recepcionista de hotel", lugar: "Hotel · Santa Fe de Antioquia", sector: "servicios", busca: ["Atención a huéspedes", "Manejo de reservas", "Organización"], pregunta: "Cuéntame de una vez que atendiste a varias personas a la vez sin que nadie quedara mal atendido.", claves: ["atend", "huesped", "reserv", "agenda", "organiz", "llamad", "recib", "client", "turist"] },
  aseo: { titulo: "Auxiliar de servicios generales", lugar: "Centro comercial · Sabaneta", sector: "servicios", busca: ["Limpieza y orden", "Cumplir horarios", "Manejo seguro de productos"], pregunta: "Cuéntame de una vez que mantuviste un lugar limpio y ordenado aunque había mucha gente o poco tiempo.", claves: ["limpi", "aseo", "orden", "horario", "product", "segur", "espacio", "barr", "trapea"] },
  guia: { titulo: "Guía de turismo local", lugar: "Turismo comunitario · Guatapé", sector: "servicios", busca: ["Contar la historia del lugar", "Atención a visitantes", "Manejo de grupos"], pregunta: "Cuéntame de una vez que le explicaste o le mostraste algo a un grupo de personas.", claves: ["grupo", "visit", "turist", "explic", "histori", "guia", "recorr", "mostr", "present"] },
  cocina: { titulo: "Auxiliar de cocina", lugar: "Restaurante · Rionegro", sector: "comida", busca: ["Higiene", "Rapidez", "Trabajo bajo presión"], pregunta: "Cuéntame de una vez que cuidaste la calidad o la limpieza de algo que preparaste o entregaste.", claves: ["limpi", "higien", "cocin", "prepar", "rapid", "calidad", "presion", "aliment"] },
  mesero: { titulo: "Mesero/a", lugar: "Restaurante campestre · San Jerónimo", sector: "comida", busca: ["Atención en mesa", "Memoria de pedidos", "Manejo de cuentas"], pregunta: "Cuéntame de una vez que lograste que alguien se fuera contento después de atenderlo.", claves: ["mesa", "pedido", "atend", "client", "cuenta", "cobr", "record", "servi", "contento"] },
  panaderia: { titulo: "Auxiliar de panadería", lugar: "Panadería de barrio · Copacabana", sector: "comida", busca: ["Horarios de madrugada", "Higiene", "Atención en mostrador"], pregunta: "Cuéntame de una vez que cumpliste un horario exigente o madrugaste durante varias semanas seguidas.", claves: ["horario", "madrug", "temprano", "horne", "prepar", "higien", "mostrador", "client", "semana"] },
  cafe: { titulo: "Recolector/a de café", lugar: "Finca cafetera · Andes", sector: "campo", busca: ["Ritmo de recolección", "Selección del grano maduro", "Resistencia al aire libre"], pregunta: "Cuéntame de una vez que trabajaste duro varios días seguidos para cumplir una meta.", claves: ["recog", "recolect", "kilo", "grano", "cosech", "meta", "cafe", "finca", "maduro"] },
  flores: { titulo: "Operario/a de cultivo de flores", lugar: "Cultivo de flores · La Ceja", sector: "campo", busca: ["Cuidado con el detalle", "Clasificación del producto", "Ritmo constante"], pregunta: "Cuéntame de una vez que clasificaste u organizaste muchas cosas con cuidado para que quedaran bien.", claves: ["flor", "clasific", "cort", "cuidado", "detalle", "empac", "calidad", "ritmo", "tallo"] },
  obra: { titulo: "Ayudante de construcción", lugar: "Obra de vivienda · Apartadó", sector: "obra", busca: ["Seguridad en obra", "Esfuerzo físico", "Seguir indicaciones"], pregunta: "Cuéntame de una vez que cuidaste tu seguridad o la de otras personas mientras hacías un trabajo.", claves: ["segur", "obra", "carg", "mezcl", "herramient", "maestro", "cuid", "proteg", "casco"] },
  mantenimiento: { titulo: "Auxiliar de mantenimiento", lugar: "Conjunto residencial · Envigado", sector: "obra", busca: ["Reparaciones básicas", "Revisión de instalaciones", "Atención a residentes"], pregunta: "Cuéntame de una vez que arreglaste algo que estaba dañado o encontraste una falla a tiempo.", claves: ["arregl", "repar", "dan", "falla", "revis", "herramient", "instal", "manten", "pint"] },
  cuidador: { titulo: "Cuidador/a de adulto mayor", lugar: "Hogar gerontológico · Caucasia", sector: "cuidado", busca: ["Paciencia", "Horarios de medicamentos", "Acompañamiento"], pregunta: "Cuéntame de una vez que cuidaste a alguien que necesitaba ayuda y cómo lo hiciste.", claves: ["cuid", "acompan", "medic", "pacien", "abuel", "salud", "ayud", "cita"] },
  ruta: { titulo: "Monitor/a de ruta escolar", lugar: "Transporte escolar · Marinilla", sector: "cuidado", busca: ["Cuidado de niños y niñas", "Puntualidad en los recorridos", "Comunicación con las familias"], pregunta: "Cuéntame de una vez que estuviste a cargo de niños o niñas y algo no salió como esperabas.", claves: ["nin", "cuid", "ruta", "famil", "padre", "segur", "recorr", "colegio", "hora"] },
  administrativo: { titulo: "Auxiliar administrativo/a", lugar: "Empresa de servicios · Medellín", sector: "oficina", busca: ["Excel y correo", "Archivo y orden", "Atención telefónica"], pregunta: "Cuéntame de una vez que organizaste información, papeles o cuentas para que otras personas los encontraran fácil.", claves: ["excel", "archiv", "document", "organiz", "correo", "llamad", "orden", "informac", "cuent", "tabla"] },
  soporte: { titulo: "Auxiliar de soporte técnico", lugar: "Mesa de ayuda · Medellín", sector: "oficina", busca: ["Resolver fallas de computador", "Explicar con paciencia", "Registro de casos"], pregunta: "Cuéntame de una vez que solucionaste un problema con un celular, un computador o una aplicación.", claves: ["comput", "celular", "aplicac", "program", "instal", "configur", "explic", "solucion", "internet", "wifi"] },
  redes: { titulo: "Auxiliar de redes sociales", lugar: "Tienda de ropa en línea · Medellín", sector: "oficina", busca: ["Fotos y videos", "Publicaciones en redes", "Ventas por WhatsApp"], pregunta: "Cuéntame de una vez que publicaste algo en redes que tuvo buena respuesta o ayudó a vender.", claves: ["red", "instagram", "tiktok", "foto", "video", "public", "seguidor", "vend", "whatsapp", "contenido"] },
} satisfies Record<string, Vacante>;
export type VacanteId = keyof typeof VACANTES | "otra";

/** Para quien no encuentra su cargo: escribe el nombre y se usan habilidades que sirven en casi cualquier empleo. */
export const vacanteOtra = (titulo: string): Vacante => ({
  titulo: titulo.trim() || "Otra vacante", lugar: "La que tú elijas", sector: "servicios",
  busca: ["Aprender rápido", "Cumplir con lo acordado", "Trato con las personas"],
  pregunta: "Cuéntame de una vez que hiciste algo bien hecho aunque nadie te estaba revisando.",
  claves: ["aprend", "cumpl", "client", "person", "atend", "organiz", "tiempo", "horario", "ayud"],
});
export const vacanteDe = (id: VacanteId | null, otra = ""): Vacante | null =>
  id === "otra" ? vacanteOtra(otra) : id ? VACANTES[id] : null;

export const PREGUNTA_BASE = "Cuéntame de una vez que resolviste un problema.";

/** La pregunta que más teme quien no ha trabajado en el cargo, y cómo responderla: el puente. */
export const preguntaPuente = (titulo: string) => `No has trabajado como ${titulo.toLowerCase()}. ¿Por qué deberíamos darte la oportunidad?`;
export const PUENTE_EJEMPLO: { parte: string; idea: string; texto: string }[] = [
  { parte: "Reconoce", idea: "Dilo con honestidad, sin disculparte.", texto: "Todavía no he trabajado como cajera." },
  { parte: "Conecta", idea: "Una experiencia tuya, con un hecho, que muestre lo que busca la vacante.", texto: "Pero durante 2 años ayudé en la tienda de mi tía: cobraba a unos 40 clientes los sábados y la caja siempre cuadró." },
  { parte: "Compromete", idea: "Cómo vas a aprender, con una prueba de que aprendes rápido.", texto: "Aprendo rápido: en una semana me aprendí los precios de toda la tienda, y quiero hacer lo mismo aquí." },
];

export const STAR_EJEMPLO: { parte: "S" | "T" | "A" | "R"; nombre: string; texto: string }[] = [
  { parte: "S", nombre: "Situación", texto: "Un sábado en la tienda de mi tía se dañó el datáfono y había fila." },
  { parte: "T", nombre: "Tarea", texto: "Tenía que seguir cobrando sin perder ventas." },
  { parte: "A", nombre: "Acción", texto: "Puse un letrero, ofrecí pago por transferencia con el número del negocio y anoté cada venta en un cuaderno." },
  { parte: "R", nombre: "Resultado", texto: "Ese día no se fue ningún cliente sin pagar y el cuadre de caja cerró completo." },
];

export interface Caso { nombre: string; texto: string; pregunta: string }
/** Prueba final: casos y preguntas que no aparecen en la práctica. */
export const CASOS: Caso[] = [
  { nombre: "Valentina", texto: "Valentina tiene 19 años y vive en Rionegro. Durante 8 meses repartió domicilios en bicicleta para una panadería del barrio, unos 25 pedidos por día. Llevaba una lista en el celular para no confundir direcciones y casi nunca hubo reclamos.", pregunta: "Háblame de una vez que tuviste que aprender algo nuevo rápido." },
  { nombre: "Andrés", texto: "Andrés tiene 23 años y vive en Apartadó. Trabajó un año en la empacadora de una finca bananera. Propuso ordenar las cajas por tamaño al empezar el turno y su grupo pasó de empacar 300 a 360 cajas por día.", pregunta: "Cuéntame de una situación difícil con un cliente, un jefe o un compañero, y qué hiciste." },
  { nombre: "Luz Mery", texto: "Luz Mery tiene 45 años y vive en Manrique, Medellín. Hace 3 años vende almuerzos desde su casa: recibe los pedidos por WhatsApp y entrega unos 30 almuerzos diarios a los trabajadores de una obra cercana, que le siguen comprando cada semana.", pregunta: "Háblame de una vez que cometiste un error y cómo lo corregiste." },
];
