import Matter from 'matter-js';
import { hslToHex, generatePalette } from './color.js';

function changeBodyColors(engine) {
    const bodies = Matter.Composite.allBodies(engine.world);
    // Create a new color palette for this change
    const newColors = generatePalette(9);

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

export function initUI(engine, setRotationSpeed, setGlobalRotationSpeed) {
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

    const globalRotationSlider = document.getElementById('globalRotationSpeed');
    if (globalRotationSlider) {
        // Set initial value
        globalRotationSlider.value = "0.0005";
        setGlobalRotationSpeed(parseFloat(globalRotationSlider.value));

        globalRotationSlider.addEventListener('input', (event) => {
            setGlobalRotationSpeed(parseFloat(event.target.value));
        });
    }

    // Visibility Toggle Logic
    const controls = document.getElementById('controls');
    if (controls) {
        window.addEventListener('click', (event) => {
            const isVisible = controls.classList.contains('visible');
            const clickedInside = controls.contains(event.target);

            if (!isVisible) {
                // If hidden, any click shows it
                controls.classList.add('visible');
            } else if (!clickedInside) {
                // If visible and clicked outside, hide it
                controls.classList.remove('visible');
            }
        });
    }
}
