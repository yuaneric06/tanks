export function pointInRotatedRect(px, py, rectX, rectY, angleDeg, w, h) {
    // Unrotate the point around the rect center
    const rad = -angleDeg * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // translate point into rect local space
    const localX = cos * (px - rectX) - sin * (py - rectY);
    const localY = sin * (px - rectX) + cos * (py - rectY);

    // axis-aligned check in local space
    return (
        Math.abs(localX) <= w / 2 &&
        Math.abs(localY) <= h / 2
    );
}

export function checkRotatedCorners(x, y, rad, CANVAS_DIMENSIONS, TANK_DIMENSIONS) {
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