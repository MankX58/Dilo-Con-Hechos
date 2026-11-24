# Dilo con hechos

Orientador de empleabilidad para el reto **Antioquia sin brechas** (Expl-AI-n 2026 × Universidad de Medellín).

**Para quién:** jóvenes y personas de Antioquia que buscan su primer empleo formal o uno nuevo, tienen experiencia real (tienda, finca, cuidado, barrio, colegio) y no saben contarla.
**Competencia:** convertir una experiencia en un enunciado de logro para la hoja de vida y defenderlo en una entrevista con el método STAR.

## Recorrido

| Etapa | Qué pasa | Papel de la IA |
|---|---|---|
| Diagnóstico | Elige una vacante de práctica, escribe su experiencia como la pondría hoy y responde una pregunta de entrevista. Es la línea base. | — |
| Taller de logros | Lección corta → el tutor le hace preguntas sobre **su** texto para sacar los hechos (cifras, lugar, resultado) → la persona escribe el logro con un medidor de criterios en vivo → revisión y reintentos → el logro pasa a su hoja de vida. | Formula las preguntas y da retroalimentación (fortaleza, mejora, pregunta). Nunca escribe el logro. |
| Entrevista | Lección STAR → 3 preguntas: una general, **una construida sobre su propio logro** y una de la vacante. Voz para escuchar y dictar. Su respuesta se ve partida en S/T/A/R. | Genera la pregunta sobre su hoja de vida, segmenta la respuesta y da retroalimentación. |
| Prueba final | Caso nuevo y pregunta nueva, sin medidor, guía ni tutor. | — (se evalúa con criterios fijos) |
| Resultado | Tabla inicio / práctica / prueba, antes y después, hoja de vida para guardar como PDF o copiar. | — |

Además:
- **24 vacantes de práctica** en 9 sectores y 16 municipios de Antioquia, con buscador, filtros y «Otra vacante».
- **Ruta sin experiencia en el cargo:** cada logro se conecta con una habilidad del aviso, y en la entrevista se practica «¿por qué darte la oportunidad?» con la estructura del puente.
- **Repregunta adaptativa:** la entrevistadora pide el detalle que falta en la respuesta.
- **Accesibilidad:** letra grande, alto contraste, escuchar al tutor y las preguntas, dictado por voz.
- **Sin conexión:** después de la primera visita funciona sin internet con el revisor por criterios (service worker, solo en producción).
- **«Cómo funciona»:** ventana para cualquier persona (y para el jurado) que dice qué hace la IA, qué hace el revisor y si la IA está conectada en ese momento.
- **Rutas de empleo** al final: Servicio Público de Empleo, APE del SENA, Comfama y Comfenalco Antioquia.

## Arquitectura

```
src/engine/rubric.ts   Revisor por criterios (local, siempre disponible) + prueba
src/content.ts         Perfiles, vacantes de práctica, casos de la prueba
src/ai/client.ts       Pide tareas al tutor; si no hay IA devuelve null y se usa el revisor local
api/tutor.ts           Función de servidor (Vercel): tareas fijas → Gemini, rotando cuentas y modelos
src/screens/*          Una pantalla por etapa
```

- Las claves de la API **solo viven en el servidor**. El navegador no envía prompts, solo el nombre de una tarea y los textos (validados y con tope de largo).
- Si no hay clave, se acaba la cuota o la IA falla, la app funciona completa con el revisor por criterios y lo dice en la cabecera.

### Cuota gratuita de Gemini
El plan gratuito permite pocas solicitudes (por ejemplo 5 por minuto y 20 por día, **por cuenta y por modelo**). Por eso:
- `GEMINI_API_KEYS` acepta varias claves separadas por comas (una por cuenta) y `GEMINI_MODELS` varios modelos. El servidor usa primero el mejor modelo en todas las cuentas y, cuando una responde 429, la pausa (un minuto, o hasta la medianoche del Pacífico si fue el límite diario) y pasa a la siguiente.
- 2 cuentas × 2 modelos × 20 = unas **80 solicitudes al día**; cada cuenta extra suma 40.
- **5 solicitudes por persona.** El tutor consulta la IA en cinco momentos y cada respuesta trae, además de lo inmediato, lo que el tutor dirá en los pasos siguientes. Se guarda en el avance de la persona y nunca se vuelve a pedir:
  1. `conocer` (al terminar el diagnóstico): saludo y lectura de lo que escribió, enfoque, consejo de entrevista y las preguntas del taller.
  2. `logro` (primer intento del primer logro): opinión + pista para los intentos siguientes + frase para cuando lo logre.
  3. `preparar` (al llegar a la entrevista, mientras lee la lección): pregunta sobre su hoja de vida + una pista personal por pregunta.
  4. `star` (primera respuesta STAR): opinión, partes S/T/A/R, repregunta y un consejo que acompaña las siguientes preguntas.
  5. `cierre` (resultado): mensaje sobre su avance real, lo que más mejoró y su siguiente paso.
- Entre un momento y otro el tutor no se calla: habla con lo que ya preparó. Sin IA, usa sus textos propios y el revisor por criterios.
- Cada dispositivo tiene un tope silencioso de 8 por día (los 5 momentos más reintentos); por IP solo hay un freno contra abusos, porque en el evento muchas personas comparten la red.
- 80 solicitudes al día alcanzan para unas 16 personas completas; con una tercera cuenta, unas 24.

## Correr en local

```powershell
npm install
copy .env.example .env.local   # y pega tus GEMINI_API_KEYS (opcional)
npm run dev                    # http://localhost:5173
npm test                       # pruebas del revisor por criterios
```

## Publicar (Vercel, gratis)

1. Sube la carpeta a un repositorio de GitHub.
2. En vercel.com → **Add New → Project** → importa el repositorio (detecta Vite solo).
3. En **Environment Variables** agrega `GEMINI_API_KEYS` con tus claves de aistudio.google.com separadas por comas, sin espacios (`clave1,clave2`).
4. **Deploy**. El enlace `https://<proyecto>.vercel.app` es el que envías.

Sin la variable, el enlace funciona igual, pero solo con el revisor por criterios.

## Cambiar el enfoque

- **Otra población u oficios:** `PERFILES` y `VACANTES` en `src/content.ts`.
- **Otros casos de la prueba:** `CASOS` en `src/content.ts` (no deben repetirse en la práctica).
- **Otra competencia:** reemplaza `evalLogro` / `evalStar` en `src/engine/rubric.ts`, los prompts de `api/tutor.ts` y las dos lecciones. El recorrido (diagnóstico → taller → práctica → prueba → resultado) se reutiliza.
- **Exigencia:** `passLogro` (4/4) y `passStar` (4/5 con acción y resultado) en `rubric.ts`.

`prototipo-v1/` guarda la primera versión de un solo archivo HTML.
