import Matter from 'matter-js';

function getRandomBrightColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.random() * 30; // 70-100%
    const lightness = 40 + Math.random() * 20;  // 40-60%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function changeBodyColors(engine) {
    const bodies = Matter.Composite.allBodies(engine.world);
    // Create a new color palette for this change
    const newColors = Array.from({ length: 6 }, getRandomBrightColor);

    let colorIndex = 0;
    for (const body of bodies) {
        // We only want to change the colors of the dynamic tumbling bodies, not the static walls
        if (body.isStatic) {
            continue;
        }
        body.render.fillStyle = newColors[colorIndex % newColors.length];
        colorIndex++;
    }
}

export function initUI(engine) {
    const colorButton = document.getElementById('colorButton');
    if (colorButton) {
        colorButton.addEventListener('click', () => {
            changeBodyColors(engine);
        });
    }
}
