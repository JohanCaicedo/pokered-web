# AI Memory: pokered-web

Este archivo sirve como memoria persistente del estado del proyecto, decisiones de arquitectura y documentación de archivos clave. Se actualizará con cada nueva implementación.

## Estado del Proyecto
- **Fase Actual:** Fase 1 (Foundation)
- **Objetivo:** Implementar los sistemas base (Renderizado, Tipos, Store) antes de la lógica de juego.
- **Progreso:** Tipos definidos, Sistema de Renderizado de Tiles funcional.

## Documentación de Archivos

### Core (`src/core/`)
- **`types.ts`**: Define las estructuras de datos fundamentales del motor.
    - `GameMap`: Estructura para mapas (ancho, alto, array de tiles, warps).
    - `Player` / `Entity`: Definen posición (coordenadas de bloque 16x16), dirección y estado.
    - `Direction`: Constantes para direccionamiento (0x00=Down, etc.) compatibles con bit operations.
    - `Pokemon`: Estructura preliminar para datos de Pokémon (stats, tipos).
- **`GameLoop.ts`**: Orquestador principal (Game Loop).
    - Usa `requestAnimationFrame` para mantener el bucle.
    - Método `update()`:
        - **Movimiento**: Interpolación pixel-per-pixel (1px/frame, 16 frames total).
        - **Colisiones**: Comprueba `GameMap` bounds y `BlockSet.isSolid`.
    - Método `draw()`:
        - **Cámara**: Calcula el offset del renderer (`setScroll`) para centrar al jugador, clampeando a los bordes del mapa.
        - Dibuja el Mapa primero, luego al Player.
    - Actualmente dibuja al Player como un bloque de 2x2 tiles (16x16px) en su posición lógica.

### Assets (`src/assets/`)
- **`maps/pallet_town.json`**: Definición de mapa (20x18 blocks).
- **`blocksets/overworld.json`**: Block definitions.
- **`tilesets/overworld.png`** (Requerido): Tileset de 8x8px tiles, 128px de ancho.
- **`sprites/red.png`** (Requerido): Spritesheet de Red. 16x16px por frame.
    - Filas: Abajo (0), Arriba (1), Izquierda (2), Derecha (3).
    - Columnas: Idle (0), Walk1 (1), Walk2 (2).

### Render (`src/render/`)
- **`ImageLoader.ts`**: Utilidad singleton para cargar y cachear imágenes (Tilesets, Spritesheets). Evita recargas innecesarias y maneja promesas.
- **`TileRenderer.ts`**: Motor de renderizado de bajo nivel.
    - Responsabilidad: Dibujar tiles de 8x8 píxeles desde un tileset principal al Canvas.
    - Método clave: `drawTile(tileId, x, y)` calcula la posición origen en el tileset y lo vuelca al canvas.
    - Fallback: Dibuja un patrón de cuadros verdes si no se encuentra la imagen.

### Store (`src/store/`)
- **`gameStore.ts`**: Estado global del juego gestionado con Zustand.
    - Contiene el estado del `player` (posición, dirección, datos).
    - `currentMapId`: ID del mapa activo.
    - Acciones atómicas para mover al jugador sin lógica de juego compleja (la lógica irá en el Loop).

### UI / Root (`src/`)
- **`App.tsx`**: Contenedor principal de React.
    - Inicializa el elemento `<canvas>`.
    - Instancia `TileRenderer` y ejecuta un renderizado de prueba al montar.
    - Maneja el escalado CSS del canvas (actualmente 3x).
- **`index.css`**: Configuración global de estilos.
    - Fuerza `image-rendering: pixelated` para evitar borrosidad.
    - Establece el fondo oscuro y centra el juego en pantalla.

## Decisiones Técnicas
- **Grid de 16x16**: Aunque los tiles son de 8x8, la lógica de movimiento se ha estandarizado a bloques de 16x16 (2x2 tiles) para coincidir con la lógica de colisiones original de Pokémon Rojo.
- **Canvas Puro**: Todo el juego ocurre dentro de un único Canvas Context 2D para máximo rendimiento y fidelidad visual. React solo gestiona el contenedor.

## Sistema de Sprites Avanzado
Desde la Fase 2 (Assets), se implementó un sistema de configuración flexible en lugar de lógica hardcodeada.

### Configuración (`src/assets/characters/`)
Cada entidad tiene un archivo de configuración (ej. `red.ts`) que define:
1.  **Hoja de Sprites**: Ruta, dimensiones totales (ej. 137x137), tamaño de slot (16px), márgenes y espaciado.
2.  **Mapa de Animaciones**: Diccionario que asocia acciones (`walk_down`, `idle_up`) con coordenadas específicas (`col`, `row`) en la rejilla.
    - Esto permite usar hojas de sprites no estándar (con padding o layout diferente).

### Lógica Dinámica (`GameLoop.ts`)
- `currentCharacter`: Carga la configuración activa.
- `update()`: Calcula el estado actual (ej: `walk_left`) basado en input y movimiento.
- `draw()`:
    1.  Busca la animación correspondiente en la config.
    2.  Calcula el frame actual basado en `moveProgress`.
    3.  Calcula las coordenadas pixel-perfect (`sx`, `sy`) aplicando la fórmula:
        `margin + (col * (slotSize + spacing))`
    4.  Aplica transformaciones de espejo (`flipX`) si la configuración del frame lo indica (útil para reutilizar sprites de izquierda/derecha).

### Funcionalidades Soportadas
- **Flip Horizontal**: `flipX: true` permite invertir sprites horizontalmente, ahorrando espacio en la hoja.
- **Ciclos de Animación Personalizados**: Arrays de frames arbitrarios (ej. `[Slot35, Slot3, Slot35]`) permiten crear ciclos de caminar ("paso izquierdo, quieto, paso izquierdo") reutilizando slots estáticos.

## Estrategia de Mapas (Híbrida)
Se ha decidido utilizar un sistema **Basado en Tiles** en lugar de imágenes gigantes completas.

### Por qué esta decisión:
1.  **Colisiones Automáticas**: Evita tener que dibujar cajas de colisión invisibles manualmente sobre cada obstáculo de una imagen gigante.
2.  **Animaciones**: Permite animar agua y flores fácilmente usando tiles animados, lo cual es imposible con una imagen estática.
3.  **Rendimiento Web**: Cargar un tileset pequeño (<100KB) es infinitamente más eficiente que cargar mapas completos de miles de píxeles.

### Flujo de Trabajo:
1.  **Recursos**: Se utilizará un `tileset` completo (imagen única con todos los bloques del juego).
2.  **Edición**: Se recomienda usar herramientas externas como **Tiled** para "pintar" el mapa visualmente y exportarlo a JSON.
3.  **Motor**: El motor leerá este JSON (IDs de tiles) y renderizará el mapa eficientemente, aplicando colisiones basadas en el ID del bloque.
