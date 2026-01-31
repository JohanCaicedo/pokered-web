
import { useEffect, useRef } from 'react';
import { TileRenderer } from './render/TileRenderer';
import { GameLoop } from './core/GameLoop';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from './core/types';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize Renderer
    const renderer = new TileRenderer(ctx);
    const gameLoop = new GameLoop(renderer); // Instantiate GameLoop

    const init = async () => {
      await renderer.load();
      gameLoop.start(); // Start GameLoop after renderer loads
    };

    init();

    return () => {
      gameLoop.stop(); // Cleanup GameLoop on unmount
    };
  }, []);

  return (
    <div id="game-root">
      <canvas
        ref={canvasRef}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        style={{
          width: `${SCREEN_WIDTH * 3}px`, // 3x Scalling
          height: `${SCREEN_HEIGHT * 3}px`,
        }}
      />
    </div>
  )
}

export default App
