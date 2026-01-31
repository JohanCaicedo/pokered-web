import { Direction } from './types';

export class InputHandler {
    private keys: Map<string, boolean> = new Map();

    constructor() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    dispose() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        this.keys.set(e.code, true);
    };

    private handleKeyUp = (e: KeyboardEvent) => {
        this.keys.set(e.code, false);
    };

    /**
     * Returns the current Direction input, or null if no directional key is pressed.
     * Prioritizes (in order): Down, Up, Left, Right (arbitrary, but standard implementation requires one win).
     * Or LIFO (Last Input First Output)? Gen 1 is usually simplistic.
     * Let's stick to checking standard WASD/Arrows.
     */
    getDirection(): Direction | null {
        if (this.keys.get('ArrowDown') || this.keys.get('KeyS')) return Direction.DOWN;
        if (this.keys.get('ArrowUp') || this.keys.get('KeyW')) return Direction.UP;
        if (this.keys.get('ArrowLeft') || this.keys.get('KeyA')) return Direction.LEFT;
        if (this.keys.get('ArrowRight') || this.keys.get('KeyD')) return Direction.RIGHT;
        return null;
    }

    isActionPressed(): boolean {
        return this.keys.get('KeyZ') || this.keys.get('Enter') || false; // A button / Start
    }
}
