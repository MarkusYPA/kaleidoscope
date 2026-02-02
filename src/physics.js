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

    function repopulateBodies(fullness = 0.3, sizeScale = 1.0) {
        // --- TUNING PARAMETERS ---
        // Increase this to make the container "fuller" overall. 
        // If 1.0 on the slider was the "minimum", setting this to 5-8 will make it much denser.
        const FULLNESS_MULTIPLIER = 10.0;

        // Adjusts how steeply the count grows as particle size decreases.
        // 1.0 = standard area scaling (N proportional to 1/R^2).
        // Higher values (e.g. 1.2, 1.5) make the count explode faster when particles are small.
        const SIZE_STEEPNESS = 1.7;

        // Ratios and scaling for layers
        const backAreaRatio = 0.6;
        const frontAreaRatio = 0.4;
        const backRadiusScaling = 1.1;
        const frontRadiusScaling = 0.9;
        // -------------------------

        // Remove existing non-static bodies
        const bodies = Matter.Composite.allBodies(world);
        const toRemove = bodies.filter(b => !b.isStatic);
        World.remove(world, toRemove);

        const baseSize = 30;
        const containerArea = (3 * Math.sqrt(3) / 4) * (containerR * containerR); // ~68956
        const avgAreaFactor = 2.7; // A = factor * R^2 for polygons with 5-8 sides

        const R_back = baseSize * sizeScale * backRadiusScaling;
        const R_front = baseSize * sizeScale * frontRadiusScaling;

        // Use the steepness exponent to calculate counts
        // Standard area scaling is R^(-2). We use R^(-2 * SIZE_STEEPNESS)
        const effectiveFullness = fullness * FULLNESS_MULTIPLIER;

        const N_back = Math.min(150, Math.floor(
            (backAreaRatio * effectiveFullness * containerArea) /
            (avgAreaFactor * Math.pow(R_back, 2 * SIZE_STEEPNESS) / Math.pow(baseSize, 2 * (SIZE_STEEPNESS - 1)))
        ) || 1);

        const N_front = Math.min(100, Math.floor(
            (frontAreaRatio * effectiveFullness * containerArea) /
            (avgAreaFactor * Math.pow(R_front, 2 * SIZE_STEEPNESS) / Math.pow(baseSize, 2 * (SIZE_STEEPNESS - 1)))
        ) || 1);

        console.log(`N_back: ${N_back}, N_front: ${N_front}`);
        console.log('fullness', fullness);

        const palette = generatePalette(8);

        // Add Back Layer
        for (let i = 0; i < N_back; i++) {
            const x = center.x + (Math.random() - 0.5) * 150;
            const y = center.y + (Math.random() - 0.5) * 150;
            const size = R_back * (0.8 + Math.random() * 0.4);
            const color = palette[i % palette.length];
            const bodyOptions = {
                friction: 1.0,
                frictionAir: 0.1,
                restitution: 0.0,
                render: { fillStyle: color, layer: 0 },
                collisionFilter: { category: CAT_LAYER_BACK, mask: CAT_WALL | CAT_LAYER_BACK }
            };
            const body = Bodies.polygon(x, y, Math.floor(Math.random() * 4) + 5, size, bodyOptions);
            World.add(world, body);
        }

        // Add Front Layer
        for (let i = 0; i < N_front; i++) {
            const x = center.x + (Math.random() - 0.5) * 150;
            const y = center.y + (Math.random() - 0.5) * 150;
            const size = R_front * (0.8 + Math.random() * 0.4);
            const color = palette[i % palette.length];
            const bodyOptions = {
                friction: 1.0,
                frictionAir: 0.1,
                restitution: 0.0,
                render: { fillStyle: color, layer: 1 },
                collisionFilter: { category: CAT_LAYER_FRONT, mask: CAT_WALL | CAT_LAYER_FRONT }
            };
            const body = Bodies.polygon(x, y, Math.floor(Math.random() * 4) + 5, size, bodyOptions);
            World.add(world, body);
        }
    }

    // Initial population
    repopulateBodies(0.3, 1.2);

    // Start the physics engine
    Runner.run(runner, engine);

    function setRotationSpeed(speed) {
        currentRotationSpeed = speed;
    }

    return { engine, setRotationSpeed, repopulateBodies };
}
