import Matter from 'matter-js';
import { generatePalette } from './color.js';

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

export function initUI(engine, setRotationSpeed, setGlobalRotationSpeed, setColorSpeed, setZoom) {
    const colorButton = document.getElementById('colorButton');
    if (colorButton) {
        colorButton.addEventListener('click', () => {
            changeBodyColors(engine);
        });
    }

    const rotationSpeedSlider = document.getElementById('rotationSpeed');
    const rotationSpeedValue = document.getElementById('rotationSpeedValue');
    if (rotationSpeedSlider) {
        // Set initial value and update physics
        rotationSpeedSlider.value = "0.0015";
        const val = parseFloat(rotationSpeedSlider.value);
        setRotationSpeed(val);
        if (rotationSpeedValue) rotationSpeedValue.textContent = val.toFixed(4);

        rotationSpeedSlider.addEventListener('input', (event) => {
            const val = parseFloat(event.target.value);
            setRotationSpeed(val);
            if (rotationSpeedValue) rotationSpeedValue.textContent = val.toFixed(4);
        });
    }

    const globalRotationSlider = document.getElementById('globalRotationSpeed');
    const globalRotationSpeedValue = document.getElementById('globalRotationSpeedValue');
    if (globalRotationSlider) {
        // Set initial value
        globalRotationSlider.value = "0.0005";
        const val = parseFloat(globalRotationSlider.value);
        setGlobalRotationSpeed(val);
        if (globalRotationSpeedValue) globalRotationSpeedValue.textContent = val.toFixed(4);

        globalRotationSlider.addEventListener('input', (event) => {
            const val = parseFloat(event.target.value);
            setGlobalRotationSpeed(val);
            if (globalRotationSpeedValue) globalRotationSpeedValue.textContent = val.toFixed(4);
        });
    }

    const colorSpeedSlider = document.getElementById('colorSpeed');
    const colorSpeedValue = document.getElementById('colorSpeedValue');
    if (colorSpeedSlider) {
        // Set initial value
        colorSpeedSlider.value = "0.2";
        const val = parseFloat(colorSpeedSlider.value);
        setColorSpeed(val);
        if (colorSpeedValue) colorSpeedValue.textContent = val.toFixed(2);

        colorSpeedSlider.addEventListener('input', (event) => {
            const val = parseFloat(event.target.value);
            setColorSpeed(val);
            if (colorSpeedValue) colorSpeedValue.textContent = val.toFixed(2);
        });
    }

    const zoomSlider = document.getElementById('zoom');
    const zoomValue = document.getElementById('zoomValue');
    if (zoomSlider) {
        // Set initial value
        zoomSlider.value = "1.0";
        const val = parseFloat(zoomSlider.value);
        setZoom(val);
        if (zoomValue) zoomValue.textContent = val.toFixed(2) + "x";

        zoomSlider.addEventListener('input', (event) => {
            const val = parseFloat(event.target.value);
            setZoom(val);
            if (zoomValue) zoomValue.textContent = val.toFixed(2) + "x";
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
