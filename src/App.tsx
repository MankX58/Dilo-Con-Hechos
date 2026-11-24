import { useEffect } from "react";
import { useIA } from "./ai/client";
import { CvDock, CvSheet } from "./components/Cv";
import { Ajustes } from "./components/Ajustes";
import { ComoFunciona } from "./components/ComoFunciona";
import { Diagnostico } from "./screens/Diagnostico";
import { Entrevista } from "./screens/Entrevista";
import { Inicio } from "./screens/Inicio";
import { Prueba } from "./screens/Prueba";
import { Resultado } from "./screens/Resultado";
import { Taller } from "./screens/Taller";
import { ETAPAS, MOTIVO_CERRADA, progreso, useApp, type Stage } from "./state";
import { Continuar } from "./components/Continuar";

const PANTALLAS: Record<Stage, () => JSX.Element> = { inicio: Inicio, diagnostico: Diagnostico, taller: Taller, entrevista: Entrevista, prueba: Prueba, resultado: Resultado };

export function App() {
  const { s, go } = useApp();
  const Pantalla = PANTALLAS[s.stage];
  const ia = useIA();
  const { hecho, abierta } = progreso(s);
  const idx = ETAPAS.findIndex((e) => e.id === s.stage);
  const hechas = ETAPAS.filter((e) => hecho[e.id]).length;

  // Al cambiar de etapa, el foco va al título para lectores de pantalla.
  useEffect(() => { document.querySelector<HTMLElement>("main h1, main h2")?.focus({ preventScroll: true }); }, [s.stage]);

  return (
    <>
      <a className="skip" href="#contenido">Saltar al contenido</a>
      <header className="top">
        <div className="top-row">
          <button className="brand" onClick={() => go("inicio")} aria-label="Dilo con hechos, ir al inicio">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
            <span className="brand-text"><b>Dilo con hechos</b><small>Tu hoja de vida y tu entrevista, con tutor</small></span>
          </button>
          <div className="top-tools">
            <ComoFunciona corto />
            <Ajustes />
            <span className={`ia ia-${ia}`} title={ia === "activa" ? "Gemini revisa tus textos y te hace preguntas. Nunca escribe por ti." : "El revisor por criterios funciona en tu navegador, sin conexión a IA."}>
              {{ activa: "Tutor IA activo", comprobando: "Conectando tutor…", ocupada: "Tutor IA ocupado un minuto", agotada: "Tutor IA: cupo de hoy usado", inactiva: "Revisión por criterios" }[ia]}
            </span>
          </div>
        </div>
        {s.stage !== "inicio" && (
          <nav className="stepper" aria-label="Etapas">
            <ol>
              {ETAPAS.map((e, i) => {
                const est = i === idx ? "now" : hecho[e.id] ? "done" : abierta[e.id] ? "open" : "locked";
                return (
                  <li key={e.id} className={est}>
                    <button disabled={!abierta[e.id]} aria-current={i === idx ? "step" : undefined} onClick={() => go(e.id)}
                      title={abierta[e.id] ? undefined : MOTIVO_CERRADA[e.id]}>
                      <span className="step-dot" aria-hidden="true">
                        {est === "done" ? <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                          : est === "locked" ? <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                          : i + 1}
                      </span>
                      <span className="step-name">{e.nombre}</span>
                      <span className="sr-only">{est === "done" ? " (hecha)" : est === "locked" ? ` (cerrada: ${MOTIVO_CERRADA[e.id].toLowerCase()})` : ""}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="stepper-bar" aria-hidden="true"><span style={{ transform: `scaleX(${hechas / ETAPAS.length})` }} /></div>
          </nav>
        )}
      </header>
      <div className={`shell${s.stage === "inicio" ? " wide" : ""}`}>
        <main id="contenido"><div className="screen" key={s.stage}><Pantalla /></div></main>
        {s.stage !== "inicio" && s.stage !== "resultado" && <aside className="cv-aside" aria-label="Tu hoja de vida"><p className="label">Tu hoja de vida se arma aquí</p><CvSheet morph /></aside>}
      </div>
      {s.stage !== "resultado" && <CvDock />}
      <Continuar />
      <footer className="foot">
        Prototipo educativo para el reto Antioquia sin brechas (Expl-AI-n 2026 × Universidad de Medellín). Las vacantes y casos son de práctica.
        La revisión es automática y puede equivocarse: úsala como guía.
      </footer>
    </>
  );
}
