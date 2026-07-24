"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface ConfettiCanvasProps {
  className?: string;
  /** Oleada temporal (ver hooks/useConfettiWave): la tasa de aparición sube y baja de forma gradual, nunca de golpe. */
  intense?: boolean;
}

const COLORS = ["#ef4444", "#22c55e", "#fbbf24", "#f472b6", "#60a5fa", "#f8fafc"];
const BASE_SPAWN_RATE = 14; // piezas nuevas por segundo en reposo
const WAVE_SPAWN_RATE = 70; // piezas nuevas por segundo durante una oleada
const RATE_SMOOTHING_MS = 700; // tiempo en acercarse al objetivo: la transición en sí, sube y baja igual de suave
const MAX_PARTICLES = 220; // válvula de seguridad, no debería alcanzarse en condiciones normales
const GRAVITY_PER_FRAME = 0.006;
const MAX_FALL_SPEED = 1.4;
const MAX_DELTA_MS = 50; // evita una ráfaga de spawn si la pestaña estuvo en segundo plano

interface Particle {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  /** Fase de un giro "3D" simulado en 2D: escala horizontal = cos(tumble). */
  tumble: number;
  tumbleSpeed: number;
  swayPhase: number;
  swaySpeed: number;
  swayAmplitude: number;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function baseParticleFields() {
  return {
    width: randomBetween(3, 5.5),
    height: randomBetween(6, 10),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    vx: randomBetween(-0.12, 0.12),
    vy: randomBetween(0.32, 0.6),
    rotation: randomBetween(0, Math.PI * 2),
    rotationSpeed: randomBetween(-0.035, 0.035),
    tumble: randomBetween(0, Math.PI * 2),
    tumbleSpeed: randomBetween(0.05, 0.11),
    swayPhase: randomBetween(0, Math.PI * 2),
    swaySpeed: randomBetween(0.018, 0.032),
    swayAmplitude: randomBetween(0.35, 0.9),
  };
}

/** Siembra inicial, repartida por toda la altura para que no arranque vacío. */
function createSeedParticle(width: number, height: number): Particle {
  return { x: randomBetween(0, width), y: randomBetween(-height, height), ...baseParticleFields() };
}

/** Pieza nueva entrando por arriba, como el resto de la lluvia de confeti. */
function createParticle(width: number): Particle {
  return { x: randomBetween(0, width), y: randomBetween(-36, -6), ...baseParticleFields() };
}

/**
 * Confeti de papel cayendo, dibujado a mano en canvas (nada de librerías):
 * gravedad con velocidad terminal, balanceo lateral tipo hoja, y un "giro 3D"
 * simulado achatando el ancho con el coseno de una fase — así cada pieza
 * parece voltear en el aire en vez de solo rotar en el plano.
 *
 * La densidad no se controla con un tamaño de array fijo (eso cambiaría de
 * golpe): se controla con una TASA de aparición que se acerca suavemente al
 * objetivo cada frame, y las piezas que salen de la pantalla simplemente se
 * eliminan (nunca se reciclan en el sitio). Así la población crece y decae
 * de forma orgánica, como pasaría con confeti real.
 */
export function ConfettiCanvas({ className, intense = false }: ConfettiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const intenseRef = useRef(intense);

  useEffect(() => {
    intenseRef.current = intense;
  }, [intense]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let animationFrame = 0;
    let spawnRate = BASE_SPAWN_RATE;
    let spawnBudget = 0;
    let lastTime: number | null = null;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.max(1, Math.round(width * dpr));
      canvas!.height = Math.max(1, Math.round(height * dpr));
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: Math.round(BASE_SPAWN_RATE * 1.2) }, () =>
        createSeedParticle(width, height),
      );
    }

    function step(now: number) {
      const deltaMs = Math.min(now - (lastTime ?? now), MAX_DELTA_MS);
      lastTime = now;

      const targetRate = intenseRef.current ? WAVE_SPAWN_RATE : BASE_SPAWN_RATE;
      spawnRate += (targetRate - spawnRate) * Math.min(1, deltaMs / RATE_SMOOTHING_MS);

      spawnBudget += (spawnRate * deltaMs) / 1000;
      while (spawnBudget >= 1 && particles.length < MAX_PARTICLES) {
        particles.push(createParticle(width));
        spawnBudget -= 1;
      }

      ctx!.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.vy = Math.min(particle.vy + GRAVITY_PER_FRAME, MAX_FALL_SPEED);
        particle.swayPhase += particle.swaySpeed;
        particle.tumble += particle.tumbleSpeed;
        particle.rotation += particle.rotationSpeed;
        particle.y += particle.vy;
        particle.x += particle.vx + Math.sin(particle.swayPhase) * particle.swayAmplitude * 0.05;

        if (particle.y - particle.height > height || particle.x < -10 || particle.x > width + 10) {
          particles.splice(i, 1);
          continue;
        }

        const tumbleScale = Math.cos(particle.tumble);
        ctx!.save();
        ctx!.translate(particle.x, particle.y);
        ctx!.rotate(particle.rotation);
        ctx!.scale(Math.max(0.12, Math.abs(tumbleScale)), 1);
        ctx!.fillStyle = particle.color;
        ctx!.globalAlpha = 0.88;
        ctx!.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
        ctx!.restore();
      }

      animationFrame = requestAnimationFrame(step);
    }

    resize();
    animationFrame = requestAnimationFrame(step);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
