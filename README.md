**Categoría: Tema libre** · #2 NaN Hackathon — Decide con Clef

# Legit?

Pegas el mensaje que te ha llegado (SMS, WhatsApp o correo) y en un segundo te dice si es una estafa, qué marca imita y qué hacer. Sin instalar nada, desde el móvil, en español y en inglés.

> «Parece Amazon, pero el enlace no es de Amazon. No pulses.»

Pensado para una persona mayor: un color (rojo, amarillo o verde: el verde es «no veo señales», no una garantía), tres preguntas con respuesta sí/no (¿te pide datos?, ¿dice ser alguien?, ¿el enlace es de verdad suyo?), una instrucción y un botón para que se lo lea en voz alta. Si duda, otro para enviárselo a un familiar.

## Cómo decide

1. **Clef decide (vía NaN).** Una sola petición con preguntas tipadas sobre el mensaje ([`lib/clef.js`](lib/clef.js)):

   | Pregunta | Tipo | Respuestas |
   |---|---|---|
   | ¿Pide datos, códigos o dinero? | `noul` | probabilidad de «sí» |
   | ¿Te manda llamar o escribir a un contacto que da? | `noul` | probabilidad de «sí» (estafas de «llama a este número», sin enlace) |
   | ¿De qué marca dice ser? | `choice` ×4 | 50 marcas: 30 globales y 20 de España y Latinoamérica, más «otra» y «ninguna» (una pregunta por grupo: Clef admite 26 opciones por pregunta). Cada dominio nuevo está verificado en Wikidata y/o en la web de la marca: ver [`lib/brands.js`](lib/brands.js) |
   | ¿Qué patrón de estafa sigue? | `choice` | banco, paquete, cuenta, premio, familiar en apuros, soporte técnico, inversión, ninguno |
   | ¿Cuánta presión mete? | `score` | de «ninguna» a «extrema» |

2. **El código comprueba lo que Clef no puede saber** ([`lib/links.js`](lib/links.js)): saca los enlaces y mira el dominio real con [`tldts`](https://www.npmjs.com/package/tldts) (`amazon.com.seguridad.xyz` es de `seguridad.xyz`), si es de verdad de esa marca ([`lib/brands.js`](lib/brands.js)), si la imita (`paypa1.com`, `bbva-clientes.com`, o mal escrita como `mcirosfot.com`), si mezcla letras de otro alfabeto, si es un acortador o una IP. Si el dominio es el nombre exacto de la marca con una terminación que no está en la lista (`netflix.co`), mira si su portada redirige al dominio oficial; si no, avisa en amarillo sin acusar.

3. **El veredicto sale de reglas** sobre esas respuestas, no de texto generado ([`lib/verdict.js`](lib/verdict.js)). Ejemplo: dice ser una marca, el enlace no es de esa marca y pide datos → rojo. Cada motivo es un código que la web traduce, y la web enseña las probabilidades de Clef en «Por qué».

Sin Clef no hay veredicto: es quien dice qué marca se está suplantando, y sin eso no hay nada contra lo que comprobar el enlace.

## Medición

**Todavía no hay cifra.** La medición se hace con 30 estafas reales (anonimizadas y con los enlaces neutralizados) y 30 mensajes legítimos en `eval/cases.jsonl`. Cómo recogerlos: [`eval/README.md`](eval/README.md).

```bash
npm run eval:check          # valida el conjunto: 30 + 30, sin enlaces vivos ni datos personales
NAN_KEY=... npm run eval    # mide
```

Sobre los mismos mensajes corren dos brazos, con el mismo chequeo de enlaces y las mismas reglas:

- **baseline**: adivinanzas por palabras clave (`lib/mock.js`) en lugar de Clef.
- **clef**: Clef de verdad.

`eval/RESULTS.md` pone los dos lado a lado con aciertos, falsos avisos y los casos en los que falla. La diferencia entre los dos brazos es lo que aporta Clef; si es pequeña, hay que decirlo. Sin `NAN_KEY` solo corre el baseline y el informe lo avisa. Los umbrales de [`lib/verdict.js`](lib/verdict.js) se ajustan con un conjunto aparte, no con el de prueba. `eval/cases.sample.jsonl` son ejemplos inventados para probar el script, no cuentan.

## Lo que no hace

- No detecta llamadas ni voces clonadas.
- No sustituye a tu banco.
- No comprueba números de teléfono ni abre los enlaces.
- No guarda los mensajes: se analizan en el servidor y se olvidan. No se escriben en los logs.
- Todavía no lee capturas de pantalla, solo texto.

## Ejecutarlo

```bash
npm install
NAN_KEY=tu-key npm run dev      # http://localhost:3000
npm test                        # tests de enlaces y reglas
```

Sin key se puede ver la interfaz con `CLEF_MOCK=1 npm run dev`: las respuestas son simuladas y la página lo avisa. No es Clef.

## Desplegar en Vercel

Importa el repo en Vercel (sin framework) y añade `NAN_KEY` en Settings → Environment Variables. La key solo vive en el servidor ([`api/check.js`](api/check.js)); el navegador nunca la ve. Si Clef responde `429` (una petición a la vez por key), la función espera un segundo y reintenta.

## Estructura

```
public/index.html   la web (una sola página, sin dependencias)
api/check.js        POST /api/check
lib/clef.js         las cuatro preguntas y la llamada a Clef
lib/links.js        extracción y comprobación de enlaces
lib/brands.js       marcas, dominios oficiales y acortadores
lib/verdict.js      reglas y umbrales
eval/run.mjs        medición con y sin Clef
eval/check-cases.mjs valida el conjunto de medición
```
