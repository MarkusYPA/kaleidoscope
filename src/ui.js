import Matter from 'matter-js';
import { hslToHex } from './color.js';

function getRandomBrightColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.random() * 30; // 70-100%
    const lightness = 40 + Math.random() * 20;  // 40-60%
    return hslToHex(hue, saturation, lightness);
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
        const newColor = newColors[colorIndex % newColors.length];
        body.render.fillStyle = newColor;
        body.render.originalFillStyle = newColor; // Update originalFillStyle
        colorIndex++;
    }
}

export function initUI(engine, setRotationSpeed) {
    const colorButton = document.getElementById('colorButton');
    if (colorButton) {
        colorButton.addEventListener('click', () => {
            changeBodyColors(engine);
        });
    }

    const rotationSpeedSlider = document.getElementById('rotationSpeed');
    if (rotationSpeedSlider) {
        // Set initial value and update physics
        rotationSpeedSlider.value = "0.0015";
        setRotationSpeed(parseFloat(rotationSpeedSlider.value));

        rotationSpeedSlider.addEventListener('input', (event) => {
            setRotationSpeed(parseFloat(event.target.value));
        });
    }
}
