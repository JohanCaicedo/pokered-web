import { TILE_SIZE, type TileID, type BlockSet } from '../core/types';
import { ImageLoader } from './ImageLoader';

/**
 * TileRenderer
 * Handles drawing 8x8 tiles from a tileset onto the Canvas.
 */
export class TileRenderer {

    private ctx: CanvasRenderingContext2D;
    private tileset: HTMLImageElement | null = null;
    private tilesetPath: string;

    private scrollX: number = 0;
    private scrollY: number = 0;

    constructor(ctx: CanvasRenderingContext2D, tilesetPath: string = '/assets/tileset_general.png') {
        this.ctx = ctx;
        this.tilesetPath = tilesetPath;
    }

    setScroll(x: number, y: number): void {
        this.scrollX = Math.floor(x);
        this.scrollY = Math.floor(y);
    }

    async load(): Promise<void> {
        try {
            this.tileset = await ImageLoader.load(this.tilesetPath);
        } catch (e) {
            console.warn("Using fallback colors for tiles.");
        }
    }

    clear(): void {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    /**
     * Draws a single 8x8 tile at the specified pixel coordinates.
     * Coordinates are WORLD SPACE. Camera scroll is applied automatically.
     */
    drawTile(tileId: TileID, x: number, y: number): void {
        const screenX = x - this.scrollX;
        const screenY = y - this.scrollY;

        // Optimization: Don't draw if off-screen
        if (screenX < -TILE_SIZE || screenX > this.ctx.canvas.width ||
            screenY < -TILE_SIZE || screenY > this.ctx.canvas.height) {
            return;
        }

        if (!this.tileset) {
            // Fallback: Checkered pattern if no tileset
            // Use different colors for different dummy ids to see patterns
            const r = (tileId * 37) % 255;
            const g = (tileId * 17) % 255;
            const b = (tileId * 7) % 255;
            this.ctx.fillStyle = `rgb(${r},${g},${b})`;
            this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            return;
        }

        // Assuming tileset is a grid. 
        // Standard GB tilesets are often 128px wide (16 tiles across).
        const TILES_PER_ROW = 16;

        const sx = (tileId % TILES_PER_ROW) * TILE_SIZE;
        const sy = Math.floor(tileId / TILES_PER_ROW) * TILE_SIZE;

        this.ctx.drawImage(
            this.tileset,
            sx, sy, TILE_SIZE, TILE_SIZE, // Source (Sheet)
            screenX, screenY, TILE_SIZE, TILE_SIZE    // Dest (Canvas)
        );
    }

    /**
     * Draws a complete 16x16 Block (2x2 Tiles)
     */
    drawBlock(blockId: number, x: number, y: number, blockset: BlockSet): void {
        const def = blockset.definitions[blockId];
        if (!def) {
            // Render Error Placeholder (Red X or similiar)
            this.drawTile(0, x, y);
            this.drawTile(0, x + 8, y);
            this.drawTile(0, x, y + 8);
            this.drawTile(0, x + 8, y + 8);
            return;
        }

        // TL, TR, BL, BR
        this.drawTile(def.tiles[0], x, y);
        this.drawTile(def.tiles[1], x + 8, y);
        this.drawTile(def.tiles[2], x, y + 8);
        this.drawTile(def.tiles[3], x + 8, y + 8);
    }

    /**
     * Draws a sprite from an external sheet.
     * Applies Camera Scroll.
     */
    drawSprite(image: HTMLImageElement, sx: number, sy: number, x: number, y: number, w: number = 16, h: number = 16, flipX: boolean = false): void {
        const screenX = x - this.scrollX;
        const screenY = y - this.scrollY;

        // Optimization: Don't draw if off-screen
        if (screenX < -w || screenX > this.ctx.canvas.width ||
            screenY < -h || screenY > this.ctx.canvas.height) {
            return;
        }

        if (flipX) {
            this.ctx.save();
            this.ctx.translate(screenX + w, screenY);
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(
                image,
                sx, sy, w, h,
                0, 0, w, h
            );
            this.ctx.restore();
        } else {
            this.ctx.drawImage(
                image,
                sx, sy, w, h,
                screenX, screenY, w, h
            );
        }
    }

    /**
     * Draws a region of tiles (useful for map rendering).
     */
    drawLayer(tiles: TileID[], width: number, startX: number, startY: number): void {
        tiles.forEach((tile, index) => {
            const col = index % width;
            const row = Math.floor(index / width);
            this.drawTile(tile, startX + col * TILE_SIZE, startY + row * TILE_SIZE);
        });
    }
}
