import { TILE_SIZE, type TileID, type BlockSet } from '../core/types';
import { ImageLoader } from './ImageLoader';

/**
 * TileRenderer
 * Handles drawing tiles and sprites onto the Canvas.
 */
export class TileRenderer {

    private ctx: CanvasRenderingContext2D;
    private scrollX: number = 0;
    private scrollY: number = 0;

    private tilesets: Map<string, HTMLImageElement> = new Map();

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    setScroll(x: number, y: number): void {
        this.scrollX = Math.floor(x);
        this.scrollY = Math.floor(y);
    }

    async loadTilesetImage(path: string): Promise<HTMLImageElement | null> {
        if (!this.tilesets.has(path)) {
            try {
                const img = await ImageLoader.load(path);
                this.tilesets.set(path, img);
                return img;
            } catch (e) {
                console.warn(`Failed to load tileset: ${path}`);
                return null;
            }
        }
        return this.tilesets.get(path) || null;
    }

    clear(): void {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    drawLayer(layer: { data: number[], width: number }, tilesets: any[]): void {
        const { data, width } = layer;

        for (let i = 0; i < data.length; i++) {
            const gid = data[i];
            if (gid === 0) continue; // Empty

            // Find Tileset
            // Tilesets must be sorted by firstgid descending to find the correct range
            // But usually Tiled JSON exports them in order. 
            // We need the one where gid >= firstgid, and it's the largest such firstgid.

            // Simple search (assuming pre-sorted or small list)
            let tileset = null;
            for (let t = tilesets.length - 1; t >= 0; t--) {
                if (gid >= tilesets[t].firstgid) {
                    tileset = tilesets[t];
                    break;
                }
            }

            if (!tileset) continue;

            const img = this.tilesets.get('/assets/tilesets/' + tileset.image);
            if (!img) continue;

            // Math
            const localId = gid - tileset.firstgid;
            const tileW = tileset.tilewidth;
            const tileH = tileset.tileheight;
            const margin = tileset.margin || 0;
            const spacing = tileset.spacing || 0;
            const columns = tileset.columns;

            const sheetCol = localId % columns;
            const sheetRow = Math.floor(localId / columns);

            const sx = margin + (sheetCol * (tileW + spacing));
            const sy = margin + (sheetRow * (tileH + spacing));

            const col = i % width;
            const row = Math.floor(i / width);

            const destX = col * 16; // Game assumes 16x16 grid
            const destY = row * 16;

            // Screen Coords
            const screenX = destX - this.scrollX;
            const screenY = destY - this.scrollY;

            // Cull
            if (screenX < -16 || screenX > 160 || screenY < -16 || screenY > 144) continue;

            this.ctx.drawImage(img, sx, sy, tileW, tileH, screenX, screenY, 16, 16);
        }
    }

    /**
     * Legacy draw (Raw ID) - Can be used for debug
     */
    drawTile(tileId: TileID, x: number, y: number): void {
        // Placeholder for legacy raw tile drawing if needed
        // For now, just a colored rect debug
        const screenX = x - this.scrollX;
        const screenY = y - this.scrollY;

        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }

    /**
     * Draws a complete 16x16 Block (2x2 Tiles)
     */
    drawBlock(blockId: number, x: number, y: number, blockset: BlockSet): void {
        const def = blockset.definitions[blockId];
        if (!def) {
            this.drawTile(0, x, y);
            return;
        }
        // Legacy implementation, kept for reference if needed
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
}
