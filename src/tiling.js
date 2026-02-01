// src/tiling.js

// Geometry for Equilateral Triangle
export const triSize = 400;
const h = triSize * (Math.sqrt(3) / 2);

// Pre-calculate the transformation matrices for all tiles covering the screen
export function generateTiling(canvasWidth, canvasHeight) {
    const r = h / 3; // Apothem
    const sideAngles = [Math.PI / 2, 7 * Math.PI / 6, 11 * Math.PI / 6];

    let renderList = [];
    const queue = [];
    const visited = new Set();

    // Screen bounds for culling
    const maxDist = Math.sqrt(canvasWidth ** 2 + canvasHeight ** 2) / 2 + triSize;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Helper: Generate Key for Visited Set
    const getKey = (point) => `${Math.round(point.x)},${Math.round(point.y)}`;

    // Initial Triangle
    const startMatrix = new DOMMatrix().translate(centerX + triSize / 2, centerY - h / 3);

    queue.push(startMatrix);
    visited.add(getKey({ x: centerX, y: centerY }));

    let safety = 0;
    while (queue.length > 0 && safety < 5000) {
        safety++;
        const currentMatrix = queue.shift();
        renderList.push(currentMatrix);

        // Try to expand to neighbors
        for (const angle of sideAngles) {
            const ex = Math.cos(angle) * r;
            const ey = Math.sin(angle) * r;

            const nextMatrix = currentMatrix.translate(ex, ey)
                .rotate(angle * 180 / Math.PI)
                .scale(-1, 1)
                .rotate(-angle * 180 / Math.PI)
                .translate(-ex, -ey);
            
            const p = nextMatrix.transformPoint(new DOMPoint(0, 0));

            const dist = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
            if (dist > maxDist) continue;

            const key = getKey(p);
            if (!visited.has(key)) {
                visited.add(key);
                queue.push(nextMatrix);
            }
        }
    }
    console.log(`Generated ${renderList.length} tiles`);
    return renderList;
}
