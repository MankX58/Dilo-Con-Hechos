import { useApp } from "../state";

// Cómo se busca cada vacante en los portales (el nombre con el que aparecen las ofertas).
const BUSQUEDA: Record<string, string> = {
  vendedor: "vendedor", cajero: "cajero", mercaderista: "mercaderista", bodega: "auxiliar de bodega", domiciliario: "domiciliario",
  carga: "auxiliar de carga", confeccion: "operario de confeccion", produccion: "operario de produccion", servicio: "asesor de servicio al cliente",
  recepcion: "recepcionista", aseo: "auxiliar de servicios generales", guia: "guia turistico", cocina: "auxiliar de cocina", mesero: "mesero",
  panaderia: "auxiliar de panaderia", cafe: "recolector de cafe", flores: "operario de cultivo de flores", obra: "ayudante de construccion",
  mantenimiento: "auxiliar de mantenimiento", cuidador: "cuidador de adulto mayor", ruta: "monitor de ruta escolar",
  administrativo: "auxiliar administrativo", soporte: "auxiliar de soporte tecnico", redes: "community manager",
};
const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "");
const slug = (t: string) => sinTildes(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Enlaces a portales con la búsqueda ya armada: el cargo al que aspira y su municipio (o Antioquia). */
export function Buscar() {
  const { s, vacante } = useApp();
  if (!vacante) return null;
  const termino = s.vacante && s.vacante !== "otra" ? BUSQUEDA[s.vacante] ?? vacante.titulo : sinTildes(s.vacanteOtra.trim() || vacante.titulo).toLowerCase();
  const municipio = s.hv.municipio.split(",")[0].trim();
  const lugar = municipio || "Antioquia";
  const q = encodeURIComponent(termino), l = encodeURIComponent(lugar);
  const portales = [
    { nombre: "Computrabajo", url: `https://co.computrabajo.com/trabajo-de-${slug(termino)}-en-${slug(lugar)}`, nota: "Ofertas por cargo y ciudad." },
    { nombre: "elempleo.com", url: `https://www.elempleo.com/co/ofertas-empleo/?trabajo=${q}`, nota: "Filtra la ciudad en la página." },
    { nombre: "Indeed Colombia", url: `https://co.indeed.com/jobs?q=${q}&l=${l}`, nota: "Puedes crear una alerta por correo." },
    { nombre: "LinkedIn Empleos", url: `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${encodeURIComponent(`${lugar}, Colombia`)}`, nota: "Útil si ya tienes perfil." },
  ];
  return (
    <div className="stack">
      <p className="muted">Búsquedas ya armadas con <b>«{termino}»</b> en <b>{lugar}</b>{municipio ? "" : " (escribe tu municipio en la hoja de vida para afinarlas)"}. Se abren en otra pestaña.</p>
      <ul className="routes">
        {portales.map((p) => (
          <li key={p.nombre}><a href={p.url} target="_blank" rel="noopener noreferrer"><b>{p.nombre}</b><span>{p.nota}</span></a></li>
        ))}
      </ul>
      <p className="small muted">Los portales cambian sus filtros con el tiempo: si la ciudad no queda aplicada, elígela allí. Desconfía de ofertas que te pidan dinero para aplicar.</p>
    </div>
  );
}
