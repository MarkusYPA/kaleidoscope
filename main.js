import { Engine, Render, Runner, World, Bodies } from 'matter-js';

// Step 1: Project setup
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

// Disable gravity or keep it light (experiment later)
engine.world.gravity.y = 0.1; // A light gravity for now

// Add four static walls forming a square boundary
const wallThickness = 50;
const halfSize = physicsCanvasSize / 2;

World.add(world, [
    // Top wall
    Bodies.rectangle(halfSize, 0 - wallThickness / 2, physicsCanvasSize + wallThickness * 2, wallThickness, { isStatic: true }),
    // Bottom wall
    Bodies.rectangle(halfSize, physicsCanvasSize + wallThickness / 2, physicsCanvasSize + wallThickness * 2, wallThickness, { isStatic: true }),
    // Left wall
    Bodies.rectangle(0 - wallThickness / 2, halfSize, wallThickness, physicsCanvasSize + wallThickness * 2, { isStatic: true }),
    // Right wall
    Bodies.rectangle(physicsCanvasSize + wallThickness / 2, halfSize, wallThickness, physicsCanvasSize + wallThickness * 2, { isStatic: true })
]);

// Use Matter.Render to draw onto your offscreen canvas (temporary for quick testing)
const matterRender = Render.create({
    canvas: physicsCanvas,
    engine: engine,
    options: {
        width: physicsCanvasSize,
        height: physicsCanvasSize,
        wireframes: false,
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
