import { useRef, useEffect, useState } from 'react'
import { drawTanks, drawShells } from './draw.tsx'
import { io } from 'socket.io-client'
import './App.css'


function App() {
  const keysPressed = useRef<{ [key: string]: boolean }>(Object.fromEntries(
    Array.from({ length: 26 }, (_, i) => [String.fromCharCode(97 + i), false])
  ));
  const mousePos = useRef({ x: 0, y: 0 });
  const canvasRef: any = useRef<HTMLCanvasElement>(null);
  const [playerColor, setPlayerColor] = useState("#FF5733");
  let SIZE_FACTOR = 1;

  useEffect(() => {
    const socket = io("https://tanks-jva2.onrender.com/");
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    let SCALE = dpr * SIZE_FACTOR;

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

      mousePos.current = { x: canvasX / dpr, y: canvasY / dpr };
      socket.emit("update", keysPressed.current, mousePos.current);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    socket.on("init", (CANVAS_DIMENSIONS, _SIZE_FACTOR, PLAYER_COLOR) => {
      console.log("initialized");
      canvas.width = CANVAS_DIMENSIONS.width * dpr;
      canvas.height = CANVAS_DIMENSIONS.height * dpr;
      SIZE_FACTOR = _SIZE_FACTOR;
      SCALE = dpr * SIZE_FACTOR;
      setPlayerColor(PLAYER_COLOR);
      console.log("player color: ", playerColor);
      ctx.scale(dpr, dpr);
    });

    socket.on("state", (bodyData, shells) => {
      ctx.clearRect(0, 0, canvas.width / SCALE, canvas.height / SCALE); // clear previous frame
      ctx.fillStyle = "blue"; // Set the fill color
      drawTanks(ctx, bodyData, SIZE_FACTOR);
      drawShells(ctx, shells, 10, SIZE_FACTOR);
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
      <p>Control your tank, shoot the enemy! WASD to move, mouse to aim, and space to shoot</p>
      <div className="color">
        <p>Your tank color: </p>
        <span style={{ display: "block", backgroundColor: playerColor, width: "50px", height: "1rem" }} />
      </div>
      <canvas ref={canvasRef} className="battlefield" tabIndex={0} />

    </main>
  )
}

export default App
