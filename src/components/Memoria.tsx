import { SITUACIONES } from "../content";
import { cita, finalText, useApp } from "../state";

/** «Lo que me has contado»: el tutor muestra lo que recuerda de la persona. Todo sale de lo que ella escribió. */
export function Memoria() {
  const { s, vacante, listos } = useApp();
  const primero = s.logros[0];
  const experiencia = primero?.crudo || s.base?.cv;
  const hechos = s.logros.flatMap((l) => l.hechos.map((h) => h.a)).filter(Boolean).slice(0, 4);
  const situacion = SITUACIONES.find((x) => x.id === s.situacion)?.titulo;
  if (!vacante && !experiencia) return null;
  return (
    <div className="memoria">
      <p className="label">Lo que me has contado</p>
      <dl>
        {vacante && <div><dt>Quieres aplicar a</dt><dd>{vacante.titulo}{situacion && <span className="muted"> · {situacion.toLowerCase()}</span>}</dd></div>}
        {experiencia && <div><dt>Tu experiencia</dt><dd>«{cita(experiencia, 14)}»</dd></div>}
        {hechos.length > 0 && <div><dt>Tus datos</dt><dd><ul className="memoria-lista">{hechos.map((h) => <li key={h}>{cita(h, 9)}</li>)}</ul></dd></div>}
        {listos.length > 0 && (
          <div><dt>{listos.length === 1 ? "Tu logro" : "Tus logros"}</dt>
            <dd>{listos.map((l) => <p key={l.id}>«{cita(finalText(l), 16)}»{l.habilidad && l.habilidad !== "Otra habilidad" && <span className="memoria-skill"> → {l.habilidad}</span>}</p>)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
