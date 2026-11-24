import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { CASOS, PERFILES, PREGUNTA_BASE, preguntaPuente, vacanteDe, type PerfilId, type Situacion, type VacanteId } from "./content";
import { evalPuente, evalStar, passPuente, passStar, type Check } from "./engine/rubric";
import type { Momento, Salidas } from "./ai/client";

export type Stage = "inicio" | "diagnostico" | "taller" | "entrevista" | "prueba" | "resultado";
export const ETAPAS: { id: Exclude<Stage, "inicio">; nombre: string }[] = [
  { id: "diagnostico", nombre: "Diagnóstico" },
  { id: "taller", nombre: "Taller de logros" },
  { id: "entrevista", nombre: "Entrevista" },
  { id: "prueba", nombre: "Prueba" },
  { id: "resultado", nombre: "Resultado" },
];

export interface Hecho { q: string; a: string }
export interface Logro {
  id: string;
  origen: PerfilId;
  crudo: string;
  hechos: Hecho[];
  fase: "contar" | "hechos" | "escribir" | "listo";
  borrador: string;
  intentos: string[];
  /** Habilidad del aviso que demuestra este logro (puente hacia la vacante). */
  habilidad?: string | null;
  /** Si viene de la hoja de vida subida: id de esa experiencia. */
  cv?: string;
  /** Lo que lleva escrito en cada parte del logro (modo por partes del taller). */
  partes?: { que: string; dato: string; res: string };
}
export type TipoPregunta = "star" | "puente";
export interface Respuesta { pregunta: string; tipo?: TipoPregunta; intentos: string[] }
export interface IntentoPrueba { caso: number; cv: string; star: string }

/** Datos para la hoja de vida final. Solo viven en el dispositivo: nunca se envían a la IA. */
export interface HojaVida {
  nombre: string; telefono: string; correo: string; municipio: string;
  perfil: string;
  nivel: string; institucion: string; anio: string; cursos: string;
  experiencia: Record<string, { rol: string; lugar: string; fechas: string }>;
  habilidades: string[]; otrasHabilidades: string; idiomas: string;
  disponibilidad: string; referencias: string;
}
export const HV_VACIA: HojaVida = {
  nombre: "", telefono: "", correo: "", municipio: "", perfil: "", nivel: "", institucion: "", anio: "", cursos: "",
  experiencia: {}, habilidades: [], otrasHabilidades: "", idiomas: "", disponibilidad: "", referencias: "Disponibles si las solicitan.",
};

/** Experiencia leída de la hoja de vida que la persona subió. */
export interface ExpSubida { id: string; cargo: string; lugar: string; fechas: string; descripcion: string; usada: boolean; incluir: boolean }

/** Lo que se lleva al taller de una experiencia subida: su descripción o, si no tiene, cargo y lugar. */
export const textoExp = (e: { cargo: string; lugar: string; descripcion: string }) => e.descripcion.trim() || [e.cargo, e.lugar].filter(Boolean).join(", ");
/** Un logro que nace de una experiencia subida ya trae su cargo, lugar y fechas para la hoja final. */
export function conExp(x: State, logro: Logro, e: ExpSubida | undefined): State {
  if (!e) return x;
  return {
    ...x,
    hv: { ...x.hv, experiencia: { ...x.hv.experiencia, [logro.id]: { rol: e.cargo, lugar: e.lugar, fechas: e.fechas } } },
    cvSubida: x.cvSubida && { ...x.cvSubida, experiencias: x.cvSubida.experiencias.map((y) => (y.id === e.id ? { ...y, usada: true } : y)) },
  };
}

export interface State {
  hv: HojaVida;
  /** Hoja de vida subida: sus experiencias se pueden mejorar en el taller y las demás pasan a la hoja final. */
  cvSubida: { archivo: string; experiencias: ExpSubida[]; modo?: "todas" | "una" } | null;
  stage: Stage;
  vacante: VacanteId | null;
  /** Nombre del cargo cuando la persona elige «Otra vacante». */
  vacanteOtra: string;
  /** Cómo quiere que el tutor la llame (opcional). */
  apodo: string;
  situacion: Situacion | null;
  base: { origen: PerfilId; cv: string; star: string } | null;
  vioLeccionLogro: boolean;
  vioLeccionStar: boolean;
  logros: Logro[];
  preguntaCv: string | null;
  /** Lo que el tutor IA preparó en cada momento: se pide una vez y acompaña el resto del recorrido. */
  tutor: { [K in Momento]?: Salidas[K] & { _para?: string } };
  tutorFallos: { [K in Momento]?: number };
  entrevista: Respuesta[];
  pasoEntrevista: number;
  prueba: IntentoPrueba[];
  caso: number;
}

const INICIAL: State = {
  hv: HV_VACIA, cvSubida: null, stage: "inicio", vacante: null, vacanteOtra: "", apodo: "", situacion: null, base: null, vioLeccionLogro: false, vioLeccionStar: false,
  logros: [], preguntaCv: null, tutor: {}, tutorFallos: {}, entrevista: [], pasoEntrevista: 0, prueba: [], caso: 0,
};

const KEY = "dilo-con-hechos:v2";
function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const g = JSON.parse(raw); return { ...INICIAL, ...g, hv: { ...HV_VACIA, ...g.hv } }; }
  } catch { /* almacenamiento bloqueado: se empieza de cero */ }
  return INICIAL;
}

/** Cambia la pantalla con una transición nativa del navegador (si existe y no se pidió reducir movimiento). */
export function withTransition(update: () => void) {
  const d = document as Document & { startViewTransition?: (cb: () => void) => { skipTransition?: () => void } };
  if (!d.startViewTransition || document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches) { update(); return; }
  let hecho = false;
  const aplicar = () => { if (!hecho) { hecho = true; flushSync(update); } };
  const vt = d.startViewTransition(aplicar);
  // Si el navegador no pinta (pestaña en segundo plano, equipo lento), el cambio no puede quedar esperando.
  setTimeout(() => { if (!hecho) { vt.skipTransition?.(); aplicar(); } }, 350);
}

type Update = (f: (s: State) => State) => void;
const Ctx = createContext<{ s: State; set: Update; reset: () => void } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState(load);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sin almacenamiento */ } }, [s]);
  const reset = () => {
    try { localStorage.removeItem(KEY); } catch { /* nada que borrar */ }
    withTransition(() => { setS({ ...INICIAL, stage: "diagnostico" }); window.scrollTo(0, 0); });
  };
  return <Ctx.Provider value={{ s, set: setS, reset }}>{children}</Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp fuera de AppProvider");
  const { s, set } = c;
  /** Cambio de estado animado: se usa para todo lo que cambia de pantalla o de paso. */
  const move = (f: (x: State) => State) => withTransition(() => { set(f); window.scrollTo(0, 0); });
  const go = (stage: Stage) => move((x) => ({ ...x, stage }));
  const vacante = vacanteDe(s.vacante, s.vacanteOtra);
  const listos = s.logros.filter((l) => l.fase === "listo");
  const sinExperiencia = s.situacion === "otra" || s.situacion === "ninguna";
  const preguntas: { texto: string; tipo: TipoPregunta }[] = [
    { texto: PREGUNTA_BASE, tipo: "star" },
    { texto: s.tutor.preparar?.pregunta_cv?.trim() || s.preguntaCv || (listos[0] ? cvQuestion(listos[0]) : "Cuéntame de algo que hayas hecho y de lo que te sientas orgulloso u orgullosa. ¿Qué pasó y qué hiciste tú?"), tipo: "star" },
    sinExperiencia && vacante
      ? { texto: preguntaPuente(vacante.titulo), tipo: "puente" }
      : { texto: vacante?.pregunta ?? "Cuéntame de una vez que tuviste que trabajar con mucho cuidado para que algo saliera bien.", tipo: "star" },
  ];
  const updateLogro = (id: string, f: (l: Logro) => Logro) => set((x) => ({ ...x, logros: x.logros.map((l) => (l.id === id ? f(l) : l)) }));
  return { ...c, go, move, vacante, listos, preguntas, sinExperiencia, updateLogro, caso: CASOS[s.caso % CASOS.length] };
}

type EtapaId = Exclude<Stage, "inicio">;
/** Una etapa se abre solo cuando la anterior está hecha. Excepción: quien se traba 3 veces con su logro puede seguir a la entrevista. */
export function progreso(s: State) {
  const listos = s.logros.filter((l) => l.fase === "listo").length;
  const trabado = s.logros.some((l) => l.intentos.length >= 3);
  const hecho: Record<EtapaId, boolean> = {
    diagnostico: Boolean(s.base), taller: listos > 0, entrevista: [0, 1, 2].every((i) => (s.entrevista[i]?.intentos.length ?? 0) > 0), prueba: s.prueba.length > 0, resultado: false,
  };
  const abierta: Record<EtapaId, boolean> = {
    diagnostico: true, taller: hecho.diagnostico, entrevista: hecho.diagnostico && (hecho.taller || trabado), prueba: hecho.entrevista, resultado: hecho.prueba,
  };
  const frontera = [...ETAPAS].reverse().find((e) => abierta[e.id])!.id;
  return { hecho, abierta, frontera };
}
export const MOTIVO_CERRADA: Record<EtapaId, string> = {
  diagnostico: "", taller: "Se abre al terminar el diagnóstico", entrevista: "Se abre cuando agregues tu primer logro a la hoja de vida",
  prueba: "Se abre al terminar las 3 preguntas de la entrevista", resultado: "Se abre al enviar la prueba final",
};

/** Saludo con el nombre que la persona quiso dar (opcional; solo vive en su dispositivo y nunca se envía a la IA). */
export const hola = (s: State) => (s.apodo.trim() ? `${s.apodo.trim()}, ` : "");

/** Recorta un texto de la persona para citarlo sin ocupar media pantalla. */
export const cita = (t: string, palabras = 12) => { const w = t.trim().split(/\s+/); return w.length > palabras ? `${w.slice(0, palabras).join(" ")}…` : t.trim().replace(/[.\s]+$/, ""); };

/** Evalúa una respuesta de entrevista con la estructura que le corresponde. */
export function evalRespuesta(texto: string, tipo: TipoPregunta = "star", claves: string[] = []): { checks: Check[]; pasa: boolean } {
  if (tipo === "puente") {
    const checks = evalPuente(texto, claves);
    return { checks, pasa: passPuente(checks) };
  }
  const checks = evalStar(texto);
  return { checks, pasa: passStar(checks) };
}

export const finalText = (l: Logro) => l.intentos[l.intentos.length - 1] ?? "";
export const cvQuestion = (l: Logro) => `En tu hoja de vida escribiste: «${finalText(l).replace(/[.\s]+$/, "")}». Cuéntame cómo lo lograste: ¿qué pasó, qué hiciste tú y cómo terminó?`;
export const rolDe = (l: Logro) => PERFILES[l.origen].rol;
export const nuevoLogro = (origen: PerfilId, crudo: string): Logro => ({
  id: Math.random().toString(36).slice(2, 9), origen, crudo, hechos: [], fase: crudo.trim() ? "hechos" : "contar", borrador: crudo, intentos: [], habilidad: null,
});
