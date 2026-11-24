import { useEffect, useSyncExternalStore } from "react";
import { askTutor, useIA, type Entradas, type Momento, type Salidas } from "./client";
import { useApp, type State } from "../state";
import { PERFILES, vacanteDe } from "../content";

/** Entrada del momento «conocer»: se usa en el diagnóstico y, si allí no alcanzó a responder, en el taller. */
export function entradaConocer(s: State) {
  const v = vacanteDe(s.vacante, s.vacanteOtra);
  return {
    vacante: v?.titulo ?? "", busca: v?.busca ?? [], situacion: s.situacion ?? undefined,
    origen: s.base ? PERFILES[s.base.origen].label : "", cv: s.base?.cv ?? "", star: s.base?.star ?? "",
  };
}

/* Los 5 momentos del tutor: cada uno se pide una sola vez por persona y su resultado queda guardado en el avance.
   Lo que el tutor dice después (pistas, ánimo, preguntas) sale de ahí, sin nuevas consultas. */
export type Guardado<K extends Momento> = Salidas[K] & { _para?: string };

const enCurso = new Set<Momento>();
const subs = new Set<() => void>();
const avisar = () => subs.forEach((f) => f());
const useEnCurso = (m: Momento) => useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => enCurso.has(m));

/**
 * @param activo  si ya es el momento de pedirlo (con `false` solo lee lo guardado)
 * @param datos   arma la entrada justo antes de pedir
 * @param para    texto al que corresponde la respuesta (p. ej. el intento revisado), para mostrarla solo junto a él
 */
export function useMomento<K extends Momento>(m: K, activo: boolean, datos: () => Entradas[K], para?: string) {
  const { s, set } = useApp();
  const estado = useIA();
  const guardado = s.tutor[m] as Guardado<K> | undefined;
  const fallos = s.tutorFallos[m] ?? 0;
  const cargando = useEnCurso(m);

  useEffect(() => {
    if (!activo || guardado || fallos >= 2 || estado !== "activa" || enCurso.has(m)) return;
    enCurso.add(m); avisar();
    askTutor(m, datos()).then((r) => {
      enCurso.delete(m); avisar();
      if (r) set((x) => ({ ...x, tutor: { ...x.tutor, [m]: { ...r, _para: para } } }));
      else if (r === null) set((x) => ({ ...x, tutorFallos: { ...x.tutorFallos, [m]: (x.tutorFallos[m] ?? 0) + 1 } }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, guardado, fallos, estado]);

  return { data: guardado ?? null, cargando: cargando || (activo && !guardado && estado === "comprobando") };
}
