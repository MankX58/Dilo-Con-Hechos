import { useSyncExternalStore } from "react";
import type { LogroCriterio, Segmento } from "../engine/rubric";
import type { Situacion } from "../content";

// El navegador solo pide uno de los 5 momentos del tutor; el prompt y las claves viven en /api/tutor.
export interface Retro { fortaleza: string; mejora: string; pregunta: string }
export interface Salidas {
  conocer: { saludo: string; lectura: string; enfoque: string; consejo_entrevista: string; preguntas: { criterio: LogroCriterio; texto: string }[] };
  logro: Retro & { si_te_trabas: string; al_lograrlo: string };
  preparar: { animo: string; pregunta_cv: string; pistas: string[] };
  star: Retro & { segmentos: Segmento[]; repregunta: string; para_las_siguientes: string };
  cierre: { mensaje: string; mejor_avance: string; siguiente_paso: string };
  cv: { perfil: string; municipio: string; nivel: string; institucion: string; anio: string; cursos: string; habilidades: string[]; idiomas: string; disponibilidad: string; experiencias: { cargo: string; lugar: string; fechas: string; descripcion: string }[] };
}
type Check = { label: string; ok: boolean };
type Contexto = { vacante: string; busca: string[]; situacion?: Situacion };
export interface Entradas {
  conocer: Contexto & { origen: string; cv: string; star: string };
  logro: Contexto & { experiencia: string; hechos: string[]; enunciado: string; checks: Check[] };
  preparar: Contexto & { logros: { texto: string; habilidad: string }[]; hechos: string[]; star: string; tercera: string; puente: boolean };
  star: { vacante: string; logro: string; hechos: string[]; pregunta: string; respuesta: string; checks: Check[] };
  cv: { vacante: string; texto: string };
  cierre: { vacante: string; habilidad: string; cvAntes: string; cvDespues: string; starAntes: string; starDespues: string; avance: string; demostro: boolean };
}
export type Momento = keyof Salidas;

/** activa: responde · ocupada: límite por minuto (vuelve sola) · agotada: se acabó la cuota de hoy · inactiva: no hay IA o no hay conexión. */
export type EstadoIA = "comprobando" | "activa" | "ocupada" | "agotada" | "inactiva";
let estado: EstadoIA = "comprobando";
let reanudar: ReturnType<typeof setTimeout> | undefined;
const subs = new Set<() => void>();
const setEstado = (e: EstadoIA) => { estado = e; subs.forEach((f) => f()); };
export const useIA = () => useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => estado);

fetch("/api/tutor")
  .then((r) => (r.ok ? r.json() : null))
  .then((j) => setEstado(j?.ia !== true ? "inactiva" : j.agotada ? "agotada" : "activa"))
  .catch(() => setEstado("inactiva"));

// Un identificador anónimo por dispositivo: el servidor reparte el cupo por persona sin pedir datos.
function dispositivo(): string {
  try {
    let id = localStorage.getItem("dilo-con-hechos:dispositivo");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("dilo-con-hechos:dispositivo", id); }
    return id;
  } catch { return ""; }
}

/** Respuesta del tutor IA; null si se intentó y falló; undefined si no se intentó (IA no disponible ahora). */
export async function askTutor<K extends Momento>(task: K, data: Entradas[K]): Promise<Salidas[K] | null | undefined> {
  if (estado !== "activa") return undefined;
  try {
    const r = await fetch("/api/tutor", {
      method: "POST",
      headers: { "content-type": "application/json", "x-dispositivo": dispositivo() },
      body: JSON.stringify({ task, ...data }),
      signal: AbortSignal.timeout(30_000),
    });
    if (r.status === 503) setEstado("inactiva");
    if (r.status === 429) {
      const { error } = await r.json().catch(() => ({ error: "" }));
      if (error === "cuota_dia") setEstado("agotada");
      else if (error === "cuota_minuto") { setEstado("ocupada"); clearTimeout(reanudar); reanudar = setTimeout(() => setEstado("activa"), 60_000); }
      // limite_persona: silencioso; el tutor sigue con lo que ya preparó.
    }
    if (!r.ok) return null;
    return (await r.json()) as Salidas[K];
  } catch {
    return null;
  }
}
