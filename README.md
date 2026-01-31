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
