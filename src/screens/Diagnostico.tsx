import { useState, type CSSProperties } from "react";
import { PERFILES, PREGUNTA_BASE, SITUACIONES, adivinarOrigen, type PerfilId } from "../content";
import { entradaConocer, useMomento } from "../ai/tutor";
import { ExperienciaBox, OrigenPicker } from "../components/Origen";
import { evalLogro, evalStar, score } from "../engine/rubric";
import { AnswerBox, Checks, Guide, Icon, Score, Speak, Words, mayus, ParaQue } from "../components/ui";
import { Tablero, vacanteLista } from "../components/Tablero";
import { COLA_CV, SubirCV } from "../components/SubirCV";
import { conExp, hola, nuevoLogro, textoExp, useApp, withTransition, type State } from "../state";

const PASOS = 4;

export function Diagnostico() {
  const { s, set, go, vacante } = useApp();
  const [paso, setPasoRaw] = useState(s.base ? PASOS : s.situacion ? 2 : s.vacante ? 1 : 0);
  const [origen, setOrigen] = useState<PerfilId | null>(s.base?.origen ?? null);
  const [cv, setCv] = useState(s.base?.cv ?? "");
  const [star, setStar] = useState(s.base?.star ?? "");
  const [desdeCv, setDesdeCv] = useState("");
  const [desdeExp, setDesdeExp] = useState<string | null>(null);
  // Camino del paso 2: subir la hoja de vida o escribir la experiencia. Al volver, se recuerda el que ya se usó.
  const [via, setVia] = useState<"cv" | "escribir" | null>(s.cvSubida ? "cv" : s.base ? "escribir" : null);
  const [cambiarOrigen, setCambiarOrigen] = useState(false);
  const setPaso = (n: number) => withTransition(() => { setPasoRaw(n); window.scrollTo(0, 0); });

  const terminar = () => {
    if (!origen) return;
    withTransition(() => {
      set((x) => {
        // La experiencia elegida de la hoja subida (y, si quiso mejorarlas todas, las siguientes) llegan al taller con su cargo, lugar y fechas.
        const exps = x.cvSubida?.experiencias ?? [];
        const elegida = exps.find((e) => e.id === desdeExp);
        const cola = x.cvSubida?.modo === "todas" ? exps.filter((e) => e.id !== desdeExp && !e.usada).slice(0, COLA_CV - 1) : [];
        const primero = { ...nuevoLogro(origen, cv.trim()), cv: elegida?.id };
        const resto = cola.map((e) => ({ ...nuevoLogro(origen, textoExp(e)), cv: e.id }));
        let y: State = { ...x, base: { origen, cv: cv.trim(), star: star.trim() }, logros: [primero, ...resto] };
        for (const l of y.logros) y = conExp(y, l, exps.find((e) => e.id === l.cv));
        return y;
      });
      setPasoRaw(PASOS);
      window.scrollTo(0, 0);
    });
  };
  const titulo = vacante?.titulo.toLowerCase() ?? "esta vacante";

  return (
    <section className="narrow stack-lg">
      <header className="stack-sm">
        {paso < PASOS && (
          <div className="progreso-fila">
            <div className="dots" aria-hidden="true">{Array.from({ length: PASOS }, (_, i) => <span key={i} className={i <= paso ? "on" : ""} />)}</div>
            <p className="meta">Paso {paso + 1} de {PASOS}</p>
          </div>
        )}
        {paso === 0 && <ParaQue>Saber desde dónde partes. Al final comparamos tu antes y tu después.</ParaQue>}
      </header>

      <div key={paso} className="stack-lg step">
        {paso === 0 && (
          <fieldset className="stack">
            <Guide>Hola. Vamos a preparar tu hoja de vida y tu entrevista para un empleo concreto. Para empezar, ¿a qué te gustaría aplicar?</Guide>
            <legend className="sr-only">Vacante</legend>
            <h2 tabIndex={-1}>Elige una vacante</h2>
            <p className="muted">Son vacantes de práctica, típicas de un primer empleo en distintas subregiones de Antioquia. No son ofertas reales: sirven para que las preguntas se parezcan a las de tu entrevista.</p>
            <Tablero />
            <div className={`sticky-next${vacanteLista(s.vacante, s.vacanteOtra) ? " ready" : ""}`}>
              <p className="sticky-next-text" aria-live="polite">
                {!vacante ? "Elige una vacante para seguir"
                  : s.vacante === "otra" && !vacanteLista(s.vacante, s.vacanteOtra) ? "Escribe el nombre del cargo"
                  : <><span className="label">Elegiste</span><b key={vacante.titulo}>{vacante.titulo}</b></>}
              </p>
              <button className="btn" disabled={!vacanteLista(s.vacante, s.vacanteOtra)} onClick={() => setPaso(1)}>Siguiente</button>
            </div>
          </fieldset>
        )}

        {paso === 1 && (
          <fieldset className="stack">
            <Guide>Buena elección. Antes de seguir: ¿ya has hecho un trabajo parecido al de {titulo}? Cualquier respuesta sirve; el camino se ajusta a ti.</Guide>
            <legend className="sr-only">Experiencia en el puesto</legend>
            <h2 tabIndex={-1}>¿Has trabajado en algo parecido?</h2>
            <div className="paths">
              {SITUACIONES.map((op, i) => (
                <label key={op.id} className="path" style={{ "--i": i } as CSSProperties}>
                  <input type="radio" name="situacion" checked={s.situacion === op.id} onChange={() => set((x) => ({ ...x, situacion: op.id }))} />
                  <b>{op.titulo}</b><span>{op.detalle}</span>
                </label>
              ))}
            </div>
            <label className="apodo" htmlFor="apodo">
              <span>¿Cómo quieres que te diga? <small className="muted">Opcional. Se queda solo en este dispositivo; no se envía a la IA.</small></span>
              <input id="apodo" className="input" value={s.apodo} maxLength={24} autoComplete="off" placeholder="Ej.: Caro" onChange={(e) => set((x) => ({ ...x, apodo: e.target.value }))} />
            </label>
            <div className="actions">
              <button className="btn ghost" onClick={() => setPaso(0)}>Atrás</button>
              <button className="btn" disabled={!s.situacion} onClick={() => setPaso(2)}>Siguiente</button>
            </div>
          </fieldset>
        )}

        {paso === 2 && (
          <div className="stack-lg">
            <Guide>
              {s.situacion === "parecido" && "Ahora tu experiencia en ese trabajo parecido. Si ya tienes hoja de vida, la aprovechamos; si no, la escribimos juntos."}
              {s.situacion === "otra" && "Tu experiencia en otro trabajo también cuenta: muchas habilidades sirven de un empleo a otro. Si ya tienes hoja de vida, la aprovechamos; si no, la escribimos juntos."}
              {s.situacion === "ninguna" && "No haber trabajado no significa no tener experiencia: la casa, el colegio, el barrio o un grupo también cuentan. Vamos a encontrar la tuya."}
            </Guide>

            {/* Primero se elige el camino; después solo se ve ese camino. */}
            {!via && (
              <fieldset className="subir-modo camino">
                <legend><h2 tabIndex={-1}>¿Ya tienes una hoja de vida hecha?</h2></legend>
                <button type="button" onClick={() => setVia("cv")}>
                  <Icon name="archivo" size={24} />
                  <b>Sí, la tengo</b>
                  <span>La subes (PDF o Word) o pegas el texto. Tomo tus datos y tu experiencia para que no los escribas dos veces.</span>
                </button>
                <button type="button" onClick={() => setVia("escribir")}>
                  <Icon name="lapiz" size={24} />
                  <b>No, o prefiero escribir</b>
                  <span>Me cuentas una experiencia con tus palabras. Te doy ideas para empezar.</span>
                </button>
              </fieldset>
            )}

            {via === "cv" && (
              <div className="stack">
                <h2 tabIndex={-1}>Tu hoja de vida</h2>
                <SubirCV elegida={desdeCv} onElegir={(t, e) => {
                  setCv(t); setDesdeCv(t); setDesdeExp(e?.id ?? null);
                  setOrigen((o) => o ?? adivinarOrigen(`${e?.cargo ?? ""} ${e?.lugar ?? ""} ${t}`));
                  // Llevar la vista a la caja donde quedó la experiencia.
                  setTimeout(() => document.getElementById("base-cv")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
                }} />
              </div>
            )}

            {via === "escribir" && (
              <fieldset className="stack">
                <legend><h2 tabIndex={-1}>¿Dónde fue esa experiencia?</h2></legend>
                <p className="muted">Elige la opción que más se parezca. Si ninguna encaja, toca «Otra cosa que hice».</p>
                <OrigenPicker name="origen" value={origen} onChange={setOrigen} situacion={s.situacion} />
              </fieldset>
            )}

            {origen && (via === "escribir" || desdeCv) && (
              <div className="stack">
                {via === "cv" && (
                  <div className="origen-elegido">
                    <p>Tipo de experiencia: <b>{PERFILES[origen].label}</b></p>
                    <button type="button" className="link" aria-expanded={cambiarOrigen} onClick={() => setCambiarOrigen((v) => !v)}>{cambiarOrigen ? "Listo" : "Cambiar"}</button>
                  </div>
                )}
                {via === "cv" && cambiarOrigen && <OrigenPicker name="origen" value={origen} onChange={(o) => { setOrigen(o); setCambiarOrigen(false); }} situacion={s.situacion} />}
                <ExperienciaBox id="base-cv" origen={origen} value={cv} onChange={setCv} desde={desdeCv}
                  label={via === "cv" ? "Así la tienes hoy. Puedes dejarla igual o ajustarla." : "Escríbelo como lo pondrías hoy en tu hoja de vida."}
                  hint="Como te salga: no hay respuestas malas. Es tu punto de partida y al final vas a ver cuánto cambió." />
              </div>
            )}

            <div className="actions">
              <button className="btn ghost" onClick={() => (via ? setVia(null) : setPaso(1))}>Atrás</button>
              {via && <button className="btn" disabled={!origen} onClick={() => setPaso(3)}>{origen && !cv.trim() ? "Seguir sin escribir" : "Siguiente"}</button>}
              {via === "cv" && !origen && <span className="small muted">Elige una experiencia de tu hoja de vida para seguir.</span>}
              {via === "escribir" && !origen && <span className="small muted">Elige una opción para seguir.</span>}
            </div>
            {via && (
              <p className="small muted">
                <button type="button" className="link" onClick={() => setVia(via === "cv" ? "escribir" : "cv")}>
                  {via === "cv" ? "Prefiero escribir mi experiencia aquí" : "Mejor subo mi hoja de vida"}
                </button>
              </p>
            )}
          </div>
        )}

        {paso === 3 && (
          <div className="stack-lg">
            <Guide>Ahora imagina que ya estás en la entrevista para {titulo}. Te hacen esta pregunta. Responde como lo harías hoy, sin pensarlo demasiado.</Guide>
            <div className="interviewer">
              <p className="interviewer-who">Entrevistadora · simulación</p>
              <h2 tabIndex={-1} className="interviewer-q"><Words text={PREGUNTA_BASE} /></h2>
              <Speak text={PREGUNTA_BASE} label="Escuchar la pregunta" />
            </div>
            <AnswerBox id="base-star" rows={6} tiempo value={star} onChange={setStar}
              label="Tu respuesta"
              hint="Puedes escribir o dictar. Si prefieres no responder todavía, sigue: también cuenta como punto de partida." />
            <div className="actions">
              <button className="btn ghost" onClick={() => setPaso(2)}>Atrás</button>
              <button className="btn" onClick={terminar}>{star.trim() ? "Ver mi punto de partida" : "Saltar y ver mi punto de partida"}</button>
            </div>
          </div>
        )}

        {paso === PASOS && s.base && <PuntoDePartida onNext={() => go("taller")} />}
      </div>
    </section>
  );
}

function PuntoDePartida({ onNext }: { onNext: () => void }) {
  const { s, sinExperiencia } = useApp();
  const base = s.base!;
  const cvC = evalLogro(base.cv), stC = evalStar(base.star);
  const total = score(cvC) + score(stC);
  // Momento 1 de 5: el tutor lee lo que escribiste y prepara las preguntas del taller.
  const conocer = useMomento("conocer", true, () => entradaConocer(s));
  const local = hola(s) + (!base.cv && !base.star ? "empiezas desde cero, y está bien: en el taller vas a construir ambos textos paso a paso, conmigo."
    : total >= 7 ? "ya tienes buena base. La práctica te ayudará a pulir lo que falta y a hacerlo sin ayuda."
    : "ya tienes lo más importante: experiencia real. Ahora vamos a contarla para que se note su valor.");
  const c = conocer.data;
  return (
    <div className="stack-lg">
      <h2 tabIndex={-1}>Tu punto de partida</h2>
      <Guide pensando={conocer.cargando} ia={Boolean(c)}>
        {c ? `${c.saludo} ${c.lectura}` : mayus(local)}
        {sinExperiencia && " Como no has trabajado en este cargo, en la entrevista también vas a practicar cómo responder cuando te pregunten por qué darte la oportunidad."}
      </Guide>
      <div className="two">
        <div className="sheet stack"><p className="label">Hoja de vida</p><Score checks={cvC} />{c?.enfoque && <p className="tutor-mini">{mayus(c.enfoque)}</p>}<Checks checks={cvC} /></div>
        <div className="sheet stack"><p className="label">Entrevista</p><Score checks={stC} />{c?.consejo_entrevista && <p className="tutor-mini">{mayus(c.consejo_entrevista)}</p>}<Checks checks={stC} /></div>
      </div>
      <div className="actions"><button className="btn" onClick={onNext}>Ir al taller de logros</button></div>
    </div>
  );
}
