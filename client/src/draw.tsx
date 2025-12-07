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

function drawTank(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    bodyAngle: number,    // degrees
    barrelAngle: number,  // radians
    SIZE_FACTOR: number,
    baseColor: string
) {
    const S = (v: number) => v * SIZE_FACTOR;

    // generate color variants
    const dark1 = shadeColor(baseColor, -40);
    const dark2 = shadeColor(baseColor, -80);
    const light1 = shadeColor(baseColor, +30);

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

    // hull
    drawRoundedRect(ctx, S(-45), S(-60), S(90), S(120), S(20), baseColor);

    ctx.restore();

    // ---------------------
    // TURRET + BARREL
    // ---------------------
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(barrelAngle);

    // turret polygon
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

    // turret circular top
    ctx.fillStyle = dark1;
    ctx.beginPath();
    ctx.arc(0, 0, S(22), 0, Math.PI * 2);
    ctx.fill();

    // barrel
    ctx.fillStyle = dark2;
    ctx.fillRect(S(22), S(-6), S(60), S(12));

    ctx.restore();
}

export function drawTanks(ctx: CanvasRenderingContext2D, tanks: Array<any>, SIZE_FACTOR: number) {
    console.log(tanks);
    tanks.forEach(data => {
        const { x, y, barrelAngle, bodyAngle } = data;
        console.log(data.tankColor);
        drawTank(ctx, x, y, bodyAngle, barrelAngle, SIZE_FACTOR, data.tankColor);
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