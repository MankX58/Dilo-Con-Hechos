import { countActions, hasNumber, hasResult, type Check, type Segmento } from "./engine/rubric";

/** Qué cambió respecto al intento anterior, en palabras simples. */
export function comparar(antes: Check[] | null, ahora: Check[]): string | null {
  if (!antes) return null;
  const era = (id: string) => antes.find((c) => c.id === id)?.ok;
  const ganados = ahora.filter((c) => c.ok && !era(c.id)).map((c) => c.label.toLowerCase());
  const perdidos = ahora.filter((c) => !c.ok && era(c.id)).map((c) => c.label.toLowerCase());
  const lista = (xs: string[]) => { const q = xs.map((x) => `«${x}»`); return q.length > 1 ? `${q.slice(0, -1).join(", ")} y ${q.at(-1)}` : q[0]; };
  if (!ganados.length && !perdidos.length) return "Frente a tu intento anterior, cumple lo mismo. Cambia solo lo que está marcado abajo.";
  return [
    ganados.length ? `Frente a tu intento anterior, ahora sí cumple ${lista(ganados)}.` : "",
    perdidos.length ? `Pero dejó de cumplir ${lista(perdidos)}: revisa que no lo hayas borrado.` : "",
  ].filter(Boolean).join(" ");
}

/** Lo que el tutor leyó en una respuesta de entrevista, citando sus frases. */
export function comentariosRespuesta(texto: string, segmentos: Segmento[]): string[] {
  const parte = (p: Segmento["parte"]) => segmentos.find((s) => s.parte === p)?.texto;
  const frases = texto.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  const ultima = frases.at(-1) ?? "";
  const out: string[] = [];
  const s = parte("S"), a = parte("A"), r = parte("R");
  if (s) out.push(`Arrancas bien: «${corta(s, 12)}» ubica a quien te escucha.`);
  else if (frases[0]) out.push(`Empiezas con «${corta(frases[0], 10)}». Antes de eso, di dónde estabas y qué pasó.`);
  if (a) out.push(`Se ve lo que hiciste tú: «${corta(a, 12)}».`);
  else if (countActions(texto) === 0) out.push("No encontré ninguna acción tuya en primera persona: ¿qué hiciste tú, paso a paso?");
  if (r) out.push(`Tu cierre «${corta(r, 12)}» deja claro cómo terminó${hasNumber(r) ? ", y con un dato" : ""}.`);
  else if (ultima) out.push(`Terminas en «${corta(ultima, 10)}». Falta contar cómo acabó todo gracias a ti.`);
  return out.slice(0, 3);
}
import type { Hecho } from "./state";

const corta = (t: string, n = 8) => { const w = t.trim().split(/\s+/); return w.length > n ? `${w.slice(0, n).join(" ")}…` : t.trim().replace(/[.\s]+$/, ""); };

/** Convierte lo que falta en una pista hecha con lo que la persona contó. Sin datos suyos, devuelve null (se usa la pregunta general). */
export function pistaPersonal(checks: Check[], hechos: Hecho[], crudo: string): string | null {
  const falta = (id: string) => checks.some((c) => c.id === id && !c.ok);
  const conDato = hechos.find((h) => hasNumber(h.a));
  const conResultado = hechos.find((h) => hasResult(h.a));
  if (falta("dato") && conDato) return `Me contaste «${conDato.a}». Ese dato le da tamaño a tu logro: ¿dónde lo pondrías?`;
  if (falta("resultado") && conResultado) return `Me dijiste «${conResultado.a}»: eso es un resultado. Ponlo al final de tu frase.`;
  if (falta("resultado") && hechos.length) return `De lo que me contaste (${hechos.map((h) => `«${h.a}»`).join(", ")}), ¿qué cambió o salió bien gracias a ti?`;
  if (falta("verbo") && crudo) return `Al principio escribiste «${corta(crudo)}». ¿Qué hacías tú exactamente? Empieza con ese verbo: atendí, organicé, preparé…`;
  if (falta("dato") && crudo) return `En «${corta(crudo)}» falta un número: ¿cuántos, cada cuánto o por cuánto tiempo?`;
  return null;
}
