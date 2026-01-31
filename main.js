import Matter from 'matter-js';
const { Engine, Render, Runner, World, Bodies } = Matter;

const mainCanvas = document.getElementById('kaleidoscopeCanvas');
const ctx = mainCanvas.getContext('2d');

// Set main canvas to fill the screen
mainCanvas.width = window.innerWidth;
mainCanvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    mainCanvas.width = window.innerWidth;
    mainCanvas.height = window.innerHeight;
});

// Step 2: Create the physics "texture" canvas
const physicsCanvasSize = 512; // e.g., 512x512
const physicsCanvas = document.createElement('canvas');
physicsCanvas.width = physicsCanvasSize;
physicsCanvas.height = physicsCanvasSize;
const physicsCtx = physicsCanvas.getContext('2d');

// Step 3: Initialize Matter.js
const engine = Engine.create();
const world = engine.world;
const runner = Runner.create();

// Enable standard gravity so things fall "down" relative to the screen
engine.world.gravity.y = 1;

// Create a Rotating Container (Octagon)
const containerR = physicsCanvasSize * 0.45; // Radius of the octagon
const sideCount = 3;
const wallThick = 1;
const wallLen = 2 * containerR * Math.tan(Math.PI / sideCount) + 10; // Slightly overlapping
const center = { x: physicsCanvasSize / 2, y: physicsCanvasSize / 2 };

const walls = [];
for (let i = 0; i < sideCount; i++) {
    const angle = (Math.PI * 2 / sideCount) * i;
    const x = center.x + Math.cos(angle) * containerR;
    const y = center.y + Math.sin(angle) * containerR;

    const wall = Bodies.rectangle(x, y, wallThick, wallLen, {
        isStatic: true,
        angle: angle,
        friction: 1,
        restitution: 0.2
    });
    walls.push(wall);
}

const container = Matter.Composite.create();
Matter.Composite.add(container, walls);
World.add(world, container);

// Rotate the container before every physics update
Matter.Events.on(engine, 'beforeUpdate', () => {
    Matter.Composite.rotate(container, 0.005, center);
});

// Step 4: Add tumbling bodies (The "Laundry")
const colors = ['#FFC107', '#E91E63', '#2196F3', '#4CAF50', '#9C27B0', '#00BCD4'];

for (let i = 0; i < 30; i++) {
    const x = center.x + (Math.random() - 0.5) * 50;
    const y = center.y + (Math.random() - 0.5) * 50;
    const size = Math.random() * 35 + 20;
    const color = colors[i % colors.length];

    const bodyOptions = {
        friction: 1.0,
        frictionAir: 0.2,
        restitution: 0.5,
        render: { fillStyle: color }
    };

    let body = Bodies.polygon(x, y, Math.floor(Math.random() * 4) + 5, size, bodyOptions);

    World.add(world, body);
}

// Step 5: custom rendering
// We removed Matter.Render. Now we draw manually.

Runner.run(runner, engine);

// Step 6 & 7 & 8: Full Screen Tiling (BFS)

// Geometry for Equilateral Triangle
const triSize = 400;
const h = triSize * (Math.sqrt(3) / 2);
const r = h / 3; // Apothem
const sideAngles = [Math.PI / 2, 7 * Math.PI / 6, 11 * Math.PI / 6];

let renderList = []; // Array of DOMMatrix

// Pre-calculate the transformation matrices for all tiles covering the screen
function generateTiling() {
    renderList = [];
    const queue = [];
    const visited = new Set();

    // Screen bounds for culling
    const maxDist = Math.sqrt(mainCanvas.width ** 2 + mainCanvas.height ** 2) / 2 + triSize;
    const centerX = mainCanvas.width / 2;
    const centerY = mainCanvas.height / 2;

    // Helper: Generate Key for Visited Set (Integer coordinates to avoid float precision issues)
    const getKey = (point) => `${Math.round(point.x)},${Math.round(point.y)}`;

    // Initial Triangle (Center)
    // We start with a matrix centered such that the Bottom-Left vertex is at the screen center
    // Centroid is at (centerX + triSize/2, centerY - h/3)
    const startMatrix = new DOMMatrix().translate(centerX + triSize / 2, centerY - h / 3);

    queue.push(startMatrix);
    visited.add(getKey({ x: centerX, y: centerY }));

    let safety = 0;
    while (queue.length > 0 && safety < 5000) { // Safety break just in case
        safety++;
        const currentMatrix = queue.shift();
        renderList.push(currentMatrix);

        // Try to expand to neighbors
        for (const angle of sideAngles) {
            // Local Reflection Matrix for this side
            // 1. Move to edge (Ex, Ey)
            const ex = Math.cos(angle) * r;
            const ey = Math.sin(angle) * r;

            // Matrix: T(Ex,Ey) * R(a) * S(-1,1) * R(-a) * T(-Ex,-Ey)
            const nextMatrix = currentMatrix.translate(ex, ey)
                .rotate(angle * 180 / Math.PI)
                .scale(-1, 1)
                .rotate(-angle * 180 / Math.PI)
                .translate(-ex, -ey);

            // Check position
            const p = nextMatrix.transformPoint(new DOMPoint(0, 0));

            // Check bounds
            const dist = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
            if (dist > maxDist) continue;

            // Check visited
            const key = getKey(p);
            if (!visited.has(key)) {
                visited.add(key);
                queue.push(nextMatrix);
            }
        }
    }
    console.log(`Generated ${renderList.length} tiles`);
}

// Helper drawing function
const drawTriangleClipped = () => {
    ctx.beginPath();
    ctx.moveTo(0, -h * 2 / 3);             // Top vertex
    ctx.lineTo(-triSize / 2, h * 1 / 3);     // Bottom Left
    ctx.lineTo(triSize / 2, h * 1 / 3);      // Bottom Right
    ctx.closePath();

    // Stroke
    // ctx.lineWidth = 1;
    // ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    // ctx.stroke();

    ctx.clip();

    // Draw texture centered
    ctx.drawImage(physicsCanvas, -physicsCanvasSize / 2, -physicsCanvasSize / 2);
};

// Generate initial tiling
generateTiling();
window.addEventListener('resize', generateTiling);

function animate() {
    // 1. Offscreen Render
    physicsCtx.fillStyle = '#111';
    physicsCtx.fillRect(0, 0, physicsCanvasSize, physicsCanvasSize);

    const bodies = Matter.Composite.allBodies(engine.world);
    physicsCtx.beginPath();
    for (const body of bodies) {
        if (body.render.visible === false) continue;
        const vertices = body.vertices;
        physicsCtx.beginPath();
        physicsCtx.moveTo(vertices[0].x, vertices[0].y);
        for (let j = 1; j < vertices.length; j++) physicsCtx.lineTo(vertices[j].x, vertices[j].y);
        physicsCtx.closePath();
        physicsCtx.fillStyle = body.render.fillStyle || '#FFF';
        physicsCtx.fill();
        physicsCtx.lineWidth = 1;
        physicsCtx.strokeStyle = 'rgba(0,0,0,0.5)';
        physicsCtx.stroke();
    }

    // 2. Optics Loop: Render List
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

    for (const matrix of renderList) {
        ctx.save();
        ctx.setTransform(matrix); // Apply the pre-calculated matrix
        ctx.scale(1.005, 1.005);  // Slight overlap to fix seams
        drawTriangleClipped();
        ctx.restore();
    }

    requestAnimationFrame(animate);
}
animate();

console.log('Matter.js and canvases initialized!');
