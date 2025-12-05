import express from 'express';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const app = express();
const server = createServer(app);
const io = new Server(server);

const players = new Map(); // contain player data
const playerKeys = new Map(); // contain pressed keys of each player
const playerMouse = new Map(); // mouse pos of each player
const TICK_RATE = 60;
const MOVE_SPEED = 3;
const TURN_SPEED = 3;
const CANVAS_DIMENSIONS = { width: 600, height: 400 };
const SIZE_FACTOR = 0.2;
// tank width is 110 x 140
const TANK_DIMENSIONS = { width: SIZE_FACTOR * 110, height: SIZE_FACTOR * 140 };

const checkRotatedCorners = (x, y, rad) => {
  const canvasWidth = CANVAS_DIMENSIONS.width;
  const canvasHeight = CANVAS_DIMENSIONS.height;
  const hw = TANK_DIMENSIONS.width / 2;
  const hh = TANK_DIMENSIONS.height / 2;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const corners = [
    { x: x + (-hw * cos - -hh * sin), y: y + (-hw * sin + -hh * cos) },
    { x: x + (hw * cos - -hh * sin), y: y + (hw * sin + -hh * cos) },
    { x: x + (hw * cos - hh * sin), y: y + (hw * sin + hh * cos) },
    { x: x + (-hw * cos - hh * sin), y: y + (-hw * sin + hh * cos) },
  ];

  for (const c of corners) {
    if (c.x < 0) return { x: 1, y: 0 };
    else if (c.x > canvasWidth) return { x: -1, y: 0 };
    else if (c.y < 0) return { x: 0, y: 1 };
    else if (c.y > canvasHeight) return { x: 0, y: -1 };
  }

  return { x: 0, y: 0 };
}

app.use(express.static(join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public/index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected, total players: ', players.size + 1);
  console.log(socket.id);

  // new player initialization
  const newPlayer = {
    id: socket.id,
    x: CANVAS_DIMENSIONS.width / 2,
    y: CANVAS_DIMENSIONS.height / 2,
    bodyAngle: 0,
    barrelAngle: 0
  };
  players.set(socket.id, newPlayer);
  playerKeys.set(socket.id, {});
  playerMouse.set(socket.id, { x: 0, y: 0 });

  // send initial canvas dimensions
  socket.emit("init", CANVAS_DIMENSIONS, SIZE_FACTOR);

  socket.on("update", (keys, mouse) => {
    // console.log("update from player. data:", keys, " ", mouse);
    playerKeys.set(socket.id, keys);
    playerMouse.set(socket.id, mouse);
  });

  socket.on("disconnect", (reason) => {
    socket.broadcast.emit("playerLeft");
    players.delete(socket.id);
    playerKeys.delete(socket.id);
    playerMouse.delete(socket.id);
    console.log("a user disconnected, total players: ", players.size);
  });
});

setInterval(() => {
  playerKeys.forEach((keys, id) => {
    const player = players.get(id);
    const angleRad = (player.bodyAngle * Math.PI) / 180;
    // Movement
    if (keys.w) {
      const newX = player.x + MOVE_SPEED * Math.sin(angleRad);
      if (JSON.stringify(checkRotatedCorners(newX, player.y, angleRad)) == JSON.stringify({ x: 0, y: 0 })) {
        player.x = newX;
      }
      const newY = player.y - MOVE_SPEED * Math.cos(angleRad);
      if (JSON.stringify(checkRotatedCorners(player.x, newY, angleRad)) == JSON.stringify({ x: 0, y: 0 })) {
        player.y = newY;
      }
    }
    if (keys.s) {
      const newX = player.x - MOVE_SPEED * Math.sin(angleRad);
      if (JSON.stringify(checkRotatedCorners(newX, player.y, angleRad)) == JSON.stringify({ x: 0, y: 0 })) {
        player.x = newX;
      }
      const newY = player.y + MOVE_SPEED * Math.cos(angleRad);
      if (JSON.stringify(checkRotatedCorners(player.x, newY, angleRad)) == JSON.stringify({ x: 0, y: 0 })) {
        player.y = newY;
      }
    }

    // Rotation
    if (keys.a) {
      const newBodyAngle = player.bodyAngle - TURN_SPEED;
      const { x, y } = checkRotatedCorners(player.x, player.y, (newBodyAngle * Math.PI) / 180)
      player.bodyAngle = newBodyAngle;
      player.x += x;
      player.y += y;
    }
    if (keys.d) {
      const newBodyAngle = player.bodyAngle + TURN_SPEED;
      if (checkRotatedCorners(player.x, player.y, (newBodyAngle * Math.PI) / 180)) {
        player.bodyAngle = newBodyAngle;
      }
    }

    // calculate barrelAngle
    const xDiff = playerMouse.get(id).x - player.x;
    const yDiff = playerMouse.get(id).y - player.y;
    player.barrelAngle = Math.atan2(yDiff, xDiff);
  })

  io.emit("state", Array.from(players.values()));
}, 1000 / TICK_RATE)

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});

/*

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
*/