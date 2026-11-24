import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PERFILES, type PerfilId } from "../content";
import { ExperienciaBox, OrigenPicker } from "../components/Origen";
import { evalLogro, passLogro, type LogroCriterio } from "../engine/rubric";
import { useIA } from "../ai/client";
import { entradaConocer, useMomento } from "../ai/tutor";
import { Annotated, AnswerBox, Checks, Formula, Guide, Icon, Meter, Quiz, Score, Speak, TutorNote, Typing, mayus, minus, ParaQue } from "../components/ui";
import { cita, conExp, finalText, hola, nuevoLogro, rolDe, textoExp, useApp, withTransition, type Logro } from "../state";
import { Memoria } from "../components/Memoria";
import { comparar, pistaPersonal } from "../personal";

export function Taller() {
  const { s, move } = useApp();
  if (!s.base) return <Falta />;
  if (!s.vioLeccionLogro) return <Leccion origen={s.base.origen} onDone={() => move((x) => ({ ...x, vioLeccionLogro: true }))} />;
  const actual = s.logros.find((l) => l.fase !== "listo");
  return actual ? <Ejercicio key={actual.id} logro={actual} /> : <Hecho />;
}

function Falta() {
  const { go } = useApp();
  return (
    <section className="narrow stack">
      <h2 tabIndex={-1}>Primero, el diagnóstico</h2>
      <p>El taller trabaja con la experiencia que escribas en el diagnóstico.</p>
      <div className="actions"><button className="btn" onClick={() => go("diagnostico")}>Ir al diagnóstico</button></div>
    </section>
  );
}

function Leccion({ origen, onDone }: { origen: PerfilId; onDone: () => void }) {
  const { s, sinExperiencia, vacante } = useApp();
  const p = PERFILES[origen];
  const c = s.tutor.conocer;
  const texto = `Una tarea dice lo que te tocaba. Un logro dice lo que pasó gracias a ti. Quien revisa hojas de vida lee decenas en pocos minutos. Atendía clientes lo escribe cualquiera. Un logro tiene cuatro partes: un verbo de acción, qué hiciste y dónde o para quién, un dato, y el resultado. Por ejemplo: ${p.logro.map(([t]) => t).join("")}`;
  return (
    <section className="narrow stack-lg">
      <header className="stack">
        <h2 tabIndex={-1}>Una tarea dice lo que te tocaba. Un logro dice lo que pasó gracias a ti.</h2>
        <Speak text={texto} />
      </header>
      <Guide ia={Boolean(c?.enfoque)}>{c?.enfoque ? `Antes de empezar, piensa en lo tuyo: ${minus(c.enfoque)}` : "Primero, una idea que cambia cómo te ven. Después la aplicamos a tu experiencia, paso a paso."}</Guide>
      <p>Quien revisa hojas de vida lee decenas en pocos minutos. «Atendía clientes» lo escribe cualquiera. Un logro muestra qué hiciste, cuánto y qué cambió. Tiene cuatro partes:</p>
      <Formula />
      <div className="compare">
        <div><p className="label">Tarea</p><p className="specimen weak">{p.tarea}</p></div>
        <div><p className="label">Logro · ejemplo para tu tipo de experiencia</p><p className="specimen"><Annotated tramos={p.logro} /></p></div>
      </div>
      {sinExperiencia && (
        <div className="callout">
          <p className="label">Si no has trabajado como {vacante?.titulo.toLowerCase() ?? "en este cargo"}</p>
          <p>No importa. Un logro de la casa, el colegio o el barrio puede mostrar justo lo que busca la vacante. Lo que se contrata es la habilidad. Por eso, al terminar cada logro vas a decir qué habilidad del aviso demuestra.</p>
        </div>
      )}
      <p className="small muted">Los ejemplos son ilustrativos. Tus datos deben ser reales: si no sabes la cifra exacta, usa una aproximación honesta («unos 40», «casi todos los días»).</p>
      <Quiz
        pregunta="¿Cuál de estas dos líneas le dice más a quien contrata?"
        opciones={[
          { texto: "Responsable, puntual y con ganas de aprender. Trabajé en un restaurante.", ok: false, fb: "Esa línea solo lista cualidades: cualquiera puede escribirlas y nadie puede comprobarlas." },
          { texto: "Preparé y despaché unos 70 almuerzos diarios en un restaurante de Envigado, sin devoluciones de pedidos durante 6 meses.", ok: true, fb: "Correcto. Tiene verbo de acción, lugar, un dato (70 almuerzos diarios, 6 meses) y un resultado (sin devoluciones)." },
        ]}
      />
      <div className="actions"><button className="btn" onClick={onDone}>Ahora con tu experiencia</button></div>
    </section>
  );
}

const ORDEN: LogroCriterio[] = ["dato", "resultado", "concreto", "verbo"];

function Ejercicio({ logro }: { logro: Logro }) {
  const { s, set, vacante, listos } = useApp();
  const deCv = logro.cv ? s.hv.experiencia[logro.id] : null;
  // Una experiencia en cola se puede dejar para después: vuelve a la lista de la hoja subida, tal como estaba.
  const saltar = () => withTransition(() => set((x) => ({
    ...x, logros: x.logros.filter((l) => l.id !== logro.id),
    cvSubida: x.cvSubida && { ...x.cvSubida, experiencias: x.cvSubida.experiencias.map((e) => (e.id === logro.cv ? { ...e, usada: false } : e)) },
  })));
  const ia = useIA() === "activa";
  const perfil = PERFILES[logro.origen];
  const vacTitulo = vacante?.titulo ?? "un primer empleo";
  const paso = logro.fase === "contar" ? 1 : logro.fase === "hechos" ? 2 : 3;
  const titulo = paso === 1 ? "Cuéntame qué hacías" : paso === 2 ? "Reunamos los hechos" : "Escribe tu logro";

  return (
    <section className="stack-lg">
      <header className="narrow stack-sm">
        <h2 tabIndex={-1}>{titulo}</h2>
        <p className="meta">
          {s.logros.length > 1 ? `Experiencia ${listos.length + 1} de ${s.logros.length}` : "Tu primera experiencia"}
          {deCv && <> · de tu hoja de vida: <b>{deCv.rol || "experiencia"}</b>{deCv.lugar && ` en ${deCv.lugar}`}</>}
          {deCv && listos.length > 0 && <> · <button type="button" className="link" onClick={saltar}>Dejarla para después</button></>}
        </p>
        <ol className="mini-steps" aria-label={`Paso ${paso} de 3`}>
          {["Contar", "Hechos", "Escribir"].map((n, i) => <li key={n} className={i + 1 < paso ? "done" : i + 1 === paso ? "now" : ""}>{n}</li>)}
        </ol>
        <ParaQue>Un logro con datos hace que quien contrata se acuerde de ti entre decenas de hojas de vida.</ParaQue>
      </header>
      <div key={logro.fase} className="step">
        {logro.fase === "contar" && <Contar logro={logro} />}
        {logro.fase === "hechos" && <Hechos logro={logro} vacante={vacTitulo} ia={ia} preguntasLocales={ORDEN.filter((c) => !evalLogro(logro.crudo).find((x) => x.id === c)?.ok).slice(0, 3).map((c) => perfil.preguntas[c])} />}
        {logro.fase === "escribir" && <Escribir logro={logro} vacante={vacTitulo} ia={ia} />}
      </div>
    </section>
  );
}

function Contar({ logro }: { logro: Logro }) {
  const { s, set, move } = useApp();
  const [origen, setOrigen] = useState<PerfilId | null>(logro.crudo ? logro.origen : null);
  const [txt, setTxt] = useState(logro.crudo);
  const [desdeCv, setDesdeCv] = useState<string | null>(null);
  const pendientes = s.cvSubida?.experiencias.filter((e) => !e.usada) ?? [];
  return (
    <div className="narrow stack-lg">
      <Guide>{pendientes.length
        ? "Otra experiencia suma. Puedes mejorar una de las que ya tenías en tu hoja de vida o contarme una nueva."
        : "Otra experiencia suma. Puede ser de un trabajo, la casa, el colegio o el barrio. Cuéntamela con tus palabras, como se la contarías a un amigo."}</Guide>
      {pendientes.length > 0 && (
        <div className="desde-cv">
          <p className="label">De tu hoja de vida, sin mejorar todavía</p>
          <div className="desde-cv-lista">
            {pendientes.map((e) => (
              <button type="button" key={e.id} className={`desde-cv-item${desdeCv === e.id ? " on" : ""}`} aria-pressed={desdeCv === e.id} onClick={() => { setTxt(textoExp(e)); setDesdeCv(e.id); }}>
                <b>{e.cargo || "Experiencia"}{e.lugar && ` · ${e.lugar}`}</b>{e.descripcion && <span>{cita(e.descripcion, 14)}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
      <fieldset className="stack">
        <legend className="field">¿Dónde fue esta experiencia?</legend>
        <OrigenPicker name="origen-n" value={origen} onChange={setOrigen} situacion={s.situacion} />
      </fieldset>
      {origen && (
        <ExperienciaBox id="contar" origen={origen} value={txt} onChange={setTxt}
          label="Cuéntalo con tus palabras, en una o dos líneas." hint="No tiene que quedar perfecto: en los siguientes pasos lo vas a mejorar." />
      )}
      <div className="actions">
        <button className="btn" disabled={!origen || !txt.trim()} onClick={() => origen && move((x) => {
          const nuevo = { ...logro, origen, crudo: txt.trim(), borrador: txt.trim(), fase: "hechos" as const, cv: desdeCv ?? undefined };
          return conExp({ ...x, logros: x.logros.map((l) => (l.id === logro.id ? nuevo : l)) }, nuevo, x.cvSubida?.experiencias.find((e) => e.id === desdeCv));
        })}>Seguir</button>
        <button className="btn ghost" onClick={() => withTransition(() => set((x) => ({ ...x, logros: x.logros.filter((l) => l.id !== logro.id) })))}>Mejor no agregar otra</button>
      </div>
    </div>
  );
}

/** El tutor pregunta de a una, como en una conversación; las respuestas se vuelven la materia prima del logro. */
function Hechos({ logro, vacante, ia, preguntasLocales }: { logro: Logro; vacante: string; ia: boolean; preguntasLocales: string[] }) {
  const { s, move } = useApp();
  // El primer logro usa las preguntas que el tutor preparó al conocerte; los siguientes, las del revisor.
  const esPrimero = s.logros[0]?.id === logro.id;
  const conocer = useMomento("conocer", esPrimero, () => entradaConocer(s));
  const deIA = esPrimero ? conocer.data?.preguntas?.filter((p) => typeof p.texto === "string" && p.texto.trim()).slice(0, 3).map((p) => p.texto) : undefined;
  const preguntas = deIA?.length ? deIA : preguntasLocales.length ? preguntasLocales : ["¿Hay algún dato o resultado que haga más fuerte esta experiencia?"];
  const [resp, setResp] = useState<string[]>([]);
  const [actual, setActual] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const idx = resp.length;
  const esperando = ia && esPrimero && conocer.cargando;
  useEffect(() => { if (!esperando) input.current?.focus({ preventScroll: true }); }, [idx, esperando]);

  const responder = (a: string) => { setResp((r) => [...r, a.trim()]); setActual(""); };
  const hechos = preguntas.map((q, i) => ({ q, a: resp[i] ?? "" })).filter((h) => h.a);

  return (
    <div className="work">
      <div className="stack-lg">
        <blockquote className="quote"><p className="label">Lo que escribiste</p>{logro.crudo}</blockquote>
        {esperando ? (
          <div className="tutor loading" aria-live="polite"><Typing /> El tutor está leyendo tu experiencia…</div>
        ) : (
          <div className="convo" aria-live="polite">
            <Guide ia={Boolean(deIA?.length)}>{deIA?.length ? "Leí lo que escribiste y tengo" : "Te voy a hacer"} {preguntas.length === 1 ? "una pregunta" : `${preguntas.length} preguntas cortas`} para encontrar los datos que hacen fuerte tu experiencia. Si no sabes una respuesta, dilo: nunca inventes cifras.</Guide>
            {preguntas.slice(0, idx).map((q, i) => (
              <div key={q} className="turn">
                <p className="turn-q">{q}</p>
                <p className={`turn-a${resp[i] ? "" : " empty"}`}>{resp[i] || "No lo sé"}</p>
              </div>
            ))}
            {idx < preguntas.length ? (
              <form key={idx} className="turn current" onSubmit={(e) => { e.preventDefault(); if (actual.trim()) responder(actual); }}>
                <label className="turn-q big" htmlFor="hecho-actual"><span className="turn-n">{idx + 1}/{preguntas.length}</span>{preguntas[idx]}</label>
                <input id="hecho-actual" ref={input} className="input" value={actual} onChange={(e) => setActual(e.target.value)} placeholder="Respuesta corta" autoComplete="off" />
                <div className="actions">
                  <button className="btn sm" type="submit" disabled={!actual.trim()}>Responder</button>
                  <button className="btn ghost sm" type="button" onClick={() => responder("")}>No lo sé</button>
                </div>
              </form>
            ) : (
              <div className="turn done stack">
                <p>{hechos.length ? "Listo. Con esto ya tienes la materia prima de tu logro." : "No pasa nada. Igual vas a poder escribir tu logro con lo que recuerdes."}</p>
                <div className="actions">
                  <button className="btn" onClick={() => move((x) => ({ ...x, logros: x.logros.map((l) => (l.id === logro.id ? { ...l, fase: "escribir", hechos } : l)) }))}>Escribir mi logro</button>
                  <button className="btn ghost sm" onClick={() => { setResp([]); setActual(""); }}>Responder de nuevo</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <aside className="margin">
        <Memoria />
        <div className="note">
          <p className="label">Por qué estas preguntas</p>
          <p>Tus respuestas se vuelven fichas que usas en el siguiente paso para escribir el logro con tus palabras.</p>
          <p className="small muted">{ia && deIA?.length ? "Preguntas hechas por el tutor IA a partir de lo que escribiste." : "Preguntas del revisor por criterios según lo que le falta a tu texto."}</p>
        </div>
      </aside>
    </div>
  );
}

function Escribir({ logro, vacante, ia }: { logro: Logro; vacante: string; ia: boolean }) {
  const { s, updateLogro, go, move, vacante: vac } = useApp();
  const ref = useRef<HTMLTextAreaElement>(null);
  const resultado = useRef<HTMLDivElement>(null);
  const [texto, setTexto] = useState(logro.borrador);
  const [habilidad, setHabilidad] = useState<string | null>(logro.habilidad ?? null);
  const [flash, setFlash] = useState(0);
  const live = evalLogro(texto);
  const ultimo = logro.intentos[logro.intentos.length - 1];
  const anterior = logro.intentos.length > 1 ? logro.intentos[logro.intentos.length - 2] : null;
  const revisado = ultimo !== undefined && ultimo === texto.trim();
  const checks = ultimo !== undefined ? evalLogro(ultimo) : null;
  const ok = checks ? passLogro(checks) : false;
  const cambio = checks && anterior ? comparar(evalLogro(anterior), checks) : null;
  const perfil = PERFILES[logro.origen];
  const falta = checks?.find((c) => !c.ok);
  const key = ultimo ? `${logro.id}:${logro.intentos.length}` : null;
  // Momento 2 de 5: la IA revisa el primer intento del primer logro. Su pista y su felicitación
  // acompañan los intentos siguientes sin volver a consultarla.
  const esPrimero = s.logros[0]?.id === logro.id;
  const primero = logro.intentos[0];
  const mom = useMomento("logro", esPrimero && Boolean(primero), () => ({
    vacante, busca: vac?.busca ?? [], situacion: s.situacion ?? undefined, experiencia: logro.crudo,
    hechos: logro.hechos.map((h) => `${h.q} ${h.a}`), enunciado: primero, checks: evalLogro(primero).map(({ label, ok }) => ({ label, ok })),
  }), primero);
  const ai = esPrimero ? mom.data : null;
  const retro = ai && ai._para === ultimo ? ai : null;
  const leyendo = esPrimero && mom.cargando && ultimo === primero;
  useEffect(() => { const t = setTimeout(() => updateLogro(logro.id, (l) => ({ ...l, borrador: texto })), 400); return () => clearTimeout(t); }, [texto]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (key) resultado.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [key]);

  function insertar(a: string) {
    const el = ref.current;
    const at = el?.selectionStart ?? texto.length;
    const antes = texto.slice(0, at), despues = texto.slice(at);
    const pieza = (antes && !/\s$/.test(antes) ? " " : "") + a + (despues && !/^\s/.test(despues) ? " " : "");
    setTexto(antes + pieza + despues);
    setFlash((f) => f + 1);
    requestAnimationFrame(() => { el?.focus(); const p = (antes + pieza).length; el?.setSelectionRange(p, p); });
  }
  // Un comienzo de dos palabras («asd») no sirve de comparación: se reconoce que empezó de cero.
  const antesUtil = logro.crudo.trim().split(/\s+/).length >= 3 && logro.crudo.trim() !== ultimo?.trim();
  const agregar = () => move((x) => ({ ...x, logros: x.logros.map((l) => (l.id === logro.id ? { ...l, fase: "listo", habilidad } : l)) }));

  return (
    <div className="work">
      <div className="stack-lg">
        <Guide ia={Boolean(ok && ai?.al_lograrlo)}>{logro.intentos.length === 0
          ? (logro.hechos.length ? `Me contaste ${logro.hechos.map((h) => `«${h.a}»`).join(" y ")}. Con eso ya tienes casi todo: úsalo para escribir tu logro. Toca cada ficha para ponerla donde está el cursor.` : "Ahora te toca a ti. Escribe tu logro con lo que recuerdes; las barras se encienden a medida que cumples cada parte.")
          : ok ? (ai?.al_lograrlo || "Muy bien. Ese logro ya dice qué hiciste, cuánto y qué cambió.")
          : "Vas bien. Mira qué criterio falta y ajusta solo eso."}</Guide>
        <blockquote className="quote"><p className="label">Lo que escribiste al principio</p>{logro.crudo}</blockquote>
        {logro.hechos.length > 0 && (
          <div className="stack-sm">
            <p className="label">Tus datos · tócalos para ponerlos en tu frase</p>
            <div className="facts-chips">{logro.hechos.map((h, i) => <button key={h.q} type="button" className="fact" style={{ "--i": i } as CSSProperties} onClick={() => insertar(h.a)} title={h.q}>{h.a}</button>)}</div>
          </div>
        )}
        <div className={flash ? "flash" : ""} key={flash}>
          <AnswerBox id={`logro-${logro.id}`} rows={3} value={texto} onChange={setTexto} textareaRef={ref}
            label="Reescríbelo como un logro" hint="Verbo de acción + qué, dónde o para quién + un dato + el resultado. Una o dos líneas." />
        </div>
        <Meter checks={live} />
        {texto.trim() && !revisado && (
          <p className="meter-falta" aria-live="polite">
            {live.every((c) => c.ok) ? "Ya tiene las 4 partes. Revísalo para confirmarlo." : `Te falta: ${live.filter((c) => !c.ok).map((c) => c.label.toLowerCase()).join(", ")}.`}
          </p>
        )}
        <div className="actions">
          <button className="btn" disabled={!texto.trim() || revisado} onClick={() => updateLogro(logro.id, (l) => ({ ...l, intentos: [...l.intentos, texto.trim()] }))}>
            {revisado ? "Cambia algo para revisar de nuevo" : logro.intentos.length ? "Revisar de nuevo" : "Revisar mi logro"}
          </button>
          {logro.intentos.length > 0 && <span className="tries">{logro.intentos.map((t, i) => `Intento ${i + 1}: ${evalLogro(t).filter((c) => c.ok).length} de 4`).join(" · ")}</span>}
        </div>

        {checks && (
          <div className="stack result" ref={resultado} key={key} aria-live="polite">
            <Score checks={checks} />
            {cambio && <p className="cambio">{cambio}</p>}
            <Checks checks={checks} />
            <TutorNote ia={ia} loading={leyendo} retro={retro} />
            {!ok && !retro && !leyendo && ai?.si_te_trabas && <p className="tutor-mini">{ai.si_te_trabas}</p>}
            {!ok && falta && !retro && !leyendo && <div className="ask"><p className="label">Pregunta del tutor</p><p>{pistaPersonal(checks!, logro.hechos, logro.crudo) ?? perfil.preguntas[falta.id as LogroCriterio]}</p></div>}
            {!ok && logro.intentos.length >= 3 && (
              <p className="small muted">¿Te trabaste? Puedes <button className="link" onClick={() => go("entrevista")}>seguir a la entrevista</button> y volver a este logro después desde «Taller de logros».</p>
            )}
            {ok && (
              <div className="win">
                <div className="win-head">
                  <CheckDraw />
                  <div>
                    <h3>Tu logro cumple los 4 criterios</h3>
                    <p className="win-sub">{logro.intentos.length > 1 ? `Lo lograste en ${logro.intentos.length} intentos.` : "A la primera."} Así se va a leer en tu hoja de vida:</p>
                  </div>
                </div>
                <figure className="win-logro">
                  <blockquote className="specimen" style={{ viewTransitionName: `logro-${logro.id}` }}>{ultimo}</blockquote>
                  <figcaption>
                    {antesUtil
                      ? <>Empezaste con <span className="win-antes">«{cita(logro.crudo, 18)}»</span></>
                      : "Empezaste casi en blanco: todo lo que dice ahora lo escribiste aquí."}
                  </figcaption>
                </figure>
                {ai?.al_lograrlo && <p className="tutor-mini">{ai.al_lograrlo}</p>}
                {vac && (
                  <fieldset className="demuestra">
                    <legend className="field">¿Qué pide el aviso de {vac.titulo.toLowerCase()} que esto demuestra?</legend>
                    <div className="demuestra-ops">
                      {[...vac.busca, "Otra habilidad"].map((b) => (
                        <label key={b} className={`pill${b === "Otra habilidad" ? " otra" : ""}`}>
                          <input type="radio" name={`hab-${logro.id}`} checked={habilidad === b} onChange={() => setHabilidad(b)} />
                          {habilidad === b && <Icon name="check" size={15} />}{b === "Otra habilidad" ? "Otra" : b}
                        </label>
                      ))}
                    </div>
                    <p className="small muted">{s.situacion === "parecido" ? "Queda escrito debajo del logro, para que quien lea vea la relación de inmediato." : "Este es tu puente: aunque no hayas trabajado en el cargo, ya demuestras algo que piden."}</p>
                  </fieldset>
                )}
                <div className="actions">
                  <button className="btn" disabled={Boolean(vac) && !habilidad} onClick={agregar}>Agregar a mi hoja de vida <Icon name="derecha" /></button>
                  {vac && !habilidad && <span className="small muted">Primero elige qué demuestra.</span>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <aside className="margin">
        <Memoria />
        <div className="note">
          <p className="label">Recuerda</p>
          <p>Verbo de acción + qué hiciste + un dato + el resultado. Evita «responsable» o «proactivo»: muéstralo con un hecho.</p>
        </div>
      </aside>
    </div>
  );
}

export const CheckDraw = () => (
  <svg className="check-draw" viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
    <circle cx="18" cy="18" r="16" />
    <path d="M10.5 18.5l5 5 10-11" />
  </svg>
);

function Hecho() {
  const { s, set, go, listos, vacante } = useApp();
  const ultimo = listos[listos.length - 1];
  const intentos = ultimo?.intentos.length ?? 0;
  const habilidad = ultimo?.habilidad && ultimo.habilidad !== "Otra habilidad" ? ultimo.habilidad : null;
  const recorrido = ultimo
    ? `${hola(s)}empezaste con «${cita(ultimo.crudo, 10)}» y ${intentos > 1 ? `en ${intentos} intentos` : "a la primera"} lo convertiste en un logro${habilidad && vacante ? ` que demuestra «${habilidad.toLowerCase()}», justo lo que pide la vacante de ${vacante.titulo.toLowerCase()}` : ""}.`
    : "";
  return (
    <section className="narrow stack-lg">
      <header className="stack">
        <h2 tabIndex={-1}>{listos.length === 1 ? "Tu primer logro ya está en tu hoja de vida" : `Tu hoja de vida tiene ${listos.length} logros`}</h2>
      </header>
      {ultimo && (
        <div className={ultimo.crudo.trim().split(/\s+/).length >= 3 ? "two" : ""}>
          {ultimo.crudo.trim().split(/\s+/).length >= 3 && <div className="sheet"><p className="label">Antes</p><p className="specimen weak small-specimen">{ultimo.crudo}</p></div>}
          <div className="sheet"><p className="label">Ahora · {rolDe(ultimo)}</p><p className="specimen small-specimen">{finalText(ultimo)}</p>{ultimo.habilidad && <p className="cv-skill">Demuestra: {ultimo.habilidad}</p>}</div>
        </div>
      )}
      <Guide>
        {recorrido && `${mayus(recorrido)} `}En la entrevista te van a preguntar por eso, así que el siguiente paso es aprender a contarlo.
        {listos.length < 3 && " Si quieres, antes puedes agregar otra experiencia: dos o tres logros hacen una hoja de vida más fuerte."}
      </Guide>
      <div className="actions">
        <button className="btn" onClick={() => go("entrevista")}>Ir a la entrevista</button>
        {listos.length < 3 && s.base && (
          <button className="btn ghost" onClick={() => withTransition(() => { set((x) => ({ ...x, logros: [...x.logros, nuevoLogro(x.base!.origen, "")] })); window.scrollTo(0, 0); })}>Agregar otra experiencia</button>
        )}
      </div>
    </section>
  );
}
