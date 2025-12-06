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