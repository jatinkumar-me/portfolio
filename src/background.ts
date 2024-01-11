import * as THREE from 'three';
import { BokehPass, EffectComposer, OutputPass, RenderPass } from 'three/examples/jsm/Addons.js';

type ColorScheme = {
    background: THREE.Color;
    foreground: THREE.Color;
}

const SEPARATION = 70, AMOUNTX = 50, AMOUNTY = 50;
const isAnimate = true;

const LIGHT_THEME_COLORS: ColorScheme = {
    background: new THREE.Color(0xffffff),
    foreground: new THREE.Color(0xededed),
}

const DARK_THEME_COLORS: ColorScheme = {
    background: new THREE.Color(0x1c1c1c),
    foreground: new THREE.Color(0x2b2b2b),
}

let colorScheme: ColorScheme = LIGHT_THEME_COLORS;

let container: HTMLElement | null;
let camera: THREE.PerspectiveCamera, scene: THREE.Scene, renderer: THREE.WebGLRenderer;

let particles: THREE.Points, count = 0;

let mouseX = 0, mouseY = -240;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

type Postprocessing = {
    bokeh?: BokehPass,
    composer?: EffectComposer
};

let postprocessing: Postprocessing = {};

init();
animate();

function changeColorMode(newColorScheme: ColorScheme) {
    /* 
     * Yes, we are creating a new web GL context every time the theme is changed, 
     * currently there is no way to destroy a created web-gl context, 
     * we have to trust the garbage collector to clear it for us.
     * */    
    colorScheme = newColorScheme;
    init();
}

function init() {
    container = document.getElementById('canvas-container');
    if (container) {
        container.remove();
    }
    container = document.createElement('div');
    container.id = 'canvas-container';
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 1000;

    scene = new THREE.Scene();
    scene.background = colorScheme.background;

    const numParticles = AMOUNTX * AMOUNTY;

    const positions = new Float32Array(numParticles * 3);
    const scales = new Float32Array(numParticles);

    let i = 0, j = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
            positions[i] = ix * SEPARATION - ((AMOUNTX * SEPARATION) / 2); // x
            positions[i + 1] = 0; // y
            positions[i + 2] = iy * SEPARATION - ((AMOUNTY * SEPARATION) / 2); // z

            scales[j] = 1;

            i += 3;
            j++;
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const vertexShader = document.getElementById('vertexshader');
    const fragmentShader = document.getElementById('fragmentshader');

    if (!vertexShader?.textContent || !fragmentShader?.textContent) {
        console.error('Error loading shaders');
        return;
    }
    const material = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: colorScheme.foreground },
        },
        vertexShader: vertexShader.textContent,
        fragmentShader: fragmentShader.textContent,
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    // renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    renderer.domElement.classList.add('background-canvas');

    initPostprocessing();

    container.style.touchAction = 'none';
    window.addEventListener('pointermove', onPointerMove);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    postprocessing.composer?.setSize(window.innerWidth, window.innerHeight);
}

function onPointerMove(event: PointerEvent) {
    if (event.isPrimary === false) return;
    mouseX = event.clientX - windowHalfX;
    // mouseY = event.clientY - windowHalfY;
}

function animate() {
    if (!isAnimate) {
        return;
    }
    requestAnimationFrame(animate);
    render();
}

function initPostprocessing() {
    const renderPass = new RenderPass(scene, camera);

    const bokehPass = new BokehPass(scene, camera, {
        focus: 1800,
        aperture: 0.3 * 0.00001,
        maxblur: 0.02
    });

    const outputPass = new OutputPass();

    const composer = new EffectComposer(renderer);

    composer.addPass(renderPass);
    composer.addPass(bokehPass);
    composer.addPass(outputPass);

    postprocessing.composer = composer;
    postprocessing.bokeh = bokehPass;
}

function render() {
    camera.position.x += (mouseX - camera.position.x) * .05;
    camera.position.y += (- mouseY - camera.position.y) * .05;
    camera.lookAt(scene.position);

    const positions = particles.geometry.attributes.position.array;
    const scales = particles.geometry.attributes.scale.array;

    let i = 0, j = 0;

    for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
            positions[i + 1] = (Math.sin((ix + count) * 0.3) * 50) +
                (Math.sin((iy + count) * 0.5) * 50);

            scales[j] = (Math.sin((ix + count) * 0.3) + 1) * 20 +
                (Math.sin((iy + count) * 0.5) + 1) * 20;
            i += 3;
            j++;
        }
    }

    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.scale.needsUpdate = true;

    // renderer.render(scene, camera);
    postprocessing.composer?.render(0.1);

    count += 0.05;
}

//Dark mode button.
const darkmodeToggleButton = document.getElementById('darkmode-toggle-button') as HTMLButtonElement;

darkmodeToggleButton.addEventListener('click', () => {
    const body = document.body;
    const isDarkMode = body.classList.contains('darkmode');
    body.classList.toggle('darkmode');

    if (isDarkMode) {
        changeColorMode(LIGHT_THEME_COLORS);
    } else {
        changeColorMode(DARK_THEME_COLORS);
    }
})
