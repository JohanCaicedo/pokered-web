import type { CharacterConfig } from '../../core/types';

// USER MAPPING:
// Path: PokemonRGOWSpritesV1Final.png (137x137)
// Grid: 8x8 Slots (16px)
// Slot 1: Idle Front (Down)
// Slot 2: Idle Back (Up)
// Slot 3: Idle Left (Left)
// Slot 3 (Flipped): Idle Right (Right)
// Slot 33: Walk Right Foot (Generic Step?)
// Slot 35: Walk Left Foot (Generic Step?)
// Slot 34: Walk Up Right Foot. (Walk Up Step 1)
// Slot 34 (Flipped): Walk Up Left Foot. (Walk Up Step 2)

// Mapping Slots to Col/Row (Zero-indexed):
// Slot 1 (Index 0): Col 0, Row 0
// Slot 2 (Index 1): Col 1, Row 0
// Slot 3 (Index 2): Col 2, Row 0
// Slot 33 (Index 32): Col 0, Row 4
// Slot 34 (Index 33): Col 1, Row 4
// Slot 35 (Index 34): Col 2, Row 4

export const RedCharacterConfig: CharacterConfig = {
    sheet: {
        path: '/assets/sprites/PokemonRGOWSpritesV1Final.png',
        width: 137,
        height: 137,
        slotSize: 16,
        margin: 1,
        spacing: 1
    },
    animations: {
        // IDLE
        'idle_down': [{ col: 0, row: 0 }], // Slot 1
        'idle_up': [{ col: 1, row: 0 }], // Slot 2
        'idle_left': [{ col: 2, row: 0 }], // Slot 3
        'idle_right': [{ col: 2, row: 0, flipX: true }], // Slot 3 (Flipped)

        // WALK DOWN (Front)
        // Cycle: Step R (33) -> Idle (1) -> Step L (33 Flipped) -> Idle (1)
        // Corrected: Previous Slot 35 was "Side View", causing glitch.
        'walk_down': [
            { col: 0, row: 4 }, // Slot 33 (Pie Derecho)
            { col: 0, row: 0 }, // Slot 1 (Idle)
            { col: 0, row: 4, flipX: true }, // Slot 33 Flipped (Pie Izquierdo)
            { col: 0, row: 0 }  // Slot 1
        ],

        // WALK UP (Back)
        // Cycle: Step R (34) -> Idle (2) -> Step L (34 Flipped) -> Idle (2)
        'walk_up': [
            { col: 1, row: 4 }, // Slot 34 (Pie Derecho)
            { col: 1, row: 0 }, // Slot 2 (Idle)
            { col: 1, row: 4, flipX: true }, // Slot 34 Flipped (Pie Izquierdo)
            { col: 1, row: 0 }  // Slot 2
        ],

        // WALK LEFT
        // Cycle: Step (Slot 35) -> Idle (Slot 3) -> Step (Slot 35) -> Idle (Slot 3)
        // User confirmed Slot 35 is "Looking Left, Step". 
        // Gen 1 Side walk usually behaves as 2-frame (Idle <-> Step).
        'walk_left': [
            { col: 2, row: 4 }, // Slot 35 (Step)
            { col: 2, row: 0 }, // Slot 3 (Idle)
            { col: 2, row: 4 }, // Slot 35
            { col: 2, row: 0 }  // Slot 3
        ],
        'walk_right': [
            { col: 2, row: 4, flipX: true }, // Slot 35 Flipped (Step)
            { col: 2, row: 0, flipX: true }, // Slot 3 Flipped (Idle)
            { col: 2, row: 4, flipX: true }, // Slot 35 Flipped
            { col: 2, row: 0, flipX: true }  // Slot 3 Flipped
        ]
    }
};
