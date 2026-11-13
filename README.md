**Categoría: Tema libre** · #2 NaN Hackathon — Decide con Clef

# Legit?

Pegas el mensaje que te ha llegado (SMS, WhatsApp o correo) y en un segundo te dice si es una estafa, qué marca imita y qué hacer. Sin instalar nada, desde el móvil, en español y en inglés.

> «Parece Amazon, pero el enlace no es de Amazon. No pulses.»

Pensado para una persona mayor: un color (rojo, amarillo o verde), una frase y una instrucción. Si duda, un botón para enviárselo a un familiar.

## Cómo decide

1. **Clef decide (vía NaN).** Una sola petición con preguntas tipadas sobre el mensaje ([`lib/clef.js`](lib/clef.js)):

   | Pregunta | Tipo | Respuestas |
   |---|---|---|
   | ¿Pide datos, códigos o dinero? | `noul` | probabilidad de «sí» |
   | ¿De qué marca dice ser? | `choice` ×2 | 30 marcas globales, «otra» y «ninguna» (en dos preguntas: Clef admite 26 opciones por pregunta) |
   | ¿Qué patrón de estafa sigue? | `choice` | banco, paquete, cuenta, premio, familiar en apuros, soporte técnico, inversión, ninguno |
   | ¿Cuánta presión mete? | `score` | de «ninguna» a «extrema» |

2. **El código comprueba lo que Clef no puede saber** ([`lib/links.js`](lib/links.js)): saca los enlaces y mira el dominio real con [`tldts`](https://www.npmjs.com/package/tldts) (`amazon.com.seguridad.xyz` es de `seguridad.xyz`), si es de verdad de esa marca ([`lib/brands.js`](lib/brands.js)), si la imita (`paypa1.com`, `bbva-clientes.com`), si mezcla letras de otro alfabeto, si es un acortador o una IP.

3. **El veredicto sale de reglas** sobre esas respuestas, no de texto generado ([`lib/verdict.js`](lib/verdict.js)). Ejemplo: dice ser una marca, el enlace no es de esa marca y pide datos → rojo. Cada motivo es un código que la web traduce, y la web enseña las probabilidades de Clef en «Por qué».

Sin Clef no hay veredicto: es quien dice qué marca se está suplantando, y sin eso no hay nada contra lo que comprobar el enlace.

## Medición

**Todavía no hay cifra.** La medición se hace con 30 estafas reales (anonimizadas y con los enlaces neutralizados) y 30 mensajes legítimos en `eval/cases.jsonl`:

```bash
NAN_KEY=... npm run eval
```

Escribe `eval/RESULTS.md` con aciertos, falsos avisos y los casos en los que falla. Los umbrales de [`lib/verdict.js`](lib/verdict.js) se ajustan con esa medición, no a ojo. `eval/cases.sample.jsonl` son ejemplos inventados para probar el script, no cuentan.

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
eval/run.mjs        medición
```
