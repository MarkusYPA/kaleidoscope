import Matter from 'matter-js';

export function initPhysics(physicsCanvasSize) {
    const { Engine, Runner, World, Bodies } = Matter;

    // Initialize Matter.js
    const engine = Engine.create();
    const world = engine.world;
    const runner = Runner.create();

    // Enable standard gravity
    engine.world.gravity.y = 0.6;

    // Create a Rotating Container
    const containerR = physicsCanvasSize * 0.45;
    const sideCount = 3;
    const wallThick = 1;
    const wallLen = 2 * containerR * Math.tan(Math.PI / sideCount) + 10;
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
            restitution: 0.0
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

    // Add tumbling bodies
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

    // Start the physics engine
    Runner.run(runner, engine);

    function setRotationSpeed(speed) {
        currentRotationSpeed = speed;
        console.log("Rotation speed:", speed)
    }

    return { engine, setRotationSpeed };
}
