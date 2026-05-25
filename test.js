const fs = require('fs');

class DOMPoint {
    constructor(x, y) { this.x = x; this.y = y; }
}

class DOMMatrix {
    constructor() { this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0; }
    translate(x, y) {
        let m = new DOMMatrix();
        m.a = this.a; m.b = this.b; m.c = this.c; m.d = this.d; m.e = this.e + this.a * x + this.c * y; m.f = this.f + this.b * x + this.d * y;
        return m;
    }
    rotate(angle) {
        let rad = angle * Math.PI / 180;
        let cos = Math.cos(rad); let sin = Math.sin(rad);
        let m = new DOMMatrix();
        m.a = this.a * cos + this.c * sin; m.b = this.b * cos + this.d * sin;
        m.c = this.c * cos - this.a * sin; m.d = this.d * cos - this.b * sin;
        m.e = this.e; m.f = this.f;
        return m;
    }
    scale(sx, sy) {
        let m = new DOMMatrix();
        m.a = this.a * sx; m.b = this.b * sx; m.c = this.c * sy; m.d = this.d * sy; m.e = this.e; m.f = this.f;
        return m;
    }
    transformPoint(p) {
        return new DOMPoint(this.a * p.x + this.c * p.y + this.e, this.b * p.x + this.d * p.y + this.f);
    }
}

function generateTiling(canvasWidth, canvasHeight, triSize = 400) {
    const h = triSize * (Math.sqrt(3) / 2);
    const r = h / 3;
    const sideAngles = [Math.PI / 2, 7 * Math.PI / 6, 11 * Math.PI / 6];
    let renderList = [];
    const queue = [];
    const visited = new Set();
    const maxDist = Math.sqrt(canvasWidth ** 2 + canvasHeight ** 2) / 2 + triSize;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const getKey = (point) => `${Math.round(point.x)},${Math.round(point.y)}`;
    const startMatrix = new DOMMatrix().translate(centerX + triSize / 2, centerY - h / 3);
    queue.push(startMatrix);
    visited.add(getKey({ x: centerX, y: centerY }));
    let safety = 0;
    while (queue.length > 0 && safety < 5000) {
        safety++;
        const currentMatrix = queue.shift();
        renderList.push(currentMatrix);
        for (const angle of sideAngles) {
            const ex = Math.cos(angle) * r; const ey = Math.sin(angle) * r;
            const nextMatrix = currentMatrix.translate(ex, ey).rotate(angle * 180 / Math.PI).scale(-1, 1).rotate(-angle * 180 / Math.PI).translate(-ex, -ey);
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
    return renderList.length;
}

console.log('Zoom 1.0:', generateTiling(1920, 1080, 400));
console.log('Zoom 3.0:', generateTiling(1920, 1080, 1200));
console.log('Zoom 0.5:', generateTiling(1920, 1080, 200));
