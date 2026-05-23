"use client";

import { useEffect, useRef } from "react";
import Matter from "matter-js";

const PEARL_COUNT = 200;
const ICE_COUNT   = 160;

type PhysicsObject = {
  body: Matter.Body;
  size: number;
  kind: "pearl" | "ice";
};

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function drawPearl(ctx: CanvasRenderingContext2D, size: number) {
  const r = size / 2;

  const base = ctx.createRadialGradient(-r * 0.26, -r * 0.26, r * 0.04, r * 0.1, r * 0.1, r);
  base.addColorStop(0,    "rgba(255, 210, 55,  0.55)");
  base.addColorStop(0.30, "rgba(245, 160, 22,  0.50)");
  base.addColorStop(0.68, "rgba(205, 105, 10,  0.46)");
  base.addColorStop(1,    "rgba(158,  68,  6,  0.42)");

  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  const shadow = ctx.createRadialGradient(r * 0.16, r * 0.24, r * 0.06, r * 0.12, r * 0.2, r * 0.98);
  shadow.addColorStop(0,    "rgba(110, 40, 0, 0)");
  shadow.addColorStop(0.55, "rgba(110, 40, 0, 0)");
  shadow.addColorStop(1,    "rgba(90,  30, 0, 0.18)");

  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  const hl = ctx.createRadialGradient(-r * 0.30, -r * 0.36, 0, -r * 0.20, -r * 0.26, r * 0.48);
  hl.addColorStop(0,    "rgba(255, 255, 225, 0.72)");
  hl.addColorStop(0.42, "rgba(255, 235, 170, 0.30)");
  hl.addColorStop(1,    "rgba(255, 210, 120, 0)");

  ctx.fillStyle = hl;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.58)";
  ctx.beginPath();
  ctx.arc(-r * 0.22, -r * 0.28, r * 0.14, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(140, 60, 5, 0.18)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, r - 0.4, 0, Math.PI * 2);
  ctx.stroke();
}

function drawIce(ctx: CanvasRenderingContext2D, size: number) {
  const h = size / 2;
  const r = Math.max(4, size * 0.2);

  const grad = ctx.createLinearGradient(-h, -h, h * 0.7, h);
  grad.addColorStop(0,    "rgba(242, 253, 255, 0.62)");
  grad.addColorStop(0.28, "rgba(198, 241, 255, 0.42)");
  grad.addColorStop(0.65, "rgba(152, 220, 248, 0.28)");
  grad.addColorStop(1,    "rgba(88,  188, 238, 0.14)");

  ctx.fillStyle = grad;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.70)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-h, -h, size, size, r);
  ctx.fill();
  ctx.stroke();

  const inner = ctx.createLinearGradient(-h * 0.76, -h * 0.76, h * 0.42, h * 0.42);
  inner.addColorStop(0,   "rgba(255, 255, 255, 0.34)");
  inner.addColorStop(0.5, "rgba(208, 243, 255, 0.14)");
  inner.addColorStop(1,   "rgba(148, 214, 244, 0.04)");

  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.roundRect(-h * 0.78, -h * 0.78, size * 0.60, size * 0.60, r * 0.45);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
  ctx.beginPath();
  ctx.roundRect(-h * 0.68, -h * 0.68, size * 0.38, size * 0.22, r * 0.5);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.beginPath();
  ctx.arc(-h * 0.20, -h * 0.28, size * 0.052, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(168, 226, 252, 0.28)";
  ctx.lineWidth = 0.85;
  ctx.beginPath();
  ctx.moveTo(-h * 0.10, h * 0.60);
  ctx.lineTo(h * 0.50, -h * 0.14);
  ctx.stroke();

  const rim = ctx.createLinearGradient(0, h * 0.28, h, h);
  rim.addColorStop(0, "rgba(175, 232, 255, 0.18)");
  rim.addColorStop(1, "rgba(95,  198, 243, 0.03)");
  ctx.strokeStyle = rim;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(-h + 0.7, -h + 0.7, size - 1.4, size - 1.4, r - 0.3);
  ctx.stroke();
}

export default function SummerPhysics() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const random = seededRandom(20260521);
    const engine = Matter.Engine.create();
    engine.gravity.y = 0;

    const render = Matter.Render.create({
      element: host,
      engine,
      options: {
        width: host.clientWidth,
        height: host.clientHeight,
        background: "transparent",
        wireframes: false,
        pixelRatio: Math.min(window.devicePixelRatio, 2)
      }
    });

    const makeBounds = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      return [
        Matter.Bodies.rectangle(w / 2, -42, w, 84,  { isStatic: true, render: { visible: false } }),
        Matter.Bodies.rectangle(w / 2, h + 42, w, 84, { isStatic: true, render: { visible: false } }),
        Matter.Bodies.rectangle(-42, h / 2, 84, h,  { isStatic: true, render: { visible: false } }),
        Matter.Bodies.rectangle(w + 42, h / 2, 84, h, { isStatic: true, render: { visible: false } })
      ];
    };

    const makeObjects = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      const objs: PhysicsObject[] = [];

      for (let i = 0; i < PEARL_COUNT + ICE_COUNT; i++) {
        const kind: "pearl" | "ice" = i < PEARL_COUNT ? "pearl" : "ice";
        const size = kind === "pearl"
          ? 18 + random() * 14          // pearls: 18–32 px diameter
          : 14 + random() * 32;         // ice: 14–46 px

        const x = random() * w;
        const y = 18 + random() * Math.max(120, h - 36);

        const body = kind === "pearl"
          ? Matter.Bodies.circle(x, y, size / 2, {
              restitution: 0.72,
              friction: 0.06,
              frictionAir: 0.004,
              density: 0.00110,
              render: {
                fillStyle: `rgba(220, 120, 18, ${0.48 + random() * 0.1})`,
                strokeStyle: "rgba(255, 195, 70, 0.4)",
                lineWidth: 1
              }
            })
          : Matter.Bodies.rectangle(x, y, size, size, {
              restitution: 0.62,
              friction: 0.28,
              frictionAir: 0.004,
              density: 0.00080,
              render: {
                fillStyle: `rgba(210, 245, 255, ${0.22 + random() * 0.14})`,
                strokeStyle: "rgba(255, 255, 255, 0.55)",
                lineWidth: 1
              }
            });

        Matter.Body.setVelocity(body, {
          x: (random() - 0.5) * 3.0,
          y: (random() - 0.5) * 3.0
        });
        if (kind === "ice") {
          Matter.Body.setAngle(body, random() * Math.PI * 2);
          Matter.Body.setAngularVelocity(body, (random() - 0.5) * 0.08);
        }

        objs.push({ body, size, kind });
      }
      return objs;
    };

    let bounds = makeBounds();
    let objects = makeObjects();
    Matter.Composite.add(engine.world, [...bounds, ...objects.map((o) => o.body)]);

    const runner = Matter.Runner.create();
    Matter.Render.run(render);
    Matter.Runner.run(runner, engine);

    const beforeUpdate = () => {
      objects.forEach((obj, i) => {
        const t = engine.timing.timestamp * 0.0007;
        const dx = Math.sin(t + obj.size * 0.28 + i * 0.19) * 0.000009 * obj.body.mass;
        const dy = Math.cos(t * 0.65 + i * 0.25)             * 0.000008 * obj.body.mass;
        Matter.Body.applyForce(obj.body, obj.body.position, { x: dx, y: dy });
      });
    };

    const afterRender = () => {
      const ctx = render.context;
      ctx.save();
      objects.forEach(({ body, size, kind }) => {
        ctx.translate(body.position.x, body.position.y);
        if (kind === "ice") ctx.rotate(body.angle);
        kind === "pearl" ? drawPearl(ctx, size) : drawIce(ctx, size);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      });
      ctx.restore();
    };

    let lastPointer = { x: 0, y: 0 };
    let lastTime = 0;

    const nudge = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const now = performance.now();
      const dt = Math.max(4, now - lastTime);
      const vx = (pointer.x - lastPointer.x) / dt;
      const vy = (pointer.y - lastPointer.y) / dt;
      const speed = Math.sqrt(vx * vx + vy * vy);
      lastPointer = { ...pointer };
      lastTime = now;

      const radius = 220;
      objects.forEach(({ body }) => {
        const offset = Matter.Vector.sub(body.position, pointer);
        const distance = Matter.Vector.magnitude(offset);
        if (distance > 0 && distance < radius) {
          const dir = Matter.Vector.normalise(offset);
          const falloff = (1 - distance / radius) ** 1.4;
          const blast      = falloff * 0.18 * body.mass;
          const throwScale = Math.min(speed * 0.004, 0.14) * body.mass * falloff;
          Matter.Body.applyForce(body, body.position, {
            x: dir.x * blast + vx * throwScale,
            y: dir.y * blast + vy * throwScale
          });
          Matter.Body.setAngularVelocity(
            body,
            body.angularVelocity + (Math.random() - 0.5) * 1.8 * falloff
          );
        }
      });
    };

    const resize = () => {
      render.canvas.width  = host.clientWidth  * render.options.pixelRatio!;
      render.canvas.height = host.clientHeight * render.options.pixelRatio!;
      render.canvas.style.width  = `${host.clientWidth}px`;
      render.canvas.style.height = `${host.clientHeight}px`;
      Matter.Composite.remove(engine.world, bounds);
      Matter.Composite.remove(engine.world, objects.map((o) => o.body));
      bounds = makeBounds();
      objects = makeObjects();
      Matter.Composite.add(engine.world, [...bounds, ...objects.map((o) => o.body)]);
    };

    Matter.Events.on(engine, "beforeUpdate", beforeUpdate);
    Matter.Events.on(render, "afterRender", afterRender);
    window.addEventListener("pointermove", nudge);
    window.addEventListener("resize", resize);

    return () => {
      Matter.Events.off(engine, "beforeUpdate", beforeUpdate);
      Matter.Events.off(render, "afterRender", afterRender);
      window.removeEventListener("pointermove", nudge);
      window.removeEventListener("resize", resize);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
  }, []);

  return <div ref={hostRef} className="physics-layer" aria-hidden="true" />;
}
