import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { PERFILES, ordenPerfiles, type PerfilId, type Situacion } from "../content";
import { AnswerBox, Icon } from "./ui";

const ICONOS: Record<PerfilId, ReactNode> = {
  ventas: <path d="M3 9l1.5-5h15L21 9M3 9h18M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 12v8h14v-8M10 20v-5h4v5" />,
  cuidado: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  comunidad: <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16.5 11a2.5 2.5 0 1 0 0-5M3 20a6 6 0 0 1 12 0M16 14.3A5 5 0 0 1 21 19.5" />,
  estudio: <path d="M2 9l10-5 10 5-10 5L2 9zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6" />,
  deporte: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5l4 2.9-1.5 4.6h-5L8 10.4z" /></>,
  campo: <path d="M12 21v-9M12 12C12 7.5 8.5 5 4 5c0 4.2 3.5 7 8 7zM12 15c0-4 3-6.5 8-6.5 0 4-3.2 6.5-8 6.5z" />,
  otro: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />,
};

/** Opciones en lenguaje cotidiano, con ícono y ejemplos para reconocerse de un vistazo. */
export function OrigenPicker({ name, value, onChange, situacion }: { name: string; value: PerfilId | null; onChange: (id: PerfilId) => void; situacion: Situacion | null }) {
  return (
    <div className="origins">
      {ordenPerfiles(situacion).map((id, i) => {
        const p = PERFILES[id];
        return (
          <label key={id} className={`origin${id === "otro" ? " origin-otro" : ""}`} style={{ "--i": i } as CSSProperties}>
            <input type="radio" name={name} value={id} checked={value === id} onChange={() => onChange(id)} />
            <span className="origin-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONOS[id]}</svg>
            </span>
            <span className="origin-text">
              <b>{p.label}</b>
              <span className="origin-ex">{p.ejemplos.map((e) => <span key={e}>{e}</span>)}</span>
            </span>
            <span className="origin-check" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
          </label>
        );
      })}
    </div>
  );
}

/** La caja para escribir la experiencia: aparece al elegir, con su propia pregunta e ideas para arrancar. */
export function ExperienciaBox({ id, origen, value, onChange, label, hint, desde = "" }: {
  id: string; origen: PerfilId; value: string; onChange: (v: string) => void; label: string; hint: string;
  /** Texto que llegó de la hoja de vida subida: se marca para que la persona vea dónde quedó. */
  desde?: string;
}) {
  const p = PERFILES[origen];
  const caja = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { caja.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [origen]);

  // Solo pone el comienzo de la frase: el resto lo escribe la persona.
  const arrancar = (a: string) => {
    const inicio = a.replace(/…$/, " ");
    const v = value.trim() ? `${value.trimEnd()} ${inicio}` : inicio;
    onChange(v);
    requestAnimationFrame(() => { ref.current?.focus(); ref.current?.setSelectionRange(v.length, v.length); });
  };

  return (
    <div className="exp-box" ref={caja} key={origen}>
      {!desde && <p className="exp-q">{p.pregunta}</p>}
      {/* Con texto traído de la hoja de vida, las ideas para arrancar sobran. */}
      {!desde && <div className="starters">
        <p className="label">Ideas para empezar · toca una y sigue escribiendo</p>
        <div className="starters-row">
          {p.arranques.map((a, i) => <button key={a} type="button" className="starter" style={{ "--i": i } as CSSProperties} onClick={() => arrancar(a)}>{a}</button>)}
        </div>
      </div>}
      <div className={desde ? "exp-pegada" : undefined} key={desde}>
        {desde && <p className="pegada-tag"><Icon name="abajo" size={13} /> {value.trim() === desde.trim() ? "Tomada de tu hoja de vida. Edítala si quieres." : "Tomada de tu hoja de vida, con tus cambios."}</p>}
        <AnswerBox id={id} rows={3} value={value} onChange={onChange} textareaRef={ref} label={label} hint={hint} />
      </div>
    </div>
  );
}
