// src/rendering.js
import Matter from 'matter-js';
import { triSize } from './tiling.js';

import { hexToHSL, hslToHex } from './color.js';


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