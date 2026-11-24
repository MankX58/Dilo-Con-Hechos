import type { CSSProperties } from "react";
import { PERFILES } from "../content";
import { Annotated, Icon } from "../components/ui";
import { ETAPAS, progreso, useApp } from "../state";
import { ComoFunciona } from "../components/ComoFunciona";

const QUE_HACES: Record<(typeof ETAPAS)[number]["id"], string> = {
  diagnostico: "Tu vacante y tu punto de partida",
  taller: "Tu experiencia, convertida en logros",
  entrevista: "Tres preguntas, con tutor",
  prueba: "Sin ayuda, con un caso nuevo",
  resultado: "Hoja de vida y vacantes filtradas",
};
const Icono = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

export function Inicio() {
  const { s, go, reset } = useApp();
  const enCurso = Boolean(s.base);
  const p = progreso(s);
  return (
    <section className="inicio">
      <div className="inicio-hero">
        <div className="stack">
          <h1 tabIndex={-1}>Tu experiencia ya vale. <em>Dilo con hechos.</em></h1>
          <p className="lead">
            Para quienes buscan su primer empleo o uno nuevo en Antioquia. Aprendes a escribir tu experiencia en la hoja de vida y a contarla en una entrevista, con hechos y no con frases que dice todo el mundo.
          </p>
          <div className="actions">
            {enCurso ? (
              <>
                <button className="btn" onClick={() => go(p.frontera)}>Continuar donde ibas</button>
                <button className="btn ghost" onClick={reset}>Empezar de nuevo</button>
              </>
            ) : (
              <button className="btn" onClick={() => go("diagnostico")}>Empezar</button>
            )}
            {!enCurso && <span className="muted small">Unos 20 minutos · sin registro</span>}
          </div>
        </div>
        <figure className="slip" aria-label="Ejemplo de cómo cambia una línea de la hoja de vida">
          <p className="slip-label">Antes</p>
          <p className="slip-before">{PERFILES.ventas.tarea}</p>
          <p className="slip-label">Después del taller</p>
          <p className="slip-after"><Annotated tramos={PERFILES.ventas.logro} /></p>
          <figcaption className="small muted">Ejemplo. En la herramienta escribes el tuyo, con tus datos reales.</figcaption>
        </figure>
      </div>

      <section className="ruta" aria-labelledby="ruta-t">
        <p className="ruta-titulo" id="ruta-t">
          {enCurso ? <><b>Tu avance</b> · {ETAPAS.filter((e) => p.hecho[e.id]).length} de 5 paradas</> : <><b>Tu ruta</b> · 5 paradas, unos 20 minutos</>}
        </p>
        <ol className="ruta-linea">
          {ETAPAS.map((e, i) => (
            <li key={e.id} style={{ "--i": i } as CSSProperties}
              className={enCurso ? (p.hecho[e.id] ? "hecha" : e.id === p.frontera ? "aqui" : "") : ""}
              aria-current={enCurso && e.id === p.frontera ? "step" : undefined}>
              <span className="ruta-parada" aria-hidden="true">{enCurso && p.hecho[e.id] ? <Icon name="check" size={15} /> : i + 1}</span>
              <b>{e.nombre}</b>
              <span>{QUE_HACES[e.id]}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="confianza">
        <span><Icono d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />Sin registro</span>
        <span><Icono d="M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3" />El tutor nunca escribe por ti</span>
        <span><Icono d="M7 3h10v18H7zM11 18h2" />Funciona en el celular y sin señal</span>
        <ComoFunciona className="link-btn" label="Cómo funciona por dentro" />
      </div>
    </section>
  );
}
