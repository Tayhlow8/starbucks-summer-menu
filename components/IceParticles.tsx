'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// ─── tunables ────────────────────────────────────────────────────────────────
const CUBE_COUNT      = 110       // cubos por lado (total = 220)
const CURSOR_RADIUS   = 200       // px de influência do cursor
const CURSOR_FORCE    = 0.28      // intensidade da repulsão
const LERP_SPEED      = 0.028     // retorno ao path (0=lento, 1=instantâneo)
const DAMPING         = 0.86      // amortecimento da velocidade
const IDLE_SPEED_MIN  = 0.0003
const IDLE_SPEED_MAX  = 0.0010
const SPREAD          = 0.22      // ± dispersão X em % da largura world
// ─────────────────────────────────────────────────────────────────────────────

type Side = 'left' | 'right'

interface IceCube {
  mesh: THREE.Mesh
  t: number
  speed: number
  vx: number
  vy: number
  rotSpeedX: number
  rotSpeedY: number
  rotSpeedZ: number
  targetX: number
  targetY: number
  baseScale: number
  offsetX: number
  side: Side
}

/**
 * Path do lado esquerdo: nasce no topo-esquerdo, deriva sutilmente pra direita.
 * Path do lado direito: espelho exato — nasce no topo-direito, deriva pra esquerda.
 */
function getPathPoint(
  t: number,
  W: number,
  H: number,
  offsetX: number,
  side: Side
): { x: number; y: number } {
  if (side === 'left') {
    const xStart = W * -0.48
    const xDrift = W * 0.18
    return {
      x: xStart + t * xDrift + offsetX,
      y: H * 0.58 - t * H * 1.16,
    }
  } else {
    const xStart = W * 0.48
    const xDrift = W * 0.18
    return {
      x: xStart - t * xDrift + offsetX,
      y: H * 0.58 - t * H * 1.16,
    }
  }
}

export default function IceParticles() {
  const mountRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const rafRef   = useRef<number>(0)

  useEffect(() => {
    if (window.matchMedia('(max-width: 1024px)').matches) return
    if (!mountRef.current) return

    const mount = mountRef.current
    const W = mount.clientWidth
    const H = mount.clientHeight

    // ── renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = false
    mount.appendChild(renderer.domElement)
    renderer.domElement.style.pointerEvents = 'none'

    // ── scene + camera ────────────────────────────────────────────────────────
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200)
    camera.position.z = 30

    // ── iluminação PBR ────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xa8d8f0, 0.6))

    const keyLight = new THREE.DirectionalLight(0xd4eeff, 2.8)
    keyLight.position.set(-8, 12, 10)
    scene.add(keyLight)

    const keyLightR = new THREE.DirectionalLight(0xd4eeff, 2.0)
    keyLightR.position.set(8, 12, 10)
    scene.add(keyLightR)

    const rimLight = new THREE.DirectionalLight(0x00704a, 1.2)
    rimLight.position.set(10, -4, 5)
    scene.add(rimLight)

    const fillLight = new THREE.PointLight(0xeef8ff, 0.8, 60)
    fillLight.position.set(0, -10, 8)
    scene.add(fillLight)

    // ── material de gelo PBR ──────────────────────────────────────────────────
    const iceMaterial = new THREE.MeshPhysicalMaterial({
      color:               new THREE.Color(0xd4eeff),
      metalness:           0.0,
      roughness:           0.08,
      transmission:        0.82,
      thickness:           1.8,
      ior:                 1.31,
      envMapIntensity:     1.4,
      transparent:         true,
      opacity:             0.92,
      side:                THREE.DoubleSide,
      attenuationColor:    new THREE.Color(0x9dd4f5),
      attenuationDistance: 3.5,
    })

    const pmrem    = new THREE.PMREMGenerator(renderer)
    const envScene = new RoomEnvironment()
    const envMap   = pmrem.fromScene(envScene, 0.04).texture
    scene.environment        = envMap
    iceMaterial.envMap       = envMap
    pmrem.dispose()
    envScene.dispose()

    // ── geometria irregular ───────────────────────────────────────────────────
    function makeIceGeometry(baseSize: number): THREE.BufferGeometry {
      const geo    = new THREE.BoxGeometry(baseSize, baseSize, baseSize, 2, 2, 2)
      const pos    = geo.attributes.position
      const jitter = baseSize * 0.12
      for (let i = 0; i < pos.count; i++) {
        pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * jitter)
        pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * jitter)
        pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * jitter)
      }
      geo.computeVertexNormals()
      return geo
    }

    // ── screen → world ────────────────────────────────────────────────────────
    function screenToWorld(sx: number, sy: number): THREE.Vector3 {
      const vec = new THREE.Vector3(
        (sx / W) * 2 - 1,
        -(sy / H) * 2 + 1,
        0.5
      )
      vec.unproject(camera)
      const dir  = vec.sub(camera.position).normalize()
      const dist = -camera.position.z / dir.z
      return camera.position.clone().add(dir.multiplyScalar(dist))
    }

    // ── criar cubos (esquerda + direita) ──────────────────────────────────────
    const cubes: IceCube[] = []
    const sizes = [0.6, 0.9, 1.2, 1.6, 2.1]
    const Ws0   = W * 0.045
    const Hs0   = H * 0.045

    const sides: Side[] = ['left', 'right']

    for (const side of sides) {
      for (let i = 0; i < CUBE_COUNT; i++) {
        const baseSize = sizes[Math.floor(Math.random() * sizes.length)]
        const geo      = makeIceGeometry(baseSize)
        const mat      = iceMaterial.clone()

        mat.color.setHSL(0.55 + Math.random() * 0.08, 0.3 + Math.random() * 0.4, 0.75 + Math.random() * 0.2)
        mat.roughness    = 0.04 + Math.random() * 0.12
        mat.transmission = 0.75 + Math.random() * 0.2
        mat.opacity      = 0.80 + Math.random() * 0.18

        const mesh = new THREE.Mesh(geo, mat)

        const rawOffset = (Math.random() - 0.5) * 2 * SPREAD * Ws0
        const offsetX   = side === 'right' ? -rawOffset : rawOffset

        const t         = Math.random()
        const { x, y }  = getPathPoint(t, Ws0, Hs0, offsetX, side)

        mesh.position.set(x, y, (Math.random() - 0.5) * 8)
        mesh.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        )

        scene.add(mesh)

        cubes.push({
          mesh, t, side, offsetX,
          speed:     IDLE_SPEED_MIN + Math.random() * (IDLE_SPEED_MAX - IDLE_SPEED_MIN),
          vx: 0, vy: 0,
          rotSpeedX: (Math.random() - 0.5) * 0.018,
          rotSpeedY: (Math.random() - 0.5) * 0.022,
          rotSpeedZ: (Math.random() - 0.5) * 0.010,
          targetX: x, targetY: y,
          baseScale: 0.7 + Math.random() * 0.6,
        })
      }
    }

    // ── raio world ────────────────────────────────────────────────────────────
    const worldScale = Hs0 / H
    const cursorR    = CURSOR_RADIUS * worldScale * 2.2

    // ── loop ──────────────────────────────────────────────────────────────────
    function animate() {
      rafRef.current = requestAnimationFrame(animate)

      const mouseWorld = mouseRef.current.x > -9000
        ? screenToWorld(mouseRef.current.x, mouseRef.current.y)
        : null

      const Ws = W * 0.045
      const Hs = H * 0.045

      for (const cube of cubes) {
        cube.t = (cube.t + cube.speed) % 1
        const { x: tx, y: ty } = getPathPoint(cube.t, Ws, Hs, cube.offsetX, cube.side)
        cube.targetX = tx
        cube.targetY = ty

        if (mouseWorld) {
          const dx   = cube.mesh.position.x - mouseWorld.x
          const dy   = cube.mesh.position.y - mouseWorld.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < cursorR && dist > 0.01) {
            const force = ((cursorR - dist) / cursorR) * CURSOR_FORCE
            cube.vx += (dx / dist) * force
            cube.vy += (dy / dist) * force
          }
        }

        cube.vx *= DAMPING
        cube.vy *= DAMPING

        cube.mesh.position.x += (cube.targetX - cube.mesh.position.x) * LERP_SPEED + cube.vx
        cube.mesh.position.y += (cube.targetY - cube.mesh.position.y) * LERP_SPEED + cube.vy

        cube.mesh.rotation.x += cube.rotSpeedX
        cube.mesh.rotation.y += cube.rotSpeedY
        cube.mesh.rotation.z += cube.rotSpeedZ
      }

      renderer.render(scene, camera)
    }

    animate()

    // ── mouse ─────────────────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
    const onMouseLeave = () => { mouseRef.current = { x: -9999, y: -9999 } }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)

    // ── resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // ── cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafRef.current)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('resize', onResize)
      cubes.forEach(c => {
        c.mesh.geometry.dispose()
        ;(c.mesh.material as THREE.Material).dispose()
        scene.remove(c.mesh)
      })
      iceMaterial.dispose()
      envMap.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      style={{
        position:      'absolute',
        inset:         0,
        zIndex:        10,
        overflow:      'hidden',
        pointerEvents: 'none',
      }}
    />
  )
}
