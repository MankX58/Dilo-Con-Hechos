import { useRef, type ReactNode } from "react";
import { cliche, hasNumber, plain } from "../engine/rubric";
import { NIVELES } from "../cv/leer";
import { Icon } from "./ui";
import { conExp, finalText, nuevoLogro, rolDe, textoExp, useApp, type HojaVida } from "../state";

const DISPONIBILIDAD = ["Inmediata, tiempo completo", "Inmediata, medio tiempo", "Fines de semana", "Por turnos, incluidos fines de semana"];

/** La hoja de vida final: la persona completa sus datos (se quedan en su dispositivo) y la descarga lista para enviar. */
export function HojaDeVida() {
  const { s, set, move, vacante, listos } = useApp();
  // Experiencias de la hoja subida que no pasaron por el taller: van tal como estaban, si la persona quiere.
  const pendientes = s.cvSubida?.experiencias.filter((e) => !e.usada) ?? [];
  const mejorar = (eid: string) => move((x) => {
    const e = x.cvSubida!.experiencias.find((y) => y.id === eid)!;
    const l = { ...nuevoLogro(x.base!.origen, textoExp(e)), cv: e.id };
    return conExp({ ...x, stage: "taller", logros: [...x.logros, l] }, l, e);
  });
  const hv = s.hv;
  const upd = (p: Partial<HojaVida>) => set((x) => ({ ...x, hv: { ...x.hv, ...p } }));
  const exp = (id: string) => hv.experiencia[id] ?? { rol: "", lugar: "", fechas: "" };
  const updExp = (id: string, p: Partial<HojaVida["experiencia"][string]>) => upd({ experiencia: { ...hv.experiencia, [id]: { ...exp(id), ...p } } });
  const perfilRef = useRef<HTMLTextAreaElement>(null);

  // Las habilidades que la persona conectó con la vacante vienen marcadas; puede quitar o sumar.
  const conectadas = listos.map((l) => l.habilidad).filter((h): h is string => Boolean(h && h !== "Otra habilidad"));
  const opciones = [...new Set([...conectadas, ...(vacante?.busca ?? [])])];
  const habilidades = hv.habilidades.length ? hv.habilidades : conectadas;

  const perfilChecks = [
    { ok: vacante ? plain(hv.perfil).includes(plain(vacante.titulo.split("/")[0]).slice(0, 5)) : hv.perfil.length > 0, t: "Dice a qué cargo aspiras" },
    { ok: hasNumber(hv.perfil), t: "Incluye un dato tuyo" },
    { ok: hv.perfil.trim().length > 0 && !cliche(hv.perfil), t: "Sin frases genéricas" },
  ];
  const arranques = [
    vacante && `Aspiro a trabajar como ${vacante.titulo.toLowerCase()}`,
    listos[0] && `Tengo experiencia en ${rolDe(listos[0]).toLowerCase()}: `,
    conectadas[0] && `Me destaco por ${conectadas[0].toLowerCase()}; por ejemplo, `,
  ].filter(Boolean) as string[];
  const arrancar = (a: string) => {
    const v = hv.perfil.trim() ? `${hv.perfil.trimEnd()} ${a}` : a;
    upd({ perfil: v });
    requestAnimationFrame(() => { perfilRef.current?.focus(); perfilRef.current?.setSelectionRange(v.length, v.length); });
  };

  const digitos = hv.telefono.replace(/\D/g, "");
  const telMal = hv.telefono.trim() !== "" && !(digitos.length === 10 || (digitos.length === 12 && digitos.startsWith("57")));
  const correoMal = hv.correo.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hv.correo.trim());
  const listoContacto = Boolean(hv.nombre && hv.telefono && hv.municipio && !telMal && !correoMal);
  const listoEstudios = Boolean(hv.nivel);
  const partes = [listoContacto, perfilChecks.every((c) => c.ok), listos.every((l) => exp(l.id).lugar) && listos.length > 0, listoEstudios, habilidades.length > 0, Boolean(hv.disponibilidad)];
  const hechas = partes.filter(Boolean).length;
  const faltan = [!hv.nombre && "tu nombre", !hv.telefono && "tu celular", !hv.municipio && "tu municipio", !hv.nivel && "tus estudios"].filter(Boolean) as string[];

  return (
    <div className="hv">
      <div className="hv-editor">
        <div className="hv-progreso" aria-live="polite">
          <p><b>{hechas === 6 ? "Tu hoja de vida está completa" : `${hechas} de 6 partes listas`}</b>{s.cvSubida && " · ya llenamos lo que venía en tu hoja subida"}</p>
          <div className="hv-barra" aria-hidden="true"><span style={{ width: `${(hechas / 6) * 100}%` }} /></div>
          <p className="small muted">Estos datos se quedan solo en este dispositivo y no se envían a la IA. {hechas < 6 ? "Abre cada parte, complétala y toca «Siguiente parte»." : "Revísala a la derecha y descárgala."}</p>
        </div>

        <Parte n={1} titulo="Tus datos de contacto" listo={listoContacto} abierta>
          <div className="hv-grid">
            <Campo id="hv-nombre" label="Nombre completo" value={hv.nombre} onChange={(v) => upd({ nombre: v })} autoComplete="name" />
            <Campo id="hv-tel" label="Celular" value={hv.telefono} onChange={(v) => upd({ telefono: v })} autoComplete="tel" type="tel" placeholder="Ej.: 300 123 4567" aviso={telMal ? "En Colombia el celular tiene 10 números." : ""} />
            <Campo id="hv-correo" label="Correo (opcional)" value={hv.correo} onChange={(v) => upd({ correo: v })} autoComplete="email" type="email" placeholder="Ej.: nombre@correo.com" aviso={correoMal ? "Revisa el correo: debe verse como nombre@correo.com." : ""} />
            <Campo id="hv-mun" label="Municipio y barrio" value={hv.municipio} onChange={(v) => upd({ municipio: v })} placeholder="Ej.: Bello, Niquía" />
          </div>
          <p className="hint">No pongas tu cédula: en Colombia no es necesaria en la hoja de vida y te protege de fraudes.</p>
        </Parte>

        <Parte n={2} titulo="Tu perfil" listo={perfilChecks.every((c) => c.ok)}>
          <p className="hint">Dos o tres frases: a qué aspiras, qué has hecho (con un dato) y qué ofreces. Escríbelo tú; estas ideas solo te ayudan a arrancar.</p>
          {arranques.length > 0 && <div className="starters-row">{arranques.map((a) => <button key={a} type="button" className="starter" onClick={() => arrancar(a)}>{a.trim()}…</button>)}</div>}
          <textarea id="hv-perfil" ref={perfilRef} rows={4} value={hv.perfil} onChange={(e) => upd({ perfil: e.target.value })} aria-label="Perfil" />
          <div className="meter meter-3">{perfilChecks.map((c) => <span key={c.t} className={c.ok ? "on" : ""}>{c.t}</span>)}</div>
          {cliche(hv.perfil) && <p className="hint warn">«{cliche(hv.perfil)}» lo escribe todo el mundo: cámbialo por algo que hayas hecho.</p>}
        </Parte>

        <Parte n={3} titulo="Experiencia" listo={listos.every((l) => exp(l.id).lugar)}>
          {listos.length === 0 && <p className="hint">Aún no tienes logros. Vuelve al taller para escribir el primero.</p>}
          {listos.map((l) => (
            <div key={l.id} className="hv-exp">
              <p className="hv-exp-logro">«{finalText(l)}»</p>
              <div className="hv-grid">
                <Campo id={`rol-${l.id}`} label="Cargo o actividad" value={exp(l.id).rol} onChange={(v) => updExp(l.id, { rol: v })} placeholder={rolDe(l)} />
                <Campo id={`lugar-${l.id}`} label="Dónde (negocio, institución o grupo)" value={exp(l.id).lugar} onChange={(v) => updExp(l.id, { lugar: v })} placeholder="Ej.: Tienda familiar, Bello" />
                <Campo id={`fechas-${l.id}`} label="Cuándo" value={exp(l.id).fechas} onChange={(v) => updExp(l.id, { fechas: v })} placeholder="Ej.: 2022 – 2024" />
              </div>
            </div>
          ))}
          {pendientes.map((e) => (
            <div key={e.id} className="hv-exp hv-exp-cv">
              <p><b>{e.cargo || "Experiencia"}</b>{e.lugar && ` · ${e.lugar}`}{e.fechas && ` · ${e.fechas}`}</p>
              {e.descripcion && <p className="hv-exp-logro">«{e.descripcion}»</p>}
              <p className="small muted">Viene de la hoja de vida que subiste y aún no tiene formato de logro.</p>
              <div className="actions">
                <label className="skill"><input type="checkbox" checked={e.incluir} onChange={(ev) => set((x) => ({ ...x, cvSubida: x.cvSubida && { ...x.cvSubida, experiencias: x.cvSubida.experiencias.map((y) => (y.id === e.id ? { ...y, incluir: ev.target.checked } : y)) } }))} />Incluirla</label>
                {s.base && <button type="button" className="btn ghost sm" onClick={() => mejorar(e.id)}>Mejorarla en el taller</button>}
              </div>
            </div>
          ))}
        </Parte>

        <Parte n={4} titulo="Estudios" listo={listoEstudios}>
          <div className="hv-grid">
            <label className="hv-campo" htmlFor="hv-nivel"><span>Último nivel</span>
              <select id="hv-nivel" className="input" value={hv.nivel} onChange={(e) => upd({ nivel: e.target.value })}>
                <option value="">Elige…</option>{NIVELES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </label>
            <Campo id="hv-inst" label="Institución" value={hv.institucion} onChange={(v) => upd({ institucion: v })} placeholder="Ej.: I. E. Fe y Alegría" />
            <Campo id="hv-anio" label="Año" value={hv.anio} onChange={(v) => upd({ anio: v })} placeholder="Ej.: 2023" inputMode="numeric" />
          </div>
          <Campo id="hv-cursos" label="Cursos o certificados (opcional)" value={hv.cursos} onChange={(v) => upd({ cursos: v })} placeholder="Ej.: Manipulación de alimentos, Excel básico (SENA)" />
        </Parte>

        <Parte n={5} titulo="Habilidades" listo={habilidades.length > 0}>
          <p className="hint">Marcamos las que ya demostraste con tus logros. Quita o agrega las que quieras.</p>
          <div className="skill-chips">
            {opciones.map((o) => (
              <label key={o} className="skill"><input type="checkbox" checked={habilidades.includes(o)}
                onChange={(e) => upd({ habilidades: e.target.checked ? [...habilidades, o] : habilidades.filter((h) => h !== o) })} />{o}</label>
            ))}
          </div>
          <Campo id="hv-otras" label="Otras (separadas por comas)" value={hv.otrasHabilidades} onChange={(v) => upd({ otrasHabilidades: v })} placeholder="Ej.: Manejo de datáfono, WhatsApp Business" />
          <Campo id="hv-idiomas" label="Idiomas (opcional)" value={hv.idiomas} onChange={(v) => upd({ idiomas: v })} placeholder="Ej.: Inglés básico" />
        </Parte>

        <Parte n={6} titulo="Disponibilidad y referencias" listo={Boolean(hv.disponibilidad)}>
          <div className="hv-grid">
            <label className="hv-campo" htmlFor="hv-disp"><span>Disponibilidad</span>
              {/* Lista con sugerencias que también acepta lo que traía la hoja de vida subida. */}
              <input id="hv-disp" className="input" list="hv-disp-ops" value={hv.disponibilidad} placeholder="Elige o escribe…" onChange={(e) => upd({ disponibilidad: e.target.value })} />
              <datalist id="hv-disp-ops">{DISPONIBILIDAD.map((d) => <option key={d} value={d} />)}</datalist>
            </label>
            <Campo id="hv-ref" label="Referencias" value={hv.referencias} onChange={(v) => upd({ referencias: v })} />
          </div>
          <p className="hint">Si pones referencias con nombre y celular, pídeles permiso antes.</p>
        </Parte>
      </div>

      <div className="hv-preview-col">
        <Documento hv={hv} habilidades={habilidades} />
        <div className="actions">
          <button className="btn" onClick={() => window.print()} disabled={!hv.nombre}>Guardar como PDF</button>
          <button className="btn ghost" onClick={() => descargarWord(hv, habilidades, vacante?.titulo ?? "", [...listos.map((l) => ({ ...exp(l.id), rol: exp(l.id).rol || rolDe(l), logro: finalText(l) })), ...pendientes.filter((e) => e.incluir).map((e) => ({ rol: e.cargo || "Experiencia", lugar: e.lugar, fechas: e.fechas, logro: e.descripcion }))])} disabled={!hv.nombre}>Descargar en Word</button>
        </div>
        {!hv.nombre ? <p className="small muted">Escribe al menos tu nombre para descargarla.</p>
          : faltan.length > 0 && <p className="small muted">Ya la puedes descargar. Antes de enviarla, te recomiendo agregar {faltan.join(", ").replace(/, ([^,]*)$/, " y $1")}.</p>}
      </div>
    </div>
  );
}

function Parte({ n, titulo, listo, abierta = false, children }: { n: number; titulo: string; listo: boolean; abierta?: boolean; children: ReactNode }) {
  // Pasar a la siguiente parte sin tener que buscarla: se abre (y la actual se cierra, porque comparten «name»).
  const siguiente = () => {
    const next = document.getElementById(`hv-parte-${n + 1}`) as HTMLDetailsElement | null;
    const destino = next ?? document.querySelector<HTMLElement>(".hv-preview-col");
    if (next) next.open = true;
    else (document.getElementById(`hv-parte-${n}`) as HTMLDetailsElement).open = false;
    requestAnimationFrame(() => destino?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  return (
    <details className={`hv-parte${listo ? " listo" : ""}`} name="hv" id={`hv-parte-${n}`} open={abierta || undefined}>
      <summary><span className="hv-n" aria-hidden="true">{listo ? <Icon name="check" size={14} /> : n}</span>{titulo}<span className="sr-only">{listo ? " (completa)" : ""}</span></summary>
      <div className="hv-body">
        {children}
        <div className="hv-sig"><button type="button" className="btn sm" onClick={siguiente}>{n < 6 ? "Siguiente parte" : "Listo, ver mi hoja de vida"}</button></div>
      </div>
    </details>
  );
}

function Campo(p: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; autoComplete?: string; inputMode?: "numeric"; aviso?: string }) {
  return (
    <label className="hv-campo" htmlFor={p.id}><span>{p.label}</span>
      <input id={p.id} className="input" type={p.type ?? "text"} value={p.value} placeholder={p.placeholder} autoComplete={p.autoComplete ?? "off"} inputMode={p.inputMode} onChange={(e) => p.onChange(e.target.value)}
        aria-invalid={p.aviso ? true : undefined} aria-describedby={p.aviso ? `${p.id}-aviso` : undefined} />
      {p.aviso && <small id={`${p.id}-aviso`} className="campo-aviso">{p.aviso}</small>}
    </label>
  );
}

/** Vista del documento: es lo que se imprime como PDF. Lo vacío se ve como guía en pantalla y no sale impreso. */
function Documento({ hv, habilidades }: { hv: HojaVida; habilidades: string[] }) {
  const { s, vacante, listos } = useApp();
  const extras = s.cvSubida?.experiencias.filter((e) => !e.usada && e.incluir) ?? [];
  const todas = [...habilidades, ...hv.otrasHabilidades.split(",").map((x) => x.trim()).filter(Boolean)];
  const v = (x: string, guia: string) => x.trim() || <span className="hv-vacio">{guia}</span>;
  return (
    <article className="hv-doc printable" aria-label="Vista previa de tu hoja de vida">
      <header>
        <h3 className="hv-nombre">{v(hv.nombre, "Tu nombre")}</h3>
        {vacante && <p className="hv-meta">Aspirante a {vacante.titulo.toLowerCase()}</p>}
        <p className="hv-contacto">{[hv.telefono, hv.correo, hv.municipio].filter(Boolean).join(" · ") || <span className="hv-vacio">Celular · Correo · Municipio</span>}</p>
      </header>
      <section><h4>Perfil</h4><p>{v(hv.perfil, "Dos o tres frases sobre ti.")}</p></section>
      <section>
        <h4>Experiencia</h4>
        {listos.length ? listos.map((l) => {
          const e = hv.experiencia[l.id] ?? { rol: "", lugar: "", fechas: "" };
          return (
            <div key={l.id} className="hv-item">
              <p className="hv-item-head"><b>{e.rol || rolDe(l)}</b>{e.lugar && ` · ${e.lugar}`}{e.fechas && <span className="hv-fechas">{e.fechas}</span>}</p>
              <ul><li>{finalText(l)}</li></ul>
            </div>
          );
        }) : null}
        {extras.map((e) => (
          <div key={e.id} className="hv-item">
            <p className="hv-item-head"><b>{e.cargo || "Experiencia"}</b>{e.lugar && ` · ${e.lugar}`}{e.fechas && <span className="hv-fechas">{e.fechas}</span>}</p>
            {e.descripcion && <ul><li>{e.descripcion}</li></ul>}
          </div>
        ))}
        {!listos.length && !extras.length && <p><span className="hv-vacio">Tus logros del taller aparecen aquí.</span></p>}
      </section>
      <section>
        <h4>Formación</h4>
        <p>{hv.nivel ? <><b>{hv.nivel}</b>{hv.institucion && ` · ${hv.institucion}`}{hv.anio && ` · ${hv.anio}`}</> : <span className="hv-vacio">Tu último nivel de estudios.</span>}</p>
        {hv.cursos && <p>Cursos: {hv.cursos}</p>}
        {hv.idiomas && <p>Idiomas: {hv.idiomas}</p>}
      </section>
      <section><h4>Habilidades</h4><p>{todas.length ? todas.join(" · ") : <span className="hv-vacio">Lo que sabes hacer.</span>}</p></section>
      {(hv.disponibilidad || hv.referencias) && (
        <section>
          {hv.disponibilidad && <p><b>Disponibilidad:</b> {hv.disponibilidad}</p>}
          {hv.referencias && <p><b>Referencias:</b> {hv.referencias}</p>}
        </section>
      )}
    </article>
  );
}

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Word abre HTML con extensión .doc: así la persona puede seguir editando su hoja de vida. */
function descargarWord(hv: HojaVida, habilidades: string[], vacante: string, exps: { rol: string; lugar: string; fechas: string; logro: string }[]) {
  const todas = [...habilidades, ...hv.otrasHabilidades.split(",").map((x) => x.trim()).filter(Boolean)];
  const h = (t: string) => `<h2 style="font-size:12pt;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #999;margin:16pt 0 6pt">${t}</h2>`;
  const html = `<html><head><meta charset="utf-8"><title>Hoja de vida</title></head><body style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.4">
<h1 style="font-size:20pt;margin:0">${esc(hv.nombre)}</h1>
${vacante ? `<p style="margin:2pt 0"><b>Aspirante a ${esc(vacante.toLowerCase())}</b></p>` : ""}
<p style="margin:2pt 0">${esc([hv.telefono, hv.correo, hv.municipio].filter(Boolean).join(" · "))}</p>
${hv.perfil ? h("Perfil") + `<p>${esc(hv.perfil)}</p>` : ""}
${exps.length ? h("Experiencia") + exps.map((e) => `<p style="margin:6pt 0 2pt"><b>${esc(e.rol)}</b>${e.lugar ? ` · ${esc(e.lugar)}` : ""}${e.fechas ? ` · ${esc(e.fechas)}` : ""}</p><ul style="margin:0"><li>${esc(e.logro)}</li></ul>`).join("") : ""}
${hv.nivel ? h("Formación") + `<p><b>${esc(hv.nivel)}</b>${hv.institucion ? ` · ${esc(hv.institucion)}` : ""}${hv.anio ? ` · ${esc(hv.anio)}` : ""}</p>${hv.cursos ? `<p>Cursos: ${esc(hv.cursos)}</p>` : ""}${hv.idiomas ? `<p>Idiomas: ${esc(hv.idiomas)}</p>` : ""}` : ""}
${todas.length ? h("Habilidades") + `<p>${esc(todas.join(" · "))}</p>` : ""}
${hv.disponibilidad ? `<p><b>Disponibilidad:</b> ${esc(hv.disponibilidad)}</p>` : ""}
${hv.referencias ? `<p><b>Referencias:</b> ${esc(hv.referencias)}</p>` : ""}
</body></html>`;
  const url = URL.createObjectURL(new Blob(["﻿", html], { type: "application/msword" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `Hoja de vida - ${hv.nombre || "sin nombre"}.doc` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
