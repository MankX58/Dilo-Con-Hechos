// Revisor por criterios: reglas fijas y transparentes. Funciona siempre, con o sin IA.
// ponytail: heurísticas por listas de palabras; ampliarlas con lo que se vea en pruebas con usuarios reales.

export interface Check { id: string; label: string; ok: boolean; msg: string }

export const plain = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
export const wordsOf = (s: string) => s.toLowerCase().match(/[a-záéíóúüñ]+|\d+/g) ?? [];
export const wordCount = (s: string) => wordsOf(s).length;
/** Segundos aproximados al decirlo en voz alta (~140 palabras por minuto). */
export const speakingSeconds = (s: string) => Math.round(wordCount(s) / 2.3);

const VERB_STEMS = ["atend","vend","organiz","organic","busc","busqu","anot","cont","sum","not","detect","report","avis","llam","encontr","entren","ayud","subi","gan","corrig","dirig","acomod","guard","empaqu","cuid","acompan","escrib","respond","calm","explic","ensen","ofrec","decid","aprend","pas","termin","envi","mont","reun","compr","pag","coordin","manej","lider","prepar","entreg","cobr","llev","control","registr","disen","cree","ensen","capacit","resolv","logr","aument","reduj","reduc","mejor","cuid","recolect","cosech","empac","repart","program","planific","administr","gestion","supervis","acompan","cocin","limpi","arregl","repar","instal","conduj","conduc","produj","produc","elabor","clasific","invent","digit","redact","comunic","negoci","propus","propon","implement","apoy","asesor","despach","recib","orden","atencion","venta","manejo","sembr","fumig","constru","pint","dict","convoc","recaud","verific","revis","calcul","factur","promocion","traduj","traduc","mantuv","cumpl","consegu","ahorr","evit","entren","fund","emprend","cosi","confeccion","alist","carg","descarg","despach","contest","solucion"];
const NOT_START = new Set(["yo","mi","mis","me","el","la","los","las","un","una","unos","unas","en","de","del","con","por","para","soy","fui","era","he","tengo","tuve","persona","buena","bueno","excelente","experiencia","trabajo","se","que","como","muy","cuando","hace","desde","durante","nosotros","nos"]);
const DUTY = new Set(["responsable","encargado","encargada","auxiliar","cargo","funciones"]);
const WEAK = new Set(["trabaje","trabajaba","ayude","ayudaba","hice","hacia","estuve","estaba","colabore","colaboraba","participe","participaba","realice","realizaba","tenia"]);
const NUM_WORDS = new Set(["dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez","once","doce","quince","veinte","treinta","cuarenta","cincuenta","sesenta","setenta","ochenta","noventa","cien","ciento","cientos","doscientos","trescientos","quinientos","mil","docena","docenas","decena","decenas","diario","diaria","diarios","diarias","semanal","semanales","mensual","mensuales","cada","mitad","doble","porciento"]);
const RESULT_RE = /\b(gane|gano|ganamos|gananci|clientes fijos|duplic|triplic|cero|sin problema|confian|regres|volvian|subio|subimos|primer lugar|campeon|ascend|promov|me contrat|contrataron|me dejaron|me encargaron|benefici|sirvio|recuper|increment|disminu|tuvo tiempo|repuso|logr|permit|aument|reduj|reduc|mejor|ahorr|sin error|sin faltante|sin queja|sin reclamo|sin olvid|sin perder|sin devolucion|a tiempo|cumpl|satisf|recomend|fideliz|crec|gracias a|consegu|evit|para que|resolv|ningun|volvi|meta|recaud|premio|felicit|reconoc|aprob|termin|nunca|siguen|seguian|ya no|al final|quedo|quedaron|funciono|salio bien|se soluciono|solucion|cuadr|mas rapido|menos tiempo|recog|reunimos|reuni)/;
const CLICHE_RE = /\b(responsable|proactiv\w*|trabajo en equipo|buena actitud|ganas de aprender|honest\w*|puntual\w*|comprometid\w*|dinamic\w*|excelente|varias cosas|muchas cosas|de todo un poco|lo que fuera|etc)\b/;
const FP_EXCL = new Set(["qué","porqué","café","sé","fé","bebé","sí","así","ahí","aquí","allí","mí","tí","dí","olé","jamás"]);
const FP_LIST = new Set(["conte","note","detecte","reporte","encontre","solucione","corregi","aplique","recibi","vendi","cuide","limpie","cocine","escribi","respondi","informe","sume","calcule","registre","ordene","acomode","guarde","empaque","cargue","descargue","despache","digite","apoye","acompane","dirigi","lidere","maneje","disene","cree","encargue","asegure","comprobe","volvi","reuni","convenci","entrene","venci","hice","dije","puse","tuve","pude","supe","quise","traje","propuse","conduje","vine","di","fui","hable","llame","organice","busque","pregunte","explique","decidi","ofreci","atendi","resolvi","pedi","aprendi","practique","revise","anote","cambie","ayude","calme","escuche","negocie","reparti","prepare","termine","entregue","acepte","converse","investigue","segui","pense","coordine","dividi","priorice","llegue","sali","empece","comence","intente","logre","consegui","mostre","ensene","pase","arregle","mire","use","avise","lleve","verifique"]);
const NOS_RE = /\b(nosotros|hicimos|decidimos|organizamos|resolvimos|logramos|hablamos|pusimos)\b/;
const SIT_RE = /\b(cuando|una vez|un dia|el dia|en (la|el|mi|una|un)|durante|trabajaba|estaba|estudiaba|hace|el ano|el mes|la semana|un sabado|un domingo|un lunes)\b/;
const TASK_RE = /\b(perd|desorden|demor|no alcanz|se acab|no lleg|llego menos|menos de lo|nadie sab|complic|enferm|accidente|se cayo|se rompio|no funcion|no servia|iban a|faltaron|faltantes|tenia que|debia|necesit|problema|reto|objetivo|me pidieron|habia que|me toco|tocaba|queria|se dano|faltaba|no habia|urgente|dificil|aprender|no sabia|mucho trabajo|al mismo tiempo|molest|queja|reclam|atrasad|error|equivoque)/;

/** Letras al azar («asd», «qwer») o la misma palabra repetida: no hay nada que revisar. */
export function sinSentido(t: string): boolean {
  const ws = wordsOf(plain(t)).filter((w) => !/^\d+$/.test(w));
  if (!ws.length) return false;
  const raras = ws.filter((w) => !/[aeiou]/.test(w) || /[^aeiou]{4,}/.test(w) || /^(asd|qwe|zxc|jaja|xd|sdf|dfg|hjk|aaa|eee)/.test(w)).length;
  return raras / ws.length >= 0.4 || (ws.length >= 4 && new Set(ws).size / ws.length < 0.5);
}
const firstWord = (t: string) => t.toLowerCase().replace(/^[\s\-•*·\d.)]+/, "").match(/[a-záéíóúüñ]+/)?.[0] ?? "";
export const hasNumber = (t: string) =>
  /\d|%/.test(t) || wordsOf(plain(t)).some((w) => NUM_WORDS.has(w)) || /\b(al dia|por dia|a la semana|al mes|por semana|todos los dias|todos los fines|(un|una|medio|media) (ano|mes|semana|dia|hora|temporada|semestre|jornada))\b/.test(plain(t));
export const hasResult = (t: string) => RESULT_RE.test(plain(t));
export const countActions = (t: string) => wordsOf(t).filter((w) => (/[éí]$/.test(w) && !FP_EXCL.has(w)) || FP_LIST.has(plain(w))).length;

export const LOGRO_LABELS = { verbo: "Verbo de acción", concreto: "Hecho concreto", dato: "Dato medible", resultado: "Resultado" } as const;
export type LogroCriterio = keyof typeof LOGRO_LABELS;

/** Enunciado de logro: 4 criterios. `persona` activa la revisión de primera persona en casos ajenos. */
export function evalLogro(text: string, persona?: string): Check[] {
  const t = text.trim();
  if (!t) return (Object.keys(LOGRO_LABELS) as LogroCriterio[]).map((id) => ({ id, label: LOGRO_LABELS[id], ok: false, msg: "Aún no hay texto." }));
  const raw = firstWord(t), fw = plain(raw), wc = wordCount(t), pt = plain(t);
  let verbo: [boolean, string];
  if (!fw) verbo = [false, "Empieza con lo que hiciste."];
  else if (fw === "yo") verbo = [false, "Quita el «yo» del inicio. En la hoja de vida se empieza directo con el verbo: Atendí, Organicé, Preparé."];
  else if (DUTY.has(fw)) verbo = [false, `«${raw}» describe un cargo, no una acción. Cámbialo por un verbo que diga qué hacías.`];
  else if (WEAK.has(fw)) verbo = [false, `«${raw}» es un verbo muy general. Usa uno que muestre la acción exacta: atendí, organicé, vendí, preparé.`];
  else if (/ó$/.test(raw) && persona) verbo = [false, `Escríbelo como lo pondría ${persona} en su hoja de vida, en primera persona: «Repartí», no «Repartió».`];
  else if (!NOT_START.has(fw) && (FP_LIST.has(fw) || VERB_STEMS.some((s) => fw.startsWith(s)) || /(é|í|aba|ía|ar|er|ir|ción|sión)$/.test(raw))) verbo = [true, `Empiezas con «${raw}»: se ve la acción de inmediato.`];
  else verbo = [false, "Empieza con un verbo de acción (Atendí, Organicé, Preparé) en vez de una descripción."];
  const cl = pt.match(CLICHE_RE);
  const concreto: [boolean, string] =
    sinSentido(t) ? [false, "Parece que no son palabras reales. Escribe con tus palabras qué hiciste, dónde y para quién."]
    : wc < 8 ? [false, "Es muy corto. Cuenta qué hacías, dónde o para quién."]
    : wc > 45 ? [false, `Tiene ${wc} palabras. Una línea de hoja de vida cabe en uno o dos renglones: deja solo lo que más pesa.`]
    : cl ? [false, `«${cl[0]}» lo escribe casi todo el mundo. Cámbialo por un hecho que lo demuestre.`]
    : [true, "Es concreto y de buen tamaño."];
  const dato: [boolean, string] = hasNumber(t) ? [true, "Incluye un dato que da tamaño a lo que hiciste."] : [false, "Falta un dato: cuántos, cada cuánto o por cuánto tiempo. Una aproximación honesta sirve."];
  const resultado: [boolean, string] = hasResult(t) ? [true, "Dice qué pasó gracias a ti."] : [false, "Falta el resultado: qué mejoró, qué se logró o qué no falló gracias a ti."];
  const all = { verbo, concreto, dato, resultado };
  return (Object.keys(all) as LogroCriterio[]).map((id) => ({ id, label: LOGRO_LABELS[id], ok: all[id][0], msg: all[id][1] }));
}

export const STAR_LABELS = { s: "Situación", t: "Tarea o problema", a: "Acción propia", r: "Resultado", c: "Claro y concreto" } as const;

/** Respuesta de entrevista (texto libre): 5 criterios del método STAR. */
export function evalStar(text: string): Check[] {
  const t = text.trim();
  if (!t) return Object.entries(STAR_LABELS).map(([id, label]) => ({ id, label, ok: false, msg: "Aún no hay respuesta." }));
  const pt = plain(t), wc = wordCount(t), acts = countActions(t), cl = pt.match(CLICHE_RE);
  const s = SIT_RE.test(pt), task = TASK_RE.test(pt), a = acts >= 2, r = hasResult(t), c = wc >= 30 && wc <= 230 && !cl;
  return [
    { id: "s", label: STAR_LABELS.s, ok: s, msg: s ? "Ubicas a quien escucha: dónde estabas y qué pasaba." : "Empieza ubicando la historia en una o dos frases: dónde estabas y qué pasó." },
    { id: "t", label: STAR_LABELS.t, ok: task, msg: task ? "Queda claro cuál era el problema o lo que había que lograr." : "Di qué tenías que lograr o cuál era el problema." },
    { id: "a", label: STAR_LABELS.a, ok: a, msg: a ? `Cuentas ${acts} acciones tuyas en primera persona.` : NOS_RE.test(pt) ? "Hablas en plural («hicimos»). Quien entrevista quiere saber qué hiciste tú: usa verbos como hablé, propuse, organicé." : "Cuenta al menos dos cosas que hiciste tú, con verbos en primera persona: hablé, revisé, organicé. Ojo con las tildes: «organicé»." },
    { id: "r", label: STAR_LABELS.r, ok: r, msg: r ? (hasNumber(t) ? "Cierras con un resultado y hasta con un dato." : "Cierras con un resultado. Si puedes, agrégale un dato.") : "Termina contando cómo acabó: qué se logró, qué mejoró o qué se evitó gracias a ti." },
    { id: "c", label: STAR_LABELS.c, ok: c, msg: cl ? `«${cl[0]}» es una frase genérica. Cámbiala por algo que hiciste.` : wc < 30 ? `Tiene ${wc} palabras. Dale un poco más de cuerpo (al menos 30): en voz alta debería durar uno o dos minutos.` : wc > 230 ? `Tiene ${wc} palabras. Recórtala para que no pase de dos minutos.` : "Tiene un largo adecuado para decirla en uno o dos minutos." },
  ];
}

const RECONOCE_RE = /\b(no (he|e) (trabajado|sido|tenido)|no tengo experiencia|aunque no|todavia no|aun no|seria mi primer|nunca he trabajado|es mi primer)/;
const DISCULPA_RE = /\b(lo siento|perdon|disculp|no se nada|no sirvo|no soy bueno|no soy buena|soy malo|soy mala)/;
const COMPROMETE_RE = /\b(aprend|dispuest|practic|me comprometo|estoy list|quiero|me gustaria|capacit|me adapto|pongo de mi parte|dar lo mejor)/;

/** Respuesta «puente» para quien no ha trabajado en el cargo: reconoce, conecta, compromete. */
export function evalPuente(text: string, claves: string[]): Check[] {
  const t = text.trim();
  const labels = { rec: "Reconoce sin disculparse", hecho: "Conecta con un hecho tuyo", vac: "Habla de lo que busca la vacante", comp: "Cierra con compromiso", c: "Claro y concreto" };
  if (!t) return Object.entries(labels).map(([id, label]) => ({ id, label, ok: false, msg: "Aún no hay respuesta." }));
  const pt = plain(t), wc = wordCount(t), cl = pt.match(CLICHE_RE), disc = pt.match(DISCULPA_RE);
  const rec = RECONOCE_RE.test(pt) && !disc;
  const hecho = countActions(t) >= 1 && hasNumber(t);
  const vac = wordsOf(pt).some((w) => claves.some((k) => w.startsWith(k)));
  const comp = COMPROMETE_RE.test(pt);
  const c = wc >= 35 && wc <= 200 && !cl;
  return [
    { id: "rec", label: labels.rec, ok: rec, msg: disc ? `«${disc[0]}» te resta. No tienes que pedir perdón por no haber trabajado: dilo y sigue.` : rec ? "Lo reconoces de frente, sin esconderlo." : "Empieza reconociendo con honestidad que no has trabajado en este cargo. Así quitas la duda de en medio." },
    { id: "hecho", label: labels.hecho, ok: hecho, msg: hecho ? "Muestras una experiencia tuya con un dato." : countActions(t) >= 1 ? "Ya cuentas algo que hiciste. Agrégale un dato: cuántos, cada cuánto o por cuánto tiempo." : "Cuenta una experiencia tuya (de la casa, el colegio, el barrio) con un verbo en primera persona y un dato." },
    { id: "vac", label: labels.vac, ok: vac, msg: vac ? "Se nota la relación entre lo que hiciste y lo que pide el cargo." : "Conecta tu experiencia con algo que busca la vacante. Mira las etiquetas del aviso que elegiste." },
    { id: "comp", label: labels.comp, ok: comp, msg: comp ? "Cierras mostrando disposición a aprender." : "Termina diciendo cómo vas a aprender lo que te falta. Si puedes, con un ejemplo de algo que aprendiste rápido." },
    { id: "c", label: labels.c, ok: c, msg: cl ? `«${cl[0]}» es una frase genérica. Cámbiala por algo que hiciste.` : wc < 35 ? `Tiene ${wc} palabras. Dale un poco más de cuerpo: al menos 35.` : wc > 200 ? `Tiene ${wc} palabras. Recórtala: menos de dos minutos.` : "Tiene un largo adecuado." },
  ];
}
export const passPuente = (c: Check[]) => score(c) >= 4 && c.some((x) => x.id === "hecho" && x.ok) && c.some((x) => x.id === "vac" && x.ok);

/** Repregunta local: pide el detalle que más le falta a la respuesta (respaldo de la IA). */
export function repreguntaLocal(respuesta: string): string {
  if (!hasNumber(respuesta)) return "¿Me das un dato de eso? Por ejemplo, cuántas personas, cuánto tiempo o cuánto dinero.";
  if (countActions(respuesta) < 3) return "¿Qué hiciste tú exactamente, paso a paso?";
  return "Si te volviera a pasar, ¿qué harías distinto?";
}
/** Una buena respuesta a la repregunta es corta pero concreta: frase completa con un dato o una acción propia. */
export function evalRepregunta(text: string): Check {
  const wc = wordCount(text), ok = wc >= 10 && (hasNumber(text) || countActions(text) >= 1);
  return {
    id: "rep", label: "Respuesta a la repregunta", ok,
    msg: ok ? "Respondes con un detalle concreto: así se sostiene una entrevista." : wc < 10 ? "Respóndela con una o dos frases completas, no con una sola palabra." : "Agrega algo concreto: un dato o una acción tuya en primera persona.",
  };
}

/** Frase genérica encontrada en el texto (para el perfil de la hoja de vida), o null. */
export const cliche = (t: string) => plain(t).match(CLICHE_RE)?.[0] ?? null;

export const score = (c: Check[]) => c.filter((x) => x.ok).length;
export const passLogro = (c: Check[]) => score(c) === 4;
export const passStar = (c: Check[]) => score(c) >= 4 && c.some((x) => x.id === "a" && x.ok) && c.some((x) => x.id === "r" && x.ok);

export type Parte = "S" | "T" | "A" | "R" | "otro";
export interface Segmento { parte: Parte; texto: string }

/** Divide una respuesta en frases y las etiqueta S/T/A/R. Respaldo local de la segmentación de la IA. */
export function segmentStar(text: string): Segmento[] {
  const frases = text.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  return frases.map((f, i) => {
    const p = plain(f), tarde = i >= frases.length / 2, acts = countActions(f);
    let parte: Parte = "otro";
    if (i === 0 && SIT_RE.test(p) && acts === 0) parte = "S";
    else if (!tarde && TASK_RE.test(p) && acts === 0) parte = "T";
    else if (hasResult(f) && (tarde || acts === 0)) parte = "R";
    else if (acts > 0) parte = "A";
    else if (SIT_RE.test(p)) parte = "S";
    else if (TASK_RE.test(p)) parte = "T";
    return { parte, texto: f };
  });
}

/** Acepta la segmentación de la IA solo si reproduce el texto original; si no, usa la local. */
export function trustSegments(text: string, segs: Segmento[] | undefined): Segmento[] {
  const norm = (s: string) => s.replace(/\s+/g, "");
  if (segs?.length && norm(segs.map((s) => s.texto).join("")) === norm(text)) return segs;
  return segmentStar(text);
}
