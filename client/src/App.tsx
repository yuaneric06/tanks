import { useRef, useEffect } from 'react'
import { drawTank } from './draw.tsx'
import './App.css'

function App() {
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const canvasRef: any = useRef<HTMLCanvasElement>(null);
  const playerStatsRef: any = useRef({
    x: 0,
    y: 0,
    bodyAngle: 0,
    barrelAngle: 0,
    mouseX: 0,
    mouseY: 0
  });

  const sizeFactor = 0.4;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // properly scale canvas
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr * sizeFactor, dpr * sizeFactor);

    const stats = playerStatsRef.current;
    const moveSpeed: number = 5;
    const turnSpeed: number = 3;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width / sizeFactor, canvas.height / sizeFactor); // clear previous frame
      ctx.fillStyle = "blue"; // Set the fill color
        ctx.fillRect(stats.mouseX, stats.mouseY, 50, 50); // x, y, width, height
      // continuous movement based on keysPressed
      if (keysPressed.current["w"]) {
        // math to calculate movement forward
        const bodyAngleRadians = stats.bodyAngle * Math.PI / 180;
        const displacementX: number = moveSpeed * Math.sin(bodyAngleRadians);
        const displacementY: number = moveSpeed * Math.cos(bodyAngleRadians);
        stats.x += displacementX;
        stats.y -= displacementY;
      }
      if (keysPressed.current["s"]) {
        // math to calculate movement backward
        const bodyAngleRadians = stats.bodyAngle * Math.PI / 180;
        const displacementX: number = moveSpeed * Math.sin(bodyAngleRadians);
        const displacementY: number = moveSpeed * Math.cos(bodyAngleRadians);
        stats.x -= displacementX;
        stats.y += displacementY;
      }
      if (keysPressed.current["a"]) stats.bodyAngle -= turnSpeed;
      if (keysPressed.current["d"]) stats.bodyAngle += turnSpeed;

      const { x, y, bodyAngle, barrelAngle } = playerStatsRef.current;
      drawTank(ctx, x, y, bodyAngle, barrelAngle);
      requestAnimationFrame(draw);
    };

    draw(); // start the animation loop

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const stats = playerStatsRef.current;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseCanvasX = (e.clientX - rect.left) / sizeFactor - stats.x;
      const mouseCanvasY = (e.clientY - rect.top) / sizeFactor - stats.y;
      stats.barrelAngle = mouseCanvasX > 0 ? Math.atan(mouseCanvasY / mouseCanvasX) : Math.atan(mouseCanvasY / mouseCanvasX) + Math.PI;
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <main>
      <h1 className="title">Tanks</h1>

      <canvas ref={canvasRef} className="battlefield" tabIndex={0} />

    </main>
  )
}

export default App
