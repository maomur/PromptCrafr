# PromptCraft

Biblioteca personal de **prompts de IA** y **enlaces**, organizados en proyectos y
categorías. Es una PWA instalable: los datos se sincronizan con Firestore y
siguen disponibles sin conexión.

## Puesta en marcha

```bash
npm install
npm run dev        # http://localhost:9002
```

| Comando             | Qué hace                                        |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo (Turbopack, puerto 9002) |
| `npm run build`     | Build de producción                              |
| `npm run check`     | Tipos + lint, lo mismo que valida el build       |
| `npm run typecheck` | Sólo TypeScript                                  |
| `npm run lint`      | Sólo ESLint                                      |

El build **falla** si hay errores de tipos o de lint. Es intencionado.

## Arquitectura

Todo se ejecuta en el cliente: no hay rutas de API, ni Server Actions, ni
lectura de datos en el servidor. Next.js aquí es empaquetador y enrutador.

```
src/
├── app/            Layout, página raíz, manifest de la PWA y estilos globales
├── components/     Interfaz (shadcn/ui en components/ui)
├── firebase/       Inicialización, contexto, hooks de lectura y escrituras
├── hooks/          use-library (acceso a los datos) y use-toast
└── lib/            Tipos, esquemas de validación y utilidades
```

### Datos

Tres colecciones bajo `users/{uid}`, cada una aislada por las reglas de
[firestore.rules](firestore.rules):

| Colección  | Contenido                                        |
| ---------- | ------------------------------------------------ |
| `projects` | Agrupaciones de primer nivel                     |
| `folders`  | Subdivisiones dentro de un proyecto              |
| `prompts`  | Prompts con título, descripción, contenido...    |
| `links`    | URLs guardadas                                   |

El esquema completo está en [docs/backend.json](docs/backend.json).

**[`useLibrary`](src/hooks/use-library.ts) es el único punto de acceso a los
datos.** Expone las tres colecciones en tiempo real y todas las mutaciones; los
componentes no hablan con Firestore directamente.

### Cómo se escribe en Firestore

Las escrituras son *no bloqueantes*
([`src/firebase/non-blocking-updates.tsx`](src/firebase/non-blocking-updates.tsx)):
se lanzan sin esperar y la interfaz se actualiza sola cuando el listener de
`onSnapshot` recibe el cambio. Los rechazos de las reglas de seguridad se
propagan por un bus de eventos y, en desarrollo, aparecen en el overlay de
Next.js con el detalle de la petición denegada.

Las operaciones que tocan varios documentos —reordenar una lista, borrar un
proyecto— usan lotes atómicos.

### Logotipo e iconos

La marca es el signo `>_` de un prompt de línea de comandos con un destello que
lo sitúa en el terreno de la IA. Dentro de la aplicación se pinta con el
componente [`<Logo />`](src/components/logo.tsx), en línea, para que escale sin
pérdida y no cueste una petición de red.

Hay cuatro variantes del mismo dibujo, cada una por un motivo concreto:

| Fichero                        | Para qué                                                  |
| ------------------------------ | --------------------------------------------------------- |
| `public/icons/logo.svg`         | Original del que salen los PNG                             |
| `src/app/icon.svg`              | Favicon: sin destello, que a 16 px sería una mancha        |
| `public/icons/maskable.svg`     | Android: fondo a sangre y glifo al 62 %, porque el lanzador recorta |
| `public/icons/apple.svg`        | iOS: fondo a sangre, porque el sistema aplica su redondeo  |

Los PNG del manifest se regeneran desde los SVG con Chrome headless; no hay
ningún paso de build que lo haga solo.

### Proyectos y carpetas

La jerarquía tiene **exactamente dos niveles**: un recurso está suelto, dentro
de un proyecto, o dentro de una carpeta de ese proyecto. En la interfaz, un
proyecto se presenta como **carpeta principal** y una carpeta como
**subcarpeta**; los dos niveles se crean y se editan con el mismo formulario
([`folder-form.tsx`](src/components/folder-form.tsx)), donde dejar la
ubicación en «carpeta principal» es lo que crea un proyecto. Ambos tienen
nombre y descripción opcional. Por eso `folders` es
una colección aparte con un `projectId`, y no un `parentId` recursivo en
`projects`: no hay anidamiento arbitrario que modelar.

Cada prompt y cada enlace guardan `projectId` y `folderId`. Cuando están en una
carpeta, **ambos** campos van informados, de modo que el filtro de un proyecto
puede recoger todo su contenido con una sola comparación. Los documentos
creados antes de esta función no tienen `folderId` y se tratan como sueltos
dentro de su proyecto.

Borrar nunca arrastra recursos:

| Se borra    | Qué pasa con lo que contenía                           |
| ----------- | ------------------------------------------------------ |
| Una carpeta | Sus recursos quedan sueltos dentro del proyecto        |
| Un proyecto | Se borran sus carpetas; los recursos van a «Sin proyecto» |

Ambas operaciones son lotes atómicos. Cambiar una subcarpeta de proyecto
también lo es: sus recursos guardan `projectId` además de `folderId`, así que
la mudanza tiene que arrastrarlos a todos o a ninguno.

Al entrar en un proyecto se ven primero sus carpetas como tarjetas y debajo
todo su contenido, incluido el que vive dentro de esas carpetas. Al entrar en
una carpeta, sólo lo suyo.

### Arrastrar y soltar

Una tarjeta se puede arrastrar por su asa para reordenarla dentro de la lista o
para archivarla en otro sitio. Los destinos válidos son las filas de la barra
lateral («Sin proyecto», cada proyecto y cada carpeta) y las tarjetas de
carpeta de la vista de proyecto; se insinúan con un borde discontinuo mientras
dura el arrastre.

SortableJS sólo sabe mover cosas entre listas, así que cada destino es
[una lista más](src/components/drop-target.tsx), vacía y no ordenable, que
anuncia su ubicación en `data-drop-target`. La rejilla de origen la lee al
soltar, de modo que toda la lógica vive en un único sitio. El nodo vuelve
siempre a su posición original y es React quien repinta la lista cuando
Firestore confirma el cambio: nunca hay dos fuentes de verdad sobre el DOM.

Arrastrar no es accesible con teclado, así que cada tarjeta mantiene
«Subir/Bajar posición» y «Mover a» en su menú.

### Búsqueda

El buscador filtra por título, descripción y **contenido** del prompt (o la URL,
en los enlaces). Compara sin tildes y sin distinguir mayúsculas, y exige que
aparezcan todas las palabras, aunque estén repartidas entre campos distintos.
La tecla `/` lleva el foco al buscador y `Esc` lo limpia.

Todo se filtra en memoria: la biblioteca entera ya está cargada por los
listeners de Firestore, así que no hay ninguna consulta extra al servidor. La
lógica vive en [`src/lib/search.ts`](src/lib/search.ts).

### Orden de los recursos

Cada prompt y cada enlace tienen un campo `order`; **mayor valor, más arriba**.
Se puede reordenar arrastrando por el asa de la tarjeta o desde el menú
«Subir/Bajar posición», que es la vía accesible por teclado.

## Configuración

Las credenciales de Firebase están en
[`src/firebase/config.ts`](src/firebase/config.ts). Es correcto que estén en el
repositorio: en una app web de Firebase son públicas por diseño y quien protege
los datos son las reglas de Firestore, no la clave.

Despliegue: Firebase App Hosting, configurado en
[apphosting.yaml](apphosting.yaml).

## Genkit

Hay un cliente de Genkit preparado con Gemini en
[`src/ai/genkit.ts`](src/ai/genkit.ts), pero todavía **sin ningún flow**. Los que
se creen se registran en [`src/ai/dev.ts`](src/ai/dev.ts).

---

Creado por [Maomur](https://www.linkedin.com/in/maomur).
