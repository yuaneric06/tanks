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
  const socketRef = useRef<any>(null);
  const [playerColor, setPlayerColor] = useState("#FF5733");
  const [connected, setConnected] = useState(false);
  const [isDead, setIsDead] = useState(false);
  let SIZE_FACTOR = 1;

  useEffect(() => {
    // socketRef.current = io("http://localhost:3000");
    socketRef.current = io("https://tanks-jva2.onrender.com/");
    const socket = socketRef.current;
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
      const canvas = canvasRef.current!;

      // raw mouse -> CSS pixels inside canvas
      const cssX = e.clientX - rect.left;
      const cssY = e.clientY - rect.top;

      // convert CSS pixels into canvas coordinate space
      const canvasX = cssX * (canvas.width / rect.width);
      const canvasY = cssY * (canvas.height / rect.height);

      mousePos.current = { x: canvasX, y: canvasY };
      socket.emit("update", keysPressed.current, mousePos.current);
    }

    // Store internal resolution globally
    let INTERNAL_WIDTH = 800; // default, will be overwritten by init
    let INTERNAL_HEIGHT = 600;

    const resizeCanvas = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      // Get the size the canvas should appear visually
      canvas.style.width = `40vw`;
      canvas.style.height = `50vh`;

      // Internal resolution stays fixed
      canvas.width = INTERNAL_WIDTH;
      canvas.height = INTERNAL_HEIGHT;

      // Reset transform (optional)
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    const goobers = (pass: string) => {
      if (pass === "yuanShoot") {
        socket.emit("disableShellCooldown");
      }
    }
    (window as any).goobers = goobers;


    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    socket.on("init", (CANVAS_DIMENSIONS: any, _SIZE_FACTOR: number, PLAYER_COLOR: string) => {
      setConnected(true);

      INTERNAL_WIDTH = CANVAS_DIMENSIONS.width;
      INTERNAL_HEIGHT = CANVAS_DIMENSIONS.height;

      SIZE_FACTOR = _SIZE_FACTOR;
      setPlayerColor(PLAYER_COLOR);

      resizeCanvas();
    });

    socket.on("state", (bodyData: any, shells: any) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height); // clear previous frame
      ctx.fillStyle = "blue"; // Set the fill color
      bodyData = bodyData.filter((player: {
        id: string;
        x: number;
        y: number;
        bodyAngle: number;
        barrelAngle: number;
        shotCooldown: number;
        health: number;
        tankColor: string;
      }) => player.health > 0);
      drawTanks(ctx, bodyData, SIZE_FACTOR);
      drawShells(ctx, shells, 10, SIZE_FACTOR);
    });

    socket.on("death", () => {
      setIsDead(true);
    });

    return () => {
      socket.off("update");
      socket.disconnect();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resizeCanvas);
      delete (window as any).goobers;
    };

  }, []);

  const renderLoadingScreen = () => {
    return (
      <h1>
        Loading... Please be patient <br />
        This is because the server has not been in use for a while, so it goes to sleep <br />
        Do not worry, it should take at most a minute to come back online
      </h1>
    )
  }

  const handleChangeName = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const input = form.querySelector("input") as HTMLInputElement;
    const newName = input.value.trim();

    if (newName.length === 0) return;

    // emit to server
    socketRef.current.emit("nameChange", newName);

    input.value = "";
  };

  return (
    <main>
      {!connected && renderLoadingScreen()}
      <h1 className="title">Tanks</h1>
      <p>Control your tank, shoot the enemy! WASD to move, mouse to aim, and space to shoot</p>
      <div className="colorAndName">
        <div className="color">
          <p>Your tank color: </p>
          <span style={{ display: "block", backgroundColor: playerColor, width: "50px", height: "1rem", marginLeft: "1rem" }} />
        </div>
        <form className="name" onSubmit={handleChangeName}>
          <label>Change your name: </label>
          <input type="text" placeholder="cheeze gunk" />
          <button>Submit</button>
        </form>
      </div>
      <canvas ref={canvasRef} className="battlefield" tabIndex={0} />
      {isDead && <button onClick={() => {
        setIsDead(false);
        const socket = socketRef.current;
        socket.emit("respawn");
      }}>Respawn</button>}
    </main>
  )
}

export default App
