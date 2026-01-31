/**
 * Core Types for pokered-web
 *
 * These types mirror the data structures used in the original Game Boy implementation
 * where applicable, adjusted for TypeScript strictness.
 */

// --------------------------------------------------------------------------
// PRIMITIVES & CONSTANTS
// --------------------------------------------------------------------------

export type TileID = number; // 0-255 (byte) representation of a tile index
export type PaletteID = number; // Index for GB palette (monochrome/SGB)

export const TILE_SIZE = 8; // Native tile size in pixels
export const BLOCK_SIZE = 16; // Meta-tile size (2x2 tiles), used for collision/movement
export const SCREEN_WIDTH = 160;
export const SCREEN_HEIGHT = 144;

// --------------------------------------------------------------------------
// SPATIAL TYPES
// --------------------------------------------------------------------------


export const Direction = {
    DOWN: 0x00,
    UP: 0x04,
    LEFT: 0x08,
    RIGHT: 0x0C,
} as const;

export type Direction = typeof Direction[keyof typeof Direction];

export interface Position {
    x: number; // Grid coordinate (blocks), NOT pixels
    y: number;
}

export interface WorldPosition extends Position {
    mapId: number; // The specific map ID the entity is on
}



// --------------------------------------------------------------------------
// TILED EDITOR SUPPORT
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// TILED JSON INTERFACES (Strictly matching Tiled Export)
// --------------------------------------------------------------------------

export interface TiledMap {
    width: number;      // Map width in tiles
    height: number;     // Map height in tiles
    tilewidth: number;
    tileheight: number;
    layers: TiledLayer[];
    tilesets: { firstgid: number, source: string }[];
}

export interface TiledLayer {
    id: number;
    name: string;
    type: 'tilelayer' | 'objectgroup';
    visible: boolean;
    data: number[]; // GIDs (0 = empty)
    width: number;
    height: number;
    x: number;
    y: number;
    opacity: number;
}

export interface TiledTilesetData {
    name: string;
    image: string;      // "Pallet_Town_RBY.png"
    imagewidth: number;
    imageheight: number;
    tilewidth: number;
    tileheight: number;
    margin: number;
    spacing: number;
    columns: number;
    tilecount: number;
    firstgid: number;   // Injected at runtime, not in the referenced JSON file usually
}

export interface Warp {
    x: number; // Grid X
    y: number; // Grid Y (derived from object x/y / 16)
    destMap: string; // Filename (e.g. "Route1.json")
    destWarpId: number; // Target ID on destination
}

// Runtime Map Structure
export interface GameMap {
    id: string | number;
    width: number;
    height: number;
    layers: TiledLayer[];
    tilesets: TiledTilesetData[];
    collisionGrid?: boolean[]; // Optimized grid for physics
    warps: Warp[];
}

export interface BlockDefinition {
    id: number;
    // 2x2 Tiles: [TopLeft, TopRight, BottomLeft, BottomRight]
    tiles: [TileID, TileID, TileID, TileID];
    isSolid: boolean;
}

export interface BlockSet {
    id: number;
    definitions: Record<number, BlockDefinition>;
}

export interface Frame {
    col: number;
    row: number;
    duration?: number; // In frames (60fps)
    flipX?: boolean;
}

export interface SpriteSheetConfig {
    path: string;
    width: number; // Total pixels
    height: number;
    slotSize: number; // e.g., 16
    margin: number; // Outer padding
    spacing: number; // Gap between slots
}

export type CharacterState =
    | 'idle_down' | 'idle_up' | 'idle_left' | 'idle_right'
    | 'walk_down' | 'walk_up' | 'walk_left' | 'walk_right';

export interface CharacterConfig {
    sheet: SpriteSheetConfig;
    animations: Record<CharacterState, Frame[]>;
}

// --------------------------------------------------------------------------
// ENTITIES
// --------------------------------------------------------------------------

export interface Entity {
    id: string; // Unique UI for React keys
    spriteId: number; // Sprite sheet index (e.g., RED, BLUE, NPC)
    pos: Position;
    direction: Direction;
    isMoving: boolean;
    moveProgress: number; // 0-16 (pixels moved between tiles)
    isVisible: boolean;
}

export interface Player extends Entity {
    name: string;
    badges: number; // Bitfield for 8 badges
    money: number;
    idNo: number; // Trainer ID (0-65535)
}

// --------------------------------------------------------------------------
// POKEMON DATA (Minimal for now)
// --------------------------------------------------------------------------

export interface Pokemon {
    speciesId: number; // 1-151 (Internally different in GB, but we might normalize)
    level: number;
    hp: number;
    maxHP: number;
    status: number; // Bitfield for SLEEP, POISON, etc.
    types: [number, number]; // [Type1, Type2]
    moves: number[]; // Array of 4 Move IDs
    pp: number[]; // Array of 4 PP values
    ivs: number; // DVs in Gen 2 terminology
    evs: number[]; // Stat experience
    ot: number; // Original Trainer ID
}
