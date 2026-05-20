import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { EvilBanana } from "./evilBanana.js";
import { AudioSystem } from "./audio.js";
import { MovementSystem } from "./movement.js";
import { UIManager } from "./ui.js";

const container = document.querySelector("#game");
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.append(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070a08);
scene.fog = new THREE.FogExp2(0x091017, 0.062);

const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.1, 80);
const controls = new PointerLockControls(camera, document.body);

const ui = new UIManager();
const audio = new AudioSystem();
const clock = new THREE.Clock();
ui.setMuteHandler((isMuted) => audio.setMuted(isMuted));

let score = 0;
let gameStarted = false;
let nearestJoke = null;

// World geometry and collision walls.
const walls = [];
const jokeNotes = [];
buildWorld();
const movement = new MovementSystem(camera, controls, walls);
const evilBanana = new EvilBanana(scene);

// Major lighting system: dim moonlight, blue ambience, red warning flicker, and banana glow.
const ambientLight = new THREE.AmbientLight(0x263a58, 0.22);
scene.add(ambientLight);
const moon = new THREE.DirectionalLight(0x9ebdff, 0.48);
moon.position.set(-10, 14, 7);
moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 38;
scene.add(moon);
const flickerLights = createFlickerLights();

ui.playButton.addEventListener("click", async () => {
  gameStarted = true;
  ui.showStartMenu(false);
  ui.showPointerOverlay(true);
  ui.setScore(score);
  await audio.start();
});

ui.pointerOverlay.addEventListener("click", async () => {
  await audio.start();
  controls.lock();
});

controls.addEventListener("lock", () => ui.showPointerOverlay(false));
controls.addEventListener("unlock", () => {
  if (gameStarted) ui.showPointerOverlay(true);
});

window.addEventListener("keydown", (event) => {
  if (event.code === "KeyE" && nearestJoke) collectJoke(nearestJoke);
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  updateLights(elapsed, delta);
  if (gameStarted && controls.isLocked) {
    const movementState = movement.update(delta);
    const monsterDistance = evilBanana.update(delta, camera.position);
    audio.update(delta, monsterDistance);
    ui.setStamina(movementState.stamina);
    ui.setProximity(monsterDistance);
    updateJokeInteractions();

    if (evilBanana.canTouch(monsterDistance)) handleBananaTouch();
  }

  renderer.render(scene, camera);
}

function buildWorld() {
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x171d1f, roughness: 0.94 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(42, 42), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x222b31, roughness: 0.88 });
  addWall(0, -20, 40, 1, wallMaterial);
  addWall(0, 20, 40, 1, wallMaterial);
  addWall(-20, 0, 1, 40, wallMaterial);
  addWall(20, 0, 1, 40, wallMaterial);
  addWall(-7, 2, 1.2, 16, wallMaterial);
  addWall(8, -3, 1.2, 15, wallMaterial);
  addWall(0, -8, 16, 1.2, wallMaterial);
  addWall(5, 9, 15, 1.2, wallMaterial);
  addWall(-13, -10, 6, 1.2, wallMaterial);

  const noteMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff3a6,
    emissive: 0x554400,
    emissiveIntensity: 0.2
  });
  [
    [-13, 0],
    [12, 8],
    [2, -14],
    [14, -12]
  ].forEach(([x, z], index) => {
    const note = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.62), noteMaterial);
    note.position.set(x, 0.08, z);
    note.rotation.y = index * 0.75;
    note.userData.index = index;
    scene.add(note);
    jokeNotes.push(note);
  });
}

function addWall(x, z, width, depth, material) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, 3.2, depth), material);
  wall.position.set(x, 1.6, z);
  wall.userData.bounds = { width, depth };
  wall.receiveShadow = true;
  scene.add(wall);
  walls.push(wall);
}

function createFlickerLights() {
  return [
    [-12, 3],
    [2, -10],
    [13, 11],
    [11, -11]
  ].map(([x, z], index) => {
    const light = new THREE.PointLight(0xff1f2d, 0.85, 10, 2.2);
    light.position.set(x, 2.8, z);
    light.userData.seed = Math.random() * 10;
    light.userData.nextStutter = 1 + Math.random() * 3;
    light.userData.stutter = 0;
    scene.add(light);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 10, 8),
      new THREE.MeshBasicMaterial({ color: index % 2 ? 0xff2c35 : 0xb80018 })
    );
    bulb.position.copy(light.position);
    scene.add(bulb);
    light.userData.bulb = bulb;
    return light;
  });
}

function updateLights(elapsed, delta) {
  flickerLights.forEach((light, index) => {
    light.userData.nextStutter -= delta;
    if (light.userData.nextStutter <= 0) {
      light.userData.stutter = 0.35 + Math.random() * 0.5;
      light.userData.nextStutter = 1.8 + Math.random() * 4.2;
    }
    light.userData.stutter = Math.max(0, light.userData.stutter - delta);
    const pulse = Math.sin(elapsed * (1.8 + index * 0.22) + light.userData.seed) * 0.18;
    const stutterDrop = light.userData.stutter > 0 && Math.random() < 0.42 ? 0.55 : 0;
    light.intensity = Math.max(0.08, 0.68 + pulse - stutterDrop);
    const bulbGlow = 0.45 + light.intensity * 0.32;
    light.userData.bulb.material.color.setRGB(bulbGlow, 0.02, 0.05);
  });
}

function updateJokeInteractions() {
  nearestJoke = null;
  let nearestDistance = Infinity;
  jokeNotes.forEach((note) => {
    if (!note.visible) return;
    const distance = note.position.distanceTo(camera.position);
    if (distance < 2.2 && distance < nearestDistance) {
      nearestJoke = note;
      nearestDistance = distance;
    }
  });

  if (nearestJoke) ui.showInteraction(nearestJoke.userData.index);
  else ui.hideInteraction();
}

function collectJoke(note) {
  note.visible = false;
  score += 1;
  ui.setScore(score);
  ui.hideInteraction();
}

function handleBananaTouch() {
  score -= 1;
  ui.setScore(score);
  ui.triggerJumpscare();
  audio.playJumpscare();
  movement.shake();
  movement.reset();
  evilBanana.reset();
  audio.stopAfterReset();
}
