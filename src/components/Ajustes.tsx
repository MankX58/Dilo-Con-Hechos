import { useEffect, useState } from "react";

const KEY = "dilo-con-hechos:a11y";
type A11y = { tam: 0 | 1 | 2; contraste: boolean };
const TAMANOS = ["Letra normal", "Letra grande", "Letra muy grande"];

function leer(): A11y {
  try { return { tam: 0, contraste: false, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { return { tam: 0, contraste: false }; }
}

/** Letra más grande y alto contraste: se recuerdan en este dispositivo. */
export function Ajustes() {
  const [a, setA] = useState<A11y>(leer);
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.size = String(a.tam);
    if (a.contraste) html.dataset.contrast = "alto"; else delete html.dataset.contrast;
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* sin almacenamiento */ }
  }, [a]);
  const siguiente = ((a.tam + 1) % 3) as A11y["tam"];
  return (
    <div className="a11y" role="group" aria-label="Accesibilidad">
      <button type="button" className="a11y-btn" onClick={() => setA((x) => ({ ...x, tam: siguiente }))}
        aria-label={`${TAMANOS[a.tam]}. Cambiar a ${TAMANOS[siguiente].toLowerCase()}`} title={TAMANOS[siguiente]}>
        <span aria-hidden="true" className="a11y-aa">A<small>A</small></span>
        <span className="a11y-dots" aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} className={i <= a.tam ? "on" : ""} />)}</span>
      </button>
      <button type="button" className="a11y-btn" aria-pressed={a.contraste} onClick={() => setA((x) => ({ ...x, contraste: !x.contraste }))} title="Alto contraste">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" /></svg>
        <span className="a11y-label">Contraste</span>
      </button>
    </div>
  );
}
