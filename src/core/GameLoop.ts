import { TileRenderer } from '../render/TileRenderer';
import { ImageLoader } from '../render/ImageLoader';
import { useGameStore } from '../store/gameStore';
import { BLOCK_SIZE, Direction, SCREEN_HEIGHT, SCREEN_WIDTH, type GameMap, type BlockSet, type CharacterConfig, type CharacterState } from './types';
import { InputHandler } from './InputHandler';
import { RedCharacterConfig } from '../assets/characters/red';

// Temporary static imports (In real engine, use an AssetManager)


const DUMMY_MAP: GameMap = {
    id: 'empty',
    width: 20,
    height: 18,
    layers: [],
    tilesets: [],
    warps: []
};

export class GameLoop {
    private renderer: TileRenderer;
    private animationId: number | null = null;
    private running: boolean = false;
    private input: InputHandler;
    private playerSprite: HTMLImageElement | null = null;
    private currentCharacter: CharacterConfig = RedCharacterConfig;

    private currentMap: GameMap;

    constructor(renderer: TileRenderer) {
        this.renderer = renderer;
        this.input = new InputHandler();

        // Initialize Map (Dummy)
        this.currentMap = DUMMY_MAP;

        // Sync map ID to store (Force number cast if string, or hash it)
        useGameStore.setState({ isMapLoaded: false, currentMapId: Number(this.currentMap.id) || 0 });

        this.loadAssets();
    }

    async loadAssets() {
        try {
            // 1. Load Character
            const path = this.currentCharacter.sheet.path;
            this.playerSprite = await ImageLoader.load(path, { removeWhiteBackground: true });

            // 2. Load Map (Dynamic JSON)
            await this.loadMap('/assets/tilesets/Pallet_Town.json');

        } catch (e) {
            console.error("Failed to load assets", e);
        }
    }

    async loadMap(path: string) {
        try {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`Failed to fetch map: ${path}`);

            const mapData = await res.json();

            // 1. Parse Layers & Tilesets (Basic Structure)
            const layers = mapData.layers || [];
            const rawTilesets = mapData.tilesets || [];

            // 2. Load Tilesets Recursively
            const loadedTilesets = [];

            for (const ts of rawTilesets) {
                // ts.source is likely "Pallet_Town_RBY.json"
                // Construct path relative to map location (or absolute assets)
                // Assuming flat structure in /assets/tilesets/ logic:
                const tsPath = '/assets/tilesets/' + ts.source;

                const tsRes = await fetch(tsPath);
                if (!tsRes.ok) {
                    console.error(`Failed to load tileset JSON: ${tsPath}`);
                    continue;
                }

                const tsData = await tsRes.json();

                // Inject runtime property 'firstgid' from the map reference
                tsData.firstgid = ts.firstgid;

                // Load the actual Image
                const imgPath = '/assets/tilesets/' + tsData.image;
                await this.renderer.loadTilesetImage(imgPath);

                loadedTilesets.push(tsData);
            }

            // 3. Pre-Calculate Collisions
            let collisionGrid: boolean[] = new Array(mapData.width * mapData.height).fill(false);
            const colLayer = layers.find((l: any) => l.name === 'collisions');

            if (colLayer && colLayer.data) {
                // Any tile ID > 0 in collision layer means blocked
                collisionGrid = colLayer.data.map((gid: number) => gid > 0);
            }

            // 4. Parse Warps (Object Layer)
            const warps: any[] = [];
            const warpLayer = layers.find((l: any) => l.type === 'objectgroup' && l.name === 'warps');

            if (warpLayer && warpLayer.objects) {
                warpLayer.objects.forEach((obj: any) => {
                    // Tiled JSON objects have properties array
                    const props = obj.properties || [];
                    const destMap = props.find((p: any) => p.name === 'destMap')?.value;
                    const destWarpId = props.find((p: any) => p.name === 'destWarpId')?.value;

                    if (destMap) {
                        warps.push({
                            x: Math.floor(obj.x / 16),
                            y: Math.floor(obj.y / 16),
                            destMap: destMap,
                            destWarpId: destWarpId || 0
                        });
                    }
                });
            }

            // 5. Update State
            this.currentMap = {
                id: path,
                width: mapData.width,
                height: mapData.height,
                layers: layers,
                tilesets: loadedTilesets,
                collisionGrid: collisionGrid,
                warps: warps
            };

            // Generate a simple numeric hash for the store ID if path is string
            const numericId = path.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            useGameStore.setState({ isMapLoaded: true, currentMapId: numericId });
            console.log('Map Loaded:', this.currentMap);

        } catch (e) {
            console.error("Map Load Error:", e);
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
            const speed = 1;
            const newProgress = player.moveProgress + speed;

            if (newProgress >= BLOCK_SIZE) {
                // Movement Finished
                let { x, y } = player.pos;
                if (player.direction === Direction.DOWN) y++;
                else if (player.direction === Direction.UP) y--;
                else if (player.direction === Direction.LEFT) x--;
                else if (player.direction === Direction.RIGHT) x++;

                useGameStore.setState((s) => ({
                    player: {
                        ...s.player,
                        pos: { x, y },
                        isMoving: false,
                        moveProgress: 0
                    }
                }));

                // Check Warps
                if (this.currentMap.warps) {
                    const warp = this.currentMap.warps.find(w => w.x === x && w.y === y);
                    if (warp) {
                        console.log(`[GameLoop] Warp Triggered: ${warp.destMap} (ID: ${warp.destWarpId})`);
                        // Future: this.loadMap('/assets/maps/' + warp.destMap);
                    }
                }
            } else {
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

                // 2. Check Map Boundaries
                if (x < 0 || x >= this.currentMap.width || y < 0 || y >= this.currentMap.height) {
                    useGameStore.setState((s) => ({
                        player: { ...s.player, direction: dir }
                    }));
                    return;
                }

                // 3. Collision Logic
                if (this.currentMap.collisionGrid) {
                    const targetIndex = y * this.currentMap.width + x;
                    if (this.currentMap.collisionGrid[targetIndex]) {
                        // Blocked
                        useGameStore.setState((s) => ({
                            player: { ...s.player, direction: dir }
                        }));
                        return;
                    }
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
        let px = player.pos.x * BLOCK_SIZE;
        let py = player.pos.y * BLOCK_SIZE;

        if (player.isMoving) {
            if (player.direction === Direction.DOWN) py += player.moveProgress;
            else if (player.direction === Direction.UP) py -= player.moveProgress;
            else if (player.direction === Direction.LEFT) px -= player.moveProgress;
            else if (player.direction === Direction.RIGHT) px += player.moveProgress;
        }

        // Camera Logic
        const targetCamX = px + 8 - (SCREEN_WIDTH / 2);
        const targetCamY = py + 8 - (SCREEN_HEIGHT / 2);
        const mapWidthPx = this.currentMap.width * BLOCK_SIZE;
        const mapHeightPx = this.currentMap.height * BLOCK_SIZE;
        const maxScrollX = Math.max(0, mapWidthPx - SCREEN_WIDTH);
        const maxScrollY = Math.max(0, mapHeightPx - SCREEN_HEIGHT);
        const camX = Math.max(0, Math.min(targetCamX, maxScrollX));
        const camY = Math.max(0, Math.min(targetCamY, maxScrollY));

        this.renderer.setScroll(camX, camY);

        // --- Render Map Layers (Dynamic) ---
        if (this.currentMap.layers) {
            for (const layer of this.currentMap.layers) {
                if (layer.visible && layer.name !== 'collisions') {
                    this.renderer.drawLayer(layer, this.currentMap.tilesets);
                }
            }
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
                const pxPerFrame = 8;

                // Use global coordinate based on direction
                let distance = 0;
                if (player.direction === Direction.LEFT || player.direction === Direction.RIGHT) {
                    distance = px;
                } else {
                    distance = py;
                }

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
