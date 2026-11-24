import { useState } from "react";
import { CASOS } from "../content";
import { evalLogro, evalStar } from "../engine/rubric";
import { AnswerBox, Checks, Guide, Score, mayus, ParaQue } from "../components/ui";
import { cita, hola, progreso, useApp } from "../state";
import { EtapaCerrada } from "../components/Continuar";

export function Prueba() {
  const { s } = useApp();
  return progreso(s).abierta.prueba ? <PruebaAbierta /> : <EtapaCerrada etapa="prueba" />;
}

function PruebaAbierta() {
  const { s, move, go, caso, listos } = useApp();
  const [cv, setCv] = useState("");
  const [star, setStar] = useState("");
  const [error, setError] = useState(false);
  const ultimo = s.prueba.at(-1);
  const enviado = ultimo && ultimo.caso === s.caso % CASOS.length ? ultimo : null;

  const enviar = () => {
    if (!cv.trim() || !star.trim()) { setError(true); return; }
    setError(false);
    move((x) => ({ ...x, prueba: [...x.prueba, { caso: x.caso % CASOS.length, cv: cv.trim(), star: star.trim() }] }));
  };
  const otro = () => { move((x) => ({ ...x, caso: x.caso + 1 })); setCv(""); setStar(""); };

  return (
    <section className="narrow stack-lg">
      <header className="stack">
        <p className="eyebrow amber">Prueba final · sin ayudas</p>
        <h2 tabIndex={-1}>Demuestra lo que aprendiste</h2>
        {!enviado && <ParaQue>Comprobar que ya lo puedes hacer sin ayuda, con un caso y una pregunta que no has visto. Se revisa con los mismos criterios que practicaste.</ParaQue>}
      </header>

      {!enviado ? (
        <>
          <Guide>{mayus(`${hola(s)}${listos[0] ? `en el taller convertiste «${cita(listos[0].crudo, 8)}» en un logro. Ahora haz lo mismo con el caso de ${caso.nombre}` : `ahora aplica lo que practicaste al caso de ${caso.nombre}`}.`)} Esta vez no voy a ayudarte mientras escribes: ya sabes cómo se hace.</Guide>
          <div className="stack">
            <p className="label">Parte 1 · Enunciado de logro</p>
            <div className="case"><p className="label">Ficha del caso</p><p>{caso.texto}</p></div>
            <AnswerBox id="f-cv" rows={3} value={cv} onChange={setCv} label={`Escribe una línea para la hoja de vida de ${caso.nombre}, como la escribiría ${caso.nombre}.`} />
          </div>
          <div className="stack">
            <p className="label">Parte 2 · Entrevista</p>
            <div className="interviewer"><p className="interviewer-who">Entrevistadora · simulación</p><h3 className="interviewer-q">{caso.pregunta}</h3></div>
            <AnswerBox id="f-star" rows={7} tiempo value={star} onChange={setStar} label="Responde con una experiencia tuya, como lo dirías en la entrevista." />
          </div>
          {error && <p className="warn" role="alert">Escribe las dos partes antes de enviar.</p>}
          <div className="actions"><button className="btn" onClick={enviar}>Enviar mi prueba</button></div>
        </>
      ) : (
        <Resultados intento={enviado} n={s.prueba.length} onOtro={otro} onVer={() => go("resultado")} />
      )}
    </section>
  );
}

function Resultados({ intento, n, onOtro, onVer }: { intento: { caso: number; cv: string; star: string }; n: number; onOtro: () => void; onVer: () => void }) {
  const c = CASOS[intento.caso];
  const cvC = evalLogro(intento.cv, c.nombre), stC = evalStar(intento.star);
  return (
    <div className="stack-lg" aria-live="polite">
      <p className="label">Resultado · intento {n}</p>
      <div className="two">
        <div className="sheet stack"><p className="label">Parte 1 · Logro de {c.nombre}</p><p className="specimen small-specimen">{intento.cv}</p><Score checks={cvC} /><Checks checks={cvC} /></div>
        <div className="sheet stack"><p className="label">Parte 2 · Respuesta STAR</p><Score checks={stC} /><Checks checks={stC} /></div>
      </div>
      <div className="actions">
        <button className="btn" onClick={onVer}>Ver mi resultado</button>
        <button className="btn ghost" onClick={onOtro}>Intentar con otro caso</button>
      </div>
    </div>
  );
}
