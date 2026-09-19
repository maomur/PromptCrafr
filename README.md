# PromptCraft

Biblioteca personal de **prompts de IA** y **enlaces**, organizados en carpetas
de hasta tres niveles. Es una PWA instalable y **funciona entera en el
navegador**: no hay servidor, ni cuentas, ni nada que se envíe fuera.

## Puesta en marcha

```bash
npm install
npm run dev        # http://localhost:9002
```

| Comando              | Qué hace                                        |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Servidor de desarrollo (Turbopack, puerto 9002) |
| `npm run build`      | Build de producción                              |
| `npm run check`      | Tipos + lint + tests: pásalo antes de subir nada |
| `npm run test`       | Sólo los tests                                   |
| `npm run test:watch` | Tests en modo vigilancia                         |
| `npm run typecheck`  | Sólo TypeScript                                  |
| `npm run lint`       | Sólo ESLint                                      |

El build **falla** si hay errores de tipos o de lint. Es intencionado.

## Arquitectura

Organización por características (*Feature-Driven*). Cada feature agrupa lo
suyo y sólo conoce lo que está por debajo de ella:

```
src/
├── app/            Sólo enrutado: layout, page, loading, error, not-found
├── features/       El núcleo modular
│   ├── backup/     Exportar e importar la biblioteca en JSON
│   ├── folders/    Jerarquía de carpetas: árbol, reglas y su interfaz
│   ├── library/    Prompts y enlaces: estado, mutaciones y su interfaz
│   └── pwa/        Instalación y service worker
├── components/
│   ├── layout/     Cabecera y pie
│   └── ui/         Componentes genéricos y atómicos (shadcn/ui)
├── hooks/          Hooks transversales de interfaz
├── lib/            Cliente de la base local y utilidades compartidas
└── styles/         Hoja de estilos global
```

Cada feature reparte lo suyo en `components/`, `hooks/`, `services/`,
`types.ts` y `schemas.ts`, y sólo crea las que necesita. Todas las
importaciones usan alias (`@/features/...`, `@/components/...`); no hay ni una
ruta relativa fuera de los componentes de shadcn.

`app/` contiene únicamente ficheros de enrutado. Los estilos viven en
`src/styles/`; `manifest.ts` e `icon.svg` se quedan porque son convenciones de
metadatos del App Router y Next.js los busca exactamente ahí.

### Desviaciones conscientes del estándar

Cuatro cosas no encajan literalmente en el documento de arquitectura. Están
aquí para que se discutan, no para que se descubran:

| Qué | Por qué |
| --- | --- |
| `lib/` guarda utilidades, no sólo clientes | El único «cliente» es `db.ts`. El resto (`utils`, `dates`, `clipboard`, `id`, `forms`, `broadcast`, `constants`) son transversales, y `@/lib/utils` es además obligatorio para shadcn/ui, que el propio documento cita. |
| `components/layout/` | El documento sólo define `components/ui/` para lo atómico. La cabecera y el pie no son atómicos ni pertenecen a una feature. |
| `src/hooks/` | Contiene únicamente `use-toast`, que viene con shadcn/ui y lo usan todas las features. |
| `src/styles/` | La alternativa era dejar `globals.css` en `app/`, que la regla 1 reserva para enrutado. Una de las dos reglas tenía que ceder. |

Las features crean sólo las subcarpetas que necesitan: `pwa` no tiene
`services/` porque no tiene lógica de negocio, y `backup` no tiene `hooks/`
porque su estado cabe en el componente.

### Sentido de las dependencias

```
app  ──►  features/library  ──►  features/folders
              │                        │
              └──►  features/backup    │
                         │             │
                         ▼             ▼
                    components/ui  ·  lib
```

`library` conoce a `folders`, **nunca al revés**: por eso «borrar una carpeta
recoloca sus prompts» vive en `library/services/mutations.ts` y no en la
feature de carpetas, que no sabe qué es un prompt.

Lo que ambas necesitan no se importa de la otra, sino de abajo: `DropTarget`
está en `components/ui` y no sabe qué se le suelta —quien lo usa declara los
grupos que admite— y la lista de esos grupos está en `lib/constants.ts`.
Cuando una pieza compartida vive dentro de una feature, aparece un ciclo.

### Sobre los Server Components

`layout.tsx`, `page.tsx`, `loading.tsx`, `not-found.tsx`, la cabecera, el pie y
el logotipo **son** Server Components. La frontera de cliente empieza en
`LibraryPage` y baja de ahí, y no por comodidad: **los datos viven en el
navegador de quien usa la aplicación**, así que no hay nada que el servidor
pueda traer ni ninguna capa de datos que mover. `error.tsx` es de cliente
porque React necesita poder reintentar el render desde el navegador.

## Los datos

Todo se guarda en **IndexedDB**, en cuatro almacenes:

| Almacén    | Contenido                               |
| ---------- | --------------------------------------- |
| `projects` | Carpetas principales                    |
| `folders`  | Subcarpetas, con `projectId` y `parentId` |
| `prompts`  | Prompts                                 |
| `links`    | URLs guardadas                          |

El cliente está en [`src/lib/db.ts`](src/lib/db.ts), que es lo único que sabe
abrir la base; las features trabajan sobre él.

**La biblioteca entera se carga en memoria al arrancar.** Son cientos de
registros, no millones, y así filtrar o buscar no cuesta una consulta.

### Cómo se escribe

Toda la lógica de negocio son **funciones puras** en
[`library/services/mutations.ts`](src/features/library/services/mutations.ts):
reciben el estado actual y devuelven el estado siguiente junto con las
operaciones a escribir.

```
componente ──► useLibrary ──► mutación pura ──► { estado, operaciones }
                    │                                    │
                    ├── setState (la interfaz responde)   │
                    └── applyOperations ◄─────────────────┘
                              (una transacción)
```

El hook no decide nada. Por eso cada regla —mover una carpeta arrastra su
subárbol, borrarla sube el contenido un nivel— se prueba sin abrir una base de
datos. Las operaciones de un mismo cambio van en **una sola transacción**, así
que una mudanza no puede quedarse a medias.

Cuando una pestaña escribe, avisa a las demás por `BroadcastChannel` y éstas
recargan ([`lib/broadcast.ts`](src/lib/broadcast.ts)).

### Copias de seguridad

Sin servidor, **el archivo JSON es la única forma** de llevarse la biblioteca a
otro navegador o de recuperarla si se borran los datos del sitio. El menú está
a la vista en la cabecera, no escondido en unos ajustes.

La importación es deliberadamente tolerante
([`backup/services/backup.ts`](src/features/backup/services/backup.ts)):
descarta lo que no tenga identificador, ignora los campos que sobren y
recoloca lo que apunte a una carpeta inexistente, en vez de rechazar el
archivo entero.

## Carpetas

La jerarquía admite hasta **3 niveles**. El límite vive en `MAX_DEPTH`
([`features/folders/types.ts`](src/features/folders/types.ts)), de donde se
derivan el pintado, las opciones de ubicación y las reglas de movimiento.

En la base conviven dos almacenes, `projects` para el primer nivel y `folders`
para los de abajo, pero **la interfaz no lo sabe**:
[`folders/services/tree.ts`](src/features/folders/services/tree.ts) monta un árbol
único y concentra filtrado, contadores, migas de pan y reglas de profundidad.

`projectId` está **desnormalizado** en cada descendiente: repetir la raíz
permite contar y filtrar sin recorrer el árbol, a cambio de mantener la
invariante de que coincide con la del padre.

Borrar nunca se lleva recursos por delante:

| Se borra              | Qué pasa con lo que contenía                                    |
| --------------------- | --------------------------------------------------------------- |
| Una carpeta           | Se borran sus subcarpetas; los recursos suben al nivel de encima  |
| Una carpeta principal | Se borra su árbol; los recursos van a «Sin carpeta»              |

## Arrastrar y soltar

Una tarjeta se arrastra por su asa para reordenarla o para archivarla en otro
sitio: las filas de la barra lateral y las tarjetas de carpeta son destinos
válidos, y se insinúan mientras dura el arrastre.

SortableJS sólo sabe mover cosas entre listas, así que cada destino es
[una lista más](src/components/ui/drop-target.tsx), vacía y no ordenable, que
anuncia su ubicación en `data-drop-target`. El nodo vuelve
siempre a su posición original y es React quien repinta.

Arrastrar no es accesible con teclado, así que cada tarjeta mantiene
«Subir/Bajar posición» y «Mover a» en su menú.

## Buscar y exportar

El buscador filtra por título, descripción y **contenido**, sin tildes y sin
distinguir mayúsculas, exigiendo todas las palabras aunque estén repartidas
entre campos. `/` enfoca, `Esc` limpia.

El botón junto al buscador descarga **todos** los prompts en CSV, con la ruta
completa de su carpeta. Lleva escapado RFC 4180 y BOM de UTF-8: sin lo primero
los saltos de línea parten las filas, y sin lo segundo Excel destroza las
tildes.

## Tests

Vitest, con los ficheros junto al código que prueban. No hay tests de
componentes: se cubre la lógica pura, que es donde están los fallos caros y
silenciosos.

| Fichero                                                              | Qué protege                                          |
| -------------------------------------------------------------------- | ---------------------------------------------------- |
| [`folders/services/tree.test.ts`](src/features/folders/services/tree.test.ts)           | Filtros, contadores acumulados y límite de niveles    |
| [`library/services/mutations.test.ts`](src/features/library/services/mutations.test.ts) | Cada operación: qué estado deja y qué escribe |
| [`backup/services/backup.test.ts`](src/features/backup/services/backup.test.ts) | Importación tolerante de archivos ajenos    |
| [`lib/db.test.ts`](src/lib/db.test.ts)                                | Que lo guardado se vuelve a leer                      |
| [`library/services/ordering.test.ts`](src/features/library/services/ordering.test.ts) | Reparto de posiciones al reordenar    |
| [`library/services/csv.test.ts`](src/features/library/services/csv.test.ts) | Escapado del CSV                                |
| [`library/services/search.test.ts`](src/features/library/services/search.test.ts) | Coincidencias sin tildes                  |

## Límites que conviene conocer

- **Los datos viven en un solo navegador.** Lo que guardes en el portátil no
  aparece en el móvil. Para moverlos, exporta e importa el JSON.
- **Borrar los datos del sitio borra la biblioteca.** No hay copia en ningún
  servidor.
- **Sin contraseña.** Quien use el equipo ve los prompts.

---

Creado por [Maomur](https://www.linkedin.com/in/maomur).
