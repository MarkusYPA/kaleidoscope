import { initPhysics } from './src/physics.js';
import { generateTiling } from './src/tiling.js';
import { startAnimationLoop } from './src/rendering.js';
import { initUI } from './src/ui.js';

// --- Setup ---

const mainCanvas = document.getElementById('kaleidoscopeCanvas');

// Create the offscreen canvas for physics rendering
const physicsCanvasSize = 512;
const physicsCanvas = document.createElement('canvas');
physicsCanvas.width = physicsCanvasSize;
physicsCanvas.height = physicsCanvasSize;

// --- Initialization ---

// 1. Initialize Physics
let rotationSpeed = 0;
let globalRotationSpeed = 0;
const { engine, setRotationSpeed } = initPhysics(physicsCanvasSize);

// 2. Initialize UI
initUI(
    engine,
    (speed) => { rotationSpeed = speed; setRotationSpeed(speed); },
    (speed) => { globalRotationSpeed = speed; }
);

// 3. Generate Tiling
let renderList = [];
function updateTiling() {
    mainCanvas.width = window.innerWidth;
    mainCanvas.height = window.innerHeight;
    renderList = generateTiling(mainCanvas.width, mainCanvas.height);
}
updateTiling(); // Initial generation

// 4. Start Animation
startAnimationLoop({
    mainCanvas,
    physicsCanvas,
    engine,
    getRenderList: () => renderList,
    getRotationSpeed: () => globalRotationSpeed
});

// --- Event Listeners ---

window.addEventListener('resize', updateTiling);

console.log('Kaleidoscope initialized!');
