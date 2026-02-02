import Matter from 'matter-js';
import { generatePalette } from './color.js';

export function initPhysics(physicsCanvasSize) {
    const { Engine, Runner, World, Bodies } = Matter;

    // Initialize Matter.js
    const engine = Engine.create();
    const world = engine.world;
    const runner = Runner.create();

    // Enable standard gravity
    engine.gravity.y = 0.4;

    // Create a Rotating Container
    const containerR = physicsCanvasSize * 0.45;
    const sideCount = 3;
    const wallThick = 1;
    const wallLen = 2 * containerR * Math.tan(Math.PI / sideCount) + 10;
    const center = { x: physicsCanvasSize / 2, y: physicsCanvasSize / 2 };

    // Collision Categories
    const CAT_WALL = 0x0001;
    const CAT_LAYER_BACK = 0x0002;
    const CAT_LAYER_FRONT = 0x0004;

    const walls = [];
    for (let i = 0; i < sideCount; i++) {
        const angle = (Math.PI * 2 / sideCount) * i;
        const x = center.x + Math.cos(angle) * containerR;
        const y = center.y + Math.sin(angle) * containerR;

        const wall = Bodies.rectangle(x, y, wallThick, wallLen, {
            isStatic: true,
            angle: angle,
            friction: 1,
            restitution: 0.0,
            collisionFilter: {
                category: CAT_WALL
            }
        });
        walls.push(wall);
    }

    let currentRotationSpeed = 0.0;

    const container = Matter.Composite.create();
    Matter.Composite.add(container, walls);
    World.add(world, container);

    // Rotate the container
    Matter.Events.on(engine, 'beforeUpdate', () => {
        if (currentRotationSpeed !== 0) {
            Matter.Composite.rotate(container, currentRotationSpeed, center);
        }
    });

    // Add tumbling bodies in two layers
    const backPalette = generatePalette(9);

    // Layer 0 (Back)
    for (let i = 0; i < 30; i++) {
        const x = center.x + (Math.random() - 0.5) * 100;
        const y = center.y + (Math.random() - 0.5) * 100;
        const size = Math.random() * 35 + 20;
        const color = backPalette[i % backPalette.length];
        const bodyOptions = {
            friction: 1.0,
            frictionAir: 0.1,
            restitution: 0.0,
            render: { fillStyle: color, layer: 0 },
            collisionFilter: {
                category: CAT_LAYER_BACK,
                mask: CAT_WALL | CAT_LAYER_BACK // Only collide with walls and its own layer
            }
        };
        let body = Bodies.polygon(x, y, Math.floor(Math.random() * 4) + 5, size, bodyOptions);
        World.add(world, body);
    }

    const frontPalette = generatePalette(6);

    // Layer 1 (Front)
    for (let i = 0; i < 20; i++) {
        const x = center.x + (Math.random() - 0.5) * 100;
        const y = center.y + (Math.random() - 0.5) * 100;
        const size = Math.random() * 30 + 20;
        const color = frontPalette[i % frontPalette.length];
        const bodyOptions = {
            friction: 1.0,
            frictionAir: 0.1,
            restitution: 0.0,
            render: { fillStyle: color, layer: 1 },
            collisionFilter: {
                category: CAT_LAYER_FRONT,
                mask: CAT_WALL | CAT_LAYER_FRONT // Only collide with walls and its own layer
            }
        };
        let body = Bodies.polygon(x, y, Math.floor(Math.random() * 4) + 5, size, bodyOptions);
        World.add(world, body);
    }

    // Start the physics engine
    Runner.run(runner, engine);

    function setRotationSpeed(speed) {
        currentRotationSpeed = speed;
    }

    return { engine, setRotationSpeed };
}
