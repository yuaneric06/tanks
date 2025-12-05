function drawTank(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    bodyAngle: number,    // degrees
    barrelAngle: number,  // radians (already in radians on server)
    SIZE_FACTOR: number
) {
    const S = (v: number) => v * SIZE_FACTOR;

    // ---------------------
    // BODY + TRACKS
    // ---------------------
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bodyAngle * Math.PI / 180);

    // tracks
    ctx.fillStyle = "#1e5c36";
    ctx.fillRect(S(-55), S(-70), S(20), S(140)); // left
    ctx.fillRect(S(35), S(-70), S(20), S(140));  // right
    // upper left: (-55, -70)
    // lower right: (55, 70)
    // total width: S(110), S(140)

    // track stripes
    ctx.fillStyle = "#1a4f2f";
    for (let i = -65; i <= 65; i += 14) {
        ctx.fillRect(S(-55), S(i), S(20), S(8));
        ctx.fillRect(S(35), S(i), S(20), S(8));
    }

    // hull
    drawRoundedRect(ctx, S(-45), S(-60), S(90), S(120), S(20), "#2cab55");

    ctx.restore();

    // ---------------------
    // TURRET + BARREL
    // ---------------------
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(barrelAngle);

    // turret polygon
    ctx.fillStyle = "#1e834c";
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
    ctx.fillStyle = "#125835";
    ctx.beginPath();
    ctx.arc(0, 0, S(22), 0, Math.PI * 2);
    ctx.fill();

    // barrel
    ctx.fillStyle = "#1e5c36";
    ctx.fillRect(S(22), S(-6), S(60), S(12));

    ctx.restore();
}

export function drawTanks(ctx: CanvasRenderingContext2D, tanks: Array<any>, SIZE_FACTOR: number) {
    tanks.forEach(data => {
        const { x, y, barrelAngle, bodyAngle } = data;
        drawTank(ctx, x, y, bodyAngle, barrelAngle, SIZE_FACTOR);
    });
}

export function drawShells(ctx: CanvasRenderingContext2D, shells: Array<any>, SIZE_FACTOR: number, SHELL_RADIUS: number) {
    console.log(shells);
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