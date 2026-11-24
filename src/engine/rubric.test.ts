import { describe, expect, it } from "vitest";
import { evalLogro, evalPuente, evalRepregunta, evalStar, passLogro, passPuente, passStar, plain, repreguntaLocal, score, segmentStar, trustSegments } from "./rubric";
import { comentariosRespuesta, comparar, pistaPersonal } from "../personal";
import { partesIniciales, unir } from "../screens/Taller";
import { CASOS, PERFILES, PREGUNTA_BASE, PUENTE_EJEMPLO, SECTORES, VACANTES, adivinarOrigen, vacanteOtra } from "../content";

const failed = (c: { ok: boolean; id: string }[]) => c.filter((x) => !x.ok).map((x) => x.id);

describe("enunciado de logro", () => {
  it("los ejemplos que enseña la app cumplen sus propios criterios", () => {
    for (const p of Object.values(PERFILES)) expect(failed(evalLogro(p.logro.map(([t]) => t).join("")))).toEqual([]);
  });
  it("detecta los errores típicos", () => {
    expect(score(evalLogro("Trabajé en una tienda"))).toBe(0);
    expect(failed(evalLogro("Yo atendía clientes en la tienda de mi tía todos los días"))).toContain("verbo");
    expect(failed(evalLogro("Responsable, puntual y con ganas de aprender en un restaurante"))).toEqual(expect.arrayContaining(["verbo", "concreto"]));
    expect(failed(evalLogro("Repartió 25 pedidos diarios en bicicleta para una panadería, casi sin reclamos", "Valentina"))).toEqual(["verbo"]);
  });
  it("reconoce resultados de proyectos de estudio", () => {
    expect(passLogro(evalLogro("Vendí con 3 compañeros unas 200 empanadas en 2 ferias del colegio y recogimos $400.000 para la excursión del grado."))).toBe(true);
  });
  it("no castiga escribir sin tildes, como se escribe en el celular", () => {
    expect(failed(evalLogro("Organice el inventario de 300 productos de la tienda y reduje las perdidas a cero"))).toEqual([]);
    expect(failed(evalLogro("Atendia unos 40 clientes al dia en la tienda de mi tia y la caja siempre cuadraba"))).toEqual([]);
    expect(failed(evalLogro("Apoye a corregir 60 actas en mi casa y mi mama tuvo tiempo libre gracias a eso"))).toEqual([]);
    expect(failed(evalLogro("Busque y anote los faltantes de 20 pedidos diarios en la bodega, sin errores en 6 meses"))).toEqual([]);
  });
  it("reconoce duraciones y resultados dichos con palabras cotidianas", () => {
    expect(failed(evalLogro("Cuidé a mi abuela durante un año y nunca faltó a sus citas médicas del hospital"))).toEqual([]);
    expect(failed(evalLogro("Vendí unas 30 arepas diarias en la esquina de mi casa y gané clientes fijos del barrio"))).toEqual([]);
    expect(failed(evalLogro("Entrené a 12 niños del barrio cada sábado y el equipo subió al primer lugar del torneo"))).toEqual([]);
  });
  it("ser más flexible no regala criterios", () => {
    expect(failed(evalLogro("Trabajé tiempo completo en una tienda del centro atendiendo a los clientes"))).toEqual(expect.arrayContaining(["verbo", "dato", "resultado"]));
    expect(passLogro(evalLogro("Ganas de aprender y buena actitud en la tienda de mi tía durante un año"))).toBe(false);
  });
  it("una línea copiada de una hoja de vida (sustantivos, sin resultado) no pasa por logro", () => {
    expect(failed(evalLogro("Atención al cliente y manejo de caja registradora, cuadre de caja al final del turno."))).toEqual(expect.arrayContaining(["verbo", "dato", "resultado"]));
    expect(evalLogro("Atención al cliente en la caja").find((x) => x.id === "verbo")!.msg).toMatch(/Atendí/);
  });
  it("no da por bueno un texto sin sentido", () => {
    const c = evalLogro("asd asd asd asdf qwer zxcv sdfg asd");
    expect(failed(c)).toContain("concreto");
    expect(c.find((x) => x.id === "concreto")!.msg).toMatch(/palabras reales/);
  });
  it("aprueba un buen enunciado", () => {
    expect(passLogro(evalLogro("Preparé y despaché unos 70 almuerzos diarios en un restaurante de Envigado, sin devoluciones de pedidos durante 6 meses."))).toBe(true);
  });
});

describe("pistas con los datos de la persona", () => {
  const hechos = [{ q: "¿Cuántos?", a: "unos 40 clientes al día" }, { q: "¿Qué salía bien?", a: "la caja siempre cuadraba" }];
  it("usa el dato que la persona contó cuando falta un número", () => {
    expect(pistaPersonal(evalLogro("Atendí clientes en la tienda de mi tía en Bello durante el día"), hechos, "Atendía clientes")).toMatch(/unos 40 clientes al día/);
  });
  it("usa el resultado que la persona contó cuando falta el resultado", () => {
    expect(pistaPersonal(evalLogro("Atendí unos 40 clientes al día en la tienda de mi tía en Bello"), hechos, "Atendía clientes")).toMatch(/la caja siempre cuadraba/);
  });
  it("compara con el intento anterior", () => {
    const antes = evalLogro("Atendí clientes en la tienda de mi tía en Bello durante el día");
    const ahora = evalLogro("Atendí unos 40 clientes al día en la tienda de mi tía en Bello durante el día");
    expect(comparar(antes, ahora)).toMatch(/ahora sí cumple «dato medible»/);
    expect(comparar(null, ahora)).toBeNull();
  });
  it("comenta la respuesta de entrevista citando sus frases", () => {
    const r = "Un sábado en la tienda se dañó el datáfono y había fila. Puse un letrero y anoté cada venta.";
    const c = comentariosRespuesta(r, segmentStar(r));
    expect(c.join(" ")).toMatch(/Un sábado en la tienda/);
    expect(c.join(" ")).toMatch(/Falta contar cómo acabó/);
  });
  it("sin datos propios no inventa nada", () => {
    expect(pistaPersonal(evalLogro("Atendí unos 40 clientes al día en la tienda de mi tía, logrando que volvieran"), [], "")).toBeNull();
  });
});

describe("catálogo de vacantes", () => {
  const todas = [...Object.values(VACANTES), vacanteOtra("auxiliar de farmacia")];
  it("cada vacante está completa y sus claves no tienen tildes", () => {
    for (const v of todas) {
      expect(v.busca).toHaveLength(3);
      expect(v.claves.length).toBeGreaterThanOrEqual(5);
      for (const k of v.claves) expect(k).toBe(plain(k));
      expect(SECTORES[v.sector]).toBeTruthy();
    }
  });
  it("ninguna pregunta de vacante repite la pregunta base ni las de la prueba final", () => {
    const reservadas = new Set([PREGUNTA_BASE, ...CASOS.map((c) => c.pregunta)]);
    const preguntas = todas.map((v) => v.pregunta);
    for (const p of preguntas) expect(reservadas.has(p)).toBe(false);
    expect(new Set(preguntas).size).toBe(preguntas.length);
  });
  it("cada sector tiene al menos dos vacantes", () => {
    for (const k of Object.keys(SECTORES)) expect(Object.values(VACANTES).filter((v) => v.sector === k).length).toBeGreaterThanOrEqual(2);
  });
});

describe("logro armado por partes", () => {
  it("un texto de la hoja subida queda en «qué hiciste» y las respuestas llenan lo que falta", () => {
    const p = partesIniciales({ crudo: "Atendí clientes en la caja de un supermercado en Rionegro.", hechos: [{ a: "unos 120 clientes por turno" }, { a: "la caja siempre cuadró" }] });
    expect(p).toEqual({ que: "Atendí clientes en la caja de un supermercado en Rionegro", dato: "unos 120 clientes por turno", res: "la caja siempre cuadró" });
    expect(unir(p)).toBe("Atendí clientes en la caja de un supermercado en Rionegro, unos 120 clientes por turno, la caja siempre cuadró.");
    expect(passLogro(evalLogro(unir(p)))).toBe(true);
  });
  it("no repite un dato que el texto ya tenía", () => {
    expect(partesIniciales({ crudo: "Vendí 30 arepas diarias", hechos: [{ a: "unas 30" }] }).dato).toBe("");
  });
});

describe("tipo de experiencia de una hoja subida", () => {
  it("se adivina por el cargo o el lugar", () => {
    expect(adivinarOrigen("Auxiliar de bodega Distribuidora La Central")).toBe("ventas");
    expect(adivinarOrigen("Recolector de café en una finca de Andes")).toBe("campo");
    expect(adivinarOrigen("Proyecto de grado en el SENA")).toBe("estudio");
    expect(adivinarOrigen("Cuidé a mi abuela")).toBe("cuidado");
    expect(adivinarOrigen("Algo distinto")).toBe("otro");
  });
});

describe("respuesta STAR", () => {
  const buena = "Un sábado en la tienda de mi tía se dañó el datáfono y había fila. Tenía que seguir cobrando sin perder ventas. Puse un letrero, ofrecí pago por transferencia con el número del negocio y anoté cada venta en un cuaderno. Ese día no se fue ningún cliente sin pagar y el cuadre de caja cerró completo.";
  it("aprueba una respuesta completa y la segmenta en orden", () => {
    expect(passStar(evalStar(buena))).toBe(true);
    expect(segmentStar(buena).map((s) => s.parte)).toEqual(["S", "T", "A", "R"]);
  });
  it("no aprueba respuestas genéricas ni en plural", () => {
    expect(passStar(evalStar("Soy muy responsable y trabajo en equipo, siempre resuelvo los problemas."))).toBe(false);
    expect(passStar(evalStar("Cuando trabajaba en la obra se dañó la mezcladora y teníamos que terminar la placa. Nosotros hicimos la mezcla a mano entre todos y logramos terminar a tiempo ese mismo día sin perder material ni retrasar la entrega."))).toBe(false);
  });
  it("aprueba una respuesta corta y completa escrita sin tildes", () => {
    const c = evalStar("En la panaderia un dia llego menos pan del pedido y se iban a perder ventas. Tenia que avisar rapido. Conte las canastas, le avise al dueno y llame al proveedor. Al final repuso todo esa misma manana.");
    expect(failed(c)).toEqual([]);
  });
  it("reconoce el problema aunque no use la palabra «problema»", () => {
    expect(evalStar("En la bodega se perdian productos cada semana y nadie sabia por que.").find((x) => x.id === "t")!.ok).toBe(true);
  });
  it("evalúa la respuesta puente de quien no ha trabajado en el cargo", () => {
    const claves = VACANTES.cajero.claves;
    expect(passPuente(evalPuente(PUENTE_EJEMPLO.map((p) => p.texto).join(" "), claves))).toBe(true);
    expect(failed(evalPuente("Lo siento, no he trabajado como cajero y no sé nada, pero soy muy responsable y tengo ganas de aprender.", claves))).toEqual(expect.arrayContaining(["rec", "hecho", "c"]));
  });
  it("la repregunta local pide lo que falta y exige un detalle concreto", () => {
    expect(repreguntaLocal("Ayudé a mi tía en la tienda cuando se dañó el datáfono.")).toMatch(/dato/);
    expect(evalRepregunta("Sí.").ok).toBe(false);
    expect(evalRepregunta("Eran unas 15 personas en la fila y yo cobré a cada una en efectivo.").ok).toBe(true);
  });
  it("descarta una segmentación de la IA que no reproduce el texto", () => {
    expect(trustSegments(buena, [{ parte: "S", texto: "otra cosa" }])).toEqual(segmentStar(buena));
  });
});
