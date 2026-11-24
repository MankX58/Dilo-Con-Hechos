// Leer una hoja de vida en el navegador. El archivo nunca sale del dispositivo; a la IA solo va texto sin datos de contacto.

/** Extrae el texto de un PDF, un Word (.docx) o un texto plano. Las librerías se cargan solo cuando alguien sube un archivo. */
export async function textoDeArchivo(file: File): Promise<string> {
  const nombre = file.name.toLowerCase();
  if (file.size > 8 * 1024 * 1024) throw new Error("El archivo pesa más de 8 MB.");
  if (nombre.endsWith(".pdf") || file.type === "application/pdf") {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const paginas: string[] = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 6); i++) {
      const contenido = await (await pdf.getPage(i)).getTextContent();
      paginas.push(contenido.items.map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : "")).join(""));
    }
    return limpiar(paginas.join("\n"));
  }
  if (nombre.endsWith(".docx")) {
    const mammoth = (await import("mammoth/mammoth.browser.js")).default;
    return limpiar((await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value);
  }
  if (nombre.endsWith(".txt") || file.type.startsWith("text/")) return limpiar(await file.text());
  throw new Error("Ese formato no se puede leer. Usa PDF, Word (.docx) o texto, o pega el texto.");
}

const limpiar = (t: string) => t.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

const CORREO = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const TELEFONO = /(?:\+?57[\s-]?)?3\d{2}[\s-]?\d{3}[\s-]?\d{4}\b|\b\d{3}[\s-]\d{2}[\s-]\d{2}\b|\b604[\s-]?\d{3}[\s-]?\d{4}\b/g;
const DOCUMENTO = /\b(?:c\.?\s?c\.?|c[eé]dula|documento|ti|t\.i\.)?[\s:#nNoº.]*\d{1,3}(?:[.\s]?\d{3}){2,3}\b/gi;

/** Los mismos niveles que ofrece la hoja de vida final. */
export const NIVELES = ["Bachiller en curso", "Bachiller", "Técnico laboral", "Técnico (SENA u otra institución)", "Tecnólogo", "Universitario en curso", "Profesional"];
/** Lleva cualquier forma de escribir el nivel («Técnico en logística – SENA») a una opción de la lista. */
export function nivelDe(t: string): string {
  const x = t.toLowerCase();
  const curso = /en curso|cursando|actualmente|\(\s*\d+\s*(semestre|°|º)/.test(x);
  if (/profesional|universit|ingenier|licenciad|administrador|pregrado|abogad|contador/.test(x)) return curso ? "Universitario en curso" : "Profesional";
  if (/tecn[oó]log/.test(x)) return "Tecnólogo";
  if (/t[eé]cnico laboral|auxiliar en|t[eé]cnico en .*laboral/.test(x)) return "Técnico laboral";
  if (/t[eé]cnic/.test(x)) return "Técnico (SENA u otra institución)";
  if (/bachiller|secundaria|media acad|grado (11|once)|und[eé]cimo/.test(x)) return curso || /grado (9|10|noveno|d[eé]cimo)/.test(x) ? "Bachiller en curso" : "Bachiller";
  return "";
}

const MUNICIPIOS = ["Medellín", "Bello", "Itagüí", "Envigado", "Sabaneta", "La Estrella", "Caldas", "Copacabana", "Girardota", "Barbosa", "Rionegro", "Marinilla", "El Carmen de Viboral", "La Ceja", "Guarne", "El Retiro", "El Santuario", "Apartadó", "Turbo", "Carepa", "Chigorodó", "Necoclí", "Caucasia", "El Bagre", "Segovia", "Remedios", "Santa Fe de Antioquia", "Sopetrán", "San Jerónimo", "Sonsón", "Abejorral", "Yarumal", "Santa Rosa de Osos", "Puerto Berrío", "Puerto Nare", "Andes", "Jardín", "Ciudad Bolívar", "Urrao", "Amagá", "Fredonia", "Támesis", "Jericó", "San Pedro de los Milagros", "Don Matías", "Yolombó", "Cisneros", "Zaragoza", "Tarazá", "Cáceres"];
const sinTilde = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Seccion = "perfil" | "experiencia" | "formacion" | "cursos" | "habilidades" | "idiomas" | "referencias" | "personales" | "otra";
const TITULOS: [RegExp, Seccion][] = [
  [/^(perfil|resumen|sobre m[ií]|objetivo|presentaci[oó]n)/, "perfil"],
  [/^(experiencia|historia laboral|trayectoria|empleos)/, "experiencia"],
  [/^(cursos|certific|formaci[oó]n complementaria|capacitaci|diplomados)/, "cursos"],
  [/^(formaci[oó]n|educaci[oó]n|estudios|escolaridad)/, "formacion"],
  [/^(habilidades|competencias|conocimientos|destrezas|aptitudes|herramientas)/, "habilidades"],
  [/^(idiomas|lenguas)/, "idiomas"],
  [/^(referencias)/, "referencias"],
  [/^(datos personales|informaci[oó]n personal|contacto)/, "personales"],
  [/^(logros|voluntariado|intereses|otros|disponibilidad)/, "otra"],
];
const titulo = (l: string): Seccion | null => {
  if (l.length > 45) return null;
  const x = l.toLowerCase().replace(/[:.\s]+$/, "").trim();
  return TITULOS.find(([re]) => re.test(x))?.[1] ?? null;
};
const AÑO = /\b(19[6-9]\d|20[0-4]\d)\b/;
const FECHAS = /\(?\s*(?:(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*\.?\s*(?:de\s*)?)?(?:19|20)\d{2}\s*(?:[-–a]+|hasta)\s*(?:(?:(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*\.?\s*(?:de\s*)?)?(?:19|20)\d{2}|actual(?:mente)?|presente|hoy|la fecha)\s*\)?|\(?\s*(?:desde\s*)?(?:(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*\.?\s*(?:de\s*)?)?(?:19|20)\d{2}\s*\)?/i;
const corta = (l: string) => l.replace(/^[-–•*·]\s*/, "").trim();
const lista = (ls: string[]) => ls.flatMap((l) => corta(l).split(/\s*[,;•·|]\s*/)).map((x) => x.trim()).filter((x) => x.length > 1 && x.length < 60);

export interface DatosCv {
  nombre: string; correo: string; telefono: string; municipio: string; perfil: string;
  nivel: string; institucion: string; anio: string; cursos: string; habilidades: string[]; idiomas: string; disponibilidad: string; referencias: string;
  experiencias: { cargo: string; lugar: string; fechas: string; descripcion: string }[];
}

/** Todo lo que se puede leer sin IA, para que la persona no tenga que volver a escribirlo al final. */
export function datosLocales(texto: string): DatosCv {
  const lineas = texto.split("\n").map((l) => l.trim()).filter(Boolean);
  const secciones: Record<Seccion, string[]> = { perfil: [], experiencia: [], formacion: [], cursos: [], habilidades: [], idiomas: [], referencias: [], personales: [], otra: [] };
  let actual: Seccion = "personales";
  for (const l of lineas) {
    const t = titulo(l);
    if (t) { actual = t; const resto = l.split(":").slice(1).join(":").trim(); if (resto) secciones[t].push(resto); continue; }
    secciones[actual].push(l);
  }

  // Nombre: «Nombre: …» o la primera línea que solo tiene letras (2 a 5 palabras), sin «hoja de vida».
  const campo = (re: RegExp) => texto.match(re)?.[1]?.trim() ?? "";
  let nombre = campo(/nombres?(?: completo)?\s*:\s*([^\n]{4,60})/i);
  if (!nombre) {
    const l = lineas.slice(0, 5).map((x) => x.replace(/\b(hoja de vida|curr[ií]culum( vitae)?)\b/gi, "").trim())
      .find((x) => /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü\s.'-]+$/.test(x) && x.split(/\s+/).length >= 2 && x.split(/\s+/).length <= 5 && !titulo(x));
    nombre = l ?? "";
  }
  if (nombre === nombre.toUpperCase()) nombre = nombre.toLowerCase().replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());

  const plano = sinTilde(texto);
  const municipio = campo(/(?:municipio|ciudad|residencia|vivo en)\s*:\s*([^\n]{3,50})/i).replace(/,?\s*antioquia$/i, "")
    || MUNICIPIOS.find((m) => new RegExp(`\\b${sinTilde(m)}\\b`).test(plano)) || "";

  // Formación: la línea con el nivel más alto.
  const lineasForm = secciones.formacion.length ? secciones.formacion : lineas;
  const conNivel = lineasForm.map((l, i) => ({ l: [l, lineasForm[i + 1] ?? ""].join(" · "), n: nivelDe(l) })).filter((x) => x.n);
  const rango = (n: string) => NIVELES.indexOf(n);
  const mejor = conNivel.sort((a, b) => rango(b.n) - rango(a.n))[0];
  const institucion = mejor ? (mejor.l.match(/((?:I\.?\s?E\.?|Instituci[oó]n|Colegio|Liceo|SENA|Universidad|Polit[eé]cnico|Tecnol[oó]gico|Corporaci[oó]n|Fundaci[oó]n|Escuela|Instituto|Comfama|Comfenalco|CESDE)[^·,\n(]{0,60})/i)?.[1] ?? "").replace(/\s*[-–]\s*(?:19|20)\d{2}.*$/, "").replace(/\s*[-–]\s*$/, "").trim() : "";
  const anio = (mejor?.l.split(" · ")[0].match(new RegExp(AÑO.source, "g")) ?? mejor?.l.match(AÑO))?.pop() ?? "";

  const cursosL = [...secciones.cursos, ...secciones.formacion.filter((l) => /curso|certific|diplomado|seminario|taller|manipulaci/i.test(l) && l !== mejor?.l.split(" · ")[0])];
  const cursos = [...new Set(cursosL.map(corta).filter((l) => l.length > 3))].slice(0, 6).join(", ");

  const idiomas = secciones.idiomas.map(corta).join(", ") || (texto.match(/\b(ingl[eé]s|franc[eé]s|portugu[eé]s)\b[^\n,.;]{0,25}/i)?.[0] ?? "");
  const disponibilidad = campo(/disponibilidad[^:\n]*:\s*([^\n]{3,80})/i);
  const referencias = secciones.referencias.map(corta).filter(Boolean).join("; ").slice(0, 300);

  return {
    nombre, correo: texto.match(CORREO)?.[0] ?? "", telefono: texto.match(TELEFONO)?.[0]?.trim() ?? "", municipio,
    perfil: secciones.perfil.join(" ").slice(0, 600), nivel: mejor?.n ?? "", institucion, anio, cursos,
    habilidades: lista(secciones.habilidades).slice(0, 10), idiomas, disponibilidad, referencias,
    experiencias: experienciasDe(secciones.experiencia),
  };
}

/** Separa la sección de experiencia en entradas: un encabezado (cargo, lugar y fechas) y lo que viene debajo. */
export function experienciasDe(ls: string[]): DatosCv["experiencias"] {
  const out: DatosCv["experiencias"] = [];
  const esEncabezado = (l: string) => l.length <= 110 && !/[.]$/.test(l) && (FECHAS.test(l) || /\s[-–|]\s/.test(l));
  for (const raw of ls) {
    const l = corta(raw);
    if (!l) continue;
    if (esEncabezado(l) || !out.length) {
      const fechas = l.match(FECHAS)?.[0]?.replace(/[()]/g, "").trim() ?? "";
      const resto = l.replace(FECHAS, "").replace(/[()]/g, "").split(/\s+[-–|]\s+|\s+en\s+(?=[A-ZÁÉÍÓÚ])|,\s*/).map((x) => x.trim()).filter(Boolean);
      if (esEncabezado(l)) { out.push({ cargo: resto[0] ?? "", lugar: resto.slice(1).join(", "), fechas, descripcion: "" }); continue; }
      out.push({ cargo: "", lugar: "", fechas: "", descripcion: l });
      continue;
    }
    const e = out[out.length - 1];
    e.descripcion = e.descripcion ? `${e.descripcion} ${l}` : l;
  }
  return out.filter((e) => e.cargo || e.descripcion.length >= 20).slice(0, 6);
}

/** Lo que se envía a la IA: sin correo, teléfono, números de documento ni el nombre. */
export function anonimizar(texto: string, nombre: string): string {
  let t = texto.replace(CORREO, "[correo]").replace(TELEFONO, "[teléfono]").replace(DOCUMENTO, "[número]");
  for (const parte of nombre.split(/\s+/).filter((p) => p.length > 2)) t = t.replace(new RegExp(`\\b${parte.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), "[nombre]");
  return t.slice(0, 7000);
}

/** Sin IA: líneas que pueden describir experiencia, para que la persona elija. */
export function lineasCandidatas(texto: string): string[] {
  return texto.split(/\n|•|·|- (?=[A-ZÁÉÍÓÚ])/).map((l) => l.trim().replace(/^[-–•*]\s*/, ""))
    .filter((l) => l.length >= 25 && l.length <= 300 && !l.includes("@") && !/^(referencias|perfil|formaci|educaci|datos personales)/i.test(l))
    .slice(0, 25);
}
