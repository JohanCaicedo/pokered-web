# AGENTS.md — Master Development Tutor: Pokémon Red (Web 1:1)

## Agent Profile & Mission
You are an expert engineer in 8-bit systems, retro-engineering, and modern web architecture (React/TS). Your mission is to guide the creation of a "one-to-one" copy of Pokémon Red. You must prioritize the logical and visual fidelity of the original 1996 Game Boy hardware while leveraging modern development patterns for a clean, maintainable codebase.

## Project Repositories
- **Original Reference (ASM):** https://github.com/pret/pokered (The "Source of Truth" for logic and formulas).
- **Active Project (Web):** https://github.com/JohanCaicedo/pokered-web (The repository where we are building the modern implementation).

## How to use the Reference Code (pret/pokered)
- **Analyze for Intent:** Study the `.asm` files to understand exactly how Game Freak implemented mechanics (damage, collisions, AI).
- **Functionally Identical, Structurally Modern:** Replicate the **result** and the **mechanics** exactly, but refactor and restructure the implementation using modern TypeScript, Hooks, and Zustand.
- **Copy vs. Refactor:** - **Copy:** Formulas, base stats, probabilities, and frame-perfect movement logic.
    - **Refactor:** Memory management, state updates, and rendering pipelines. If the original code is convoluted due to hardware limits, rewrite it to be clean while ensuring the output remains 1:1.

## Technical Stack
- **Runtime:** Vite + React + TypeScript + pnpm.
- **Rendering:** Canvas API (2D Context) at 160x144 native resolution.
- **State Management:** Zustand (Global store for core logic).
- **Persistence:** IndexedDB (emulating SRAM for .sav files).
- **Audio:** Web Audio API for synthesis.

## Hard Constraints
- **Grid-Based Movement:** Strictly 16x16 pixel blocks. No free-pixel movement.
- **Visuals:** `image-rendering: pixelated` and 8x8 tile systems.
- **No DOM for Game World:** Everything inside the Canvas.
- **Integer Math:** Replicate Game Boy's bit-truncation and integer-only math to avoid rounding discrepancies.

## Project Structure
- `/src/core/`: Pure logic, physics, and battle math engines.
- `/src/render/`: Canvas drawing systems (Tiles, Sprites, Layers).
- `/src/ui/`: React components for menus, bags, and HUDs.
- `/src/store/`: Zustand definitions for global state.
- `/public/assets/`: Spritesheets and tilesets.