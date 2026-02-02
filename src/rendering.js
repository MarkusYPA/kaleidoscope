import Matter from 'matter-js';
import { hexToHSL, hslToHex } from './color.js';

// --- Rendering ---
const baseTriSize = 400;

function drawTriangleClipped(ctx, physicsCanvas, physicsCanvasSize, triSize) {
    const bleed = 0.5; // Small logical pixel bleed to close seams without "saw tooth" artifacts
    const h = triSize * (Math.sqrt(3) / 2);
    const zoom = triSize / baseTriSize;
    const scaledSize = physicsCanvasSize * zoom;

    // Expand the clipping triangle slightly
    const expandedTriSize = triSize + bleed * 2;
    const expandedH = expandedTriSize * (Math.sqrt(3) / 2);

    ctx.beginPath();
    ctx.moveTo(0, -expandedH * 2 / 3);
    ctx.lineTo(-expandedTriSize / 2, expandedH * 1 / 3);
    ctx.lineTo(expandedTriSize / 2, expandedH * 1 / 3);
    ctx.closePath();
    ctx.clip();

    // Draw the image slightly larger to ensure it covers the expanded clip path
    const drawScale = expandedTriSize / triSize;
    const finalDrawSize = scaledSize * drawScale;
    ctx.drawImage(physicsCanvas, -finalDrawSize / 2, -finalDrawSize / 2, finalDrawSize, finalDrawSize);
}

let hueShift = 0;

function updateBodyColors(bodies, speed = 0.2) {
    hueShift = (hueShift + speed) % 360;

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


export function startAnimationLoop({ mainCanvas, physicsCanvas, physicsCanvasSize, engine, getRenderList, getRotationSpeed, getColorSpeed, getZoom }) {
    const mainCtx = mainCanvas.getContext('2d');
    const physicsCtx = physicsCanvas.getContext('2d');
    const physicsResolution = physicsCanvas.width;
    let globalRotation = 0;

    function animate() {
        // Update global rotation
        const speed = getRotationSpeed ? getRotationSpeed() : 0;
        globalRotation += speed;

        // Offscreen Render
        physicsCtx.fillStyle = '#111';
        physicsCtx.fillRect(0, 0, physicsResolution, physicsResolution);

        physicsCtx.save();
        const resScale = physicsResolution / physicsCanvasSize;
        physicsCtx.scale(resScale, resScale);

        const bodies = Matter.Composite.allBodies(engine.world);

        // Update colors
        const colorSpeed = getColorSpeed ? getColorSpeed() : 0.2;
        updateBodyColors(bodies, colorSpeed);

        // Sort bodies by layer (back to front)
        const sortedBodies = [...bodies].sort((a, b) => {
            const layerA = a.render.layer || 0;
            const layerB = b.render.layer || 0;
            return layerA - layerB;
        });

        // Render bodies
        for (const body of sortedBodies) {
            if (body.render.visible === false) continue;
            const vertices = body.vertices;
            physicsCtx.save();

            physicsCtx.beginPath();
            physicsCtx.moveTo(vertices[0].x, vertices[0].y);
            for (let j = 1; j < vertices.length; j++) {
                physicsCtx.lineTo(vertices[j].x, vertices[j].y);
            }
            physicsCtx.closePath();
            physicsCtx.fillStyle = body.render.fillStyle || '#FFF';
            physicsCtx.fill();
            physicsCtx.restore();
        }

        physicsCtx.restore(); // Restore resScale

        // Main Canvas Render
        const dpr = window.devicePixelRatio || 1;
        mainCtx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset to DPR scale for clearing and logical coords

        mainCtx.imageSmoothingEnabled = true;
        mainCtx.imageSmoothingQuality = 'high';

        mainCtx.fillStyle = '#111';
        mainCtx.fillRect(0, 0, mainCanvas.width / dpr, mainCanvas.height / dpr);

        const centerX = (mainCanvas.width / dpr) / 2;
        const centerY = (mainCanvas.height / dpr) / 2;

        const renderList = getRenderList();
        for (const matrix of renderList) {
            mainCtx.save();

            // Global Rotation around screen center
            mainCtx.translate(centerX, centerY);
            mainCtx.rotate(globalRotation);
            mainCtx.translate(-centerX, -centerY);

            const zoom = getZoom ? getZoom() : 1.0;
            const currentTriSize = baseTriSize * zoom;

            // Apply the tile matrix (which is in logical coords)
            mainCtx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);

            drawTriangleClipped(mainCtx, physicsCanvas, physicsCanvasSize, currentTriSize);
            mainCtx.restore();
        }

        requestAnimationFrame(animate);
    }

    animate();
}