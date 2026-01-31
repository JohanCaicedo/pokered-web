import { create } from 'zustand';
import { Direction, type Player } from '../core/types';

interface GameState {
    // World State
    currentMapId: number;
    isMapLoaded: boolean;

    // Entities
    player: Player;

    // Actions
    setPlayerPosition: (x: number, y: number) => void;
    setPlayerDirection: (dir: Direction) => void;
    setMap: (mapId: number) => void;
}

const INITIAL_PLAYER: Player = {
    id: 'player',
    name: 'RED',
    spriteId: 0, // Placeholder
    pos: { x: 5, y: 5 }, // Pallet Town bedroom generic coords
    direction: Direction.DOWN,
    isMoving: false,
    moveProgress: 0,
    isVisible: true,
    badges: 0,
    money: 3000,
    idNo: 12345
};

export const useGameStore = create<GameState>((set) => ({
    currentMapId: 1, // Pallet Town?
    isMapLoaded: false,
    player: INITIAL_PLAYER,

    setPlayerPosition: (x, y) => set((state) => ({
        player: {
            ...state.player,
            pos: { x, y }
        }
    })),

    setPlayerDirection: (direction) => set((state) => ({
        player: {
            ...state.player,
            direction
        }
    })),

    setMap: (mapId) => set({ currentMapId: mapId, isMapLoaded: false }),
}));
