import { describe, expect, it } from "vitest";
import { anonimizar, datosLocales, lineasCandidatas } from "./leer";

const HV = `Carolina Pérez Gómez
C.C. 1.036.123.456 · Cel. 300 123 4567 · caro.perez@correo.com
Bello, Antioquia

Experiencia
Auxiliar de ventas, Tienda El Ahorro (2022 - 2024)
Atendía clientes y manejaba la caja registradora todos los días.
Bachiller, I. E. Fe y Alegría, 2021`;

describe("lectura de hoja de vida", () => {
  it("encuentra nombre, correo y celular sin IA", () => {
    expect(datosLocales(HV)).toMatchObject({ nombre: "Carolina Pérez Gómez", correo: "caro.perez@correo.com", telefono: "300 123 4567", municipio: "Bello" });
  });
  it("lee estudios, cursos, habilidades y cada experiencia de una hoja de vida completa", () => {
    const d = datosLocales(`HOJA DE VIDA
LAURA MARCELA GÓMEZ
Cel. 311 555 1234 - laura.g@correo.com
Itagüí, Antioquia

PERFIL
Persona responsable, puntual y con ganas de aprender.

EXPERIENCIA LABORAL
Auxiliar de bodega - Distribuidora La Central (2023 - 2024)
Recibía mercancía, organizaba estanterías y ayudaba en el despacho de pedidos.
Ayudante en negocio familiar - Miscelánea Doña Rosa (2020 - 2023)
Atendía clientes los fines de semana y llevaba el inventario en un cuaderno.

FORMACIÓN ACADÉMICA
Bachiller - I.E. Ciudad Itagüí - 2020
Curso de Excel básico - SENA (2022)

HABILIDADES
Manejo de montacargas, Excel básico, trabajo en equipo

IDIOMAS
Inglés básico

Disponibilidad: inmediata, tiempo completo

REFERENCIAS
Carlos Ruiz - Supervisor - 300 000 0000`);
    expect(d).toMatchObject({
      nombre: "Laura Marcela Gómez", municipio: "Itagüí", perfil: "Persona responsable, puntual y con ganas de aprender.",
      nivel: "Bachiller", institucion: "I.E. Ciudad Itagüí", anio: "2020", idiomas: "Inglés básico", disponibilidad: "inmediata, tiempo completo",
    });
    expect(d.cursos).toContain("Curso de Excel básico");
    expect(d.habilidades).toEqual(["Manejo de montacargas", "Excel básico", "trabajo en equipo"]);
    expect(d.referencias).toContain("Carlos Ruiz");
    expect(d.experiencias).toEqual([
      { cargo: "Auxiliar de bodega", lugar: "Distribuidora La Central", fechas: "2023 - 2024", descripcion: "Recibía mercancía, organizaba estanterías y ayudaba en el despacho de pedidos." },
      { cargo: "Ayudante en negocio familiar", lugar: "Miscelánea Doña Rosa", fechas: "2020 - 2023", descripcion: "Atendía clientes los fines de semana y llevaba el inventario en un cuaderno." },
    ]);
  });
  it("lo que va a la IA no lleva nombre, correo, celular ni cédula", () => {
    const t = anonimizar(HV, "Carolina Pérez Gómez");
    for (const dato of ["Carolina", "Pérez", "caro.perez@correo.com", "300 123 4567", "1.036.123.456"]) expect(t).not.toContain(dato);
    expect(t).toContain("Atendía clientes y manejaba la caja");
    expect(t).toContain("2022 - 2024");
  });
  it("propone líneas de experiencia para elegir sin IA", () => {
    expect(lineasCandidatas(HV)).toContain("Atendía clientes y manejaba la caja registradora todos los días.");
  });
});
