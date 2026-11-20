# RESPUESTAS — TP N° 4 · App integradora “Biblioteca IPF”

**Alumno:** Eric Andres Fariña · **Fecha de entrega:** 20/11/2026

Respuestas a las Partes B a E. Todas las referencias son a archivos y líneas de este repositorio.
Proyecto hecho con **Expo SDK 58** (expo-router 58, React 19.3, React Native 0.88, React Compiler
activo).

Varias respuestas de navegación y de estado están comprobadas con tests automáticos
(`__tests__/navegacion.test.tsx` y `__tests__/useBusqueda.test.tsx`, con `expo-router/testing-library`):
redirecciones, rutas protegidas, el “atrás” después de reservar, los deep links y la condición de
carrera del buscador. Los comportamientos que dependen del teléfono (diálogos de permisos, Ajustes,
notificaciones) están razonados a partir del código y de la documentación de Expo.

---

## Parte B · Estado, efectos y renderizado

### B1. El ciclo de vida de `useLibros`

Código: `src/hooks/useLibros.ts`, líneas 8–41.

```ts
const [libros, setLibros] = useState<Libro[]>([]);
const [cargando, setCargando] = useState(true);
const [error, setError] = useState<string | null>(null);
const [intento, setIntento] = useState(0);

useEffect(() => {
  let activo = true;

  async function cargar() {
    try {
      const datos = await obtenerLibros();
      if (activo) setLibros(datos);
    } catch {
      if (activo) setError(MENSAJE_ERROR);
    } finally {
      if (activo) setCargando(false);
    }
  }

  cargar();
  return () => {
    activo = false;
  };
}, [intento]);
```

**a) Render por render**

Camino feliz (el pedido sale bien):

| Render | `libros` | `cargando` | `error` | Qué lo provoca |
|---|---|---|---|---|
| 1 | `[]` | `true` | `null` | El montaje del Catálogo. Después de pintar, React ejecuta el efecto y se llama a `obtenerLibros()`. En pantalla: el indicador “Cargando el catálogo…”. |
| 2 | 15 libros | `false` | `null` | ~800 ms después se resuelve la promesa. `setLibros(datos)` y `setCargando(false)` se ejecutan en la misma continuación del `await` (el `try` y el `finally` corren seguidos), así que React 18+ los **agrupa** (*automatic batching*) en un solo render. Aparece la lista. |

Son **2 renders**. El efecto no se vuelve a ejecutar porque `intento` no cambió.

Cuando `obtenerLibros()` falla y la persona toca “Reintentar”:

| Render | `libros` | `cargando` | `error` | Qué lo provoca |
|---|---|---|---|---|
| 1 | `[]` | `true` | `null` | Montaje → efecto → pedido. |
| 2 | `[]` | `false` | `"No pudimos cargar el catálogo…"` | La promesa se rechaza: `setError` en el `catch` y `setCargando(false)` en el `finally`, agrupados. Se ve el mensaje con el botón “Reintentar”. |
| 3 | `[]` | `true` | `null` | La persona toca “Reintentar”: `reintentar()` hace `setError(null)`, `setCargando(true)` y `setIntento(n => n + 1)` dentro del mismo manejador de evento → un solo render. Después de pintar, React ejecuta la **limpieza** del efecto anterior (`activo = false`) y vuelve a ejecutar el efecto porque `intento` pasó de 0 a 1. |
| 4 | 15 libros | `false` | `null` | Llega la respuesta del segundo pedido (si vuelve a fallar, se repite la fila 2). |

Nota: si la app corre en *Strict Mode* de desarrollo, React monta, desmonta y vuelve a montar el
efecto: salen dos pedidos, pero el primero queda descartado porque su `activo` ya es `false`. No agrega
renders visibles con datos distintos.

**b) ¿Se desmonta el Catálogo?**

- **Al cambiar a la pestaña “Mis reservas”: no.** El navegador de tabs deja montadas las pantallas que
  ya se visitaron (solo cambia cuál está enfocada).
- **Al abrir un detalle: tampoco.** `/libro/[isbn]` se apila en el Stack de la tab Catálogo
  (`src/app/(tabs)/(catalogo)/_layout.tsx`), y las pantallas de abajo de una pila siguen montadas.

Lo comprobé con un `console.log('LIMPIEZA useLibros')` temporal en la limpieza y un recorrido
Catálogo → “Mis reservas” → Catálogo → detalle: el mensaje **no apareció** en ninguno de esos pasos, y
sí apareció una sola vez al final, cuando se desmontó toda la app. Después lo borré (la entrega no tiene
`console.log`).

La limpieza que escribí se ejecuta en situaciones reales cuando:

1. La persona toca **“Reintentar”**: cambia `intento`, y antes de correr el efecto nuevo React limpia el
   anterior. Es el caso más común.
2. El Catálogo **se desmonta** de verdad: por ejemplo, durante *Fast Refresh* en desarrollo o si el
   navegador de tabs se quitara de la pila raíz. Si en ese momento el pedido de 800 ms todavía no volvió,
   la bandera evita actualizar el estado de un componente que ya no existe.

O sea: la limpieza casi nunca corre por “salir de la pantalla”; corre por **cambio de dependencias** o
por desmontaje real. Por eso no alcanza con pensar “la limpieza es para cuando me voy”.

**c) ¿Por qué no se puede pasar una función `async` directamente a `useEffect`?**

Porque una función `async` **siempre devuelve una promesa**, y `useEffect` espera que su función
devuelva `undefined` o una **función de limpieza** de forma sincrónica. Si le pasamos
`useEffect(async () => {...})`, React recibe una `Promise` como si fuera la limpieza: avisa con un
error en consola y no hay forma de devolver la limpieza (llegaría tarde, dentro de la promesa).

Lo resolví declarando una función `async` **adentro** del efecto, llamándola y devolviendo la limpieza
sincrónicamente (`src/hooks/useLibros.ts`, líneas 14–32), como se ve en el fragmento de arriba.

**d) ¿Cómo implementé `reintentar`?**

```ts
const reintentar = useCallback(() => {
  setError(null);
  setCargando(true);
  setIntento((n) => n + 1);
}, []);
```

(`src/hooks/useLibros.ts`, líneas 34–38). Lo que hace que el pedido se vuelva a ejecutar es que
`intento` está en el array de dependencias: React compara cada dependencia con `Object.is` y, como el
número cambió, limpia el efecto anterior y lo ejecuta otra vez.

¿Por qué `intento` y no otro valor?

- **No `error`**: también cambia cuando el pedido falla, así que cada fallo dispararía otro pedido
  automáticamente (un bucle de reintentos sin que la persona lo pida).
- **No `libros`**: la API devuelve **objetos nuevos en cada respuesta** (`LIBROS.map(l => ({...l}))`),
  así que cada respuesta cambiaría la dependencia y volvería a pedir: bucle infinito.
- **No un booleano**: también funcionaría alternándolo, pero un contador expresa “número de intento”,
  nunca repite un valor anterior y es más fácil de leer en las herramientas de desarrollo.

### B2. La condición de carrera del buscador

Código: `src/hooks/useBusqueda.ts`, líneas 22–37. El texto vive en la URL (`q`), y el hook busca con
*debounce* de 300 ms y una bandera `vigente` por cada ejecución del efecto:

```ts
useEffect(() => {
  if (!consulta) return;
  let vigente = true;
  const temporizador = setTimeout(async () => {
    try {
      const libros = await buscarLibros(consulta);
      if (vigente) setRespuesta({ clave, libros });
    } catch {
      if (vigente) setFallo(clave);
    }
  }, DEMORA_BUSQUEDA_MS);
  return () => {
    vigente = false;
    clearTimeout(temporizador);
  };
}, [consulta, clave]);
```

En el catálogo hay libros de Borges y además “La borra del café” (Benedetti), que también coincide con
“bor”. Así la diferencia se ve:

| Momento | Qué pasa | Sin limpieza: qué se ve | Con tu código: qué se ve |
|---|---|---|---|
| t = 0 ms | Escribe “bor” → se pide `buscarLibros("bor")` (tarda 1.400 ms). | “Buscando…” | “Buscando…” (la respuesta todavía no es de “bor”). |
| t = 200 ms | Escribe “borges” → se pide `buscarLibros("borges")` (tarda 300 ms). | “Buscando…” (hay dos pedidos en vuelo). | “Buscando…”. Antes de lanzar “borges”, React limpió el efecto de “bor”: su `vigente` quedó en `false`. |
| t = 500 ms | Llega la respuesta de “borges”. | Los libros de Borges. | Los libros de Borges. |
| t = 1.400 ms | Llega la respuesta de “bor”. | **Error:** la lista cambia a los resultados de “bor” (Borges + “La borra del café”) mientras el campo dice “borges”. | Nada cambia: la respuesta de “bor” se descarta porque su `vigente` es `false`. Siguen los libros de Borges. |

Con el *debounce* de mi app, en este escenario exacto el pedido de “bor” **ni siquiera sale**: “borges”
llega a los 200 ms, antes de que se cumplan los 300 ms, y la limpieza hace `clearTimeout`. La tabla
supone que el pedido sí salió (por ejemplo, si la persona hizo una pausa de más de 300 ms), y aun así el
resultado es correcto.

Los dos casos están probados en `__tests__/useBusqueda.test.tsx`: la respuesta de “bor” que llega
después que la de “borges” no cambia los resultados, y escribiendo rápido solo se llama a
`buscarLibros("borges")`.

**a) ¿Qué hace exactamente la limpieza?**

Pone en `false` la variable `vigente` **de esa ejecución del efecto** (cada ejecución tiene la suya,
creada por la clausura) y cancela el temporizador del *debounce*. Cuando la promesa vieja se resuelve,
su continuación lee su propio `vigente`, ve `false` y no llama a `setRespuesta`.

Se ejecuta **cuando cambia `q`** (React limpia el efecto anterior justo antes de ejecutar el nuevo, después
del render con el texto nuevo) y **cuando la pantalla `/buscar` se desmonta**.

Además, la respuesta guarda la `clave` de la búsqueda que la originó y el hook solo devuelve resultados
cuando esa clave coincide con la búsqueda actual (`src/hooks/useBusqueda.ts`, líneas 42–44): es
una segunda protección que hace imposible mostrar resultados de otra búsqueda.

**b) La propuesta del compañero: `if (texto === q) setResultados(datos)`**

**No funciona.** Dentro del `.then()`, `q` no es “el valor actual de la URL”: es el valor que tenía `q`
**en el render en que se creó ese efecto**. La función flecha del `.then()` es una **clausura**: guarda
una referencia a las variables del ámbito donde se definió, y ese ámbito es el de aquel render. Como
`texto` es justamente lo que se buscó en ese render, `texto === q` es **siempre verdadero** y la
respuesta vieja se muestra igual.

Para que funcionara, habría que leer un valor que no quede congelado en la clausura (por ejemplo, un
`useRef` que se actualice en cada render y comparar con `qRef.current`). Eso es reinventar a mano lo que
la limpieza del efecto ya resuelve.

**c) La URL y el botón atrás mientras se escribe**

Con `router.setParams({ q })` (`src/app/buscar.tsx`, línea 42) cada tecla **reemplaza el parámetro de
la ruta actual**: la URL pasa por `/buscar?q=b`, `/buscar?q=bo`… pero **no se agregan pantallas** al
historial. Un solo “atrás” saca a la persona del buscador.

Con `router.push` cada tecla apilaría una pantalla `/buscar` nueva: para escribir “borges” habría 6
pantallas, el “atrás” iría borrando letra por letra, cada pantalla nueva se montaría desde cero (el
teclado se cerraría y el campo perdería el foco) y se repetirían las búsquedas.

### B3. Mutar o reemplazar

**a) Toca “Anotarme” tres veces.** El texto sigue mostrando **“Personas en espera: 0”**. `encolar`
modifica el objeto que está guardado en el estado, pero no se llama a ningún `set...`: React no se entera
de que algo cambió y no vuelve a renderizar. Aunque se llamara a `setEspera(espera)`, sería **la misma
referencia**, y React compara con `Object.is`: ve “sin cambios” y descarta el render.

**b) El número “salta” a 3.** Escribir en el `TextInput` controlado llama a su `setTexto`, eso provoca un
render del componente y, en ese render, `espera.tamanio` lee el objeto mutado, que ya tiene 3 personas.
El dato estaba “bien” en memoria pero la pantalla estaba desactualizada; se corrige por casualidad cuando
otro estado provoca un render.

Un error que aparece “a veces” es peor que uno que aparece siempre porque **depende de algo que no tiene
relación con la causa** (en este caso, escribir en otro campo): es difícil de reproducir, una prueba manual
puede pasar, y cuando aparece lleva a buscar el problema en el lugar equivocado (el `TextInput`). Un error
constante se ve en la primera prueba y apunta directo a su origen. Además, en mi proyecto está activo el
React Compiler, que memoriza partes del render según sus dependencias: con datos mutados, cuándo se
“nota” el cambio se vuelve todavía menos predecible.

**c) Cómo lo resolví en mi Context**

Las listas de espera, los préstamos y los recientes se manejan con un `useReducer`
(`src/context/BibliotecaContext.tsx`, líneas 58–62) cuyo reductor (`src/lib/biblioteca.ts`) **nunca modifica
la cola que está en el estado**: crea una copia a partir de la anterior, modifica la copia y devuelve un
estado nuevo.

```ts
case 'encolar': {
  const actual = estado.esperas[accion.isbn] ?? new Cola<string>();
  if (actual.incluye(accion.persona)) return estado;
  const copia = actual.clonar();
  copia.encolar(accion.persona);
  return { ...estado, esperas: { ...estado.esperas, [accion.isbn]: copia } };
}
```

(`src/lib/biblioteca.ts`, líneas 95–101 y `clonar()` en `src/estructuras/Cola.ts`, líneas 56–58).

| Alternativa | Ventaja | Costo |
|---|---|---|
| **Cola nueva a partir de la anterior** (mi solución, dentro de un `useReducer`) | Cambia la referencia, así que React, `useMemo`, `memo` y el React Compiler detectan el cambio. El reductor es una función pura: se puede probar sola y *Strict Mode* puede ejecutarla dos veces sin duplicar personas. | Copiar la cola es O(n) por operación y genera objetos nuevos. Exige disciplina: nadie debe llamar a `encolar` sobre la cola original. |
| **Contador de versión** (mutar y hacer `setVersion(v => v + 1)`) | Muy barato (O(1)) y con muy poco código. | La referencia de la cola no cambia: cualquier `useMemo`/`memo` que dependa de la cola queda desactualizado. Es fácil olvidarse de incrementar. Si la mutación ocurre dentro de un *updater*, *Strict Mode* la ejecuta dos veces y encola dos veces. No se puede comparar el estado anterior con el nuevo. |
| **`useReducer`** (como mecanismo) | Centraliza todas las transiciones en un solo lugar con acciones con nombre (`'encolar'`, `'entregar'`…); el componente solo hace `dispatch`. | Más código (tipos de acción, `switch`). Por sí solo no evita la mutación: hay que combinarlo con copias, que es lo que hice. |
| **Guardar arrays y usar la clase solo como ayuda** | Los arrays son nativos para React y se serializan directo. | Se pierde el encapsulamiento de `#items` (cualquiera puede hacer `splice`). |

### B4. ¿Dónde vive cada dato?

| Dato | Dónde vive en mi app | Por qué ahí y no en otro lugar |
|---|---|---|
| Texto del buscador | **URL** (`/buscar?q=`), leído con `useLocalSearchParams`; el `TextInput` no es controlado (`defaultValue`), así que no hay una copia en estado local. | Así se puede compartir o abrir por deep link (`bibliotecaipf://buscar?q=borges`) y vuelve a aparecer si se reabre la URL. Una copia en estado local sería un dato duplicado que puede desincronizarse con la URL. |
| Préstamos y reservas | **Context** (`prestamos` en el reductor), persistido con AsyncStorage. | Lo leen y escriben varias pantallas que no son padre e hijo: detalle, confirmación, Mis reservas, Mostrador y el cálculo de disponibles del Catálogo. Tiene que sobrevivir a la navegación. |
| Listas de espera | **Context** (`esperas: Record<isbn, Cola<string>>`), persistido. | Las usan el detalle (cuántos esperan), la confirmación (posición), Mis reservas (mi posición) y el Mostrador (entregar al siguiente). |
| Vistos recientemente | **Context** (`recientes: Pila<string>`), persistido. | Se escribe en el detalle y se lee en el Catálogo, que están en pantallas distintas de la pila. |
| Sesión del personal | **Context** (`sesion: boolean`), **sin** persistir. | La necesitan el layout raíz (`Stack.Protected`) y el botón “Personal” del header. No la guardo en disco a propósito: en un mostrador compartido, el personal vuelve a ingresar cada vez que se abre la app. |
| Ejemplares disponibles | **Se calcula**: `libro.ejemplares − préstamos que salieron del estante` (`src/lib/biblioteca.ts`, líneas 152–157). | Si lo guardara aparte, sería el mismo dato en dos lugares y podría desincronizarse (ver E4 d). |
| Estado del permiso de cámara | **Sistema operativo**. `usePermiso` lo consulta y guarda la última respuesta solo como caché, que refresca al enfocar la pantalla y al volver de segundo plano. | La persona lo puede cambiar en Ajustes en cualquier momento. Una copia guardada en el Context o en disco quedaría vieja. |
| Identificador de la notificación programada | **Context**, dentro de cada préstamo (`notificacionId`), persistido. La notificación en sí vive en el **sistema operativo**. | Hace falta para cancelarla desde cualquier pantalla (al devolver o al apagar el interruptor) y está atada a ese préstamo. Lo persisto porque la notificación sobrevive al cierre de la app (ver D2 b). |

**¿Qué se re-renderiza cuando cambia el `value` del Context?** Todos los componentes que lo consumen con
`useContext` (en mi app, a través de `useBiblioteca`), **aunque usen solo una parte**. El `value` es un
objeto memorizado con `useMemo` (`src/context/BibliotecaContext.tsx`, líneas 181–215): cambia cuando cambia
el estado del reductor.

Por eso **sí**: el Catálogo, que usa `recientes` y `disponibles`, se vuelve a renderizar cuando se activa un
recordatorio en “Mis reservas”, porque la pestaña sigue montada y el `value` es otro objeto.

Para evitarlo se podría:

- dividir el Context en varios (uno para recientes, otro para préstamos, otro para la sesión), o separar
  “estado” y “acciones” en dos contextos;
- usar un *store* externo con selectores (`useSyncExternalStore`) para que cada componente se suscriba solo
  a lo que lee;
- memorizar los hijos caros con `memo`.

**En una app de este tamaño no vale la pena:** son 15 libros y unas pocas pantallas, el re-render cuesta
muy poco y el React Compiler ya evita recalcular el JSX que no cambió. Lo correcto sería medirlo primero
con el *Profiler* de React DevTools y dividir el Context solo si aparece un problema real.

---

## Parte C · Navegación y rutas

Árbol de rutas (detalle completo en el README):

```
src/app/
├── _layout.tsx                 Stack raíz (Provider, Stack.Protected, anchor "(tabs)")
├── (tabs)/
│   ├── _layout.tsx             Tabs (expo-router/js-tabs, anchor "(catalogo)")
│   ├── (catalogo)/
│   │   ├── _layout.tsx         Stack de la tab Catálogo (anchor "index")
│   │   ├── index.tsx           /
│   │   ├── escanear.tsx        /escanear
│   │   └── libro/[isbn].tsx    /libro/[isbn]
│   └── reservas.tsx            /reservas
├── buscar.tsx                  /buscar?q=
├── reservar/[isbn].tsx         /reservar/[isbn]   (modal)
├── permisos/[recurso].tsx      /permisos/[recurso] (modal)
├── login.tsx                   /login      (modal, solo sin sesión)
├── mostrador.tsx               /mostrador  (solo con sesión)
├── reserva.tsx                 /reserva → <Redirect href="/reservas" />
└── +not-found.tsx              404
```

### C1. La pila en mi app

Notación: base → tope. “Raíz” es el Stack de `src/app/_layout.tsx`; “Stack Catálogo” es el de
`src/app/(tabs)/(catalogo)/_layout.tsx`.

| # | Acción | Pilas resultantes |
|---|---|---|
| 1 | Abre la app. | **Raíz:** `[(tabs)]` · **Tabs:** enfocada “Catálogo” (“Mis reservas” todavía no se montó) · **Stack Catálogo:** `[index]` |
| 2 | Toca un libro del Catálogo. | **Raíz:** `[(tabs)]` · **Stack Catálogo:** `[index, libro/[isbn]]` |
| 3 | Toca “Reservar”. | **Raíz:** `[(tabs), reservar/[isbn] (modal)]` · **Stack Catálogo:** `[index, libro/[isbn]]` |
| 4 | Toca “Confirmar”. | **Raíz:** `[(tabs)]` (el modal salió de la pila) · **Tabs:** enfocada “Mis reservas”, historial de tabs `[(catalogo), reservas]` · **Stack Catálogo:** sigue `[index, libro/[isbn]]` |
| 5 | Toca atrás (Android). | **Raíz:** `[(tabs)]` · **Tabs:** vuelve a “Catálogo” (las tabs usan `backBehavior: 'firstRoute'`) · **Stack Catálogo:** `[index, libro/[isbn]]` → la persona ve **el detalle** del libro que reservó (ahora dice “Ya tenés este libro”). |
| 6 | Toca la tab “Catálogo”. | **Raíz:** `[(tabs)]` · **Stack Catálogo:** `[index]` → ve **el Catálogo**. |

**a) ¿Qué método usé en el paso 4?**

`reservar(isbn)` del Context y después `router.dismissTo('/reservas')`
(`src/app/reservar/[isbn].tsx`, líneas 51–55).

- **Con `push`:** como la ruta enfocada de la raíz es el modal y no `(tabs)`, expo-router apilaría **una
  segunda instancia** de `(tabs)` encima del modal: `Raíz [(tabs), reservar (modal), (tabs)']`. Habría dos
  barras de pestañas y dos Catálogos montados. El primer “atrás” llevaría al Catálogo de esa copia y el
  segundo **volvería a la confirmación**, que es justo lo que la consigna prohíbe.
- **Con `replace`:** el modal se reemplaza, pero también por una `(tabs)` nueva: `Raíz [(tabs), (tabs)']`. La
  confirmación ya no está, pero quedan dos navegadores de tabs duplicados: “atrás” desde la copia lleva a
  su propio Catálogo y recién después a la instancia original (donde estaba el detalle).
- **Con `dismissTo`:** quita pantallas de la raíz hasta encontrar la `(tabs)` que ya existía y, adentro,
  cambia a la pestaña “Mis reservas”. No duplica nada y la confirmación desaparece del historial. Por eso
  elegí este.

Las tres variantes las probé con `expo-router/testing-library`, mirando el estado del router después de
cada una (los resultados son los que figuran arriba). El test que quedó en el proyecto comprueba la
elegida: después de confirmar, la ruta es `/reservas` y “atrás” vuelve a `/libro/…`, no a la
confirmación.

**b) Paso 6: ¿Catálogo o detalle?**

Ve **el Catálogo**. En el paso 5 la persona ya estaba en la pestaña Catálogo (viendo el detalle) y en el
paso 6 toca la pestaña **que ya está enfocada**. El Stack anidado escucha el evento `tabPress` de su tab
padre y, si la pestaña ya estaba enfocada y la pila tiene más de una pantalla, hace `popToTop` (lo
implementa `createNativeStackNavigator` dentro de expo-router). Es el comportamiento estándar de iOS y
Android, y también está en el test de la reserva.

Me parece correcto para esta app. Después de reservar, el “atrás” devuelve a la ficha del libro, que
ahora muestra el estado de la reserva (es contexto útil). Tocar la pestaña es el gesto habitual para
“volver al inicio de esta sección”. Si la pestaña mostrara siempre el detalle, la persona tendría que
tocar “atrás” varias veces para volver a la lista.

### C2. El escáner que dispara de más

Código: `src/app/(tabs)/(catalogo)/escanear.tsx`, líneas 53–74.

```ts
// Refs y no estado: se leen y escriben al instante, aunque lleguen varios cuadros seguidos.
const navegado = useRef(false);
const ultimoDesconocido = useRef<string | null>(null);

function abrirLibro(isbn: string) {
  navegado.current = true;
  router.replace({ pathname: '/libro/[isbn]', params: { isbn } });
}

function alLeerCodigo({ data }: BarcodeScanningResult) {
  if (navegado.current || !esIsbnValido(data)) return;
  if (!buscarLibroPorIsbn(data)) {
    if (ultimoDesconocido.current !== data) {
      ultimoDesconocido.current = data;
      setAviso(
        `El código ${data} no corresponde a ningún libro del catálogo. Probá con otro o escribí el ISBN a mano.`,
      );
    }
    return;
  }
  abrirLibro(data);
}
```

`abrirLibro` también lo usa el campo para escribir el ISBN a mano (`<EntradaIsbn onIsbnEncontrado={abrirLibro} />`).
La cámara solo está activa mientras la pantalla tiene el foco (`active={enfocada}`).

**a) `router.push` sin protección.** `onBarcodeScanned` se llama con cada cuadro en el que la cámara
detecta el código (muchas veces por segundo). Cada llamada a `router.push` agrega una acción a la **cola de
acciones de navegación** (TP 2): el router las procesa en orden y cada una apila otra pantalla. En un
segundo se apilarían 5, 10 o más detalles del mismo libro, con sus animaciones. La persona tendría que
tocar “atrás” muchas veces y cada detalle además haría `push` en la Pila de recientes.

**b) ¿`useState` o `useRef`? Usé `useRef`.** Un `useState` puesto en `true` en el primer escaneo no
alcanza porque `setEscaneado(true)` **no cambia la variable en ese momento**: pide un render nuevo. Hasta
que ese render ocurre y la cámara recibe la función nueva, los llamados que siguen llegando ejecutan la
**misma función del render anterior**, cuya clausura todavía ve `escaneado === false`. En ese intervalo
pasan varios cuadros y se navega varias veces. `navegado.current = true` en cambio se escribe **de forma
sincrónica** en un objeto que comparten todas las clausuras, así que el segundo llamado ya lo ve.

**c) ¿Por qué `replace` del escáner al detalle?** `/escanear` está en el Stack de la tab Catálogo. Con
`replace`, la pila pasa de `[index, escanear]` a `[index, libro/[isbn]]`, y “atrás” desde el detalle
vuelve al **Catálogo**, que es lo que la persona espera. El escáner ya cumplió su función.

Con `push` quedaría `[index, escanear, libro]`: al tocar “atrás” la persona volvería a la **cámara**. Esa
pantalla tiene `navegado.current === true` y no reaccionaría más al código (parecería colgada). Si el
bloqueo se reiniciara, la cámara volvería a leer el mismo libro, que sigue frente al lente, y apilaría
otra vez el detalle: un bucle.

**d) ISBN que no está en el catálogo.** La app muestra debajo de la cámara un aviso: “El código … no
corresponde a ningún libro del catálogo. Probá con otro o escribí el ISBN a mano.” La cámara **sigue
escaneando**, y el campo para escribir el ISBN sigue disponible.

Para que el aviso no aparezca diez veces, no uso `Alert` (se apilarían diálogos): uso un texto en
pantalla y el ref `ultimoDesconocido`. Solo actualizo el aviso si el código leído **es distinto** del último
desconocido, así que el mismo código frente a la cámara no provoca ni siquiera un `setState`.

### C3. Deep links y rutas protegidas

| Link | Qué ve la persona | Qué queda debajo en la pila | Qué parte de tu código lo decide |
|---|---|---|---|
| `bibliotecaipf://libro/9780132350884` (existente) | El detalle de “Clean Code”, con el título en el header. | Stack Catálogo: `[index]` (el Catálogo) y la barra de tabs. “Atrás” lleva al Catálogo. | `unstable_settings = { anchor: 'index' }` en `src/app/(tabs)/(catalogo)/_layout.tsx`, líneas 6–8 y `anchor: '(tabs)'` en `src/app/_layout.tsx`, líneas 15–17. La validación: `useLibro` (`src/hooks/useLibro.ts`, líneas 10–15). |
| `bibliotecaipf://libro/123` | La pantalla de detalle con el mensaje “Este enlace no corresponde a un libro del catálogo” y el botón “Ir al catálogo”. Header: “Libro no encontrado”. | El Catálogo (mismo anchor). | El segmento dinámico `[isbn]` acepta cualquier texto. La pantalla valida con `esIsbnValido` (13 dígitos) en `useLibro` (`src/hooks/useLibro.ts`, líneas 10–15) y muestra `MensajeLibroInexistente`. |
| `bibliotecaipf://buscar?q=borges` | El buscador con “borges” escrito y los libros de Borges. | Raíz: `[(tabs)]` con el Catálogo. “Atrás” cierra el buscador y deja las pestañas. | `anchor: '(tabs)'` en el layout raíz (`src/app/_layout.tsx`, líneas 15–17) y la lectura de `q` con `useLocalSearchParams` en `src/app/buscar.tsx`, línea 28. |
| `bibliotecaipf://mostrador` (sin sesión) | El Catálogo. El mostrador no existe sin sesión, así que `Stack.Protected` redirige al *anchor* del navegador (`(tabs)`). | El deep link arma `Raíz [(tabs), mostrador]` y la redirección reemplaza `mostrador` por **otra instancia** de `(tabs)`: queda `Raíz [(tabs), (tabs)']`. “Atrás” muestra el mismo Catálogo, el de la instancia original. | `<Stack.Protected guard={sesion}>` en `src/components/NavegadorRaiz.tsx`, líneas 34–42 (el Stack raíz que renderiza el layout raíz). |
| `bibliotecaipf://reserva` | “Mis reservas”. | El deep link arma `Raíz [(tabs), reserva]` por el anchor y `<Redirect>` hace `replace` de `reserva`. Como la ruta enfocada no es `(tabs)`, se reemplaza por otra instancia de `(tabs)` con “Mis reservas” enfocada: `Raíz [(tabs), (tabs)']`. “Atrás” lleva al Catálogo (primero el de esa copia y después el original). | `src/app/reserva.tsx`, línea 5 (`<Redirect href="/reservas" />`, que internamente hace `router.replace` en un `useFocusEffect`). |
| `bibliotecaipf://escanear` (cámara bloqueada) | La pantalla del escáner en estado **bloqueado**: “La cámara está bloqueada para esta app…” + botón “Abrir Ajustes”, y debajo el campo para escribir el ISBN a mano. La app no se traba. | Stack Catálogo: `[index, escanear]` (el Catálogo debajo, por el anchor). | `usePermiso('camara')` (`src/hooks/usePermiso.ts`, líneas 12–67; estado `'bloqueado'` cuando `canAskAgain` es `false`) y los bloques condicionales por estado de `escanear.tsx`, líneas 81–115. |

Las pilas de esta tabla las comprobé abriendo cada URL con `renderRouter` (expo-router/testing-library) y
leyendo el estado del router. En el teléfono se prueban con los links `exp://IP:8081/--/…` del README.
Los dos casos con una `(tabs)` duplicada (`/mostrador` sin sesión y `/reserva`) vienen de cómo expo-router
resuelve un `replace` desde una pantalla de la raíz. Para la persona no se nota (ve la pantalla correcta
y “atrás” la lleva al Catálogo), pero es un costo de usar `<Redirect>` en una ruta de la pila raíz.

Por el mismo motivo, en el uso normal de la app evité esa redirección. Al iniciar sesión, el login se
protege con `<Stack.Protected guard={!sesion} redirectTo="/mostrador">`: el login se cierra solo y se
reemplaza por el mostrador, que vive en la pila raíz, y no se duplica nada. Al cerrar sesión, el
mostrador primero vuelve al Catálogo con `router.dismissTo('/')` y después cierra la sesión
(`src/app/mostrador.tsx`, líneas 56–61); como el mostrador ya no está enfocado, `Stack.Protected` lo
quita del historial sin redirigir. El test de navegación comprueba que después de cerrar sesión no
queda ninguna pantalla a la que volver.

**¿Por qué `/libro/123` llega a mi pantalla de detalle?** Porque Expo Router decide la ruta **solo por la
forma de la URL**, comparándola con el árbol de archivos: `libro/[isbn].tsx` es un segmento dinámico que
coincide con **cualquier** texto en esa posición. El router no conoce los datos de la biblioteca (ni debe
conocerlos). `+not-found.tsx` solo aparece cuando **ningún archivo** coincide con la URL (por ejemplo,
`/libros/123`).

La responsabilidad de responder bien es **de la pantalla** (y de la capa de datos que usa): validar el
parámetro (13 dígitos), buscar el libro y, si no existe, mostrar un mensaje claro con una salida. Eso
hacen `useLibro` y `MensajeLibroInexistente`.

### C4. Foco, montaje y primer plano

**a) ¿Qué evento detecta cada una?**

- **`useEffect` con `[]`**: el **montaje** del componente (una sola vez) y, en la limpieza, el desmontaje.
  Una pantalla de tab que ya está montada no vuelve a ejecutarlo.
- **`useFocusEffect`**: que la pantalla **gane el foco dentro de la navegación** (al montarse enfocada, al
  volver desde otra pestaña, al cerrarse un modal o una pantalla de encima). Su limpieza corre al perder
  el foco.
- **`AppState`**: que **la app entera** pase entre primer plano y segundo plano (`active`, `background`, y
  `inactive` en iOS), por ejemplo al ir a Ajustes y volver.

**b)** Si la persona sale a **Ajustes**, habilita las notificaciones y vuelve, **solo `AppState`** se entera
(`background` → `active`). Para la navegación nada cambió: la pantalla nunca perdió el foco ni se desmontó.

Si en cambio va a la pestaña **Catálogo y vuelve a “Mis reservas”**, se entera **solo `useFocusEffect`**: la
app nunca salió de primer plano y la pantalla de la tab sigue montada.

**c) ¿Cuál usé?** **Las dos**, dentro de `usePermiso` (`src/hooks/usePermiso.ts`, líneas 27–37 y 40–52). `useFocusEffect` hace también la primera consulta (corre al montarse la pantalla
enfocada), así que no necesité un `useEffect` con `[]`.

Con una sola habría estados viejos. Por ejemplo, con solo `useFocusEffect`: la persona está en “Mis
reservas” con el aviso “Las notificaciones están desactivadas”, va a Ajustes, las habilita y vuelve: el
aviso **sigue diciendo desactivadas** hasta que cambie de pestaña y regrese. Con solo `AppState` pasaría
al revés: si el permiso se concede desde la pantalla previa (un modal dentro de la app), al cerrarla “Mis
reservas” no se enteraría porque la app nunca pasó a segundo plano.

---

## Parte D · Permisos en mi app

### D1. Recorrido completo de la cámara (Android 14, app recién instalada)

Flujo de mi app: “Escanear” (Catálogo) → `/escanear`. Si el permiso es preguntable, el escáner muestra
el panel con “Usar la cámara”, que abre la pantalla previa `/permisos/camara` (beneficio + un único botón
“Continuar”). “Continuar” muestra el diálogo del sistema y después vuelve al escáner.

> En Expo Go el permiso pertenece a la app Expo Go. Para repetir el recorrido “recién instalada” hay que
> borrar los datos de Expo Go o revocar sus permisos.

| # | Acción | Qué muestra mi app | `status` | `canAskAgain` |
|---|---|---|---|---|
| 1 | Toca “Escanear” por primera vez. | `/escanear` en estado **preguntable**: “Para leer el código de barras necesitamos usar la cámara” + botón “Usar la cámara”, y el campo para escribir el ISBN. Al tocar “Usar la cámara” se abre `/permisos/camara` con “Continuar”. | `undetermined` | `true` |
| 2 | “Continuar” → “No permitir”. | Se cierra la pantalla previa y vuelve al escáner, otra vez en estado **preguntable** (mismo panel y campo manual). | `denied` | `true` (Android deja volver a preguntar después de la primera negativa) |
| 3 | Toca “Escanear” otra vez. | Igual que en 1: estado **preguntable** y, con “Usar la cámara”, la pantalla previa con “Continuar”. | `denied` | `true` |
| 4 | “Continuar” → “No permitir”. | Vuelve al escáner, ahora en estado **bloqueado**: “La cámara está bloqueada para esta app. Podés habilitarla en Ajustes o escribir el ISBN abajo.” + botón “Abrir Ajustes”. | `denied` | `false` (desde Android 11, dos negativas equivalen a “no volver a preguntar”) |
| 5 | Toca “Escanear” otra vez. | Directamente el estado **bloqueado** con “Abrir Ajustes” y el campo manual. El sistema ya no mostraría el diálogo. | `denied` | `false` |
| 6 | “Abrir Ajustes” → habilita la cámara → vuelve a la app. | Al volver, `AppState` pasa a `active`, `usePermiso` vuelve a consultar y la pantalla pasa a **concedido**: se ve la cámara escaneando. | `granted` | `true` |

**a) En iOS** cambia el **paso 2**. iOS muestra el diálogo del sistema **una sola vez**: después de la
primera negativa, `status` es `denied` y `canAskAgain` ya es `false`. Al volver de la pantalla previa, mi
app muestra directamente el estado **bloqueado** con “Abrir Ajustes”. En los pasos 3 y 4 no hay segundo
diálogo: si la persona abre la pantalla previa, el botón ya dice “Abrir Ajustes”. El paso 6 funciona igual.

**b) La línea que decide entre “Continuar” y “Abrir Ajustes”:**

```ts
return respuesta.canAskAgain ? 'preguntable' : 'bloqueado';
```

(`src/lib/permisos.ts`, línea 15). La pantalla previa muestra “Abrir Ajustes” cuando el estado es
`'bloqueado'` (`src/components/PedidoDePermiso.tsx`, líneas 69–78, que es lo que renderiza la ruta `src/app/permisos/[recurso].tsx`).

Usa el campo **`canAskAgain`**. Con `status` no alcanza porque vale **`denied` en los dos casos**: cuando
todavía se puede volver a mostrar el diálogo (Android, primera negativa) y cuando el sistema ya no lo va
a mostrar más. Si decidiera solo con `status`, en el caso bloqueado mostraría “Continuar”, el pedido
devolvería `denied` al instante sin mostrar nada, y la persona quedaría tocando un botón que no hace nada.

**c) Paso 6: ¿quién se entera de que volvió de Ajustes?** El *listener* de `AppState` dentro de
`usePermiso` (`src/hooks/usePermiso.ts`, líneas 40–52): cuando el estado pasa a `'active'` vuelve a
consultar el permiso. Sin esa parte, la app seguiría mostrando “La cámara está bloqueada” aunque ya
estuviera habilitada, hasta que la persona saliera de la pantalla y volviera a entrar (eso lo detecta
`useFocusEffect`).

### D2. Notificaciones y consistencia

**a) “Recordarme” y “Devolver” antes de los 15 s sin cancelar.** La notificación ya está programada en el
sistema operativo y llegaría igual a los 15 s: “Acordate de devolver *Clean Code*” sobre un libro que ya
se devolvió. Es un mensaje falso que hace perder confianza en los recordatorios (y la persona termina
desactivándolos). Por eso `devolver` cancela la notificación antes de quitar el préstamo
(`src/context/BibliotecaContext.tsx`, líneas 101–108).

**b) ¿Dónde guardo el identificador?** En el préstamo, dentro del Context (`notificacionId`), y el estado
se persiste con AsyncStorage (`src/lib/persistencia.ts`).

Si la app se cierra antes de que llegue:

- **La notificación** sigue programada en el sistema operativo (no depende de que la app esté abierta) y
  **llega igual** a los 15 s.
- **El identificador**, si solo estuviera en memoria, **se perdería**. Al reabrir, el préstamo aparecería
  con el interruptor apagado aunque haya un recordatorio pendiente, y “Devolver” ya no podría
  cancelarlo: es el caso del inciso a), pero sin forma de arreglarlo.

Cómo lo resolví: el identificador se guarda junto con el préstamo, así que sobrevive al cierre. Al iniciar
la app **reconcilio** lo guardado con lo que el sistema tiene programado
(`Notifications.getAllScheduledNotificationsAsync()`): si un identificador ya no está programado (la
notificación ya se mostró), lo borro y el interruptor queda apagado, que refleja la realidad
(`src/context/BibliotecaContext.tsx`, líneas 64–75 y `src/lib/biblioteca.ts`, líneas 71–87).

**c) ¿Por qué el canal se crea antes de pedir el permiso en Android 13+?** Desde Android 13 (API 33)
mostrar notificaciones requiere el permiso en tiempo de ejecución `POST_NOTIFICATIONS`, y el sistema
asocia el diálogo a los **canales** de la app: si la app todavía no tiene ningún canal creado, el diálogo
puede no mostrarse y el pedido vuelve como denegado. La documentación de Expo indica crear el canal
**antes** de pedir el permiso. Además el canal define la importancia, el sonido y el nombre que la persona
ve en Ajustes (“Préstamos”). Lo hago en `prepararCanal()` (`src/lib/notificaciones.ts`, líneas 19–27), que
`usePermiso` llama justo antes del pedido (`src/hooks/usePermiso.ts`, líneas 54–60).

**En Android 12** no existe ese permiso en tiempo de ejecución: las notificaciones vienen habilitadas al
instalar, `requestPermissionsAsync()` devuelve `granted` **sin mostrar ningún diálogo**, y la persona solo
puede desactivarlas desde Ajustes. El canal sigue siendo obligatorio (desde Android 8) para poder mostrar
la notificación, pero ya no condiciona el diálogo.

**d) Permiso denegado y me entregan un libro desde el mostrador.** Me entero por un **aviso dentro de la
app**, en la parte de arriba de “Mis reservas” (“¡Ya podés retirar “El Aleph” en el mostrador! Lo tenés en préstamo hasta el dd/mm/aaaa.”), con
un botón de ícono (✕, con `accessibilityLabel="Descartar aviso"`) para descartarlo. Además el libro ya
aparece como préstamo. Este recorrido completo (anotarse con 0 ejemplares, entrar al mostrador,
entregar y ver el aviso con el permiso denegado) está en `__tests__/navegacion.test.tsx`.

El código que decide (`src/lib/notificaciones.ts`, líneas 67–80):

```ts
export async function avisarEntrega(titulo: string): Promise<'notificacion' | 'aviso'> {
  if (await notificacionesPermitidas()) {
    await Notifications.scheduleNotificationAsync({ ... });
    return 'notificacion';
  }
  return 'aviso';
}
```

y en el Context, si la respuesta es `'aviso'`, se agrega el aviso al estado
(`src/context/BibliotecaContext.tsx`, líneas 135–161).

**Consulta el permiso en ese momento** (`getPermissionsAsync()` dentro de `notificacionesPermitidas`), no un
valor guardado. Importa porque la persona puede cambiar el permiso en Ajustes en cualquier momento. Con un
valor guardado viejo podrían pasar dos cosas malas: creer que está concedido cuando ya no lo está (se
“manda” una notificación que el sistema descarta en silencio y la persona **nunca se entera** de que su
libro está listo), o creer que está denegado cuando ya lo habilitó (se pierde la notificación que pidió).

### D3. Lo que mi app pide y lo que no

| Plataforma | Permiso o clave declarada | Función de la app que lo justifica | ¿Quién lo agrega? |
|---|---|---|---|
| Android | `android.permission.CAMERA` | Escanear el código de barras (EAN-13) de la contratapa. | El *config plugin* / manifiesto de `expo-camera`. |
| Android | `android.permission.POST_NOTIFICATIONS` | Recordatorio de devolución y aviso de entrega desde el mostrador. | El manifiesto de `expo-notifications`. |
| Android | `android.permission.RECEIVE_BOOT_COMPLETED` | Que un recordatorio programado siga existiendo si el teléfono se reinicia antes de que llegue. | El manifiesto de `expo-notifications`. |
| Android | `android.permission.INTERNET` | Conexión con el servidor de desarrollo (Metro) y, a futuro, con una API real del catálogo. | La plantilla de React Native / Expo. |
| iOS | `NSCameraUsageDescription` = “Usamos tu cámara para leer el código de barras del libro y abrir su ficha sin escribir el ISBN.” | Texto del diálogo de cámara. | El plugin de `expo-camera`, con mi texto de `app.json`. |
| iOS | Notificaciones locales (sin clave en `Info.plist`; el permiso se pide en tiempo de ejecución). Con `enableRemoteNotifications: false` no se agrega el *entitlement* `aps-environment`. | Recordatorios y avisos. | El plugin de `expo-notifications`. |
| Android | **Bloqueados** con `blockedPermissions`: `RECORD_AUDIO`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` | Ninguna: la app no graba audio, no usa ubicación ni lee archivos. Se bloquean por si alguna dependencia los agrega. | `app.json` (Expo agrega `tools:node="remove"` en el manifiesto). |

**a) ¿Por qué no declara `RECORD_AUDIO` aunque usa `expo-camera`?** El plugin de `expo-camera` agrega
`RECORD_AUDIO` por defecto (para grabar video con sonido) y, en iOS, `NSMicrophoneUsageDescription`. Mi
app solo lee códigos de barras, así que lo desactivo en el plugin. Además lo bloqueo explícitamente por
si otra librería lo agregara:

```json
[
  "expo-camera",
  {
    "cameraPermission": "Usamos tu cámara para leer el código de barras del libro y abrir su ficha sin escribir el ISBN.",
    "microphonePermission": false,
    "recordAudioAndroid": false
  }
]
```

```json
"android": {
  "blockedPermissions": ["android.permission.RECORD_AUDIO", "..."]
}
```

(`app.json`, líneas 48–56 y 23–32).

**b) “Elegir una foto de portada desde la galería”.** Usaría **`expo-image-picker`**
(`launchImageLibraryAsync`). Para *elegir* una imagen no hace falta permiso de lectura de la galería: en
Android 13+ se usa el selector de fotos del sistema y en iOS 14+ el `PHPicker`, que solo le entregan a la
app la foto elegida. Igual configuraría el plugin con un texto de propósito (`photosPermission`) por si se
necesita acceso completo, y no habría que bloquear `READ_MEDIA_IMAGES` si se lo pidiera.

**No alcanza con una actualización OTA**: hace falta **una build nueva**. Una actualización OTA (EAS Update)
solo reemplaza JavaScript y *assets*, y `expo-image-picker` agrega **código nativo** que no está en el
binario instalado. Además cambia `app.json` (plugin, textos de `Info.plist`, manifiesto), que solo se
aplica al compilar. Si se enviara por OTA, la app fallaría al buscar el módulo nativo. (En Expo Go
funcionaría porque Expo Go ya trae ese módulo, y eso puede engañar.)

**c) ¿Qué no pude verificar del todo en Expo Go?**

- **Los textos de propósito**: Expo Go usa su propio `Info.plist`, así que el diálogo de cámara muestra el
  texto de Expo Go, no el mío.
- **`blockedPermissions`, `recordAudioAndroid: false` y `microphonePermission: false`**: Expo Go usa su
  propio manifiesto, que declara muchos permisos (incluido el micrófono).
- **El canal “prestamos”**: se crea, pero queda dentro de los ajustes de notificaciones **de Expo Go**, y el
  comportamiento del diálogo de Android 13 es el de Expo Go (que puede tener el permiso concedido de antes).
- **El *scheme* `bibliotecaipf://`**: en Expo Go los links son `exp://IP:8081/--/…`.
- **El color e ícono de la notificación** del plugin.

Cómo lo verificaría: con una **development build** (`npx expo run:android` / `eas build --profile
development`). Revisaría el `AndroidManifest.xml` y el `Info.plist` generados con `npx expo prebuild`,
listaría los permisos instalados con `adb shell dumpsys package <paquete>`, probaría los links con
`npx uri-scheme open "bibliotecaipf://libro/9780132350884" --android` y miraría en Ajustes → Notificaciones
de la app que aparezca el canal “Préstamos”.

---

## Parte E · Buenas prácticas y decisiones de diseño

### E1. Revisión de código

**a) Problemas encontrados**

| # | Línea(s) | Tipo | Problema y por qué sucede | Cómo lo corrijo |
|---|---|---|---|---|
| 1 | 13–16 | **Mala práctica** (y riesgo de rechazo) | Pide cámara y notificaciones **al abrir la app**, sin contexto ni pantalla previa. La persona todavía no tocó “Escanear” ni activó un recordatorio, así que no entiende para qué se piden y lo más probable es que los niegue (y en iOS ya no se pueden volver a pedir). | Pedirlos en el momento de uso: cámara al escanear, con `/permisos/camara`; notificaciones solo al activar “Recordarme”. |
| 2 | 15 | **Error de ejecución** (Android 13+) | `Notifications.requestPermissionsAsync()` sin crear antes el canal: en Android 13+ el diálogo puede no aparecer y el pedido vuelve como denegado. | `prepararCanal()` antes de pedir (`src/lib/notificaciones.ts`). |
| 3 | 16 | **Advertencia** (lint `react-hooks/exhaustive-deps`) | `pedirPermiso` se usa dentro del efecto pero no está en las dependencias. Además las promesas de 14 y 15 no se esperan ni se capturan. | Eliminar el efecto (punto 1). Si hiciera falta, declarar las dependencias y manejar los errores. |
| 4 | 18–20 | **Error de ejecución / rendimiento** | Efecto **sin array de dependencias**: se ejecuta después de **cada** render. Cada respuesta trae un array nuevo, `setLibros` provoca un render, el render vuelve a ejecutar el efecto y se arma un bucle de pedidos (ver b). | `useLibros()` con `[intento]` como dependencia. |
| 5 | 19 | **Error de ejecución** | No hay `.catch`: la API falla 1 de cada 5 veces y queda un *unhandled promise rejection*. La persona no ve ningún mensaje ni puede reintentar. | `try/catch` y estado `error` con botón “Reintentar”. |
| 6 | 19 | **Mala práctica** (condición de carrera) | Sin limpieza: si el componente se desmonta o llegan respuestas desordenadas, se actualiza el estado con datos viejos. | Bandera `activo` en la limpieza. |
| 7 | 10, 22 | **Mala práctica** | `any`: TypeScript ya no puede avisar errores como `libro.titlo` o un `isbn` numérico. | Usar el tipo `Libro` de `src/types`. |
| 8 | 22–30 | **Rendimiento** (y error sutil) | `Fila` se declara **dentro** de `Catalogo`: en cada render es un tipo de componente nuevo, así que React desmonta y vuelve a montar todas las filas (pierden su estado y se recrean sus vistas nativas). Con el bucle del punto 4 pasa cada 800 ms. | Declararla a nivel de módulo en su propio archivo: `src/components/FilaLibro.tsx`. |
| 9 | 24 | **Mala práctica** | `'/libro/' + libro.isbn` es un string armado a mano: las rutas tipadas no lo pueden validar. Si la ruta cambia, TypeScript no avisa. | `router.push({ pathname: '/libro/[isbn]', params: { isbn } })`. |
| 10 | 25 | **Mala práctica** | Estilos en línea con color fijo `#333`: se crea un objeto en cada render, no respeta el tema y en modo oscuro el texto gris oscuro sobre fondo oscuro casi no se lee. | `StyleSheet.create` con los colores de `src/constants/tema.ts`. |
| 11 | 33–36 | **Rendimiento** | `ScrollView` + `map` renderiza **todos** los libros a la vez, sin virtualización. Además no hay estados de carga, error ni vacío: mientras carga se ve una pantalla en blanco. | `FlatList` con `ListEmptyComponent` y los tres estados. |
| 12 | 35 | **Advertencia / error sutil** | `key={i}` usa el índice: si la lista se reordena o se filtra, React reutiliza la fila equivocada. | `keyExtractor={(libro) => libro.isbn}`. |
| 13 | 24, 37–39 | **Mala práctica** (accesibilidad) | Los `Pressable` no tienen `accessibilityRole="button"`. El botón de 37–39 **solo tiene ícono** y no tiene `accessibilityLabel` (un lector de pantalla dice “botón” sin más). El ícono de 28 px deja un área táctil menor a 44 × 44 y, sin `color`, es negro: invisible en modo oscuro. | `BotonIcono` con `accessibilityLabel="Escanear código de barras"`, `minWidth/minHeight: 44` y color del tema. |
| 14 | 11 | **Advertencia** (lint `no-unused-vars`) | `permiso` se declara y nunca se usa. | Quitarlo. |

**b) El efecto de las líneas 18–20 durante el primer minuto**

1. **0 ms**: primer render con `libros = []`. Después de pintar corren los dos efectos: aparece el diálogo de
   cámara (y después el de notificaciones) encima de una pantalla vacía, y sale el pedido 1.
2. **~800 ms**: llega el pedido 1 → `setLibros(arrayNuevo)` → render 2 (todas las `Fila` se desmontan y se
   vuelven a montar porque `Fila` es otro tipo) → como el efecto no tiene dependencias, **se ejecuta de
   nuevo** → pedido 2.
3. **~1.600 ms, ~2.400 ms, …**: se repite: un pedido cada ~800 ms, la lista parpadea y un toque puede
   perderse si la fila se desmonta justo en ese momento.
4. **Primer fallo** (20 % de probabilidad en cada vuelta, en promedio a los ~4 s): no hay `catch`, aparece
   el aviso de *unhandled promise rejection*, `setLibros` no se llama y **el bucle se detiene**… hasta que
   cualquier otro cambio provoque un render. Por ejemplo, al responder el diálogo de cámara cambia `permiso`
   en `useCameraPermissions` → render → efecto → el bucle **arranca de nuevo**.
5. Resultado en un minuto: decenas de pedidos (hasta ~75 si no hubiera fallos), batería y datos gastados,
   parpadeos y advertencias en consola, con un comportamiento que cambia en cada ejecución.

**¿Cambiaría si `obtenerLibros()` devolviera siempre el mismo array?** Sí. El primer `setLibros(LIBROS)`
cambia `[]` por `LIBROS` (render), el efecto vuelve a pedir, y el segundo `setLibros(LIBROS)` recibe **la
misma referencia**: React compara con `Object.is`, ve que el estado no cambió y **no vuelve a renderizar**,
así que el efecto no se ejecuta otra vez y el bucle se corta después de dos pedidos. El error quedaría
**escondido**: el efecto seguiría sin dependencias, pero no se notaría hasta conectar una API real, que
(como la simulada) devuelve objetos nuevos en cada respuesta.

**c) La pantalla reescrita con mis hooks, componentes y constantes**

Es el archivo real de mi app: `src/app/(tabs)/(catalogo)/index.tsx`.

```tsx
import { FlatList, StyleSheet } from 'react-native';

import { EncabezadoCatalogo } from '@/components/EncabezadoCatalogo';
import { EstadoLista } from '@/components/EstadoLista';
import { FilaLibro } from '@/components/FilaLibro';
import { ESPACIO } from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { useEstilos } from '@/hooks/useEstilos';
import { useLibros } from '@/hooks/useLibros';
import { crearHojas } from '@/lib/estilos';

const hojas = crearHojas((c) =>
  StyleSheet.create({
    lista: {
      backgroundColor: c.fondo,
    },
    contenido: {
      padding: ESPACIO.lg,
      gap: ESPACIO.sm,
    },
  }),
);

export default function Catalogo() {
  const estilos = useEstilos(hojas);
  const { libros, cargando, error, reintentar } = useLibros();
  const { disponibles } = useBiblioteca();

  return (
    <FlatList
      style={estilos.lista}
      contentContainerStyle={estilos.contenido}
      contentInsetAdjustmentBehavior="automatic"
      data={cargando || error ? [] : libros}
      keyExtractor={(libro) => libro.isbn}
      renderItem={({ item }) => <FilaLibro libro={item} disponibles={disponibles(item)} />}
      ListHeaderComponent={<EncabezadoCatalogo />}
      ListEmptyComponent={
        <EstadoLista
          cargando={cargando}
          error={error}
          onReintentar={reintentar}
          mensajeCargando="Cargando el catálogo…"
          mensajeVacio="El catálogo está vacío por ahora."
        />
      }
    />
  );
}
```

Qué cambió: los datos vienen de `useLibros` (con carga, error, limpieza y `reintentar`). La lista es una
`FlatList` con `keyExtractor` por ISBN y un `ListEmptyComponent` que cubre cargando, error y vacío. Las
filas son un componente de módulo (`FilaLibro`). Las rutas son tipadas. Los estilos salen de `tema.ts`. Ya
no se pide ningún permiso al abrir: el botón “Escanear” lleva a `/escanear` y ahí se maneja el permiso con
su pantalla previa. Las acciones son `Boton` con `accessibilityRole="button"` y un área mínima de 44 × 44.

**d) ¿Cuál problema podría provocar el rechazo en una tienda y cuál haría que una persona la desinstale
primero?**

- **Rechazo en la tienda: pedir permisos al abrir, sin contexto (líneas 13–16).** Las guías de Apple (5.1.1,
  *Data Collection and Storage*) piden solicitar acceso solo cuando hace falta para una función y explicar
  para qué. Google Play pide lo mismo: pedir cada permiso en el contexto de la función que lo usa. Un
  revisor que abre la app y recibe dos diálogos antes de ver nada tiene motivos para rechazarla. Pedir
  notificaciones al arrancar sin ninguna función visible que las justifique es un motivo típico de
  rechazo.
- **Desinstalación: el bucle de pedidos (líneas 18–20)**, sumado a la primera impresión de los dos diálogos.
  La persona ve parpadear la lista sin explicación, la app consume batería y datos sin parar y a veces
  queda en blanco sin ningún mensaje (cuando el pedido falla no hay error ni “Reintentar”). Los problemas
  de código (`any`, `key={i}`) la persona no los ve; una app que parece rota y gasta batería, sí.

### E2. Organización y acoplamiento

**a) Qué carpetas importan a cuáles**

```
app ─────────► components, hooks, context (solo el layout raíz: Provider), lib, constants, types
components ──► hooks, lib, constants, types
hooks ───────► context, lib, constants, types
context ─────► lib, constants, types
lib ─────────► data, estructuras, constants, types
estructuras ─► (nada)
data ────────► types
constants ───► types (solo tipos, por ejemplo `Recurso` en los textos de permisos)
types ───────► (nada)
```

Las dependencias van siempre “hacia abajo”: **nada importa de `src/app`** (lo comprobé buscando
`from '@/app` y `from '../app` en todo `src/`: sin resultados). Las pantallas no importan `src/data`
directamente: pasan por `src/lib` (`catalogo.ts`, `api.ts`).

Si un hook importara algo de `src/app` sería un problema porque:

- todo archivo en `src/app` es una **ruta** que el router carga por su cuenta. Importarla desde un hook
  mete una pantalla entera (con sus dependencias) en algo que debería ser lógica reutilizable;
- se forman **ciclos** (la pantalla importa el hook y el hook importa la pantalla), que en Metro pueden dar
  valores `undefined` según el orden de carga;
- para reutilizar ese código habría que dejarlo dentro de `src/app`, y ahí cualquier archivo nuevo se
  convierte en una ruta.

**b) Si el catálogo viniera de una API real, ¿qué archivos cambiarían?**

1. `src/lib/api.ts`: `fetch` al servidor real en lugar de `LIBROS`.
2. `src/lib/catalogo.ts`: hoy `buscarLibroPorIsbn` lee `LIBROS` de forma sincrónica; tendría que pedir el
   libro a la API (asincrónico) o usar un caché de la lista.
3. `src/hooks/useLibro.ts`: pasaría a ser asincrónico y a devolver también `cargando` y `error`.
4. Las pantallas que usan `useLibro` (detalle y confirmación) tendrían que mostrar esos dos estados nuevos.
5. Los demás lugares que llaman a `buscarLibroPorIsbn` de forma sincrónica: `escanear.tsx`,
   `reservas.tsx`, `EntradaIsbn.tsx`, `ListaRecientes.tsx`, `PedidoDePermiso.tsx`, y el Context
   (`librosEnEspera` del mostrador usa `librosDelCatalogo()`).
6. `src/data/libros.ts` se borraría.

Son bastante más de dos archivos. Eso me dice que **el acceso sincrónico al catálogo está repartido**:
muchas partes de la app suponen que los libros están siempre disponibles en memoria. El cambio grande no
es la red (eso queda encerrado en `api.ts`), sino pasar de sincrónico a asincrónico. Lo mitigué en parte:
ninguna pantalla importa `LIBROS` directamente, todas pasan por `src/lib/catalogo.ts`, y la validación
del parámetro de ruta está en un solo lugar (`useLibro`). Un diseño más desacoplado tendría un único
“repositorio” del catálogo (un hook o un Context con caché y estados de carga) desde el principio; así
ese cambio quedaría en `lib` y `hooks`, y las pantallas solo agregarían su estado de carga.

**c) `<ConPermiso recurso="camara">…</ConPermiso>` en lugar de `usePermiso` + pantalla previa**

- **Ganaría**: menos código en cada pantalla, un envoltorio declarativo (“esto solo se muestra con cámara”) y
  estados visuales iguales en toda la app.
- **Perdería**:
  - flexibilidad: el escáner muestra el campo manual **en todos los estados**, y su panel cambia según el
    estado, y un envoltorio que decide qué renderizar lo complica;
  - la pantalla previa como **ruta** (`/permisos/camara`, modal, enlazable y la misma para los dos recursos);
  - poder probar la lógica del permiso separada de la interfaz.
- **Para las notificaciones no me serviría**: ahí el permiso no se pide “al abrir una pantalla”, sino desde
  una **acción** (activar un interruptor dentro de una fila de la lista). Ahí no hay nada que envolver:
  necesito llamar `pedir()` de forma imperativa y decidir qué hacer con el resultado, y eso es justamente lo
  que da el hook. Si quisiera el componente, lo construiría **encima** de `usePermiso`, no en su lugar.

### E3. Mapa de fallas

| Situación | Qué ve la persona | Dónde se maneja (archivo y línea) |
|---|---|---|
| `obtenerLibros()` falla | “No pudimos cargar el catálogo. Revisá tu conexión e intentá de nuevo.” + botón “Reintentar”. “Buscar” y “Escanear” siguen funcionando. | `src/hooks/useLibros.ts`, líneas 21–22 y `src/components/EstadoLista.tsx`, líneas 22–24 |
| Se abre `/libro/abc` | Header “Libro no encontrado”, mensaje “Este enlace no corresponde a un libro del catálogo.” + botón “Ir al catálogo”. | `src/hooks/useLibro.ts`, líneas 10–15 y `src/app/(tabs)/(catalogo)/libro/[isbn].tsx`, líneas 39–41 |
| Se escanea un ISBN que no está en el catálogo | Aviso debajo de la cámara: “El código … no corresponde a ningún libro del catálogo. Probá con otro o escribí el ISBN a mano.” La cámara sigue escaneando. | `src/app/(tabs)/(catalogo)/escanear.tsx`, líneas 53–74 |
| La cámara está bloqueada | “La cámara está bloqueada para esta app…” + “Abrir Ajustes” y el campo para escribir el ISBN. | `src/app/(tabs)/(catalogo)/escanear.tsx`, líneas 81–115 y `src/lib/permisos.ts`, línea 15 |
| Las notificaciones están denegadas | En “Mis reservas”: “Las notificaciones están desactivadas: te avisamos acá adentro.” El interruptor queda apagado y las entregas aparecen como avisos dentro de la app. | `src/app/(tabs)/reservas.tsx`, líneas 55–67, `src/components/EncabezadoReservas.tsx`, línea 48, `src/components/PedidoDePermiso.tsx`, líneas 54–61 y `src/context/BibliotecaContext.tsx`, líneas 135–161 |
| Se intenta reservar un libro ya reservado | En el detalle: “Ya tenés este libro en préstamo” o “Ya estás en la lista de espera de este libro, en la posición N”, sin botón “Reservar”. Si se llega a `/reservar/…` por link: el mismo mensaje y “Ver mis reservas”. | `src/app/(tabs)/(catalogo)/libro/[isbn].tsx`, líneas 54–70, `src/app/reservar/[isbn].tsx`, líneas 57–65 y `src/lib/biblioteca.ts`, líneas 88–94 y 60–63 |
| “Entregar al siguiente” con la lista de espera vacía | El mostrador solo lista libros con espera; cuando una lista se vacía, el libro desaparece. Si no queda ninguno: “No hay libros con lista de espera.” Si se intenta igual, la acción no hace nada y se ve “No hay nadie esperando este libro.” (`Cola.desencolar()` devuelve `undefined`, no lanza error). | `src/app/mostrador.tsx`, líneas 37–54, `src/context/BibliotecaContext.tsx`, líneas 135–161 y `src/estructuras/Cola.ts`, líneas 19–28 |
| Login con clave incorrecta | “Usuario o clave incorrectos. Revisalos e intentá de nuevo.” La clave se borra y el foco queda en el formulario. | `src/app/login.tsx`, líneas 56–61 |

### E4. Decisiones con argumentos

**a) Identificador: ISBN como parámetro de ruta y `key`.** Elegí el ISBN.

- **A favor:** es el identificador que **está impreso en el libro**. El escáner lee el EAN-13 y ese valor
  ya es la ruta (`/libro/9780132350884`), sin tabla intermedia. Los deep links son legibles y estables
  entre instalaciones, y sirve como `key` estable en las `FlatList`.
- **El tipo de dato:** `useLocalSearchParams` **siempre devuelve strings** (o arrays de strings). Con un id
  numérico habría que convertir con `Number()`, validar `NaN` y recordar que `'5' !== 5` (el error del
  ejercicio E1 del TP 2, donde la comparación estricta fallaba). El ISBN es un string en el tipo `Libro`
  y en la URL, así que la comparación es directa, y además conserva ceros a la izquierda.
- **Dos ediciones del mismo título:** tienen **ISBN distintos**, y para una biblioteca eso es lo correcto,
  porque son ejemplares físicos distintos (otra paginación, otro año). Si se quisiera agruparlas, iría un
  campo “obra” aparte, no un id inventado.
- **Libros sin ISBN** (tesis, apuntes, libros viejos o donados): es la debilidad real. Se resolvería
  asignando un **código interno de 13 dígitos** con un prefijo reservado (como hacen las bibliotecas con
  sus etiquetas de código de barras), así el resto de la app no cambia.

**b) Estructuras: clase `Pila` con `#items` o array en el estado.** Elegí la clase, combinada con copias
dentro del reductor.

- **Qué me dio:** encapsulamiento real (`#items` es privado: nadie puede hacer `splice` en el medio de
  una cola), una interfaz que dice qué se puede hacer (`apilar`, `verTope`, `encolar`, `verFrente`), y
  `desencolar` en O(1) sin `shift()` gracias al índice `#inicio`. Además pude probarla aparte con jest
  (`src/estructuras/__tests__`).
- **Qué me complicó:** React detecta cambios por referencia y la clase está pensada para mutarse. Tuve que
  agregar `clonar()` y no mutar nunca la instancia que está en el estado (B3 c). Los campos `#privados` no
  se serializan con `JSON.stringify`, así que para AsyncStorage tuve que convertir con `aArray()` y
  reconstruir con `Cola.desde()` / `Pila.desde()`. Tampoco se ven en React DevTools.
- Con un array y `[...pila, x]` todo eso es gratis, pero se pierde la garantía de que solo se usen las
  operaciones de pila o cola.

**c) Memorización.** Sí, en pocos lugares elegidos.

- **Donde aporta:** el `value` del Context (`useMemo`, `src/context/BibliotecaContext.tsx`, líneas 181–215) y
  sus acciones (`useCallback`). Sin `useMemo`, cada render del Provider crearía un objeto nuevo y **todos**
  los consumidores se volverían a renderizar aunque el estado no haya cambiado. Además, `registrarVisto`
  está en las dependencias del efecto del detalle: si no fuera estable, ese efecto se ejecutaría en cada
  render.
- **Donde sería ruido:** envolver en `useCallback` el `onPress` de un botón de una pantalla chica que no
  pasa por ningún `memo`, o hacer `useMemo` de `formatearFecha(vence)`. Cuesta más leerlo que lo que
  ahorra. En mi código, el caso más cercano a ruido es el `useCallback` de `reintentar` en `useLibros`:
  solo termina en el `onPress` del botón “Reintentar” y no es dependencia de ningún efecto. Además, con el **React Compiler** activo en este proyecto, la mayoría de esa memorización se
  hace automáticamente.
- **Cómo lo comprobaría:** con el *Profiler* de React DevTools (“Highlight updates when components render”
  y “Why did this render?”), midiendo cuántas veces se renderiza `FilaLibro` al activar un recordatorio,
  con y sin la memorización. Si el número no cambia, la memorización sobra.

**d) Datos duplicados: “ejemplares disponibles”.** Los **calculo**:

```ts
export function disponibles(estado: EstadoBiblioteca, libro: Libro): number {
  const prestados = estado.prestamos.filter(
    (p) => p.isbn === libro.isbn && p.origen === 'estante',
  ).length;
  return Math.max(0, libro.ejemplares - prestados);
}
```

(`src/lib/biblioteca.ts`, líneas 152–157).

El error típico cuando un dato vive en dos lugares es la **desincronización**. Si además de la lista de
préstamos guardara un contador `disponibles`, cada acción tendría que actualizar los dos. Basta un camino
que actualice uno solo (devolver sin incrementar el contador, restaurar los préstamos desde AsyncStorage
pero no el contador, o un doble toque que descuente dos veces) para que la pantalla diga “2 disponibles”
cuando no queda ninguno, o muestre números negativos. Con el valor calculado hay **una sola fuente de
verdad** (los préstamos) y el número disponible no puede contradecirla.
