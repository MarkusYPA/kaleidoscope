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

// Create a Rotating Container
const containerSize = physicsCanvasSize * 0.8; // Make it a bit smaller than canvas to rotate freely
const wallThickness = 50;
const center = { x: physicsCanvasSize / 2, y: physicsCanvasSize / 2 };

// Helper to make a wall
const createWall = (x, y, w, h) => {
    return Bodies.rectangle(x, y, w, h, {
        isStatic: true,
        friction: 1,      // High friction to "grab" items
        restitution: 0.2  // Not too bouncy
    });
};

const walls = [
    // Top
    createWall(center.x, center.y - containerSize / 2, containerSize, wallThickness),
    // Bottom
    createWall(center.x, center.y + containerSize / 2, containerSize, wallThickness),
    // Left
    createWall(center.x - containerSize / 2, center.y, wallThickness, containerSize),
    // Right
    createWall(center.x + containerSize / 2, center.y, wallThickness, containerSize)
];

const container = Matter.Composite.create();
Matter.Composite.add(container, walls);
World.add(world, container);

// Rotate the container before every physics update
Matter.Events.on(engine, 'beforeUpdate', () => {
    Matter.Composite.rotate(container, 0.002, center); // Rotate x radians per tick
});

// Step 4: Add tumbling bodies (The "Laundry")
const colors = ['#FFC107', '#E91E63', '#2196F3', '#4CAF50', '#9C27B0', '#00BCD4'];

for (let i = 0; i < 30; i++) {
    const isCircle = Math.random() > 0.5;
    const x = center.x + (Math.random() - 0.5) * 100;
    const y = center.y + (Math.random() - 0.5) * 100;
    const size = Math.random() * 20 + 10;
    const color = colors[i % colors.length];

    const bodyOptions = {
        friction: 0.05,
        frictionAir: 0.01,
        restitution: 0.8, // Bouncy!
        render: { fillStyle: color } // We'll use this custom property in our render loop
    };

    let body;
    if (isCircle) {
        body = Bodies.circle(x, y, size / 2, bodyOptions);
    } else {
        body = Bodies.polygon(x, y, Math.floor(Math.random() * 4) + 3, size, bodyOptions);
    }

    World.add(world, body);
}

// Step 5: custom rendering
// We removed Matter.Render. Now we draw manually.

Runner.run(runner, engine);

function animate() {
    // 1. Clear the physics canvas (the "texture")
    physicsCtx.fillStyle = '#111'; // Dark background for the inside of the machine
    physicsCtx.fillRect(0, 0, physicsCanvasSize, physicsCanvasSize);

    // 2. Draw all bodies onto the physics canvas
    const bodies = Matter.Composite.allBodies(engine.world);

    physicsCtx.beginPath();
    for (let body of bodies) {
        if (body.render.visible === false) continue;

        // Handle vertices
        const vertices = body.vertices;
        physicsCtx.beginPath();
        physicsCtx.moveTo(vertices[0].x, vertices[0].y);
        for (let j = 1; j < vertices.length; j += 1) {
            physicsCtx.lineTo(vertices[j].x, vertices[j].y);
        }
        physicsCtx.lineTo(vertices[0].x, vertices[0].y);

        // Styling
        physicsCtx.fillStyle = body.render.fillStyle || '#FFF';
        physicsCtx.fill();
        physicsCtx.lineWidth = 1;
        physicsCtx.strokeStyle = '#000';
        physicsCtx.stroke();
    }

    // 3. Draw the physics canvas to the main canvas (for debugging/visibility)
    // Later (Step 6), this will be clipped to a triangle.
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    // Draw it centered just to look nice
    const drawX = (mainCanvas.width - physicsCanvasSize) / 2;
    const drawY = (mainCanvas.height - physicsCanvasSize) / 2;

    ctx.drawImage(physicsCanvas, drawX, drawY);

    requestAnimationFrame(animate);
}
animate();

console.log('Matter.js and canvases initialized!');
