"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// ─── tunables ────────────────────────────────────────────────────────────────
const CUBE_COUNT = 55; // por lado (total = 110) — era 220
const CURSOR_RADIUS = 200; // px de influência do cursor
const CURSOR_FORCE = 0.28; // intensidade da repulsão
const LERP_SPEED = 0.028; // retorno ao path
const DAMPING = 0.86; // amortecimento
const IDLE_SPEED_MIN = 0.0003;
const IDLE_SPEED_MAX = 0.001;
const SPREAD = 0.22; // ± dispersão X
// ─────────────────────────────────────────────────────────────────────────────

type Side = "left" | "right";

interface IceCube {
  index: number;
  t: number;
  speed: number;
  vx: number;
  vy: number;
  posZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  rotSpeedX: number;
  rotSpeedY: number;
  rotSpeedZ: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  offsetX: number;
  side: Side;
  scale: number;
}

function getPathPoint(
  t: number,
  W: number,
  H: number,
  offsetX: number,
  side: Side,
): { x: number; y: number } {
  if (side === "left") {
    return {
      x: W * -0.48 + t * W * 0.18 + offsetX,
      y: H * 0.58 - t * H * 1.16,
    };
  }
  return {
    x: W * 0.48 - t * W * 0.18 + offsetX,
    y: H * 0.58 - t * H * 1.16,
  };
}

export default function IceParticles() {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (window.matchMedia("(max-width: 1024px)").matches) return;
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // ── renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.pointerEvents = "none";

    // ── scene + camera ────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200);
    camera.position.z = 30;

    // ── iluminação ────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xa8d8f0, 0.8));

    const keyLight = new THREE.DirectionalLight(0xd4eeff, 3.0);
    keyLight.position.set(-8, 12, 10);
    scene.add(keyLight);

    const keyLightR = new THREE.DirectionalLight(0xd4eeff, 2.2);
    keyLightR.position.set(8, 12, 10);
    scene.add(keyLightR);

    const rimLight = new THREE.DirectionalLight(0x00704a, 1.4);
    rimLight.position.set(10, -4, 5);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xeef8ff, 1.0, 60);
    fillLight.position.set(0, -10, 8);
    scene.add(fillLight);

    // ── envMap sem RoomEnvironment (compatível com Next.js/Webpack) ───────────
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromEquirectangular(
      (() => {
        const data = new Uint8Array([180, 220, 255, 255, 210, 235, 255, 255]);
        const tex = new THREE.DataTexture(data, 2, 1, THREE.RGBAFormat);
        tex.needsUpdate = true;
        return tex;
      })(),
    ).texture;
    pmrem.dispose();

    // ── material de gelo — SEM transmission ───────────────────────────────────
    const iceMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xc8e8ff),
      metalness: 0.05,
      roughness: 0.06,
      transparent: true,
      opacity: 0.58,
      envMap: envTex,
      envMapIntensity: 2.2,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    scene.environment = envTex;

    // ── geometria compartilhada ───────────────────────────────────────────────
    const BASE_GEO = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
    {
      const pos = BASE_GEO.attributes.position;
      const jitter = 0.1;
      for (let i = 0; i < pos.count; i++) {
        pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * jitter);
        pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * jitter);
        pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * jitter);
      }
      BASE_GEO.computeVertexNormals();
    }

    // ── InstancedMesh — 1 draw call para todos os cubos ──────────────────────
    const TOTAL = CUBE_COUNT * 2;
    const instancedMesh = new THREE.InstancedMesh(BASE_GEO, iceMaterial, TOTAL);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instancedMesh.frustumCulled = false;
    scene.add(instancedMesh);

    // ── vectors reutilizados (sem alocação por frame) ─────────────────────────
    const _vec = new THREE.Vector3();
    const _dir = new THREE.Vector3();
    const mouseWorld = new THREE.Vector3();
    let mouseValid = false;

    function screenToWorldXY(sx: number, sy: number, out: THREE.Vector3) {
      _vec.set((sx / W) * 2 - 1, -(sy / H) * 2 + 1, 0.5);
      _vec.unproject(camera);
      _dir.copy(_vec).sub(camera.position).normalize();
      const dist = -camera.position.z / _dir.z;
      out.copy(camera.position).addScaledVector(_dir, dist);
    }

    // ── criar cubos ───────────────────────────────────────────────────────────
    const cubes: IceCube[] = [];
    const sizes = [0.6, 0.9, 1.2, 1.6, 2.1];
    const Ws0 = W * 0.045;
    const Hs0 = H * 0.045;
    const dummy = new THREE.Object3D();

    let idx = 0;
    for (const side of ["left", "right"] as Side[]) {
      for (let i = 0; i < CUBE_COUNT; i++) {
        const scale = sizes[Math.floor(Math.random() * sizes.length)];
        const rawOff = (Math.random() - 0.5) * 2 * SPREAD * Ws0;
        const offsetX = side === "right" ? -rawOff : rawOff;
        const t = Math.random();
        const { x, y } = getPathPoint(t, Ws0, Hs0, offsetX, side);
        const posZ = (Math.random() - 0.5) * 8;

        dummy.position.set(x, y, posZ);
        dummy.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        );
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(idx, dummy.matrix);

        cubes.push({
          index: idx,
          t,
          side,
          offsetX,
          posZ,
          scale,
          currentX: x,
          currentY: y,
          targetX: x,
          targetY: y,
          rotX: dummy.rotation.x,
          rotY: dummy.rotation.y,
          rotZ: dummy.rotation.z,
          rotSpeedX: (Math.random() - 0.5) * 0.018,
          rotSpeedY: (Math.random() - 0.5) * 0.022,
          rotSpeedZ: (Math.random() - 0.5) * 0.01,
          speed:
            IDLE_SPEED_MIN + Math.random() * (IDLE_SPEED_MAX - IDLE_SPEED_MIN),
          vx: 0,
          vy: 0,
        });

        idx++;
      }
    }

    instancedMesh.instanceMatrix.needsUpdate = true;

    // ── raio world ────────────────────────────────────────────────────────────
    const worldScale = Hs0 / H;
    const cursorR = CURSOR_RADIUS * worldScale * 2.2;
    const Ws = W * 0.045;
    const Hs = H * 0.045;

    // ── loop ──────────────────────────────────────────────────────────────────
    function animate() {
      rafRef.current = requestAnimationFrame(animate);

      if (mouseValid) {
        screenToWorldXY(mouseRef.current.x, mouseRef.current.y, mouseWorld);
      }

      for (const cube of cubes) {
        cube.t = (cube.t + cube.speed) % 1;
        const { x: tx, y: ty } = getPathPoint(
          cube.t,
          Ws,
          Hs,
          cube.offsetX,
          cube.side,
        );
        cube.targetX = tx;
        cube.targetY = ty;

        if (mouseValid) {
          const dx = cube.currentX - mouseWorld.x;
          const dy = cube.currentY - mouseWorld.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < cursorR && dist > 0.01) {
            const force = ((cursorR - dist) / cursorR) * CURSOR_FORCE;
            cube.vx += (dx / dist) * force;
            cube.vy += (dy / dist) * force;
          }
        }

        cube.vx *= DAMPING;
        cube.vy *= DAMPING;

        cube.currentX += (cube.targetX - cube.currentX) * LERP_SPEED + cube.vx;
        cube.currentY += (cube.targetY - cube.currentY) * LERP_SPEED + cube.vy;

        cube.rotX += cube.rotSpeedX;
        cube.rotY += cube.rotSpeedY;
        cube.rotZ += cube.rotSpeedZ;

        dummy.position.set(cube.currentX, cube.currentY, cube.posZ);
        dummy.rotation.set(cube.rotX, cube.rotY, cube.rotZ);
        dummy.scale.setScalar(cube.scale);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(cube.index, dummy.matrix);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
    }

    animate();

    // ── mouse — passive listeners ─────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      mouseValid = true;
    };
    const onMouseLeave = () => {
      mouseValid = false;
      mouseRef.current = { x: -9999, y: -9999 };
    };

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    // ── resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize, { passive: true });

    // ── cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      instancedMesh.geometry.dispose();
      (instancedMesh.material as THREE.Material).dispose();
      scene.remove(instancedMesh);
      envTex.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    />
  );
}
