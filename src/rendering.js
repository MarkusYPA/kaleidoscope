// src/rendering.js
import Matter from 'matter-js';
import { triSize } from './tiling.js';

// --- Color Conversion Helpers ---

function hexToHSL(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c / 2,
        r = 0,
        g = 0,
        b = 0;
    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);

    if (r.length == 1) r = "0" + r;
    if (g.length == 1) g = "0" + g;
    if (b.length == 1) b = "0" + b;

    return "#" + r + g + b;
}


// --- Rendering ---

const h = triSize * (Math.sqrt(3) / 2);

function drawTriangleClipped(ctx, physicsCanvas, physicsCanvasSize) {
    ctx.beginPath();
    ctx.moveTo(0, -h * 2 / 3);
    ctx.lineTo(-triSize / 2, h * 1 / 3);
    ctx.lineTo(triSize / 2, h * 1 / 3);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(physicsCanvas, -physicsCanvasSize / 2, -physicsCanvasSize / 2);
}

let hueShift = 0;

function updateBodyColors(bodies) {
    hueShift = (hueShift + 0.2) % 360;

    for (const body of bodies) {
        if (body.render.visible === false || body.isStatic) continue;

        if (!body.render.originalFillStyle) {
            body.render.originalFillStyle = body.render.fillStyle;
        }

        const originalColor = body.render.originalFillStyle;
        if (!originalColor) continue;

        try {
            const hsl = hexToHSL(originalColor);
            hsl.h = (hsl.h + hueShift) % 360;
            body.render.fillStyle = hslToHex(hsl.h, hsl.s, hsl.l);
        } catch (e) {
            // Ignore color conversion errors
            // console.error("Could not parse color:", originalColor, e);
        }
    }
}


export function startAnimationLoop({ mainCanvas, physicsCanvas, engine, getRenderList }) {
    const mainCtx = mainCanvas.getContext('2d');
    const physicsCtx = physicsCanvas.getContext('2d');
    const physicsCanvasSize = physicsCanvas.width;

    function animate() {
        // Offscreen Render
        physicsCtx.fillStyle = '#111';
        physicsCtx.fillRect(0, 0, physicsCanvasSize, physicsCanvasSize);

        const bodies = Matter.Composite.allBodies(engine.world);

        // Update colors
        updateBodyColors(bodies);

        // Render bodies
        for (const body of bodies) {
            if (body.render.visible === false) continue;
            const vertices = body.vertices;
            physicsCtx.beginPath();
            physicsCtx.moveTo(vertices[0].x, vertices[0].y);
            for (let j = 1; j < vertices.length; j++) {
                physicsCtx.lineTo(vertices[j].x, vertices[j].y);
            }
            physicsCtx.closePath();
            physicsCtx.fillStyle = body.render.fillStyle || '#FFF';
            physicsCtx.fill();
            physicsCtx.lineWidth = 1;
            physicsCtx.strokeStyle = 'rgba(0,0,0,0.5)';
            physicsCtx.stroke();
        }

        // Main Canvas Render
        mainCtx.fillStyle = '#111';
        mainCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

        const renderList = getRenderList();
        for (const matrix of renderList) {
            mainCtx.save();
            mainCtx.setTransform(matrix);
            mainCtx.scale(1.005, 1.005);
            drawTriangleClipped(mainCtx, physicsCanvas, physicsCanvasSize);
            mainCtx.restore();
        }

        requestAnimationFrame(animate);
    }

    animate();
}