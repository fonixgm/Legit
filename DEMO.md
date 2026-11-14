# Guion de la demo (3 minutos)

Web: https://legit-nu.vercel.app. Cada veredicto de abajo se comprobó con Clef el 14 nov 2026 (respuesta en unos 0,5 s por mensaje). Clef no es determinista al 100 %: pruébalos otra vez justo antes de presentar.

## 0. El problema (20 s)

> «A tu madre le llega un SMS del banco, o un "hola mamá, número nuevo". ¿Le contesta? Legit? responde en un segundo: rojo, amarillo o verde, y qué hacer.»

## 1. Rojo: el banco falso (30 s)

Pulsa «SMS falso de un banco» o pega:

```
BBVA: Hemos detectado un acceso no autorizado. Su cuenta sera bloqueada en 24h. Verifique su identidad ahora: https://bbva-seguridad-clientes.com/verificar
```

**Estafa.** Clef lee lo que el código no puede leer: dice ser BBVA, pide datos y mete prisa. El enlace no es de BBVA, y la web lo tacha dentro del mensaje.

## 2. Amarillo: el hijo en apuros (45 s, el momento clave)

```
Hola mamá, se me ha roto el móvil y este es mi número nuevo. Guárdalo y escríbeme por WhatsApp cuando puedas
```

**Cuidado.** Explícalo así: «No hay enlace ni palabras de estafa. **Sin Clef, este mensaje sale verde.** Clef entiende que es un familiar que te pide escribirle a un número nuevo: el primer paso del timo, antes de pedir dinero. Por eso dice "no contestes, llama a tu hijo a su número de siempre". No lo marca en rojo, porque un hijo de verdad también cambia de móvil.»

## 3. Verde: el SMS real del banco (20 s)

Pulsa «SMS real de un banco»:

```
BBVA: compra de 23,90 EUR en MERCADONA con tu tarjeta *4821. Si no la reconoces, consulta tus movimientos en la app.
```

**Nada raro.** No pide nada ni mete prisa. El verde dice «Nada raro», no «De fiar»: nunca prometemos que algo sea seguro.

## 4. Trucos que el ojo no ve (30 s, si hay tiempo)

```
Apple: tu Apple ID ha sido bloqueado por seguridad. Desbloquéalo en https://аррӏе.com/id
```

Rojo: «аррӏе» está escrito con letras cirílicas.

```
Microsoft: tu contraseña caduca hoy. Mantén la misma en https://www.google.com/url?q=https://ms-login-portal.example.com
```

Rojo: el enlace empieza por google.com, pero te reenvía a otra web.

## 5. Los números (35 s)

> «Lo medimos con 60 mensajes reales que nadie había visto: estafas citadas por INCIBE y Maldita, y SMS legítimos.»

| Estafas que pasan en verde | Sin Clef | Con Clef |
|---|---|---|
| v2 (30 estafas) | 8 | **1** |

> «Y 0 mensajes legítimos en rojo. Sin Clef, la app no sirve: Clef toma la decisión.»

Cifras y limitaciones: [README.md](README.md#medición). Enlaces medidos aparte con 45.387 enlaces de phishing activos de PhishTank: solo 3 pasan como enlace oficial de la marca.

## Si algo falla

- Si NaN va lento o saturado, la web reintenta sola. Si da error, enseña los mismos mensajes ejecutados en local con `npm run dev`.
- Si preguntan «¿y si Clef se equivoca?»: si su respuesta llega rota, la app da error, nunca un verde.
