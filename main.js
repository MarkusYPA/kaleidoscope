import { initPhysics } from './src/physics.js';
import { generateTiling } from './src/tiling.js';
import { startAnimationLoop } from './src/rendering.js';
import { initUI } from './src/ui.js';

// --- Setup ---

const mainCanvas = document.getElementById('kaleidoscopeCanvas');

// Create the offscreen canvas for physics rendering
const physicsCanvasSize = 512;
const physicsResolution = 1536; // 3x logical size for sharpness
const physicsCanvas = document.createElement('canvas');
physicsCanvas.width = physicsResolution;
physicsCanvas.height = physicsResolution;

// --- Initialization ---

// 1. Initialize Physics
let rotationSpeed = 0;
let globalRotationSpeed = 0;
let colorSpeed = 0.2;
let zoom = 1.0;
const baseTriSize = 400;

const { engine, setRotationSpeed } = initPhysics(physicsCanvasSize);

// 2. Generate Tiling
let renderList = [];
function updateTiling() {
    const dpr = window.devicePixelRatio || 1;
    mainCanvas.width = window.innerWidth * dpr;
    mainCanvas.height = window.innerHeight * dpr;
    mainCanvas.style.width = `${window.innerWidth}px`;
    mainCanvas.style.height = `${window.innerHeight}px`;

    // The tiling matrices are calculated in logical coordinates, 
    // but the canvas is now scaled by DPR.
    renderList = generateTiling(window.innerWidth, window.innerHeight, baseTriSize * zoom);
}

// 3. Initialize UI
initUI(
    engine,
    (speed) => { rotationSpeed = speed; setRotationSpeed(speed); },
    (speed) => { globalRotationSpeed = speed; },
    (speed) => { colorSpeed = speed; },
    (z) => { zoom = z; updateTiling(); }
);

updateTiling(); // Initial generation

// 4. Start Animation
startAnimationLoop({
    mainCanvas,
    physicsCanvas,
    physicsCanvasSize,
    engine,
    getRenderList: () => renderList,
    getRotationSpeed: () => globalRotationSpeed,
    getColorSpeed: () => colorSpeed,
    getZoom: () => zoom
});

// --- Event Listeners ---

window.addEventListener('resize', updateTiling);

console.log('Kaleidoscope initialized!');
