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

// Add some "laundry" items to demonstrate the tumbling (Step 4 preview)
// We add these now because an empty rotating box doesn't look like much!
for (let i = 0; i < 20; i++) {
    World.add(world, Bodies.polygon(
        center.x + (Math.random() - 0.5) * 100,
        center.y + (Math.random() - 0.5) * 100,
        Math.floor(Math.random() * 5) + 3, // 3 to 8 sides
        Math.random() * 20 + 10,           // size
        {
            render: { fillStyle: ['#FFC107', '#E91E63', '#2196F3', '#4CAF50'][i % 4] }
        }
    ));
}

// Use Matter.Render to draw onto your offscreen canvas (temporary for quick testing)
const matterRender = Render.create({
    canvas: physicsCanvas,
    engine: engine,
    options: {
        width: physicsCanvasSize,
        height: physicsCanvasSize,
        wireframes: false, // Set to false to see colors
        background: '#ffffff'
    }
});
Render.run(matterRender);

// Run the engine
Runner.run(runner, engine);

// For now, let's just draw the physics canvas to the main canvas to see if it works
function animate() {
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    ctx.drawImage(physicsCanvas, 0, 0, mainCanvas.width, mainCanvas.height);
    requestAnimationFrame(animate);
}
animate();

console.log('Matter.js and canvases initialized!');
