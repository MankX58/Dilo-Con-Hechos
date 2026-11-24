import { useState } from "react";
import { CASOS } from "../content";
import { evalLogro, evalStar, passLogro, passStar, score, type Check } from "../engine/rubric";
import { HojaDeVida } from "../components/HojaDeVida";
import { Buscar } from "../components/Buscar";
import { cita, evalRespuesta, finalText, hola, rolDe, useApp } from "../state";
import { Guide, mayus, useCountUp } from "../components/ui";
import { useMomento } from "../ai/tutor";

const best = (textos: string[], f: (t: string) => Check[]) => textos.map(f).sort((a, b) => score(b) - score(a))[0];

export function Resultado() {
  const { s, go, reset, listos, vacante } = useApp();
  const [copiado, setCopiado] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const f = s.prueba.at(-1);
  const fCv = f ? evalLogro(f.cv, CASOS[f.caso].nombre) : null;
  const fSt = f ? evalStar(f.star) : null;
  const okCv = fCv ? passLogro(fCv) : false, okSt = fSt ? passStar(fSt) : false;

  const practicaCv = best(listos.map(finalText), (t) => evalLogro(t));
  const practicaSt = best(s.entrevista.filter((r) => r.tipo !== "puente").map((r) => r.intentos.at(-1) ?? ""), evalStar);
  const puente = s.entrevista.find((r) => r.tipo === "puente");
  const practicaPuente = puente ? evalRespuesta(puente.intentos.at(-1) ?? "", "puente", vacante?.claves).checks : null;
  const q1 = s.entrevista[0]?.intentos.at(-1);

  let titulo: string, texto: string;
  if (!f) { titulo = "Aún te falta la prueba final"; texto = "Sin la prueba final no hay evidencia de que puedas hacerlo sin ayuda. Cuando quieras, vuelve al paso de prueba."; }
  else if (okCv && okSt) { titulo = "Demostraste la competencia"; texto = `En la prueba final, sin ayudas, escribiste un enunciado de logro que cumple los 4 criterios y una respuesta de entrevista con estructura STAR${s.prueba.length > 1 ? ` (en el intento ${s.prueba.length})` : ""}.`; }
  else if (okCv || okSt) { titulo = "Vas a mitad de camino"; texto = `En la prueba final lograste ${okCv ? "el enunciado de logro" : "la respuesta STAR"}, pero todavía no ${okCv ? "la respuesta STAR" : "el enunciado de logro"}. Revisa los criterios marcados e inténtalo con otro caso.`; }
  else { titulo = "Todavía no la demuestras, y está bien"; texto = "En la prueba final aún faltan criterios en las dos partes. Vuelve a practicar o intenta con otro caso: cada intento cuenta."; }

  const paraCopiar = [
    listos.length ? "EXPERIENCIA\n" + listos.map((l) => `${rolDe(l)}\n• ${finalText(l)}${l.habilidad && l.habilidad !== "Otra habilidad" ? `\n  (Demuestra: ${l.habilidad})` : ""}`).join("\n\n") : "",
    s.entrevista.length ? "RESPUESTAS DE ENTREVISTA\n" + s.entrevista.map((r) => `${r.pregunta}\n${r.intentos.at(-1)}`).join("\n\n") : "",
  ].filter(Boolean).join("\n\n");

  // Momento 5 de 5: el tutor cierra mirando tu antes y tu después reales.
  const sc = (c: Check[] | null | undefined) => (c ? `${score(c)}/${c.length}` : "sin dato");
  const cierre = useMomento("cierre", Boolean(f), () => ({
    vacante: vacante?.titulo ?? "", habilidad: listos.map((l) => l.habilidad).find((h) => h && h !== "Otra habilidad") ?? "", cvAntes: s.base?.cv ?? "", cvDespues: listos[0] ? finalText(listos[0]) : "",
    starAntes: s.base?.star ?? "", starDespues: q1 ?? "",
    avance: `Logro: inicio ${sc(s.base ? evalLogro(s.base.cv) : null)}, práctica ${sc(practicaCv)}, prueba ${sc(fCv)}. Entrevista: inicio ${sc(s.base ? evalStar(s.base.star) : null)}, práctica ${sc(practicaSt)}, prueba ${sc(fSt)}.`,
    demostro: okCv && okSt,
  }), String(s.prueba.length));
  const cierreAI = cierre.data && cierre.data._para === String(s.prueba.length) ? cierre.data : null;

  const copiar = () => {
    navigator.clipboard.writeText(paraCopiar).then(() => setCopiado("Copiado."), () => setCopiado("No se pudo copiar. Selecciona el texto y cópialo."));
  };

  return (
    <section className="stack-lg">
      <header className="narrow stack">
        <h2 tabIndex={-1} className={okCv && okSt ? "verdict-title" : ""}>{titulo}</h2>
        <p className="lead">{texto}</p>
        {!f && <div className="actions"><button className="btn" onClick={() => go("prueba")}>Ir a la prueba final</button></div>}
        {f && (
          <Guide ia={Boolean(cierreAI)} pensando={cierre.cargando && !cierreAI}>
            {cierreAI ? cierreAI.mensaje : mayus(`${hola(s)}${s.base?.cv && listos[0] ? `empezaste con «${cita(s.base.cv, 8)}» y terminaste con «${cita(finalText(listos[0]), 12)}». ` : ""}${okCv && okSt ? "Y en la prueba lo hiciste sin ayuda: eso ya es tuyo." : "Ya sabes qué revisar; cada intento te acerca."}`)}
          </Guide>
        )}
        {cierreAI && (
          <dl className="tutor-cierre">
            {cierreAI.mejor_avance && <div><dt>Lo que más mejoraste</dt><dd>{cierreAI.mejor_avance}</dd></div>}
            {cierreAI.siguiente_paso && <div><dt>Tu siguiente paso</dt><dd>{cierreAI.siguiente_paso}</dd></div>}
          </dl>
        )}
      </header>

      {f && (
        <nav className="res-nav narrow" aria-label="En esta página">
          <a href="#avance"><span>1</span>Tu avance</a>
          <a href="#hoja"><span>2</span>Tu hoja de vida</a>
          <a href="#buscar"><span>3</span>Dónde buscar</a>
        </nav>
      )}

      <div className="narrow stack res-sec" id="avance">
        <h3><span className="res-n">1</span>Tu avance, criterio por criterio</h3>
        <div className="table-wrap">
          <table className="progress-t">
            <thead><tr><th>Competencia</th><th>Inicio</th><th>Práctica</th><th>Prueba final</th></tr></thead>
            <tbody>
              <Fila nombre="Enunciado de logro" a={s.base ? evalLogro(s.base.cv) : null} b={practicaCv ?? null} c={fCv} ok={f ? okCv : null} />
              <Fila nombre="Respuesta de entrevista" a={s.base ? evalStar(s.base.star) : null} b={practicaSt ?? null} c={fSt} ok={f ? okSt : null} />
              {practicaPuente && <Fila nombre="Respuesta sin experiencia en el cargo" a={null} b={practicaPuente} c={null} ok={null} />}
            </tbody>
          </table>
        </div>
        <p className="small muted">Solo cuentan los textos que escribiste. La revisión es automática y puede equivocarse: úsala como guía, no como calificación oficial.</p>
        <details className="prev">
          <summary>Ver tu antes y después</summary>
          <div className="two">
            <div><p className="label">Hoja de vida · al empezar</p><p className="specimen weak small-specimen">{s.base?.cv || "(en blanco)"}</p></div>
            <div><p className="label">Hoja de vida · después del taller</p><p className="specimen small-specimen">{listos[0] ? finalText(listos[0]) : "(aún sin logros)"}</p></div>
            <div><p className="label">Entrevista · al empezar</p><p className="small-specimen pre">{s.base?.star || "(en blanco)"}</p></div>
            <div><p className="label">Entrevista · después de practicar</p><p className="small-specimen pre">{q1 || "(aún sin respuesta)"}</p></div>
          </div>
        </details>
      </div>

      <div className="stack res-sec" id="hoja">
        <div className="narrow stack-sm">
          <h3><span className="res-n">2</span>Tu hoja de vida, lista para enviar</h3>
          <p className="muted">Tus logros ya están adentro. Completa lo demás y descárgala.</p>
        </div>
        <HojaDeVida />
      </div>

      <div className="narrow stack res-sec" id="buscar">
        <h3><span className="res-n">3</span>Dónde buscar {vacante ? `vacantes de ${vacante.titulo.toLowerCase()}` : "empleo"}</h3>
        <Buscar />
        <h4 className="res-h4">Agencias de empleo en Antioquia</h4>
        <p className="small muted">Registran tu hoja de vida, te orientan y publican vacantes reales.</p>
        <ul className="routes">
          <li><a href="https://www.serviciodeempleo.gov.co" target="_blank" rel="noopener noreferrer"><b>Servicio Público de Empleo</b><span>Registra tu hoja de vida en línea o en su app. Es el registro que piden las agencias.</span></a></li>
          <li><a href="https://agenciapublicadeempleo.sena.edu.co" target="_blank" rel="noopener noreferrer"><b>Agencia Pública de Empleo del SENA</b><span>Orientación ocupacional y vacantes. También atiende en sus sedes.</span></a></li>
          <li><a href="https://www.comfama.com/servicio-de-empleo/" target="_blank" rel="noopener noreferrer"><b>Servicio de empleo de Comfama</b><span>Caja de compensación de Antioquia.</span></a></li>
          <li><a href="https://www.comfenalcoantioquia.com.co/personas/servicios/agencia-de-empleo" target="_blank" rel="noopener noreferrer"><b>Agencia de empleo de Comfenalco Antioquia</b><span>Orientación con psicólogos, ofertas de empleo y sedes.</span></a></li>
        </ul>
      </div>

      <div className="narrow res-fin">
        <div className="actions">
          <button className="btn ghost sm" onClick={copiar} disabled={!paraCopiar}>Copiar mis respuestas de entrevista</button>
          <span className="small muted" aria-live="polite">{copiado}</span>
        </div>
        <div className="actions">
          {!confirmar ? <button className="btn ghost sm" onClick={() => setConfirmar(true)}>Borrar todo y empezar de nuevo</button> : (
            <><span>Se borrarán tus textos de este dispositivo.</span><button className="btn amber" onClick={reset}>Sí, borrar</button><button className="btn ghost" onClick={() => setConfirmar(false)}>Cancelar</button></>
          )}
        </div>
      </div>
    </section>
  );
}

function Num({ n }: { n: number }) {
  return <>{useCountUp(n, 900)}</>;
}

function Fila({ nombre, a, b, c, ok }: { nombre: string; a: Check[] | null; b: Check[] | null; c: Check[] | null; ok: boolean | null }) {
  const cell = (x: Check[] | null) => (x ? <td className="num"><Num n={score(x)} />/{x.length}</td> : <td className="muted">—</td>);
  return (
    <tr>
      <th scope="row">{nombre}</th>
      {cell(a)}{cell(b)}
      {c ? <td className="num"><Num n={score(c)} />/{c.length}<span className={`pill ${ok ? "ok" : "no"}`}>{ok ? "logrado" : "aún no"}</span></td> : <td className="muted">—</td>}
    </tr>
  );
}
