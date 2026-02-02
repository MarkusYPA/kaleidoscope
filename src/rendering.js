import Matter from 'matter-js';
import { hexToHSL, hslToHex } from './color.js';

// --- Rendering ---
const baseTriSize = 400;

function drawTriangleClipped(ctx, physicsCanvas, physicsCanvasSize, triSize) {
    const bleed = 0.5; // Small logical pixel bleed to close seams without "saw tooth" artifacts
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

        // Cache HSL on the body object to avoid repeated Hex -> HSL conversions
        if (!body.render.hsl) {
            const originalColor = body.render.originalFillStyle || body.render.fillStyle;
            if (!originalColor) continue;
            try {
                body.render.hsl = hexToHSL(originalColor);
            } catch (e) {
                console.error("Could not parse color:", originalColor, e);
                continue;
            }
        }

        const hsl = body.render.hsl;
        // Use the cached HSL and update only the hue
        const h = (hsl.h + hueShift) % 360;
        body.render.fillStyle = `hsl(${h}, ${hsl.s}%, ${hsl.l}%)`;
    }
}


export function startAnimationLoop({ mainCanvas, physicsCanvas, physicsCanvasSize, engine, getRenderList, getRotationSpeed, getColorSpeed, getZoom, getBackgroundColor, isDevMode }) {
    const mainCtx = mainCanvas.getContext('2d');
    const physicsCtx = physicsCanvas.getContext('2d', { alpha: false }); // Optimization: disable alpha
    const physicsResolution = physicsCanvas.width;
    let globalRotation = 0;
    let bgHueShift = 0;

    // --- Optimization: Tile Caching ---
    // We create an offscreen canvas to hold the pre-clipped triangle tile
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = physicsResolution;
    tileCanvas.height = physicsResolution;
    const tileCtx = tileCanvas.getContext('2d');

    function animate() {
        // Update global rotation
        const speed = getRotationSpeed ? getRotationSpeed() : 0;
        globalRotation += speed;

        // Get Background Color
        const bg = getBackgroundColor ? getBackgroundColor() : { h: 0, s: 0, l: 7, loop: false };
        const colorSpeed = getColorSpeed ? getColorSpeed() : 0.2;

        if (bg.loop) {
            bgHueShift = (bgHueShift + colorSpeed) % 360;
        } else {
            bgHueShift = 0;
        }

        const hue = (bg.h + bgHueShift) % 360;
        const finalBgColor = `hsl(${hue}, ${bg.s}%, ${bg.l}%)`;

        // Offscreen Render (Physics)
        physicsCtx.fillStyle = finalBgColor;
        physicsCtx.fillRect(0, 0, physicsResolution, physicsResolution);

        physicsCtx.save();
        const resScale = physicsResolution / physicsCanvasSize;
        physicsCtx.scale(resScale, resScale);

        const bodies = Matter.Composite.allBodies(engine.world);

        // Update colors
        updateBodyColors(bodies, colorSpeed);

        // Sort bodies by layer (back to front) - only if necessary
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

            // If we are in Dev Mode, draw a stroke for static bodies (walls)
            if (isDevMode && isDevMode() && body.isStatic) {
                physicsCtx.strokeStyle = '#FFF';
                physicsCtx.lineWidth = 2;
                physicsCtx.stroke();
            }

            physicsCtx.restore();
        }

        physicsCtx.restore(); // Restore resScale

        // --- Update Tile Cache ---
        // Pre-clip the physics canvas into the tileCanvas once per frame.
        const zoom = getZoom ? getZoom() : 1.0;
        const logicalTileSize = baseTriSize * zoom;

        // Increase buffer area (0.9 instead of 0.96) to allow for larger zoom-compensated bleed
        const tileTriWidth = physicsResolution * 0.90;
        const tileScale = tileTriWidth / baseTriSize;

        // Zoom-compensated bleed: ensures at least ~1.5 physical pixels of overlap on screen 
        // regardless of zoom level, which eliminates anti-aliasing seams (hairline borders).
        const bleed = Math.min(20, 1.5 / Math.max(0.1, zoom));

        tileCtx.clearRect(0, 0, physicsResolution, physicsResolution);
        tileCtx.save();
        tileCtx.translate(physicsResolution / 2, physicsResolution / 2);

        // Clipping triangle (fixed internal scale)
        const expandedTriWidth = tileTriWidth + (bleed * 2) * tileScale;
        const expandedH = expandedTriWidth * (Math.sqrt(3) / 2);

        tileCtx.beginPath();
        tileCtx.moveTo(0, -expandedH * 2 / 3);
        tileCtx.lineTo(-expandedTriWidth / 2, expandedH * 1 / 3);
        tileCtx.lineTo(expandedTriWidth / 2, expandedH * 1 / 3);
        tileCtx.closePath();
        tileCtx.clip();

        // Draw the physics canvas into the tile canvas at the fixed scale
        const physicsDrawSize = physicsCanvasSize * tileScale;
        tileCtx.drawImage(physicsCanvas, -physicsDrawSize / 2, -physicsDrawSize / 2, physicsDrawSize, physicsDrawSize);
        tileCtx.restore();

        // Main Canvas Render
        const dpr = window.devicePixelRatio || 1;
        mainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        mainCtx.imageSmoothingEnabled = true;
        mainCtx.imageSmoothingQuality = 'high';

        mainCtx.fillStyle = finalBgColor;
        mainCtx.fillRect(0, 0, mainCanvas.width / dpr, mainCanvas.height / dpr);

        const centerX = (mainCanvas.width / dpr) / 2;
        const centerY = (mainCanvas.height / dpr) / 2;

        const renderList = getRenderList();

        // Calculate the draw size for the entire tileCanvas to make the triangle match logicalTileSize
        const drawSize = logicalTileSize * (physicsResolution / tileTriWidth);

        for (const matrix of renderList) {
            mainCtx.save();

            // Global Rotation around screen center
            mainCtx.translate(centerX, centerY);
            mainCtx.rotate(globalRotation);
            mainCtx.translate(-centerX, -centerY);

            // Apply the tile matrix
            mainCtx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);

            // Draw the pre-clipped tile!
            mainCtx.drawImage(
                tileCanvas,
                -drawSize / 2, -drawSize / 2, drawSize, drawSize
            );

            mainCtx.restore();
        }

        // --- DEV MODE OVERLAY ---
        if (isDevMode && isDevMode()) {
            mainCtx.save();
            mainCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            mainCtx.fillRect(0, 0, mainCanvas.width / dpr, mainCanvas.height / dpr);

            const displaySize = Math.min(mainCanvas.width / dpr, mainCanvas.height / dpr) * 0.8;
            const x = (mainCanvas.width / dpr - displaySize) / 2;
            const y = (mainCanvas.height / dpr - displaySize) / 2;

            mainCtx.strokeStyle = '#0FF';
            mainCtx.lineWidth = 2;
            mainCtx.strokeRect(x, y, displaySize, displaySize);
            mainCtx.drawImage(physicsCanvas, x, y, displaySize, displaySize);

            mainCtx.fillStyle = '#0FF';
            mainCtx.font = 'bold 20px monospace';
            mainCtx.fillText('DEVELOPER MODE', x, y - 10);
            mainCtx.font = '14px monospace';
            mainCtx.fillText(`Resolution: ${physicsCanvas.width}x${physicsCanvas.height}`, x, y + displaySize + 20);
            mainCtx.fillText(`Bodies: ${Matter.Composite.allBodies(engine.world).length}`, x, y + displaySize + 40);
            mainCtx.restore();
        }

        requestAnimationFrame(animate);
    }

    animate();
}