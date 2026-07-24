"use client";

import { useEffect, useMemo, useState } from "react";
import { animate, useMotionValue, type MotionValue } from "framer-motion";
import Matter from "matter-js";
import {
  createCenaPatronalWorld,
  RELEASE_AT_MS,
  CUP_HEIGHT,
  CUP_WIDTH,
  CUP_POCKET_DEPTH,
  CUP_WALL_THICKNESS,
  type PieceId,
} from "@/lib/physics/cenaPatronalWorld";

export interface PieceMotion {
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotate: MotionValue<number>;
  /** Sólo para el "golpe" visual al aterrizar — no la mueve la física, la dispara un evento de colisión (ver más abajo). */
  scaleY: MotionValue<number>;
}

export interface SplashPoint {
  x: number;
  y: number;
}

const PIECE_IDS: PieceId[] = ["pot", "lid", "plate", "cup", "ice1", "ice2"];
const RAD_TO_DEG = 180 / Math.PI;

// Colisiones que cuentan como "aterrizaje" (disparan el golpe de aplastado)
// para cada pieza — la tapa aterriza sobre la cacerola, el resto sobre el
// suelo. Si la tapa cayera fuera de la cacerola, tocar el suelo directamente
// también cuenta (ver nota sobre deriva horizontal en cenaPatronalWorld.ts).
const LANDING_PARTNERS: Partial<Record<PieceId, string[]>> = {
  pot: ["floor"],
  lid: ["pot", "floor"],
  plate: ["floor"],
  cup: ["floor"],
};

// Los hielos "salpican" al tocar el fondo del hueco del vaso (no el vaso en
// sí, ver comentario en cenaPatronalWorld.ts), el suelo (si fallan el vaso) o
// al chocar entre ellos.
const SPLASH_PARTNERS: string[] = ["cupFloor", "floor", "ice1", "ice2"];

const SQUASH_KEYFRAMES = [1, 0.82, 1.06, 0.97, 1];
const SQUASH_TIMES = [0, 0.28, 0.55, 0.8, 1];

/**
 * Ejecuta el mundo físico de la cena patronal (ver `cenaPatronalWorld.ts`) y
 * expone su estado como `MotionValue`s de Framer Motion listas para usar en
 * `style={{ x, y, rotate }}` de cada `motion.g` — así la posición/rotación
 * real de cada cuerpo se pinta cada frame sin pasar por `setState` (que
 * forzaría un render de React 60 veces por segundo).
 *
 * Cada pieza sólo se "suelta" en el mundo (empieza a caer) en el instante
 * marcado por `RELEASE_AT_MS`, y sólo se considera visible (se debe montar
 * su JSX) a partir de ese mismo instante — antes no existe en la simulación.
 */
export function useCenaPatronalPhysics() {
  // `useMotionValue` es un hook: no puede llamarse dentro de un bucle sobre
  // PIECE_IDS (rompería las reglas de hooks), así que se declaran los 24
  // valores (6 piezas × x/y/rotate/scaleY) explícitos y se agrupan después.
  const potX = useMotionValue(0);
  const potY = useMotionValue(-200);
  const potRotate = useMotionValue(0);
  const potScaleY = useMotionValue(1);

  const lidX = useMotionValue(0);
  const lidY = useMotionValue(-200);
  const lidRotate = useMotionValue(0);
  const lidScaleY = useMotionValue(1);

  const plateX = useMotionValue(0);
  const plateY = useMotionValue(-200);
  const plateRotate = useMotionValue(0);
  const plateScaleY = useMotionValue(1);

  const cupX = useMotionValue(0);
  const cupY = useMotionValue(-200);
  const cupRotate = useMotionValue(0);
  const cupScaleY = useMotionValue(1);

  const ice1X = useMotionValue(0);
  const ice1Y = useMotionValue(-200);
  const ice1Rotate = useMotionValue(0);
  const ice1ScaleY = useMotionValue(1);

  const ice2X = useMotionValue(0);
  const ice2Y = useMotionValue(-200);
  const ice2Rotate = useMotionValue(0);
  const ice2ScaleY = useMotionValue(1);

  const pieces = useMemo<Record<PieceId, PieceMotion>>(
    () => ({
      pot: { x: potX, y: potY, rotate: potRotate, scaleY: potScaleY },
      lid: { x: lidX, y: lidY, rotate: lidRotate, scaleY: lidScaleY },
      plate: { x: plateX, y: plateY, rotate: plateRotate, scaleY: plateScaleY },
      cup: { x: cupX, y: cupY, rotate: cupRotate, scaleY: cupScaleY },
      ice1: { x: ice1X, y: ice1Y, rotate: ice1Rotate, scaleY: ice1ScaleY },
      ice2: { x: ice2X, y: ice2Y, rotate: ice2Rotate, scaleY: ice2ScaleY },
    }),
    [
      potX, potY, potRotate, potScaleY,
      lidX, lidY, lidRotate, lidScaleY,
      plateX, plateY, plateRotate, plateScaleY,
      cupX, cupY, cupRotate, cupScaleY,
      ice1X, ice1Y, ice1Rotate, ice1ScaleY,
      ice2X, ice2Y, ice2Rotate, ice2ScaleY,
    ],
  );

  const [releasedPieces, setReleasedPieces] = useState<Record<PieceId, boolean>>({
    pot: false,
    lid: false,
    plate: false,
    cup: false,
    ice1: false,
    ice2: false,
  });
  const [splashes, setSplashes] = useState<Partial<Record<"ice1" | "ice2", SplashPoint>>>({});

  useEffect(() => {
    const world = createCenaPatronalWorld();

    const hasLanded = new Set<PieceId>();
    const hasSplashed = new Set<"ice1" | "ice2">();
    const released = new Set<PieceId>();

    Matter.Events.on(world.engine, "collisionStart", (event) => {
      for (const pair of event.pairs) {
        const labels = [pair.bodyA.label, pair.bodyB.label];

        for (const pieceId of PIECE_IDS) {
          if (!labels.includes(pieceId) || hasLanded.has(pieceId)) continue;
          const partners = LANDING_PARTNERS[pieceId];
          const otherLabel = labels[0] === pieceId ? labels[1] : labels[0];
          if (partners?.includes(otherLabel)) {
            hasLanded.add(pieceId);
            animate(pieces[pieceId].scaleY, SQUASH_KEYFRAMES, {
              duration: 0.4,
              times: SQUASH_TIMES,
              ease: "easeOut",
            });
          }
        }

        for (const iceId of ["ice1", "ice2"] as const) {
          if (!labels.includes(iceId) || hasSplashed.has(iceId)) continue;
          const otherLabel = labels[0] === iceId ? labels[1] : labels[0];
          if (SPLASH_PARTNERS.includes(otherLabel)) {
            hasSplashed.add(iceId);
            const body = world.bodies[iceId];
            setSplashes((current) => ({ ...current, [iceId]: { x: body.position.x, y: body.position.y } }));
          }
        }
      }
    });

    let rafId: number;
    let lastTime: number | null = null;
    let elapsedMs = 0;

    function tick(now: number) {
      if (lastTime === null) lastTime = now;
      const delta = Math.min(now - lastTime, 33); // evita saltos grandes si la pestaña estuvo en segundo plano
      lastTime = now;
      elapsedMs += delta;

      for (const id of PIECE_IDS) {
        if (!released.has(id) && elapsedMs >= RELEASE_AT_MS[id]) {
          released.add(id);
          Matter.Composite.add(world.engine.world, world.bodies[id]);
          if (id === "cup") {
            // El hueco del vaso entra en juego justo cuando el vaso empieza a
            // caer, para que ya esté ahí (siguiéndolo) cuando lleguen los hielos.
            Matter.Composite.add(world.engine.world, [
              world.cupPocket.floor,
              world.cupPocket.wallLeft,
              world.cupPocket.wallRight,
            ]);
          }
          setReleasedPieces((current) => ({ ...current, [id]: true }));
        }
      }

      Matter.Engine.update(world.engine, delta);

      if (released.has("cup")) {
        // El vaso no gira (rotación bloqueada), así que basta con trasladar
        // el hueco en bloque a la posición actual del vaso — sin tener en
        // cuenta ningún ángulo.
        const cupBody = world.bodies.cup;
        const floorY = cupBody.position.y - CUP_HEIGHT / 2 + CUP_POCKET_DEPTH;
        const wallY = cupBody.position.y - CUP_HEIGHT / 2 + CUP_POCKET_DEPTH / 2;
        Matter.Body.setPosition(world.cupPocket.floor, { x: cupBody.position.x, y: floorY });
        Matter.Body.setPosition(world.cupPocket.wallLeft, {
          x: cupBody.position.x - (CUP_WIDTH / 2 - CUP_WALL_THICKNESS / 2),
          y: wallY,
        });
        Matter.Body.setPosition(world.cupPocket.wallRight, {
          x: cupBody.position.x + (CUP_WIDTH / 2 - CUP_WALL_THICKNESS / 2),
          y: wallY,
        });
      }

      for (const id of PIECE_IDS) {
        if (!released.has(id)) continue;
        const body = world.bodies[id];
        pieces[id].x.set(body.position.x);
        pieces[id].y.set(body.position.y);
        pieces[id].rotate.set(body.angle * RAD_TO_DEG);
      }

      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      Matter.Events.off(world.engine, "collisionStart");
      Matter.World.clear(world.engine.world, false);
      Matter.Engine.clear(world.engine);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `pieces` agrupa MotionValue estables (no cambian de identidad); sólo debe correr una vez por montaje
  }, []);

  return { pieces, releasedPieces, splashes };
}
