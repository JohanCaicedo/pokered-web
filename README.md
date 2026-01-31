# pokered-web

A "one-to-one" web implementation of Pokémon Red (Game Boy, 1996), built with modern web technologies but adhering strictly to the original 8-bit architecture and constraints.

## Mission
To replicate the original *Pokémon Red* experience with 100% logical and visual fidelity. We prioritize the original assembly logic (bugs and all) over modern game design conventions, ensuring the underlying math and mechanics are identical to the source of truth.

## Reference
- **Source of Truth:** [pret/pokered](https://github.com/pret/pokered) (Original Game Boy ASM disassembly)

## Tech Stack
- **Languages:** TypeScript, React (UI Layer only)
- **Build Tool:** Vite
- **State Management:** Zustand (Decoupled Game Logic)
- **Rendering:** Canvas API (2D Context) - Native 160x144 resolution
- **Persistence:** IndexedDB (SRAM / .sav emulation)
- **Audio:** Web Audio API

## Key Constraints
1.  **Grid-Based Movement:** Strictly 16x16 pixel blocks. No smooth/sub-pixel movement logic.
2.  **Visual Fidelity:** `image-rendering: pixelated` enforced. 8x8 tile rendering system.
3.  **Integer Math:** Start logic uses integer-only math and bit-truncation to match the Game Boy CPU.
4.  **No DOM in Game World:** The entire game world lives inside the Canvas. DOM is only used for non-diegetic UI (debug tools, outer container).

## Project Structure
- `/src/core/`: Pure TypeScript logic engine (Physics, Math, Battle Systems).
- `/src/render/`: Canvas rendering pipeline (Layers, Sprites, Tiles).
- `/src/store/`: Game state management (Zustand).
- `/src/ui/`: React components for the browser interface.
- `/public/assets/`: Raw assets (Tilesets, Spritesheets).

## Setup
1.  Clone the repository.
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  Run the development server:
    ```bash
    pnpm dev
    ```

## Engine Architecture

### 1. Map Rendering System (Dynamic JSON Pipeline)
The engine utilizes a custom **JSON-based rendering pipeline** that integrates directly with **Tiled Map Editor** exports, creating a flexible and data-driven world system.

*   **Data Source:** Maps are exported as JSON files (`.json`) into `public/assets/tilesets/`. This allows "hot-swapping" map data without recompiling the codebase.
*   **Recursive Loading:** `GameLoop.ts` implements a recursive fetching strategy (`loadMap()`). It first fetches the Map JSON, extracts referenced tilesets, and then fetches the Tileset JSONs + PNGs independently.
*   **TileRenderer (Hard-Grid):** The renderer (`TileRenderer.ts`) parses the tileset configuration data (margin, spacing, tilewidth) *strictly* from the JSON. It calculates source coordinates (`sx`, `sy`) mathematically:
    ```typescript
    const sx = margin + (sheetCol * (tileW + spacing));
    const sy = margin + (sheetRow * (tileH + spacing));
    ```
    This eliminates "magic numbers" and supports custom tilesets with varying padding or layouts.

### 2. Collision System (Boolean Grid)
Physics are handled via a pre-calculated 1D boolean array (`collisionGrid`) to maximize performance in the update loop (60fps).

*   **Layer-Based:** The engine scans the Tiled map for a layer named `"collisions"`.
*   **Binary Flattening:** Any tile ID > 0 in this layer is converted to `true` (solid). Empty tiles are `false` (walkable).
*   **O(1) Check:** During movement, the engine checks: `if (currentMap.collisionGrid[y * width + x])` to determine solidity instantly.

### 3. Warp / Teleport System (Object Layers)
Transition logic is decoupled from code using Tiled's **Object Layers**, allowing level designers to define game logic visually.

*   **Warps Layer:** Lookups are performed against an Object Group named `"warps"`.
*   **Event Triggers:** When a player's grid coordinate matches a Warp Object's position, a trigger fires.
*   **Metadata:** Destinations are defined in Tiled using **Custom Properties**:
    *   `destMap` (string): The filename of the target map (e.g., `Route1.json`).
    *   `destWarpId` (int): The ID of the specific spawn point in the destination map.
