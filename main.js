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
const DEFAULT_ROTATION_SPEED = 0.0015;
const DEFAULT_GLOBAL_ROTATION_SPEED = 0.0005;
const DEFAULT_COLOR_SPEED = 0.2;
const DEFAULT_ZOOM = 1.0;
const DEFAULT_BG_H = 0;
const DEFAULT_BG_S = 0;
const DEFAULT_BG_L = 7;
const DEFAULT_BG_LOOP = false;

let rotationSpeed = DEFAULT_ROTATION_SPEED;
let globalRotationSpeed = DEFAULT_GLOBAL_ROTATION_SPEED;
let colorSpeed = DEFAULT_COLOR_SPEED;
let zoom = DEFAULT_ZOOM;
const baseTriSize = 400;

// Background State
let bgH = DEFAULT_BG_H;
let bgS = DEFAULT_BG_S;
let bgL = DEFAULT_BG_L;
let loopBg = DEFAULT_BG_LOOP;

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
    (z) => { zoom = z; updateTiling(); },
    {
        randomizeBackground: () => {
            bgH = Math.floor(Math.random() * 360);
            bgS = Math.floor(Math.random() * 50) + 20; // 20-70% saturation for background
        },
        setBgLightness: (l) => { bgL = l; },
        setBgLoop: (loop) => { loopBg = loop; },
        resetToDefaults: () => {
            rotationSpeed = DEFAULT_ROTATION_SPEED;
            setRotationSpeed(rotationSpeed);
            globalRotationSpeed = DEFAULT_GLOBAL_ROTATION_SPEED;
            colorSpeed = DEFAULT_COLOR_SPEED;
            zoom = DEFAULT_ZOOM;
            bgH = DEFAULT_BG_H;
            bgS = DEFAULT_BG_S;
            bgL = DEFAULT_BG_L;
            loopBg = DEFAULT_BG_LOOP;
            updateTiling();
            return {
                rotationSpeed,
                globalRotationSpeed,
                colorSpeed,
                zoom,
                bgL,
                loopBg
            };
        }
    }
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
    getZoom: () => zoom,
    getBackgroundColor: () => {
        return { h: bgH, s: bgS, l: bgL, loop: loopBg };
    }
});

// --- Event Listeners ---

window.addEventListener('resize', updateTiling);

console.log('Kaleidoscope initialized!');
