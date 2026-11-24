import { useRef } from "react";
import { createPortal } from "react-dom";
import { useIA } from "../ai/client";

const MOMENTOS = [
  ["Te conoce", "Lee tu experiencia y tu primera respuesta, y prepara las preguntas para sacar tus datos."],
  ["Revisa tu primer logro", "Qué funciona, qué mejorar y una pista por si te trabas."],
  ["Prepara tu entrevista", "Una pregunta sobre tu hoja de vida y una pista para cada pregunta."],
  ["Escucha tu primera respuesta", "La divide en situación, tarea, acción y resultado; opina y repregunta."],
  ["Cierra contigo", "Lo que más mejoraste y tu siguiente paso."],
];
const COMPROBACION = [
  ["Diagnóstico", "Escribes como lo harías hoy."],
  ["Práctica", "Con preguntas, medidor y reintentos."],
  ["Prueba final", "Un caso nuevo, sin ayudas."],
  ["Resultado", "Compara tu antes y tu después."],
];
const ESTADO: Record<string, string> = {
  activa: "Conectado: Gemini (Google) responde desde nuestro servidor.",
  comprobando: "Comprobando la conexión…",
  ocupada: "Conectado, pero llegó a su límite por minuto. En un momento vuelve; mientras tanto funciona el revisor por criterios.",
  agotada: "Conectado, pero ya usó su cupo gratuito de hoy (se renueva cada madrugada). Todo sigue funcionando con el revisor por criterios.",
  inactiva: "Sin IA en este momento. La herramienta funciona completa con el revisor por criterios.",
};

/** Explica qué hace la IA y qué hace el revisor por criterios, con el estado real de la IA.
 *  La ventana se dibuja fuera de la página (portal) para que ningún estilo de alrededor la afecte. */
export function ComoFunciona({ className = "link-btn", label = "Cómo funciona", corto = false }: { className?: string; label?: string; corto?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const ia = useIA();
  const cerrar = () => ref.current?.close();
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.showModal()} aria-label={corto ? label : undefined}>
        {corto ? <><span className="cf-txt" aria-hidden="true">{label}</span><span className="cf-ico" aria-hidden="true">?</span></> : label}
      </button>
      {createPortal(
        <dialog ref={ref} className="info-dialog" aria-labelledby="cf-title" onClick={(e) => { if (e.target === ref.current) cerrar(); }}>
          <div className="info-inner">
            <header className="info-head">
              <div>
                <h2 id="cf-title">Cómo funciona Dilo con hechos</h2>
              </div>
              <button type="button" className="info-x" onClick={cerrar} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </header>

            <p className="info-lead">Aprendes dos cosas para conseguir empleo: escribir tu experiencia como <b>logros</b> para la hoja de vida y <b>responder entrevistas</b> con una historia en cuatro partes. Si nunca has trabajado en el cargo, también practicas cómo responder «¿por qué darte la oportunidad?».</p>

            <p className={`info-estado ia-${ia}`}><span className="info-punto" aria-hidden="true" />{ESTADO[ia]}</p>

            <section className="info-card">
              <h3>El tutor con IA te acompaña en cinco momentos</h3>
              <ol className="info-pasos">
                {MOMENTOS.map(([t, d]) => <li key={t}><b>{t}</b><span>{d}</span></li>)}
              </ol>
              <p className="info-nota">Nunca escribe el logro ni la respuesta por ti. Lo que escribe para ti aparece marcado «escrito para ti». Puede equivocarse: tú decides qué cambiar.</p>
            </section>

            <section className="info-card">
              <h3>El revisor por criterios</h3>
              <ul className="info-lista">
                <li>Revisa con reglas fijas que ves en pantalla: 4 criterios para el logro y 5 para la entrevista.</li>
                <li>Funciona sin internet y sin IA.</li>
                <li>Califica la prueba final, para que sea igual para todas las personas.</li>
              </ul>
            </section>

            <section className="info-card">
              <h3>Cómo se comprueba lo que aprendiste</h3>
              <ol className="info-linea">
                {COMPROBACION.map(([t, d]) => <li key={t}><b>{t}</b><span>{d}</span></li>)}
              </ol>
            </section>

            <div className="info-cols">
              <section className="info-card">
                <h3>Accesibilidad</h3>
                <ul className="info-lista">
                  <li>Pensada primero para celular.</li>
                  <li>Escuchar las preguntas y dictar con voz.</li>
                  <li>Letra grande y alto contraste (botones de arriba).</li>
                  <li>Sigue funcionando sin conexión después de la primera visita.</li>
                </ul>
              </section>
              <section className="info-card">
                <h3>Privacidad</h3>
                <ul className="info-lista">
                  <li>Sin registro. Tu avance y tus datos de contacto se quedan en este dispositivo.</li>
                  <li>Si subes tu hoja de vida, se lee aquí mismo; a la IA solo va el texto sin nombre, correo, celular ni documento.</li>
                  <li>En su plan gratuito, Google puede usar los textos para mejorar sus servicios: no escribas datos personales en las respuestas.</li>
                  <li>Las vacantes y los casos son de práctica.</li>
                </ul>
              </section>
            </div>
          </div>
        </dialog>,
        document.body,
      )}
    </>
  );
}
