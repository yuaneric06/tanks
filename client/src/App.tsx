import { useRef, useEffect } from 'react'
import { drawTanks } from './draw.tsx'
import { io } from 'socket.io-client'
import './App.css'


function App() {
  const keysPressed = useRef<{ [key: string]: boolean }>(Object.fromEntries(
    Array.from({ length: 26 }, (_, i) => [String.fromCharCode(97 + i), false])
  ));
  const mousePos = useRef({ x: 0, y: 0 });
  const canvasRef: any = useRef<HTMLCanvasElement>(null);
  let SIZE_FACTOR = 1;

  useEffect(() => {
    const socket = io("http://localhost:3000");
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    let SCALE = dpr * SIZE_FACTOR;

    // const draw = () => {
    //   ctx.clearRect(0, 0, canvas.width / SIZE_FACTOR, canvas.height / SIZE_FACTOR); // clear previous frame
    //   ctx.fillStyle = "blue"; // Set the fill color

    //   // continuous movement based on keysPressed
    //   requestAnimationFrame(draw);
    // };

    // draw(); // start the animation loop

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
      socket.emit("update", keysPressed.current, mousePos.current);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
      socket.emit("update", keysPressed.current, mousePos.current);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current.getBoundingClientRect();

      // raw mouse -> CSS pixels inside canvas
      const cssX = e.clientX - rect.left;
      const cssY = e.clientY - rect.top;

      // convert CSS pixels into canvas coordinate space
      const canvasX = cssX * (canvas.width / rect.width);
      const canvasY = cssY * (canvas.height / rect.height);

      mousePos.current = { x: canvasX / SCALE, y: canvasY / SCALE};
      socket.emit("update", keysPressed.current, mousePos.current);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    socket.on("init", (CANVAS_DIMENSIONS, _SIZE_FACTOR) => {
      canvas.width = CANVAS_DIMENSIONS.width * dpr;
      canvas.height = CANVAS_DIMENSIONS.height * dpr;
      SIZE_FACTOR = _SIZE_FACTOR;
      SCALE = dpr * SIZE_FACTOR;
      ctx.scale(SCALE, SCALE);
    });

    socket.on("state", (bodyData) => {
      // console.log("update from server, data: ", data);
      ctx.clearRect(0, 0, canvas.width / SCALE, canvas.height / SCALE); // clear previous frame
      ctx.fillStyle = "blue"; // Set the fill color
      drawTanks(ctx, bodyData);
    });

    return () => {
      socket.off("update");
      socket.disconnect();
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
