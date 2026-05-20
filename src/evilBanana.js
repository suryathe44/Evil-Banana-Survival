import * as THREE from "three";

export class EvilBanana {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(-10, 1.65, -10);
    this.spawn = this.group.position.clone();
    this.baseSpeed = 1.05;
    this.timeAlive = 0;
    this.walkTime = 0;
    this.touchCooldown = 0;

    const material = new THREE.MeshStandardMaterial({
      color: 0xffe629,
      emissive: 0xffd000,
      emissiveIntensity: 0.82,
      roughness: 0.42,
      metalness: 0.05
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.75, 3.3, 28), material);
    body.castShadow = true;
    this.group.add(body);
    this.bodyMaterial = material;

    const aura = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.96, 3.55, 28),
      new THREE.MeshBasicMaterial({
        color: 0xffdf4d,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    this.group.add(aura);
    this.aura = aura;

    const grin = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.08, 0.035),
      new THREE.MeshBasicMaterial({ color: 0x120a05 })
    );
    grin.position.set(0, 0.45, 0.76);
    this.group.add(grin);

    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff1d1d });
    [-0.22, 0.22].forEach((x) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), eyeMaterial);
      eye.position.set(x, 0.9, 0.74);
      this.group.add(eye);
    });

    const glow = new THREE.PointLight(0xffdf4d, 0.58, 7);
    glow.position.set(0, 0.8, 0);
    this.group.add(glow);

    scene.add(this.group);
  }

  reset() {
    this.group.position.copy(this.spawn);
    this.timeAlive = 0;
    this.touchCooldown = 1.2;
  }

  update(delta, playerPosition) {
    this.timeAlive += delta;
    this.walkTime += delta;
    this.touchCooldown = Math.max(0, this.touchCooldown - delta);

    const toPlayer = playerPosition.clone().sub(this.group.position);
    toPlayer.y = 0;
    const distance = toPlayer.length();
    if (distance > 0.05) {
      const speed = this.baseSpeed + Math.min(1.15, this.timeAlive * 0.025);
      const direction = toPlayer.normalize();
      this.group.position.addScaledVector(direction, speed * delta);
      this.group.rotation.y = Math.atan2(direction.x, direction.z);
    }

    const wobble = Math.sin(this.walkTime * 7.5) * 0.09;
    const stretch = Math.sin(this.walkTime * 5.2) * 0.035;
    const glowPulse = 0.68 + Math.sin(this.walkTime * 3.1) * 0.14;
    this.group.rotation.z = wobble;
    this.group.scale.set(1 + stretch, 1 - stretch * 0.6, 1 + stretch);
    this.bodyMaterial.emissiveIntensity = glowPulse;
    this.aura.material.opacity = 0.1 + Math.sin(this.walkTime * 4.4) * 0.025;
    return distance;
  }

  canTouch(distance) {
    return distance < 1.25 && this.touchCooldown <= 0;
  }
}
