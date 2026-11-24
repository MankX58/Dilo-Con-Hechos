import { useRef } from "react";
import { finalText, rolDe, useApp } from "../state";

/** La hoja de vida que se va llenando con los logros que la persona escribe.
 *  `morph`: solo una copia en pantalla puede llevar nombres de transición (la del costado). */
export function CvSheet({ className = "", morph = false }: { className?: string; morph?: boolean }) {
  const { s, vacante, listos } = useApp();
  const ultimo = listos[listos.length - 1]?.id;
  return (
    <article className={`cv ${className}`} aria-label="Tu hoja de vida (borrador)">
      <header className="cv-head">
        <p className={`cv-name${s.hv.nombre ? " real" : ""}`}>{s.hv.nombre || "Tu nombre"}</p>
        <p className="cv-goal">{vacante ? `Aspirante a ${vacante.titulo.toLowerCase()}` : "Elige una vacante en el diagnóstico"}</p>
        <p className="cv-contact">{[s.hv.telefono, s.hv.correo, s.hv.municipio].filter(Boolean).join(" · ") || "Celular · Correo · Municipio"}</p>
      </header>
      <h3 className="cv-section">{s.situacion === "parecido" ? "Experiencia" : "Experiencia y proyectos"}</h3>
      {listos.length ? (
        <ul className="cv-list">
          {listos.map((l) => (
            <li key={l.id} className={l.id === ultimo ? "ultimo" : ""}>
              <p className="cv-role">{rolDe(l)}</p>
              <p className="cv-text" style={morph ? { viewTransitionName: `logro-${l.id}` } : undefined}>{finalText(l)}</p>
              {l.habilidad && <p className="cv-skill">Demuestra: {l.habilidad}</p>}
              <span className="stamp">Escrito por ti</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="cv-empty">
          {s.situacion === "ninguna"
            ? "Aquí aparecerán los logros que escribas. Cuidar a alguien, un proyecto del colegio o entrenar con un equipo también cuentan."
            : "Aquí aparecerán los logros que escribas en el taller. Los escribes tú; el tutor solo revisa."}
        </p>
      )}
    </article>
  );
}

/** En pantallas angostas la hoja de vida se abre en un diálogo nativo. */
export function CvDock() {
  const { listos, s } = useApp();
  const ref = useRef<HTMLDialogElement>(null);
  // En el diagnóstico la hoja de vida aún está vacía y el botón taparía la barra de «Siguiente».
  if (s.stage === "inicio" || s.stage === "diagnostico") return null;
  return (
    <>
      <button type="button" className="cv-dock" onClick={() => ref.current?.showModal()} aria-label={`Mi hoja de vida: ${listos.length} ${listos.length === 1 ? "logro" : "logros"}`}>
        <span className="cv-dock-sheet" aria-hidden="true" />
        <span className="cv-dock-text" aria-hidden="true">Mi hoja de vida</span> <span className="badge" key={listos.length} aria-hidden="true">{listos.length}</span>
      </button>
      <dialog ref={ref} className="cv-dialog" aria-label="Tu hoja de vida" onClick={(e) => { if (e.target === ref.current) ref.current.close(); }}>
        <div className="cv-dialog-inner">
          <button type="button" className="btn ghost sm close" onClick={() => ref.current?.close()}>Cerrar</button>
          <CvSheet />
        </div>
      </dialog>
    </>
  );
}
