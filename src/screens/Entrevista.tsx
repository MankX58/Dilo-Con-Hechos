import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PUENTE_EJEMPLO, STAR_EJEMPLO } from "../content";
import { evalRepregunta, repreguntaLocal, score, trustSegments } from "../engine/rubric";
import { useIA } from "../ai/client";
import { useMomento } from "../ai/tutor";
import { AnswerBox, Checks, Guide, PuenteKey, Quiz, Score, Speak, StarStrip, TutorNote, Typing, Words, mayus, ParaQue } from "../components/ui";
import { cita, evalRespuesta, finalText, hola, progreso, useApp } from "../state";
import { Memoria } from "../components/Memoria";
import { comentariosRespuesta, comparar } from "../personal";
import { EtapaCerrada } from "../components/Continuar";
import { CheckDraw } from "./Taller";

export function Entrevista() {
  const { s, move } = useApp();
  if (!progreso(s).abierta.entrevista) return <EtapaCerrada etapa="entrevista" />;
  if (!s.vioLeccionStar) return <Leccion onDone={() => move((x) => ({ ...x, vioLeccionStar: true }))} />;
  if (s.pasoEntrevista >= 3) return <Cierre />;
  return <Pregunta key={s.pasoEntrevista} n={s.pasoEntrevista} />;
}

/** Momento 3 de 5: con tu hoja de vida ya escrita, el tutor prepara la pregunta sobre tu logro y una pista para cada pregunta.
 *  Se pide al llegar a la entrevista, mientras se lee la lección, para que esté lista al empezar. */
function usePreparar() {
  const { s, vacante, listos, preguntas } = useApp();
  return useMomento("preparar", Boolean(s.base), () => ({
    vacante: vacante?.titulo ?? "", busca: vacante?.busca ?? [], situacion: s.situacion ?? undefined,
    logros: listos.slice(0, 3).map((l) => ({ texto: finalText(l), habilidad: l.habilidad && l.habilidad !== "Otra habilidad" ? l.habilidad : "" })),
    hechos: s.logros.flatMap((l) => l.hechos.map((h) => `${h.q} ${h.a}`)).slice(0, 8),
    star: s.base?.star ?? "", tercera: preguntas[2].texto, puente: preguntas[2].tipo === "puente",
  }));
}

function Leccion({ onDone }: { onDone: () => void }) {
  const prep = usePreparar();
  const texto = "Cuando te piden un ejemplo, no respondas con cualidades. Cuenta una historia corta en cuatro partes: situación, tarea, acción y resultado. Habla en primera persona: qué hiciste tú. Debe durar entre uno y dos minutos. " + STAR_EJEMPLO.map((p) => p.texto).join(" ");
  return (
    <section className="narrow stack-lg">
      <header className="stack">
        <h2 tabIndex={-1}>Cuando te piden un ejemplo, cuenta una historia en cuatro partes</h2>
        <Speak text={texto} />
      </header>
      <Guide ia={Boolean(prep.data?.animo)}>{prep.data?.animo || "Lo que escribiste en tu hoja de vida es justo lo que te van a preguntar. Vamos a practicar cómo contarlo."}</Guide>
      <p>Preguntas como «Cuéntame de una vez que…» buscan hechos, no cualidades. El método <b>STAR</b> te ordena: Situación, Tarea, Acción y Resultado. La acción es la parte más larga y va en primera persona: qué hiciste <i>tú</i>. Entre uno y dos minutos.</p>
      <div className="sheet">
        <p className="label">Ejemplo · «Cuéntame de una vez que resolviste un problema»</p>
        <ol className="star-example">
          {STAR_EJEMPLO.map((p, i) => <li key={p.parte} data-p={p.parte} style={{ "--i": i } as CSSProperties}><b>{p.parte}</b><div><span>{p.nombre}</span>{p.texto}</div></li>)}
        </ol>
      </div>
      <Quiz
        pregunta="«En el colegio teníamos que entregar un proyecto y un compañero se retiró. Yo repartí sus tareas entre los demás y me quedé dos tardes adicionales». ¿Qué le falta?"
        opciones={[
          { texto: "La situación", ok: false, fb: "Esa parte sí está: el colegio y el compañero que se retiró. Fíjate en cómo termina." },
          { texto: "La acción", ok: false, fb: "Está: repartió tareas y se quedó dos tardes. Fíjate en cómo termina." },
          { texto: "El resultado", ok: true, fb: "Correcto. Sabemos qué pasó y qué hizo, pero no cómo acabó: ¿entregaron a tiempo?, ¿qué nota sacaron?" },
        ]}
      />
      <div className="actions"><button className="btn" onClick={onDone}>Empezar la entrevista</button></div>
    </section>
  );
}

const INTRO = [
  "Empecemos con una pregunta que casi siempre aparece. Es la misma del diagnóstico: así vas a notar la diferencia.",
  "Ahora la entrevistadora leyó tu hoja de vida y te pregunta por tu logro. Lo que escribiste, lo tienes que poder contar.",
  "Última pregunta, la que se relaciona directamente con la vacante.",
];

function Pregunta({ n }: { n: number }) {
  const { s, set, move, vacante, listos, preguntas, sinExperiencia } = useApp();
  const ia = useIA() === "activa";
  const resp = s.entrevista[n];
  const [texto, setTexto] = useState(resp?.intentos.at(-1) ?? "");
  const resultado = useRef<HTMLDivElement>(null);

  const prep = usePreparar();
  const { tipo } = preguntas[n];
  const pregunta = preguntas[n].texto;
  // La pregunta 2 sale de tu hoja de vida: si el tutor aún la está preparando, se espera un momento.
  const preparando = n === 1 && prep.cargando && !prep.data;
  const puente = tipo === "puente";
  // El tutor habla de lo que la persona ya escribió: su respuesta del diagnóstico, su logro y la habilidad que conectó.
  const habilidad = listos.map((l) => l.habilidad).find((h) => h && h !== "Otra habilidad") ?? null;
  const introPersonal =
    n === 0 && s.base?.star ? `En el diagnóstico respondiste «${cita(s.base.star, 10)}». Ahora cuéntalo como una historia con principio y final.`
    : n === 1 && listos[0] ? `Tu hoja de vida dice «${cita(finalText(listos[0]), 12)}». La entrevistadora quiere saber cómo lo lograste.`
    : n === 2 && habilidad ? `${INTRO[2]} En tu hoja de vida conectaste «${habilidad.toLowerCase()}» con este cargo: úsalo.`
    : INTRO[n];
  const pista = prep.data?.pistas?.[n]?.trim();

  const ultimo = resp?.intentos.at(-1);
  const anterior = resp && resp.intentos.length > 1 ? resp.intentos[resp.intentos.length - 2] : null;
  const revisado = ultimo !== undefined && ultimo === texto.trim();
  const ev = ultimo !== undefined ? evalRespuesta(ultimo, tipo, vacante?.claves) : null;
  const key = ultimo ? `${n}:${resp!.intentos.length}` : null;

  // Momento 4 de 5: la IA revisa tu primera respuesta STAR (partes, opinión, repregunta y un consejo para las demás).
  const primera = resp?.intentos[0];
  const star = useMomento("star", !puente && Boolean(primera), () => ({
    vacante: vacante?.titulo ?? "", logro: listos[0] ? finalText(listos[0]) : "", hechos: listos.flatMap((l) => l.hechos.map((h) => `${h.q} ${h.a}`)).slice(0, 8),
    pregunta, respuesta: primera ?? "", checks: evalRespuesta(primera ?? "", tipo, vacante?.claves).checks.map(({ label, ok }) => ({ label, ok })),
  }), `${n}|${primera}`);
  const retro = star.data && star.data._para === `${n}|${ultimo}` ? star.data : null;
  const leyendo = star.cargando && ultimo === primera && !star.data;
  const consejo = star.data && !retro ? star.data.para_las_siguientes?.trim() : "";
  const segmentos = ultimo && !puente ? trustSegments(ultimo, retro?.segmentos) : [];
  const lectura = ultimo && !puente ? comentariosRespuesta(ultimo, segmentos) : [];
  const cambio = ev && anterior ? comparar(evalRespuesta(anterior, tipo, vacante?.claves).checks, ev.checks) : null;
  useEffect(() => { if (key) resultado.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [key]);

  const responder = () => set((x) => {
    const e = [...x.entrevista];
    e[n] = { pregunta, tipo, intentos: [...(e[n]?.intentos ?? []), texto.trim()] };
    return { ...x, entrevista: e };
  });
  const siguiente = () => move((x) => ({ ...x, pasoEntrevista: n + 1 }));

  return (
    <section className="stack-lg">
      <header className="narrow stack-sm">
        <div className="progreso-fila">
          <div className="dots" aria-hidden="true">{[0, 1, 2].map((i) => <span key={i} className={i <= n ? "on" : ""} />)}</div>
          <p className="meta">Pregunta {n + 1} de 3{vacante ? ` · entrevista para ${vacante.titulo.toLowerCase()}` : ""}</p>
        </div>
        {n === 0 && <ParaQue>Practicar aquí, con calma, para que la entrevista real no te tome por sorpresa.</ParaQue>}
      </header>
      <div className="work">
        <div className="stack-lg">
          <Guide ia={Boolean(pista || consejo)} pensando={preparando}>
            {puente
              ? `Esta es la pregunta que más asusta cuando no has trabajado como ${vacante?.titulo.toLowerCase() ?? "en el cargo"}. Tranquilidad: tiene una forma clara de responderse${habilidad ? `, y ya conectaste «${habilidad.toLowerCase()}» con este cargo en tu hoja de vida: ese es tu puente` : ", y ya tienes con qué"}.`
              : introPersonal}
            {sinExperiencia && !puente && n === 2 && " Cuenta una experiencia de tu vida, no tiene que ser de un trabajo."}
            {pista && ` ${pista}`}
            {consejo && n > 0 && ` Y recuerda: ${consejo.charAt(0).toLowerCase()}${consejo.slice(1)}`}
          </Guide>
          <div className="interviewer">
            <p className="interviewer-who">Entrevistadora · simulación</p>
            {preparando
              ? <p className="interviewer-q muted-on-dark"><Typing /> Leyendo tu hoja de vida…</p>
              : <h2 tabIndex={-1} className="interviewer-q" key={pregunta}><Words text={pregunta} /></h2>}
            {!preparando && <Speak text={pregunta} label="Escuchar la pregunta" />}
          </div>
          {n === 0 && s.base?.star && (
            <details className="prev"><summary>Ver lo que respondiste en el diagnóstico</summary><p>{s.base.star}</p></details>
          )}
          {puente ? (
            <details className="guide" open>
              <summary>Cómo responder: el puente</summary>
              <ol className="bridge-example">
                {PUENTE_EJEMPLO.map((p) => <li key={p.parte}><b>{p.parte}</b><span>{p.idea}</span><em>«{p.texto}»</em></li>)}
              </ol>
              {listos.some((l) => l.habilidad) && (
                <p className="small">Pista: en tu hoja de vida ya conectaste {listos.filter((l) => l.habilidad && l.habilidad !== "Otra habilidad").map((l) => `«${l.habilidad}»`).join(" y ") || "una habilidad"} con esta vacante. Úsalo.</p>
              )}
            </details>
          ) : (
            <details className="guide" open={n === 0}>
              <summary>Guía STAR para esta respuesta</summary>
              <ol>
                <li><b>S</b> ¿Dónde estabas y qué pasó? Una o dos frases.</li>
                <li><b>T</b> ¿Qué tenías que lograr o cuál era el problema?</li>
                <li><b>A</b> ¿Qué hiciste tú, paso a paso? Es la parte más larga.</li>
                <li><b>R</b> ¿Cómo terminó? Si puedes, con un dato.</li>
              </ol>
            </details>
          )}
          <AnswerBox id={`resp-${n}`} rows={7} tiempo value={texto} onChange={setTexto} label="Tu respuesta" hint="Escríbela o díctala como la dirías en voz alta." />
          <div className="actions">
            <button className="btn" disabled={!texto.trim() || revisado || preparando} onClick={responder}>{revisado ? "Revisada" : resp ? "Revisar de nuevo" : "Responder"}</button>
            {resp && <span className="tries">Intentos: {resp.intentos.map((t, i) => `${i + 1}º ${score(evalRespuesta(t, tipo, vacante?.claves).checks)}/5`).join(" · ")}</span>}
          </div>

          {ev && (
            <div className="stack result" ref={resultado} key={key} aria-live="polite">
              <p className="label">{puente ? "Las tres partes del puente" : "Así se escucha tu respuesta, parte por parte"}</p>
              {puente ? <PuenteKey checks={ev.checks} /> : <StarStrip segmentos={segmentos} />}
              <Score checks={ev.checks} />
              {cambio && <p className="cambio">{cambio}</p>}
              <Checks checks={ev.checks} />
              <TutorNote ia={ia} loading={leyendo} retro={retro} />
              {!retro && !leyendo && !puente && lectura.length > 0 && (
                <div className="lectura"><p className="label">Lo que leí en tu respuesta</p><ul>{lectura.map((c) => <li key={c}>{c}</li>)}</ul></div>
              )}
              {!retro && !leyendo && (consejo || (puente && pista)) && <p className="tutor-mini">{puente ? pista : consejo}</p>}
              {!puente && ultimo && <Repregunta key={key} respuesta={ultimo} deIA={retro?.repregunta?.trim()} />}
              <div className={ev.pasa ? "win stack" : "stack"}>
                {ev.pasa && <div className="win-head"><CheckDraw /><h3>{puente ? "Tu respuesta tiene un buen puente" : "Tu respuesta tiene estructura STAR"}</h3></div>}
                <div className="actions">
                  <button className="btn" onClick={siguiente}>{n < 2 ? "Siguiente pregunta" : "Terminar la entrevista"}</button>
                  {!ev.pasa && <span className="small muted">O mejora tu respuesta arriba y revísala otra vez.</span>}
                </div>
              </div>
            </div>
          )}
        </div>
        <aside className="margin">
          <Memoria />
          <div className="note">
            <p className="label">Nota del tutor</p>
            {puente ? (
              <ul>
                <li>No escondas que no has trabajado: lo saben por tu hoja de vida.</li>
                <li>Nada de «lo siento» ni «no sé nada».</li>
                <li>Un hecho tuyo vale más que diez cualidades.</li>
                <li>Cierra con cómo vas a aprender.</li>
              </ul>
            ) : (
              <ul>
                <li>Elige un caso real, aunque sea pequeño.</li>
                <li>Si trabajaste en grupo, di qué hiciste tú.</li>
                <li>Termina con lo que cambió.</li>
                <li>Léela en voz alta: entre 60 y 120 segundos es ideal.</li>
              </ul>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

/** En una entrevista real siempre hay una repregunta. Si la IA revisó esta respuesta, ya la dejó escrita; si no, se pide lo que más falta. */
function Repregunta({ respuesta, deIA }: { respuesta: string; deIA?: string }) {
  const [abierta, setAbierta] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviado, setEnviado] = useState("");
  const rep = deIA || repreguntaLocal(respuesta);
  const check = enviado ? evalRepregunta(enviado) : null;

  if (!abierta) {
    return (
      <div className="rep-invite">
        <p><b>En una entrevista real casi siempre hay una repregunta.</b> ¿Practicas una?</p>
        <button type="button" className="btn ghost sm" onClick={() => setAbierta(true)}>Practicar la repregunta</button>
      </div>
    );
  }
  return (
    <div className="rep stack">
      <div className="interviewer small-card">
        <p className="interviewer-who">La entrevistadora repregunta</p>
        {rep ? <p className="interviewer-q" key={rep}><Words text={rep} /></p> : <p className="interviewer-q muted-on-dark"><Typing /> Pensando en tu respuesta…</p>}
        {rep && <Speak text={rep} label="Escuchar" />}
      </div>
      {rep && (
        <>
          <AnswerBox id="rep-resp" rows={3} value={texto} onChange={setTexto} label="Tu respuesta corta" hint="Una o dos frases, con un detalle concreto." />
          <div className="actions">
            <button className="btn sm" disabled={!texto.trim() || texto.trim() === enviado} onClick={() => setEnviado(texto.trim())}>Responder</button>
          </div>
          {check && <Checks checks={[check]} />}
        </>
      )}
    </div>
  );
}

function Cierre() {
  const { s, move, go, vacante } = useApp();
  // La pregunta donde más mejoró, con sus propios números.
  const avance = s.entrevista
    .map((r) => ({ r, a: score(evalRespuesta(r.intentos[0] ?? "", r.tipo, vacante?.claves).checks), b: score(evalRespuesta(r.intentos.at(-1) ?? "", r.tipo, vacante?.claves).checks) }))
    .filter((x) => x.b > x.a)
    .sort((x, y) => (y.b - y.a) - (x.b - x.a))[0];
  return (
    <section className="narrow stack-lg">
      <header className="stack">
        <h2 tabIndex={-1}>Terminaste la entrevista de práctica</h2>
      </header>
      <ol className="recap">
        {s.entrevista.map((r, i) => {
          const c = evalRespuesta(r.intentos.at(-1) ?? "", r.tipo, vacante?.claves).checks;
          return <li key={i}><p className="recap-q">{r.pregunta}</p><p className="small muted">{score(c)} de 5 criterios · {r.intentos.length} {r.intentos.length === 1 ? "intento" : "intentos"}</p></li>;
        })}
      </ol>
      <Guide>
        {mayus(`${hola(s)}respondiste las 3 preguntas.`)}
        {avance && ` En «${cita(avance.r.pregunta, 7)}» pasaste de ${avance.a} a ${avance.b} criterios de 5.`}
        {" "}Ahora viene la prueba final: un caso nuevo y una pregunta nueva, sin medidor, sin guía y sin mí. Es la forma de saber si ya lo puedes hacer por tu cuenta.
      </Guide>
      <div className="actions">
        <button className="btn" onClick={() => go("prueba")}>Ir a la prueba final</button>
        <button className="btn ghost" onClick={() => move((x) => ({ ...x, pasoEntrevista: 0 }))}>Repasar las preguntas</button>
      </div>
    </section>
  );
}
