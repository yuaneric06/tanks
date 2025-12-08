import express from 'express';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomColor } from 'randomcolor'
import { checkRotatedCorners, pointInRotatedRect } from './calculations.js'

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    // origin: "http://localhost:5173",
    origin: "https://yuaneric06.github.io",
    methods: ["GET", "POST"]
  }
});

// player data containers
const players = new Map(); // contain player data
const playerKeys = new Map(); // contain pressed keys of each player
const playerMouse = new Map(); // mouse pos of each player
let shells = [];

// canvas data
const CANVAS_DIMENSIONS = { width: 600, height: 400 };
const SIZE_FACTOR = 0.2;
const TANK_DIMENSIONS = { width: SIZE_FACTOR * 110, height: SIZE_FACTOR * 140 };

// game data
const TICK_RATE = 60;
const MOVE_SPEED = 3;
const TURN_SPEED = 3;
const SHELL_SPEED = 5;
const SHOT_COOLDOWN = 30;

const TOTAL_HEALTH = 5;
const PLAYER_WIDTH = 110; // make sure to scale by SIZE_FACTOR
const PLAYER_HEIGHT = 140;

let bozoCounter = 0;
const playersWithNoShellCooldown = new Set();

app.use(express.static(join(__dirname, 'public')));

const generateRandomString = (length) => {
  return Math.random().toString(36).substring(2, 2 + length);
};
const disableShellCooldownPass = generateRandomString(10);
const enableInvincibilityPass = generateRandomString(10);
console.log("disable shell cooldown password: " + disableShellCooldownPass);
console.log("enable invincibility password: " + enableInvincibilityPass);

io.on('connection', (socket) => {
  bozoCounter++;
  console.log("user connected, socket id: ", socket.id)
  // new player initialization
  const newPlayer = {
    id: socket.id,
    x: CANVAS_DIMENSIONS.width / 2,
    y: CANVAS_DIMENSIONS.height / 2,
    bodyAngle: 0,
    barrelAngle: 0,
    shotCooldown: SHOT_COOLDOWN,
    health: TOTAL_HEALTH,
    tankColor: randomColor(),
    name: `bozo #${bozoCounter}`
  };
  players.set(socket.id, newPlayer);
  playerKeys.set(socket.id, {});
  playerMouse.set(socket.id, { x: 0, y: 0 });

  // send initial canvas dimensions
  socket.emit("init", CANVAS_DIMENSIONS, SIZE_FACTOR, newPlayer.tankColor);

  socket.on("update", (keys, mouse) => {
    playerKeys.set(socket.id, keys);
    playerMouse.set(socket.id, mouse);
  });

  socket.on("respawn", () => {
    players.get(socket.id).health = TOTAL_HEALTH;
  });

  socket.on("nameChange", (newName) => {
    players.get(socket.id).name = newName;
  })

  socket.on("disconnect", (reason) => {
    socket.broadcast.emit("playerLeft");
    console.log("user left, socket id: ", socket.id);
    players.delete(socket.id);
    playerKeys.delete(socket.id);
    playerMouse.delete(socket.id);
  });

  // cheats
  socket.on(disableShellCooldownPass, () => {
    playersWithNoShellCooldown.add(socket.id);
  });
  socket.on(enableInvincibilityPass, () => {
    players.get(socket.id).health = 999;
  });
});

setInterval(() => {
  // update player state
  playerKeys.forEach((keys, id) => {
    const player = players.get(id);
    const angleRad = (player.bodyAngle * Math.PI) / 180;
    // Movement
    if (keys.w) {
      const newX = player.x + MOVE_SPEED * Math.sin(angleRad);
      if (JSON.stringify(checkRotatedCorners(newX, player.y, angleRad, CANVAS_DIMENSIONS, TANK_DIMENSIONS)) == JSON.stringify({ x: 0, y: 0 })) {
        player.x = newX;
      }
      const newY = player.y - MOVE_SPEED * Math.cos(angleRad);
      if (JSON.stringify(checkRotatedCorners(player.x, newY, angleRad, CANVAS_DIMENSIONS, TANK_DIMENSIONS)) == JSON.stringify({ x: 0, y: 0 })) {
        player.y = newY;
      }
    }
    if (keys.s) {
      const newX = player.x - MOVE_SPEED * Math.sin(angleRad);
      if (JSON.stringify(checkRotatedCorners(newX, player.y, angleRad, CANVAS_DIMENSIONS, TANK_DIMENSIONS)) == JSON.stringify({ x: 0, y: 0 })) {
        player.x = newX;
      }
      const newY = player.y + MOVE_SPEED * Math.cos(angleRad);
      if (JSON.stringify(checkRotatedCorners(player.x, newY, angleRad, CANVAS_DIMENSIONS, TANK_DIMENSIONS)) == JSON.stringify({ x: 0, y: 0 })) {
        player.y = newY;
      }
    }

    // Rotation
    if (keys.a) {
      const newBodyAngle = player.bodyAngle - TURN_SPEED;
      const { x, y } = checkRotatedCorners(player.x, player.y, (newBodyAngle * Math.PI) / 180, CANVAS_DIMENSIONS, TANK_DIMENSIONS)
      player.bodyAngle = newBodyAngle;
      player.x += x;
      player.y += y;
    }
    if (keys.d) {
      const newBodyAngle = player.bodyAngle + TURN_SPEED;
      if (checkRotatedCorners(player.x, player.y, (newBodyAngle * Math.PI) / 180, CANVAS_DIMENSIONS, TANK_DIMENSIONS)) {
        player.bodyAngle = newBodyAngle;
      }
    }

    // calculate barrelAngle
    const xDiff = playerMouse.get(id).x - player.x;
    const yDiff = playerMouse.get(id).y - player.y;
    player.barrelAngle = Math.atan2(yDiff, xDiff);

    // shooting
    if (player.shotCooldown < SHOT_COOLDOWN) {
      player.shotCooldown++;
    }

    if (keys[" "] && player.health > 0 && (player.shotCooldown >= SHOT_COOLDOWN || playersWithNoShellCooldown.has(player.id))) {
      player.shotCooldown = 0;
      shells.push({ x: player.x, y: player.y, angle: player.barrelAngle, shotFrom: player.id });
    }
  })

  // update shells state
  const shellsToRemove = [];
  for (let i = shells.length - 1; i >= 0; i--) {
    const shell = shells[i];
    const { x, y, angle } = shell; // angle is already in radians
    const newX = x + SHELL_SPEED * Math.cos(angle)
    const newY = y + SHELL_SPEED * Math.sin(angle);
    shell.x = newX;
    shell.y = newY;
    players.forEach((player, id) => {
      if (player.health > 0 && pointInRotatedRect(shell.x,
        shell.y,
        player.x,
        player.y,
        player.bodyAngle,
        PLAYER_WIDTH * SIZE_FACTOR,
        PLAYER_HEIGHT * SIZE_FACTOR) &&
        shell.shotFrom != player.id) {
        player.health--;
        if (player.health == 0) {
          io.to(id).emit("death");
        }
        shellsToRemove.push(i);
      }
    })
  }

  shells = shells.filter((data, idx) => {
    return data.x >= 0 && data.x < CANVAS_DIMENSIONS.width && data.y >= 0 && data.y < CANVAS_DIMENSIONS.height && !shellsToRemove.includes(idx);
  })

  io.emit("state", Array.from(players.values()), shells);
}, 1000 / TICK_RATE)


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  console.log(`Server running at ${url}`);
});