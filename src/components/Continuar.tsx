import { ETAPAS, MOTIVO_CERRADA, progreso, useApp, type Stage } from "../state";

/** Si alguien llega a una etapa cerrada (por ejemplo, con un avance guardado), se le dice por qué y se le lleva a donde va. */
export function EtapaCerrada({ etapa }: { etapa: Exclude<Stage, "inicio"> }) {
  const { s, go } = useApp();
  const { frontera } = progreso(s);
  return (
    <section className="narrow stack">
      <h2 tabIndex={-1}>Esta etapa todavía no está abierta</h2>
      <p>{MOTIVO_CERRADA[etapa]}.</p>
      <div className="actions"><button className="btn" onClick={() => go(frontera)}>Ir a {ETAPAS.find((e) => e.id === frontera)!.nombre.toLowerCase()}</button></div>
    </section>
  );
}

/** Barra fija para seguir: aparece cuando la persona mira una etapa ya hecha (o agrega otro logro) y la siguiente la espera.
 *  No aparece si la pantalla ya muestra su propio botón hacia esa misma etapa. */
export function Continuar() {
  const { s, go, listos } = useApp();
  if (s.stage === "inicio" || s.stage === "resultado") return null;
  const { hecho, frontera } = progreso(s);
  const actual = ETAPAS.findIndex((e) => e.id === s.stage);
  const destino = ETAPAS.findIndex((e) => e.id === frontera);
  if (destino <= actual) return null;

  const logroEnCurso = s.stage === "taller" && s.logros.some((l) => l.fase !== "listo");
  const pantallaFinal = hecho[s.stage] && !logroEnCurso;
  if (destino === actual + 1 && pantallaFinal) return null;

  const nombre = ETAPAS[destino].nombre;
  const texto = logroEnCurso && destino === actual + 1
    ? `Tu hoja de vida ya tiene ${listos.length} ${listos.length === 1 ? "logro" : "logros"}. Puedes seguir cuando quieras.`
    : destino === actual + 1 ? "Ya terminaste esta etapa." : "Ya avanzaste más allá de esta etapa.";
  return (
    <div className="continuar" role="region" aria-label="Seguir">
      <p>{texto}</p>
      <button className="btn sm" onClick={() => go(ETAPAS[destino].id)}>{destino === actual + 1 ? `Seguir: ${nombre}` : `Ir a ${nombre}`} →</button>
    </div>
  );
}
