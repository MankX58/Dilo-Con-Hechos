import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { Tramo } from "../content";
import { speakingSeconds, wordCount, type Check, type Parte, type Segmento } from "../engine/rubric";
import type { Retro } from "../ai/client";

/** El modelo puede empezar frases en minúscula o mayúscula: se ajusta según dónde se muestren. */
export const mayus = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
export const minus = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

const reduceMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const vars = (o: Record<string, number | string>) => o as CSSProperties;

/** Una línea que dice para qué sirve la etapa: cualquiera entiende el porqué antes de empezar. */
/** Iconos dibujados con un solo trazo (no caracteres de texto). */
const ICONOS = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  alerta: "M12 7v6M12 17h.01",
  abajo: "M12 5v14M6 13l6 6 6-6",
  derecha: "M5 12h14M13 6l6 6-6 6",
  archivo: "M7 3h7l5 5v13H7zM14 3v5h5",
  capas: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5",
  dedo: "M12 3v12M7 10l5 5 5-5M5 21h14",
  lapiz: "M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3",
} as const;
export function Icon({ name, size = 16 }: { name: keyof typeof ICONOS; size?: number }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONOS[name]} />
    </svg>
  );
}

export const ParaQue =({ children }: { children: ReactNode }) => <p className="para-que"><b>Para qué:</b> {children}</p>;

/* ---------- La voz del tutor ---------- */
/** La voz del tutor. `pensando`: está leyendo lo tuyo. `ia`: lo que dice fue escrito para ti a partir de tus textos. */
export function Guide({ children, pensando = false, ia = false }: { children: ReactNode; pensando?: boolean; ia?: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [texto, setTexto] = useState("");
  useEffect(() => { setTexto(ref.current?.textContent ?? ""); }, [children, pensando]);
  return (
    <div className={`guide-voice${pensando ? " pensando" : ""}${ia ? " personal" : ""}`} aria-busy={pensando}>
      <span className="guide-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3" /></svg>
      </span>
      <div>
        <div className="guide-top">
          <p className="guide-who">Tu tutor{ia && <span className="guide-ia"> · escrito para ti</span>}</p>
          {!pensando && texto && <Speak text={texto} label="Escuchar" small />}
        </div>
        {pensando
          ? <p className="guide-text guide-thinking" aria-live="polite"><Typing /> Estoy leyendo lo que escribiste…</p>
          : <p className="guide-text" ref={ref} key={ia ? "ia" : "local"}>{children}</p>}
      </div>
    </div>
  );
}

/** Texto que aparece palabra por palabra; los lectores de pantalla leen la frase completa. */
export function Words({ text }: { text: string }) {
  const parts = text.split(/(\s+)/);
  let n = 0;
  return (
    <>
      <span className="sr-only">{text}</span>
      <span className="words" aria-hidden="true">
        {parts.map((w, i) => (/^\s+$/.test(w) ? w : <span key={i} style={vars({ "--i": Math.min(n++, 45) })}>{w}</span>))}
      </span>
    </>
  );
}

/** Número que sube hasta su valor (desacelerando). */
export function useCountUp(target: number, ms = 650) {
  const [v, setV] = useState(() => (reduceMotion() ? target : 0));
  const from = useRef(v);
  useEffect(() => {
    if (reduceMotion() || document.hidden) { from.current = target; setV(target); return; }
    let raf = 0;
    const t0 = performance.now(), start = from.current;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const val = Math.round(start + (target - start) * (1 - Math.pow(1 - p, 3)));
      from.current = val; setV(val);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Si el navegador no entrega cuadros de animación, el número igual llega a su valor real.
    const seguro = setTimeout(() => { cancelAnimationFrame(raf); from.current = target; setV(target); }, ms + 150);
    return () => { cancelAnimationFrame(raf); clearTimeout(seguro); };
  }, [target, ms]);
  return v;
}

/* ---------- Lista de criterios ---------- */
/** Lo que ya cumple va en una sola línea; solo lo que falta se explica completo. Así la revisión no abruma. */
export function Checks({ checks }: { checks: Check[] }) {
  const ok = checks.filter((c) => c.ok), no = checks.filter((c) => !c.ok);
  return (
    <div className="checks-wrap">
      {no.length > 0 && (
        <ul className="checks">
          {no.map((c, i) => (
            <li key={c.id} className="no" style={vars({ "--i": i })}>
              <span className="mark" aria-hidden="true">!</span>
              <div><strong>{c.label}<span className="sr-only">: por mejorar</span></strong><p>{c.msg}</p></div>
            </li>
          ))}
        </ul>
      )}
      {ok.length > 0 && (
        <p className="checks-ok"><span className="mark-ok" aria-hidden="true"><Icon name="check" size={13} /></span><span><b>{no.length ? "Ya cumple:" : "Cumple todo:"}</b> {ok.map((c) => c.label).join(" · ")}</span></p>
      )}
    </div>
  );
}

export function ChecksCompletos({ checks }: { checks: Check[] }) {
  return (
    <ul className="checks">
      {checks.map((c, i) => (
        <li key={c.id} className={c.ok ? "ok" : "no"} style={vars({ "--i": i })}>
          <span className="mark" aria-hidden="true"><Icon name={c.ok ? "check" : "alerta"} size={13} /></span>
          <div>
            <strong>{c.label}<span className="sr-only">{c.ok ? ": cumple" : ": por mejorar"}</span></strong>
            <p>{c.msg}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Medidor en vivo (solo en la práctica) ---------- */
export function Meter({ checks }: { checks: Check[] }) {
  const n = checks.filter((c) => c.ok).length;
  return (
    <div className="meter" role="status" aria-label={`${n} de ${checks.length} criterios`}>
      {checks.map((c) => <span key={c.id} className={c.ok ? "on" : ""}>{c.label}</span>)}
    </div>
  );
}

export function Score({ checks }: { checks: Check[] }) {
  const n = checks.filter((c) => c.ok).length;
  const shown = useCountUp(n);
  return (
    <div className="score-row">
      <p className="score"><span aria-hidden="true">{shown}</span><span className="sr-only">{n}</span><small> de {checks.length} criterios</small></p>
      <span className="score-bar" aria-hidden="true"><span style={vars({ "--p": n / checks.length })} /></span>
    </div>
  );
}

/** Las tres partes del puente, encendidas según los criterios. */
export function PuenteKey({ checks }: { checks: Check[] }) {
  const ok = (id: string) => checks.some((c) => c.id === id && c.ok);
  const partes = [
    { n: "Reconoce", on: ok("rec") },
    { n: "Conecta", on: ok("hecho") && ok("vac") },
    { n: "Compromete", on: ok("comp") },
  ];
  return (
    <div className="bridge" aria-label="Partes del puente en tu respuesta">
      {partes.map((p, i) => (
        <span key={p.n} className={p.on ? "on" : ""} style={vars({ "--i": i })}>{p.n}<span className="sr-only">{p.on ? " presente" : " falta"}</span></span>
      ))}
    </div>
  );
}

/* ---------- Caja de respuesta con dictado por voz ---------- */
interface Rec {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null;
}
const SR = typeof window === "undefined" ? undefined
  : (window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }).SpeechRecognition
    ?? (window as unknown as { webkitSpeechRecognition?: new () => Rec }).webkitSpeechRecognition;

export function AnswerBox(props: {
  id: string; label: ReactNode; value: string; onChange: (v: string) => void;
  hint?: ReactNode; rows?: number; tiempo?: boolean; textareaRef?: RefObject<HTMLTextAreaElement>;
}) {
  const { id, label, value, onChange, hint, rows = 4, tiempo, textareaRef } = props;
  const [escuchando, setEscuchando] = useState(false);
  const [error, setError] = useState("");
  const rec = useRef<Rec | null>(null);
  const latest = useRef(value);
  latest.current = value;
  useEffect(() => () => rec.current?.stop(), []);

  function dictar() {
    if (!SR) return;
    if (escuchando) { rec.current?.stop(); return; }
    const r = new SR();
    r.lang = "es-CO"; r.continuous = true; r.interimResults = false;
    r.onresult = (e) => {
      let add = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) add += e.results[i][0].transcript;
      if (add.trim()) onChange((latest.current.trim() ? latest.current.trimEnd() + " " : "") + add.trim());
    };
    r.onend = () => setEscuchando(false);
    r.onerror = () => { setEscuchando(false); setError("No pude usar el micrófono. Revisa el permiso del navegador o escribe tu respuesta."); };
    setError("");
    try { r.start(); rec.current = r; setEscuchando(true); } catch { setError("El dictado no está disponible en este navegador."); }
  }

  const wc = wordCount(value);
  return (
    <div className="answer">
      <label className="field" htmlFor={id}>{label}</label>
      <textarea id={id} ref={textareaRef} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="off" spellCheck />
      <div className="answer-bar">
        {SR && (
          <button type="button" className={`mic${escuchando ? " live" : ""}`} onClick={dictar} aria-pressed={escuchando}>
            <MicIcon /> {escuchando ? "Detener dictado" : "Dictar con voz"}
          </button>
        )}
        <span className="count" aria-live="off">{wc} palabras{tiempo && wc > 0 ? ` · ≈ ${speakingSeconds(value)} s hablando` : ""}</span>
      </div>
      {hint && <p className="hint">{hint}</p>}
      {error && <p className="hint warn">{error}</p>}
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

/* ---------- Leer en voz alta ---------- */
export function Speak({ text, label = "Escuchar", small = false }: { text: string; label?: string; small?: boolean }) {
  const [on, setOn] = useState(false);
  useEffect(() => () => { if ("speechSynthesis" in window) speechSynthesis.cancel(); }, []);
  if (!("speechSynthesis" in window)) return null;
  function toggle() {
    if (on) { speechSynthesis.cancel(); setOn(false); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-CO"; u.rate = 0.95;
    const v = speechSynthesis.getVoices().find((x) => x.lang.startsWith("es"));
    if (v) u.voice = v;
    u.onend = u.onerror = () => setOn(false);
    speechSynthesis.cancel(); speechSynthesis.speak(u); setOn(true);
  }
  return (
    <button type="button" className={`speak${small ? " sm" : ""}`} onClick={toggle} aria-pressed={on} aria-label={small ? `${on ? "Detener" : label}: ${text.slice(0, 60)}` : undefined}>
      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 9v6h4l5 4V5L8 9H4zM17 9a4 4 0 0 1 0 6" /></svg>
      {on ? "Detener" : label}
    </button>
  );
}

/* ---------- Ejemplo anotado ---------- */
export function Annotated({ tramos }: { tramos: Tramo[] }) {
  return <>{tramos.map(([t, k], i) => <span key={i} className={k ? `k-${k}` : undefined} style={vars({ "--i": i })}>{t}</span>)}</>;
}
export function Formula() {
  return (
    <p className="formula" aria-label="Fórmula del logro: verbo de acción, más qué, dónde o para quién, más un dato, más el resultado">
      <span className="k-v">Verbo de acción</span><span className="op">+</span>
      <span className="k-q">qué, dónde o para quién</span><span className="op">+</span>
      <span className="k-d">un dato</span><span className="op">+</span>
      <span className="k-r">el resultado</span>
    </p>
  );
}

/* ---------- Pregunta de comprobación ---------- */
export function Quiz({ pregunta, opciones }: { pregunta: ReactNode; opciones: { texto: string; ok: boolean; fb: string }[] }) {
  const [sel, setSel] = useState<number | null>(null);
  return (
    <div className="quiz">
      <p className="quiz-q"><span className="label">Compruébalo</span>{pregunta}</p>
      <div className="quiz-opts">
        {opciones.map((o, i) => (
          <button key={i} type="button" aria-pressed={sel === i} className={sel === i ? (o.ok ? "right" : "wrong") : ""} onClick={() => setSel(i)}>{o.texto}</button>
        ))}
      </div>
      <p className="quiz-fb" aria-live="polite">{sel !== null && opciones[sel].fb}</p>
    </div>
  );
}

/* ---------- Respuesta segmentada en S/T/A/R ---------- */
const PARTES: Record<Parte, string> = { S: "Situación", T: "Tarea", A: "Acción", R: "Resultado", otro: "Otro" };
export function StarStrip({ segmentos }: { segmentos: Segmento[] }) {
  const presentes = new Set(segmentos.map((s) => s.parte));
  return (
    <div className="strip">
      <div className="strip-key" aria-label="Partes presentes en tu respuesta">
        {(["S", "T", "A", "R"] as const).map((p) => (
          <span key={p} data-p={p} className={presentes.has(p) ? "has" : ""} title={PARTES[p]}>
            <b>{p}</b>{PARTES[p]}<span className="sr-only">{presentes.has(p) ? " presente" : " falta"}</span>
          </span>
        ))}
      </div>
      <ol className="strip-text">
        {segmentos.map((s, i) => <li key={i} data-p={s.parte} style={vars({ "--i": i })}><span className="strip-tag">{PARTES[s.parte]}</span>{s.texto}</li>)}
      </ol>
    </div>
  );
}

/* ---------- Nota del tutor IA ---------- */
/** Nota del tutor IA. Sin respuesta, explica por qué (cupo por minuto o del día) u ofrece pedirla: la cuota gratuita es poca. */
/** Opinión del tutor IA sobre el intento que revisó. En los demás intentos el tutor acompaña con lo que ya preparó (pistas en su voz). */
export function TutorNote({ loading, retro }: { loading: boolean; retro: Retro | null; ia?: boolean }) {
  if (loading) return <div className="tutor loading" aria-live="polite"><Typing /> El tutor está leyendo lo que escribiste…</div>;
  if (!retro) return null;
  return (
    <div className="tutor" aria-live="polite">
      <p className="label">Tu tutor · escrito para ti</p>
      {retro.fortaleza && <p><b>Lo que ya funciona.</b> {retro.fortaleza}</p>}
      {retro.mejora && <p><b>Lo que más sumaría.</b> {retro.mejora}</p>}
      {retro.pregunta && <p className="tutor-q">{retro.pregunta}</p>}
      <p className="fine">El tutor orienta, pero no escribe por ti. Puede equivocarse: decide tú qué cambiar.</p>
    </div>
  );
}

export const Typing = () => <span className="typing" aria-hidden="true"><i /><i /><i /></span>;

