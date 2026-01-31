// Step 1: Project setup
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

for (let i = 0; i < 25; i++) {
    const x = center.x + (Math.random() - 0.5) * 50;
    const y = center.y + (Math.random() - 0.5) * 50;
    const size = Math.random() * 40 + 15;
    const color = colors[i % colors.length];

    const bodyOptions = {
        friction: 1.0,
        frictionAir: 0.2,
        restitution: 0.5,
        render: { fillStyle: color }
    };

    let body = Bodies.polygon(x, y, Math.floor(Math.random() * 4) + 4, size, bodyOptions);

    World.add(world, body);
}

// Step 5: custom rendering
// We removed Matter.Render. Now we draw manually.

Runner.run(runner, engine);

// Step 6 & 7: The Kaleidoscope Optics
const slices = 12;
const anglePerSlice = (Math.PI * 2) / slices;

function animate() {
    // 1. Offscreen Render: Draw the physics world to the physics canvas
    // Clear with dark "inside machine" color
    physicsCtx.fillStyle = '#111';
    physicsCtx.fillRect(0, 0, physicsCanvasSize, physicsCanvasSize);

    // Draw bodies
    const bodies = Matter.Composite.allBodies(engine.world);

    physicsCtx.beginPath();
    for (const body of bodies) {
        if (body.render.visible === false) continue;

        const vertices = body.vertices;
        physicsCtx.beginPath();
        physicsCtx.moveTo(vertices[0].x, vertices[0].y);
        for (let j = 1; j < vertices.length; j += 1) {
            physicsCtx.lineTo(vertices[j].x, vertices[j].y);
        }
        physicsCtx.closePath();

        physicsCtx.fillStyle = body.render.fillStyle || '#FFF';
        physicsCtx.fill();
        // Optional: Add stroke for definition
        physicsCtx.lineWidth = 1;
        physicsCtx.strokeStyle = 'rgba(0,0,0,0.5)';
        physicsCtx.stroke();
    }

    // 2. Optics Loop: Tiled Triangle View
    // Clear main canvas
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

    const cx = mainCanvas.width / 2;
    const cy = mainCanvas.height / 2;
    const triSize = 400;
    const h = triSize * (Math.sqrt(3) / 2);
    const r = h / 3; // Apothem (distance from center to midpoint of side)

    // Helper to draw one triangle
    const drawTriangleClipped = () => {
        ctx.beginPath();
        ctx.moveTo(0, -h * 2 / 3);             // Top vertex
        ctx.lineTo(-triSize / 2, h * 1 / 3);     // Bottom Left
        ctx.lineTo(triSize / 2, h * 1 / 3);      // Bottom Right
        ctx.closePath();

        // Stroke
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#FFF';
        ctx.stroke();

        ctx.clip();

        // Draw texture centered
        ctx.drawImage(physicsCanvas, -physicsCanvasSize / 2, -physicsCanvasSize / 2);
    };

    // 1. Draw Center Triangle
    ctx.save();
    ctx.translate(cx, cy);
    drawTriangleClipped();
    ctx.restore();

    // 2. Draw 3 Mirrored Neighbors
    // Angles of the sides (normals pointing out):
    // Bottom: 90 deg (PI/2)
    // Left: 210 deg (7PI/6)
    // Right: 330 deg (11PI/6)
    const sideAngles = [Math.PI / 2, 7 * Math.PI / 6, 11 * Math.PI / 6];

    for (const angle of sideAngles) {
        ctx.save();
        ctx.translate(cx, cy);

        // Rotate so the target side is pointing UP (or defined direction)
        // Let's rotate by the angle. 
        // At angle 0, vector is (1,0). At PI/2, vector is (0,1) (Down).
        // Our apothem vector P is (cos(angle)*r, sin(angle)*r).

        // Move to the edge center
        ctx.translate(Math.cos(angle) * r, Math.sin(angle) * r);

        // We want to mirror across the line perpendicular to this normal.
        // The normal angle is `angle`. The tangent (edge) angle is `angle + PI/2`.
        // Rotate so the normal is along Y axis?
        ctx.rotate(angle - Math.PI / 2);

        // Now normal is pointing Down (+Y). Edge is Horizontal.
        // Mirror vertically.
        ctx.scale(1, -1);

        // Now we are in mirrored space. We need to move "back" by r so that the triangle center (0,0) 
        // lands in the correct spot relative to the edge.
        // Wait, we are at the edge. The new triangle center should be r units away along the normal.
        // Normalized normal is (0,1) in this rotated space.
        // So we translate (0, r).
        // BUT we scaled Y by -1. So +Y is "Up" visually.
        // If we want to move "away" from the edge (which is at Y=0), we move to Y = r?
        // Let's try drawing at (0, -r) because we want it to be "connected" at the base.
        // Base of standard triangle is at Y = r (h/3).
        // If we draw at (0,0), the base is at r.
        // If we mirror at edge (Y=rs), and base is at Y=r, they coincide.
        // So... we just draw?
        // Let's test: Start at Center. Move to Edge (0, r). Rotate. Scale(1,-1). 
        // Logic: The "Base" of the standard triangle (drawn by drawTriangleClipped) is at y = h/3 = r.
        // So if we are at the edge, and we scale(1,-1), Y becomes -Y.
        // The point y=r becomes y=-r.
        // We want the base to stay at the edge (y=0 in local edge coords).
        // So we need to translate by -r before flipping?

        // SIMPLER LOGIC:
        // 1. Go to edge center.
        // 2. Rotate so edge is horizontal. 
        // 3. Scale(1, -1). 
        // 4. Move "back" so the base aligns with the edge.
        // Standard base is at y = r. We want base at y = 0. So translate(0, -r).
        // So: translate(0, -r) -> scale(1,-1) -> draw.
        // Let's verify: 
        // Point on base (x, r). Translate -> (x, 0). Scale -> (x, 0). 
        // It stays at 0 (the edge).
        // Point at tip (0, -2r). Translate -> (0, -3r). Scale -> (0, 3r). 
        // So tip ends up at 3r away. Correct direction.

        ctx.translate(0, -r);
        drawTriangleClipped();

        ctx.restore();
    }

    requestAnimationFrame(animate);
}
animate();

console.log('Matter.js and canvases initialized!');
