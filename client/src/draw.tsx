function shadeColor(hex: string, percent: number) {
    const num = parseInt(hex.slice(1), 16);
    let r = (num >> 16) + percent;
    let g = ((num >> 8) & 0x00FF) + percent;
    let b = (num & 0x0000FF) + percent;

    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    return "#" + (r << 16 | g << 8 | b).toString(16).padStart(6, "0");
}

function drawHeartShape(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
) {
    const w = size;
    const h = size;

    ctx.save();
    ctx.fillStyle = "#ff4d4d"; // classic red heart

    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h);

    ctx.bezierCurveTo(x + w, y + h * 0.6, x + w, y + h * 0.2, x + w * 0.5, y + h * 0.2);
    ctx.bezierCurveTo(x, y + h * 0.2, x, y + h * 0.6, x + w / 2, y + h);

    ctx.fill();
    ctx.restore();
}

function drawHearts(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    playerHealth: number,
    SIZE_FACTOR: number
) {
    const S = (v: number) => v * SIZE_FACTOR;

    const heartSize = S(18);      // width of each heart
    const heartSpacing = S(6);    // space between hearts
    const totalWidth = playerHealth * heartSize + (playerHealth - 1) * heartSpacing;

    const startX = x - totalWidth / 2;  // center horizontally
    const heartY = y - S(110);          // position ABOVE the tank

    for (let i = 0; i < playerHealth; i++) {
        const hx = startX + i * (heartSize + heartSpacing);
        drawHeartShape(ctx, hx, heartY, heartSize);
    }
}

function drawName(
    ctx: CanvasRenderingContext2D,
    name: string,
    x: number,
    y: number,
    SIZE_FACTOR: number
) {
    ctx.save();
    ctx.font = `${12}px Arial`;
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // draw it slightly below the tank (10 * SIZE_FACTOR)
    // ctx.fillText(name, x, y + 40 * SIZE_FACTOR);
    ctx.fillText(name, x, y + 80 * SIZE_FACTOR);

    ctx.restore();
}

function drawTank(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    bodyAngle: number,    // degrees
    barrelAngle: number,  // radians
    playerHealth: number,
    name: string,
    SIZE_FACTOR: number,
    baseColor: string
) {
    const S = (v: number) => v * SIZE_FACTOR;

    const dark1 = shadeColor(baseColor, -40);
    const dark2 = shadeColor(baseColor, -80);
    const light1 = shadeColor(baseColor, +30);
    const frontAccent = shadeColor(baseColor, +60);   // NEW
    const rearAccent = shadeColor(baseColor, -60);    // NEW

    // ---------------------
    // BODY + TRACKS
    // ---------------------
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bodyAngle * Math.PI / 180);

    // tracks
    ctx.fillStyle = dark2;
    ctx.fillRect(S(-55), S(-70), S(20), S(140));
    ctx.fillRect(S(35), S(-70), S(20), S(140));

    // track stripes
    ctx.fillStyle = dark1;
    for (let i = -65; i <= 65; i += 14) {
        ctx.fillRect(S(-55), S(i), S(20), S(8));
        ctx.fillRect(S(35), S(i), S(20), S(8));
    }

    // hull base
    drawRoundedRect(ctx, S(-45), S(-60), S(90), S(120), S(20), baseColor);

    // ---------------------
    // FRONT GLACIS PLATE (NEW)
    // ---------------------
    ctx.fillStyle = frontAccent;
    ctx.beginPath();
    ctx.moveTo(S(-45), S(-60));   // left top corner
    ctx.lineTo(S(45), S(-60));    // right top corner
    ctx.lineTo(S(30), S(-85));    // angled right
    ctx.lineTo(S(-30), S(-85));   // angled left
    ctx.closePath();
    ctx.fill();

    // ---------------------
    // REAR ENGINE VENTS (NEW)
    // ---------------------
    ctx.fillStyle = rearAccent;
    ctx.fillRect(S(-30), S(52), S(60), S(12));  // vent block

    ctx.fillStyle = dark1;
    for (let i = -25; i <= 25; i += 10) {
        ctx.fillRect(S(i), S(54), S(20), S(4)); // vent slits
    }

    ctx.restore();

    // ---------------------
    // TURRET + BARREL
    // ---------------------
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(barrelAngle);

    ctx.fillStyle = light1;
    ctx.beginPath();
    ctx.moveTo(S(-25), S(-30));
    ctx.lineTo(S(25), S(-30));
    ctx.lineTo(S(40), S(0));
    ctx.lineTo(S(25), S(30));
    ctx.lineTo(S(-25), S(30));
    ctx.lineTo(S(-40), S(0));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = dark1;
    ctx.beginPath();
    ctx.arc(0, 0, S(22), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = dark2;
    ctx.fillRect(S(22), S(-6), S(60), S(12));

    ctx.restore();

    drawHearts(ctx, x, y, playerHealth, SIZE_FACTOR);
    drawName(ctx, name, x, y, SIZE_FACTOR);
}

export function drawTanks(ctx: CanvasRenderingContext2D, tanks: Array<any>, SIZE_FACTOR: number) {
    tanks.forEach(data => {
        const { x, y, barrelAngle, bodyAngle, health, name } = data;
        drawTank(ctx, x, y, bodyAngle, barrelAngle, health, name, SIZE_FACTOR, data.tankColor);
    });
}

export function drawShells(ctx: CanvasRenderingContext2D, shells: Array<any>, SIZE_FACTOR: number, SHELL_RADIUS: number) {
    shells.forEach(data => {
        const { x, y } = data;
        ctx.beginPath();
        ctx.arc(x, y, SHELL_RADIUS * SIZE_FACTOR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    })
}
function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    color: string
) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.fill();
}