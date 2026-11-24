import { useState, type CSSProperties } from "react";
import { SECTORES, VACANTES, type Sector, type VacanteId } from "../content";
import { plain } from "../engine/rubric";
import { useApp } from "../state";

const LISTA = Object.entries(VACANTES) as [Exclude<VacanteId, "otra">, (typeof VACANTES)[keyof typeof VACANTES]][];
const conteo = (sec: Sector) => LISTA.filter(([, v]) => v.sector === sec).length;

/** Tablero de avisos «Se necesita»: buscar por palabra, filtrar por sector o escribir un cargo propio. */
export function Tablero() {
  const { s, set } = useApp();
  const [sector, setSector] = useState<Sector | "todos">("todos");
  const [q, setQ] = useState("");
  const termino = plain(q.trim());
  const visibles = LISTA.filter(([, v]) =>
    (sector === "todos" || v.sector === sector) &&
    (!termino || plain([v.titulo, v.lugar, ...v.busca, SECTORES[v.sector]].join(" ")).includes(termino)));
  const elegir = (id: VacanteId) => set((x) => ({ ...x, vacante: id, preguntaCv: null }));

  return (
    <div className="stack">
      <div className="board-tools">
        <label className="search">
          <span className="sr-only">Buscar un cargo</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca: cajero, cocina, bodega, café…" autoComplete="off" />
        </label>
        <div className="sectors" role="group" aria-label="Filtrar por sector">
          <button type="button" aria-pressed={sector === "todos"} onClick={() => setSector("todos")}>Todas <span>{LISTA.length}</span></button>
          {(Object.keys(SECTORES) as Sector[]).map((k) => (
            <button key={k} type="button" aria-pressed={sector === k} onClick={() => setSector(k)}>{SECTORES[k]} <span>{conteo(k)}</span></button>
          ))}
        </div>
      </div>

      <p className="small muted" aria-live="polite">{visibles.length === LISTA.length ? `${LISTA.length} vacantes de práctica` : `${visibles.length} de ${LISTA.length} vacantes`}</p>

      <div className="board" key={`${sector}:${termino}`}>
        {visibles.map(([id, v], i) => (
          <label key={id} className="notice" style={{ "--i": i } as CSSProperties}>
            <input type="radio" name="vacante" value={id} checked={s.vacante === id} onChange={() => elegir(id)} />
            <span className="notice-top">Se necesita · {SECTORES[v.sector]}</span>
            <span className="notice-title">{v.titulo}</span>
            <span className="notice-place">{v.lugar}</span>
            <span className="notice-tags">{v.busca.map((b) => <span key={b}>{b}</span>)}</span>
          </label>
        ))}
        <label className="notice notice-otra" style={{ "--i": visibles.length } as CSSProperties}>
          <input type="radio" name="vacante" value="otra" checked={s.vacante === "otra"} onChange={() => elegir("otra")} />
          <span className="notice-top">¿No está tu cargo?</span>
          <span className="notice-title">Otra vacante</span>
          <span className="notice-place">Escribe el cargo al que quieres aplicar. Practicarás con habilidades que piden casi todos los empleos.</span>
          {s.vacante === "otra" && (
            <input className="input" value={s.vacanteOtra} maxLength={60} autoFocus placeholder="Ej.: auxiliar de farmacia"
              aria-label="Nombre del cargo" onChange={(e) => set((x) => ({ ...x, vacanteOtra: e.target.value }))} />
          )}
        </label>
      </div>

      {visibles.length === 0 && <p className="muted">No encontramos «{q}» en el tablero. Prueba con otra palabra o elige «Otra vacante» y escríbelo.</p>}
    </div>
  );
}

/** ¿Se puede seguir? Con «Otra vacante», solo si ya escribió el cargo. */
export const vacanteLista = (id: VacanteId | null, otra: string) => Boolean(id && (id !== "otra" || otra.trim().length >= 3));
