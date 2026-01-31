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
// MAP & WORLD
// --------------------------------------------------------------------------

export interface GameMap {
    id: number;
    width: number; // Width in blocks (2x2 tiles)
    height: number; // Height in blocks
    data: TileID[]; // Flattened array of tile IDs (width * height * 4 usually if raw tiles, or just block IDs)
    // In gen 1, maps are composed of "Blocks" which are 4x4 tiles (32x32px) or 2x2 tiles?
    // Correction: Gen 1 uses 4x4 pixel tiles? No, 8x8 px tiles.
    // Blocks are usually 2x2 tiles (16x16 px) or 4x4 tiles (32x32 px) depending on engine version.
    // Pokémon Red uses 2x2 meta-tiles (16x16px) for the "Unit" of movement.
    // Let's call them "Blocks" to match ASM.
    blocks: number[]; // Block IDs from the blockset
    borderBlock: number; // The block ID to replicate outside bounds
    warpData: Warp[];
    scriptId: number; // Function to run every frame (gamescript)
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

export interface Warp {
    x: number;
    y: number;
    destMap: number;
    destWarpIndex: number; // Which warp index on the destination map
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
