import * as THREE from "three";

const PLAYER_RADIUS = 0.55;
const PLAYER_HEIGHT = 1.7;

export class MovementSystem {
  constructor(camera, controls, walls) {
    this.camera = camera;
    this.controls = controls;
    this.walls = walls;
    this.spawn = new THREE.Vector3(0, PLAYER_HEIGHT, 7);
    this.velocity = new THREE.Vector3();
    this.keys = new Set();
    this.stamina = 1;
    this.bobTime = 0;
    this.shakeTime = 0;
    this.shakeStrength = 0;
    this.camera.position.copy(this.spawn);
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener("keydown", (event) => this.keys.add(event.code));
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));
  }

  reset() {
    this.camera.position.copy(this.spawn);
    this.velocity.set(0, 0, 0);
    this.stamina = Math.max(0.35, this.stamina);
  }

  shake(strength = 0.16, duration = 0.38) {
    this.shakeStrength = strength;
    this.shakeTime = duration;
  }

  update(delta) {
    const input = this.getInputDirection();
    const isTryingSprint = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    const isMoving = input.lengthSq() > 0.001;
    const canSprint = isTryingSprint && isMoving && this.stamina > 0.02;
    const targetSpeed = canSprint ? 8.2 : 4.25;

    if (canSprint) this.stamina = Math.max(0, this.stamina - delta * 0.28);
    else this.stamina = Math.min(1, this.stamina + delta * 0.18);

    const worldDirection = this.getWorldDirection(input).multiplyScalar(targetSpeed);
    const acceleration = isMoving ? 12 : 9;
    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, worldDirection.x, acceleration, delta);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, worldDirection.z, acceleration, delta);

    this.moveWithCollision(delta);
    this.applyCameraBobAndShake(delta, isMoving);
    return { stamina: this.stamina, isMoving };
  }

  getInputDirection() {
    const direction = new THREE.Vector3();
    if (this.keys.has("KeyW")) direction.z -= 1;
    if (this.keys.has("KeyS")) direction.z += 1;
    if (this.keys.has("KeyA")) direction.x -= 1;
    if (this.keys.has("KeyD")) direction.x += 1;
    return direction.lengthSq() > 0 ? direction.normalize() : direction;
  }

  getWorldDirection(input) {
    const euler = new THREE.Euler(0, this.camera.rotation.y, 0, "YXZ");
    return input.clone().applyEuler(euler);
  }

  moveWithCollision(delta) {
    const nextX = this.camera.position.clone();
    nextX.x += this.velocity.x * delta;
    if (!this.collides(nextX)) this.camera.position.x = nextX.x;
    else this.velocity.x = 0;

    const nextZ = this.camera.position.clone();
    nextZ.z += this.velocity.z * delta;
    if (!this.collides(nextZ)) this.camera.position.z = nextZ.z;
    else this.velocity.z = 0;

    this.camera.position.y = PLAYER_HEIGHT;
  }

  collides(position) {
    if (Math.abs(position.x) > 19.4 || Math.abs(position.z) > 19.4) return true;
    return this.walls.some((wall) => {
      const width = wall.userData.bounds?.width ?? wall.scale.x;
      const depth = wall.userData.bounds?.depth ?? wall.scale.z;
      const halfX = width / 2 + PLAYER_RADIUS;
      const halfZ = depth / 2 + PLAYER_RADIUS;
      return Math.abs(position.x - wall.position.x) < halfX && Math.abs(position.z - wall.position.z) < halfZ;
    });
  }

  applyCameraBobAndShake(delta, isMoving) {
    const baseY = PLAYER_HEIGHT;
    this.bobTime += delta * (isMoving ? 9 : 3);
    const bobAmount = isMoving ? Math.sin(this.bobTime) * 0.035 : Math.sin(this.bobTime) * 0.008;

    let shakeY = 0;
    if (this.shakeTime > 0) {
      this.shakeTime -= delta;
      const fade = Math.max(0, this.shakeTime / 0.38);
      const jitter = new THREE.Vector3(
        (Math.random() - 0.5) * this.shakeStrength * fade,
        (Math.random() - 0.5) * this.shakeStrength * fade,
        0
      );
      this.controls.getObject().position.add(jitter);
      shakeY = jitter.y;
    }

    this.camera.position.y = baseY + bobAmount + shakeY;
  }
}
