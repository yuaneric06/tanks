function drawTank(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    bodyAngle: number,
    barrelAngle: number
) {
    ctx.save();
    ctx.translate(x, y);
    // rotate is given in degrees, convert to radians
    ctx.rotate(bodyAngle * Math.PI / 180);

    // ---------------------
    // BODY + TRACKS
    // ---------------------
    // tracks
    ctx.fillStyle = "#1e5c36";
    ctx.fillRect(-55, -70, 20, 140); // left track
    ctx.fillRect(35, -70, 20, 140);  // right track

    // tracks stripes
    ctx.fillStyle = "#1a4f2f";
    for (let i = -65; i <= 65; i += 14) {
        ctx.fillRect(-55, i, 20, 8);
        ctx.fillRect(35, i, 20, 8);
    }

    // hull (rounded rectangle)
    drawRoundedRect(ctx, -45, -60, 90, 120, 20, "#2cab55");

    ctx.restore(); // body done


    // ---------------------
    // TURRET + BARREL
    // ---------------------
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(barrelAngle);

    // turret polygon
    ctx.fillStyle = "#1e834c";
    ctx.beginPath();
    ctx.moveTo(-25, -30);
    ctx.lineTo(25, -30);
    ctx.lineTo(40, 0);
    ctx.lineTo(25, 30);
    ctx.lineTo(-25, 30);
    ctx.lineTo(-40, 0);
    ctx.closePath();
    ctx.fill();

    // turret circular top
    ctx.fillStyle = "#125835";
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // barrel
    ctx.fillStyle = "#1e5c36";
    ctx.fillRect(22, -6, 60, 12);

    ctx.restore();
}

export function drawTanks(ctx: CanvasRenderingContext2D, tanks: Array<any>) {
    console.log("drawing tanks, data: ", tanks);
    tanks.forEach(data => {
        const { x, y, barrelAngle, bodyAngle } = data;
        drawTank(ctx, x, y, bodyAngle, barrelAngle);
    });
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