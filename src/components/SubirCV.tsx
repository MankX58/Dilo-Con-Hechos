import { useState } from "react";
import { askTutor, useIA } from "../ai/client";
import { anonimizar, datosLocales, lineasCandidatas, nivelDe, textoDeArchivo } from "../cv/leer";
import { evalLogro } from "../engine/rubric";
import { HV_VACIA, textoExp, useApp, type ExpSubida, type HojaVida } from "../state";
import { Icon, Typing } from "./ui";

const id = () => Math.random().toString(36).slice(2, 9);
/** Cuántas experiencias pasan por el taller si la persona elige mejorarlas todas. */
export const COLA_CV = 3;

/** Subir la hoja de vida actual: se lee en el navegador, se ordena (con IA si hay) y sus datos pasan a la hoja final. */
export function SubirCV({ onElegir, elegida = "" }: { onElegir: (texto: string, exp?: ExpSubida) => void; elegida?: string }) {
  const { s, set, vacante } = useApp();
  const ia = useIA() === "activa";
  const [fase, setFase] = useState<"inicio" | "pegar" | "leyendo" | "listo">(s.cvSubida ? "listo" : "inicio");
  const [pegado, setPegado] = useState("");
  const [error, setError] = useState("");
  const [lineas, setLineas] = useState<string[]>([]);
  const [guardados, setGuardados] = useState<string[]>([]);

  async function procesar(contenido: string, archivo: string) {
    setError(""); setFase("leyendo");
    const loc = datosLocales(contenido);
    const r = ia ? await askTutor("cv", { vacante: vacante?.titulo ?? "", texto: anonimizar(contenido, loc.nombre) }) : null;
    // La IA ordena mejor; lo que no encuentre lo completa la lectura local.
    const deIA = (r?.experiencias ?? []).filter((e) => textoExp(e));
    const experiencias: ExpSubida[] = (deIA.length ? deIA : loc.experiencias).filter((e) => textoExp(e)).slice(0, 6)
      .map((e) => ({ id: id(), cargo: e.cargo, lugar: e.lugar, fechas: e.fechas, descripcion: e.descripcion, usada: false, incluir: true }));
    if (!experiencias.length) setLineas(lineasCandidatas(contenido));

    const uno = (...v: (string | undefined)[]) => v.map((x) => x?.trim() ?? "").find(Boolean) ?? "";
    const nuevos: Partial<HojaVida> = {
      nombre: loc.nombre, telefono: loc.telefono, correo: loc.correo,
      municipio: uno(r?.municipio, loc.municipio).replace(/,?\s*antioquia\.?$/i, ""),
      perfil: uno(r?.perfil, loc.perfil),
      nivel: nivelDe(r?.nivel ?? "") || loc.nivel, institucion: uno(r?.institucion, loc.institucion), anio: uno(r?.anio, loc.anio),
      cursos: uno(r?.cursos, loc.cursos), idiomas: uno(r?.idiomas, loc.idiomas), disponibilidad: uno(r?.disponibilidad, loc.disponibilidad),
      otrasHabilidades: [...new Set([...(r?.habilidades ?? []), ...loc.habilidades].map((h) => h.trim()).filter(Boolean))].slice(0, 10).join(", "),
      referencias: loc.referencias,
    };
    // Lo que la persona ya escribió no se pisa: solo se llenan los espacios vacíos (o con el texto por defecto).
    const llenos: string[] = [];
    set((x) => {
      const hv = { ...x.hv };
      for (const [k, v] of Object.entries(nuevos) as [keyof HojaVida, string][]) {
        const prev = (hv[k] as string)?.trim();
        if (v && (!prev || prev === HV_VACIA[k])) { (hv[k] as string) = v; llenos.push(ETIQUETA[k] ?? k); }
      }
      return { ...x, hv, cvSubida: { archivo, experiencias, modo: experiencias.length > 1 ? undefined : "una" } };
    });
    setGuardados(llenos);
    setFase("listo");
    // Con una sola experiencia no hay nada que elegir: pasa directo a la caja.
    if (experiencias.length === 1) onElegir(textoExp(experiencias[0]), experiencias[0]);
  }

  async function subir(file: File | undefined) {
    if (!file) return;
    try { await procesar(await textoDeArchivo(file), file.name); }
    catch (e) { setError(e instanceof Error ? e.message : "No pude leer ese archivo."); setFase("inicio"); }
  }

  const modo = (m: "todas" | "una") => {
    const exps = s.cvSubida?.experiencias ?? [];
    set((x) => ({ ...x, cvSubida: x.cvSubida && { ...x.cvSubida, modo: m } }));
    // Mejorarlas todas empieza por la más reciente: queda como punto de partida sin pedir otra elección.
    if (m === "todas" && exps[0]) onElegir(textoExp(exps[0]), exps[0]);
  };

  if (fase === "leyendo") return <div className="subir subir-leyendo" aria-live="polite"><Typing /> Leyendo tu hoja de vida{ia ? " y ordenando tus experiencias" : ""}…</div>;

  if (fase === "listo" && s.cvSubida) {
    const { experiencias: exps, modo: m } = s.cvSubida;
    return (
      <div className="subir subir-listo" aria-live="polite">
        <div className="subir-head">
          <p><Icon name="archivo" /> <b>Leí «{s.cvSubida.archivo}».</b> {exps.length ? `Encontré ${exps.length} ${exps.length === 1 ? "experiencia" : "experiencias"}.` : "No encontré experiencias separadas: elige la línea que mejor te describe."}</p>
          <button type="button" className="link" onClick={() => { set((x) => ({ ...x, cvSubida: null })); setFase("inicio"); setLineas([]); setGuardados([]); }}>Subir otra</button>
        </div>

        {guardados.length > 0 && (
          <div className="subir-guardado">
            <p className="label">Ya quedó en tu hoja de vida final</p>
            <ul>{guardados.map((g) => <li key={g}><Icon name="check" size={14} />{g}</li>)}</ul>
            <p className="small muted">No tendrás que escribirlo otra vez. Al final lo revisas.</p>
          </div>
        )}

        {exps.length > 1 && !m && (
          <fieldset className="subir-modo">
            <legend className="field">¿Qué quieres hacer con tu experiencia?</legend>
            <button type="button" onClick={() => modo("todas")}>
              <Icon name="capas" size={22} />
              <b>Mejorar las que ya tengo</b>
              <span>Pasamos tus {Math.min(exps.length, COLA_CV)} experiencias más recientes por el taller, una por una. Salen como logros.</span>
            </button>
            <button type="button" onClick={() => modo("una")}>
              <Icon name="dedo" size={22} />
              <b>Elegir una y seguir el recorrido</b>
              <span>Trabajas una a fondo. Las demás pasan tal cual a tu hoja final y puedes mejorarlas después.</span>
            </button>
          </fieldset>
        )}

        {m === "todas" && (
          <div className="stack-sm">
            <ol className="subir-cola">
              {exps.map((e, i) => (
                <li key={e.id} className={i === 0 ? "ahora" : i < COLA_CV ? "" : "tal-cual"}>
                  <span className="subir-cola-n" aria-hidden="true">{i < COLA_CV ? i + 1 : <Icon name="check" size={13} />}</span>
                  <span><b>{e.cargo || "Experiencia"}</b>{e.lugar && ` · ${e.lugar}`}</span>
                  <em>{i === 0 ? "Empiezas con esta" : i < COLA_CV ? "Después, en el taller" : "Pasa tal cual a tu hoja final"}</em>
                </li>
              ))}
            </ol>
            <button type="button" className="link" onClick={() => set((x) => ({ ...x, cvSubida: x.cvSubida && { ...x.cvSubida, modo: "una" } }))}>Prefiero elegir una</button>
          </div>
        )}

        {m === "una" && exps.length > 0 && (
          <ul className="subir-exps">
            {exps.map((e) => {
              const faltan = evalLogro(textoExp(e)).filter((c) => !c.ok).map((c) => c.label.toLowerCase());
              const esta = elegida === textoExp(e);
              return (
                <li key={e.id} className={esta ? "on" : ""}>
                  <p className="subir-cargo"><b>{e.cargo || "Experiencia"}</b>{e.lugar && ` · ${e.lugar}`}{e.fechas && <span> · {e.fechas}</span>}</p>
                  {e.descripcion && <p className="subir-desc">«{e.descripcion}»</p>}
                  <p className="subir-falta">{faltan.length ? <>Para ser un logro le falta: <b>{faltan.join(", ")}</b></> : "Ya tiene formato de logro."}</p>
                  {esta
                    ? <p className="linea-ok"><Icon name="abajo" size={13} /> Elegida · abajo la revisas</p>
                    : <button type="button" className="btn sm" onClick={() => onElegir(textoExp(e), e)}>Empezar con esta</button>}
                </li>
              );
            })}
          </ul>
        )}

        {!exps.length && (
          <ul className="subir-lineas">
            {lineas.map((l) => (
              <li key={l}>
                <button type="button" className={l === elegida ? "on" : ""} aria-pressed={l === elegida} onClick={() => onElegir(l)}>
                  {l}{l === elegida && <span className="linea-ok"><Icon name="abajo" size={13} /> Elegida · abajo la revisas</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="subir">
      <div className="subir-head">
        <p>Súbela o pega el texto. Tomo tus datos, estudios y experiencias para que no los escribas de nuevo.</p>
      </div>
      {fase === "pegar" ? (
        <div className="stack-sm">
          <label className="field" htmlFor="cv-pegado">Pega aquí el texto de tu hoja de vida</label>
          <textarea id="cv-pegado" rows={6} value={pegado} onChange={(e) => setPegado(e.target.value)} />
          <div className="actions">
            <button type="button" className="btn sm" disabled={pegado.trim().length < 40} onClick={() => procesar(pegado, "texto pegado")}>Leer</button>
            <button type="button" className="btn ghost sm" onClick={() => setFase("inicio")}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="actions">
          <label className="btn ghost sm subir-btn">
            <input type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(e) => subir(e.target.files?.[0])} />
            Subir PDF o Word
          </label>
          <button type="button" className="link" onClick={() => setFase("pegar")}>o pegar el texto</button>
        </div>
      )}
      {error && <p className="warn small" role="alert">{error}</p>}
      <p className="small muted">El archivo se lee en tu dispositivo. {ia ? "Para ordenarlo, a la IA solo va el texto sin tu nombre, correo, celular ni números de documento." : ""}</p>
    </div>
  );
}

const ETIQUETA: Partial<Record<keyof HojaVida, string>> = {
  nombre: "nombre", telefono: "celular", correo: "correo", municipio: "municipio", perfil: "perfil", nivel: "estudios", institucion: "institución", anio: "año de grado",
  cursos: "cursos", otrasHabilidades: "habilidades", idiomas: "idiomas", disponibilidad: "disponibilidad", referencias: "referencias",
};
