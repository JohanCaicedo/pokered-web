import { TileRenderer } from '../render/TileRenderer';
import { ImageLoader } from '../render/ImageLoader';
import { useGameStore } from '../store/gameStore';
import { BLOCK_SIZE, Direction, SCREEN_HEIGHT, SCREEN_WIDTH, type GameMap, type BlockSet, type CharacterConfig, type CharacterState } from './types';
import { InputHandler } from './InputHandler';
import { RedCharacterConfig } from '../assets/characters/red';

// Temporary static imports (In real engine, use an AssetManager)
import palletTownData from '../assets/maps/pallet_town.json';
import overworldBlocksetData from '../assets/blocksets/overworld.json';

export class GameLoop {
    private renderer: TileRenderer;
    private animationId: number | null = null;
    private running: boolean = false;
    private input: InputHandler;
    private playerSprite: HTMLImageElement | null = null;
    private currentCharacter: CharacterConfig = RedCharacterConfig;

    private currentMap: GameMap = palletTownData as unknown as GameMap;
    private currentBlockset: BlockSet = overworldBlocksetData as unknown as BlockSet;

    constructor(renderer: TileRenderer) {
        this.renderer = renderer;
        this.input = new InputHandler();

        // Sync map ID to store
        useGameStore.setState({ isMapLoaded: true, currentMapId: this.currentMap.id });

        this.loadAssets();
    }

    async loadAssets() {
        try {
            // Load Character Sprite from Config
            const path = this.currentCharacter.sheet.path;
            this.playerSprite = await ImageLoader.load(path, { removeWhiteBackground: true });
            console.log(`Loaded Sprite: ${path}`);
        } catch (e) {
            console.error("Failed to load Character Sprite", e);
        }
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.loop();
    }

    stop() {
        this.running = false;
        this.input.dispose(); // Cleanup listeners
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    private loop = () => {
        if (!this.running) return;

        this.update();
        this.draw();

        this.animationId = requestAnimationFrame(this.loop);
    };

    private update() {
        const state = useGameStore.getState();
        const player = state.player;

        // MOVEMENT LOGIC
        if (player.isMoving) {
            // Continue moving
            // Speed: 1px per frame (Walk) -> 16 frames per tile.
            // Speed: 2px per frame (Run/Bike)
            const speed = 1;
            const newProgress = player.moveProgress + speed;

            if (newProgress >= BLOCK_SIZE) {
                // Movement Finished
                // Calculate new grid position
                let { x, y } = player.pos;
                if (player.direction === Direction.DOWN) y++;
                else if (player.direction === Direction.UP) y--;
                else if (player.direction === Direction.LEFT) x--;
                else if (player.direction === Direction.RIGHT) x++;

                // Update Store: Snap to new grid, Reset progress
                useGameStore.setState((s) => ({
                    player: {
                        ...s.player,
                        pos: { x, y },
                        isMoving: false,
                        moveProgress: 0
                    }
                }));
            } else {
                // Update Progress
                useGameStore.setState((s) => ({
                    player: { ...s.player, moveProgress: newProgress }
                }));
            }


        } else {
            // Idle - Check Input
            const dir = this.input.getDirection();
            if (dir !== null) {
                // 1. Calculate Target Position
                let { x, y } = player.pos;
                if (dir === Direction.DOWN) y++;
                else if (dir === Direction.UP) y--;
                else if (dir === Direction.LEFT) x--;
                else if (dir === Direction.RIGHT) x++;

                // 2. Check Map BOundaries
                const map = this.currentMap;
                if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
                    // Out of bounds - Just Turn
                    useGameStore.setState((s) => ({
                        player: { ...s.player, direction: dir }
                    }));
                    return;
                }

                // 3. Check Block Solidity
                const blockIndex = y * map.width + x;
                const blockId = map.blocks[blockIndex];
                const blockDef = this.currentBlockset.definitions[blockId];

                // Default to solid if unknown, to define 'safe' behavior? or not solid?
                // Gen 1: Unknown blocks are usually treated as Walkable unless defined Solid?
                // Safe approach: If definition missing, treat as wall to prevent glitches.
                const isSolid = blockDef ? blockDef.isSolid : true;

                if (isSolid) {
                    // Blocked - Just Turn
                    useGameStore.setState((s) => ({
                        player: { ...s.player, direction: dir }
                    }));
                    return;
                }

                // 4. Path Clear - Start Moving
                useGameStore.setState((s) => ({
                    player: {
                        ...s.player,
                        direction: dir,
                        isMoving: true,
                        moveProgress: 0
                    }
                }));
            }
        }
    }


    private draw() {
        this.renderer.clear();

        // Draw State
        const { player } = useGameStore.getState();

        // Calculate Pixel Position (World Space)
        // Base grid position
        let px = player.pos.x * BLOCK_SIZE;
        let py = player.pos.y * BLOCK_SIZE;

        // Add offset if moving
        if (player.isMoving) {
            if (player.direction === Direction.DOWN) py += player.moveProgress;
            else if (player.direction === Direction.UP) py -= player.moveProgress;
            else if (player.direction === Direction.LEFT) px -= player.moveProgress;
            else if (player.direction === Direction.RIGHT) px += player.moveProgress;
        }

        // --- Camera Logic ---
        // Center on Player
        // Player is 16x16 (Block), so center is px + 8, py + 8
        const targetCamX = px + 8 - (SCREEN_WIDTH / 2);
        const targetCamY = py + 8 - (SCREEN_HEIGHT / 2);

        // Map dimensions in pixels
        const mapWidthPx = this.currentMap.width * BLOCK_SIZE;
        const mapHeightPx = this.currentMap.height * BLOCK_SIZE;

        // Clamp
        const maxScrollX = Math.max(0, mapWidthPx - SCREEN_WIDTH);
        const maxScrollY = Math.max(0, mapHeightPx - SCREEN_HEIGHT);

        const camX = Math.max(0, Math.min(targetCamX, maxScrollX));
        const camY = Math.max(0, Math.min(targetCamY, maxScrollY));

        this.renderer.setScroll(camX, camY);

        // --- Render Map ---
        // 1. Draw Map Layer 0 (Background)
        const map = this.currentMap;
        const blockset = this.currentBlockset;

        // Optimization: Only draw visible blocks?
        // For now, draw all (map is small).
        // If optimizing: Calculate startCol/endCol based on camX/camY.

        for (let i = 0; i < map.blocks.length; i++) {
            const blockId = map.blocks[i];
            const col = i % map.width;
            const row = Math.floor(i / map.width);

            // Draw Block at (col*16, row*16)
            this.renderer.drawBlock(blockId, col * BLOCK_SIZE, row * BLOCK_SIZE, blockset);
        }

        // 2. Draw Entities (Player)

        if (this.playerSprite) {
            // Determine State
            let state: CharacterState = 'idle_down';
            const action = player.isMoving ? 'walk' : 'idle';
            const dirStr =
                player.direction === Direction.UP ? 'up' :
                    player.direction === Direction.LEFT ? 'left' :
                        player.direction === Direction.RIGHT ? 'right' : 'down';

            state = `${action}_${dirStr}` as CharacterState;

            // Get Animation Sequence
            const anim = this.currentCharacter.animations[state];

            // Determine Frame Index
            let frameIndex = 0;
            if (player.isMoving && anim.length > 0) {
                // Global Walking Cycle
                // To achieve 1 Step per Tile (Gen 1 Style):
                // The full cycle (Step R -> Idle -> Step L -> Idle) takes 2 Tiles (32px).
                // Each frame lasts 8px (Half a tile).
                // Frame 0 (Step R): 0-7px
                // Frame 1 (Idle):   8-15px
                // Frame 2 (Step L): 16-23px
                // Frame 3 (Idle):   24-31px

                const walkCyclePx = 32; // 2 Tiles
                const framesInCycle = 4; // Assuming config has 4 frames
                const pxPerFrame = 8;

                // Use global coordinate based on direction
                let distance = 0;
                if (player.direction === Direction.LEFT || player.direction === Direction.RIGHT) {
                    distance = px;
                } else {
                    distance = py;
                }

                // If moving negative (Up/Left), we need to invert/adjust so frames play forward? 
                // Or just Math.abs? Math.abs is safest for cycle consistency.
                frameIndex = Math.floor(Math.abs(distance) / pxPerFrame) % anim.length;
            }

            const frame = anim[frameIndex] || anim[0];

            // Calculate Source Coordinates (Flexible Grid)
            const { slotSize, margin, spacing } = this.currentCharacter.sheet;

            const sx = margin + (frame.col * (slotSize + spacing));
            const sy = margin + (frame.row * (slotSize + spacing));

            this.renderer.drawSprite(this.playerSprite, sx, sy, px, py, 16, 16, frame.flipX);

        } else {
            // Fallback: White Box
            this.renderer.drawTile(255, px, py);
            this.renderer.drawTile(255, px + 8, py);
            this.renderer.drawTile(255, px, py + 8);
            this.renderer.drawTile(255, px + 8, py + 8);
        }
    }
}
