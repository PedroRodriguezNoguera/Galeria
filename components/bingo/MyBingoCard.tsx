"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { motion, type PanInfo } from "framer-motion";
import { Spinner } from "@/components/ui/Spinner";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { getOrCreateMyBingoCards, markBingoCardNumber } from "@/lib/actions/bingoCard";
import type { BingoCard } from "@/lib/actions/bingoCard";

interface MyBingoCardProps {
  autoAssignCards: boolean;
  /** Cambia cada vez que el admin reinicia las papeletas (ver resetBingoCards) — dispara pedir una nueva. */
  cardsResetAt: string | null;
  /** Cuántas papeletas le tocan a cada visitante (elegido desde el admin). */
  cardsPerVisitor: number;
}

// Celdas pequeñas (no una foto a pantalla completa): un gesto corto y claro
// de "arrancar" basta. Mismo criterio offset-o-velocidad que el swipe del
// visor de fotos (ver MediaViewer.handleDragEnd).
const TEAR_DRAG_THRESHOLD = 46;
const TEAR_VELOCITY_THRESHOLD = 500;
const TEAR_FLIGHT_SECONDS = 0.32;
// Ángulo máximo mientras se arrastra sin soltar todavía (la pegatina se
// despega, pero no se suelta del todo hasta pasar el umbral).
const PEEL_DRAG_MAX_DEG = 55;
// Ángulo al que sigue girando una vez se suelta de verdad, continuando el
// mismo pivote/sentido en el que ya se estaba despegando.
const PEEL_EXIT_DEG = 150;

interface TearFlight {
  fromRotate: number;
  direction: 1 | -1;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** PRNG determinista (mismo seed → misma secuencia siempre, nunca Math.random). */
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Recorte irregular (no un rectángulo perfecto) que simula un borde de
 * papel rasgado — profundidad y número de muescas propios por semilla
 * (no una alternancia fija de 2 valores) para que cada desgarrón se vea
 * distinto de verdad, no un sawtooth repetido. Determinista por semilla:
 * el servidor y el cliente pintan exactamente lo mismo, sin parpadeo al
 * hidratar.
 */
function buildTornClipPath(seed: number): string {
  const rand = seededRandom(seed);
  const notches = 5 + Math.floor(rand() * 4); // 5–8 muescas por lado
  const jag = () => 1 + rand() * 11; // profundidad de cada muesca, 1–12%
  const points: string[] = [];
  for (let i = 0; i <= notches; i++) {
    points.push(`${(i / notches) * 100}% ${jag()}%`);
  }
  for (let i = 1; i <= notches; i++) {
    points.push(`${100 - jag()}% ${10 + (i / notches) * 80}%`);
  }
  for (let i = 0; i <= notches; i++) {
    points.push(`${100 - (i / notches) * 100}% ${100 - jag()}%`);
  }
  for (let i = 1; i < notches; i++) {
    points.push(`${jag()}% ${90 - (i / notches) * 80}%`);
  }
  return `polygon(${points.join(", ")})`;
}

// Varias formas distintas precalculadas (no una sola reutilizada en todas
// las casillas) — cada número de bingo siempre cae en la misma forma
// (estable entre renders), pero números distintos casi nunca coinciden.
const TORN_CLIP_PATH_VARIANTS = Array.from({ length: 11 }, (_, i) =>
  buildTornClipPath(i * 97 + 13),
);
function tornClipPathFor(n: number): string {
  return TORN_CLIP_PATH_VARIANTS[n % TORN_CLIP_PATH_VARIANTS.length];
}

interface TearableNumberProps {
  onTear: (fromRotate: number, direction: 1 | -1) => void;
  /** Acaba de volver (doble toque en su hueco): entra con un pequeño rebote en vez de aparecer de golpe. */
  justRestored: boolean;
  children: ReactNode;
}

/**
 * El número mientras todavía sigue pegado al cartón. En vez de arrastrarse
 * libremente por la pantalla, gira sobre un pivote fijo en su esquina
 * superior derecha — como despegar una pegatina agarrándola por esa
 * esquina: no importa hacia dónde tires, el punto de anclaje no se mueve,
 * solo se abre más cuanto más se tira.
 *
 * - `transformOrigin` fijo en la esquina superior derecha.
 * - El ángulo de giro depende de la distancia arrastrada, y su sentido
 *   (hacia la izquierda o hacia la derecha) del lado hacia el que se
 *   desliza — no siempre el mismo lado.
 * - Una sombra que crece con el ángulo (se despega más de la superficie
 *   cuanto más se abre).
 * - Nada de traslación libre (`dragElastic={0}`): el "arrastre" es solo la
 *   señal de entrada, el propio elemento no persigue el dedo por la
 *   pantalla, que rompería la ilusión de estar anclado por la esquina.
 *
 * Vive en un componente aparte porque necesita su propio estado de
 * arrastre (no se pueden crear hooks dentro de un .map()). Genérico en su
 * contenido (children) para poder envolver tanto un número como el hueco
 * decorativo con el logo — ambos se despegan igual, solo cambia qué llevan
 * pegado encima; quién es (para marcar/restaurar) lo decide el `onTear` que
 * le pasa cada llamador vía closure, no una prop `n` fija a números.
 */
function TearableNumber({ onTear, justRestored, children }: TearableNumberProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  function handleDrag(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    setOffset({ x: info.offset.x, y: info.offset.y });
  }

  function handleDragEnd(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    const dist = Math.hypot(info.offset.x, info.offset.y);
    const speed = Math.hypot(info.velocity.x, info.velocity.y);
    if (dist <= TEAR_DRAG_THRESHOLD && speed <= TEAR_VELOCITY_THRESHOLD) {
      setOffset({ x: 0, y: 0 });
      return;
    }
    // Ángulo a partir de la distancia final del propio gesto (no del
    // estado `offset`, que podría quedarse un frame atrás): así la
    // animación de salida arranca exactamente donde se soltó, sin salto.
    const dir: 1 | -1 = info.offset.x >= 0 ? -1 : 1;
    onTear(dir * clamp(dist / TEAR_DRAG_THRESHOLD, 0, 1) * PEEL_DRAG_MAX_DEG, dir);
  }

  const distance = Math.hypot(offset.x, offset.y);
  const progress = clamp(distance / TEAR_DRAG_THRESHOLD, 0, 1);
  // Hacia qué lado se despega: el signo lo decide hacia dónde se desliza
  // (izquierda o derecha), no siempre el mismo sentido de giro.
  const direction = offset.x >= 0 ? -1 : 1;
  const rotate = direction * progress * PEEL_DRAG_MAX_DEG;
  const liftShadow = `-${2 + progress * 6}px ${4 + progress * 16}px ${8 + progress * 22}px rgba(0,0,0,${(0.16 + progress * 0.34).toFixed(2)})`;

  return (
    <motion.div
      drag
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
      dragElastic={0}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      // Entrada orgánica solo al volver de un doble toque (justRestored):
      // un rebote de resorte en escala/opacidad, separado del giro de
      // despegado (que sigue siendo instantáneo, sin rebote, para que el
      // arrastre en vivo no se sienta con retraso).
      initial={justRestored ? { scale: 0.3, opacity: 0 } : false}
      animate={{ rotate, boxShadow: liftShadow, scale: 1, opacity: 1 }}
      transition={{
        default: { type: "tween", duration: 0 },
        scale: { type: "spring", stiffness: 260, damping: 14 },
        opacity: { type: "spring", stiffness: 260, damping: 14 },
      }}
      style={{ transformOrigin: "100% 0%" }}
      className="relative aspect-square cursor-grab touch-none select-none active:cursor-grabbing"
    >
      {children}
    </motion.div>
  );
}

interface SingleBingoCardProps {
  card: BingoCard;
  /** Sólo para el rótulo ("Cartón 2/3") cuando hay más de una papeleta. */
  cardsCount: number;
}

/**
 * Una papeleta individual (cartón 3x9 tradicional, papel verde claro como
 * los cartones físicos de toda la vida). Cuando cards_per_visitor > 1, el
 * visitante ve varias de éstas apiladas (ver MyBingoCard más abajo) — cada
 * una lleva su propio estado de arrastre/desgarrado, por eso vive en un
 * componente aparte con sus propios hooks (uno por papeleta, no uno
 * compartido para todas).
 *
 * Arrastrar un número lo despega de la papeleta como una pegatina: gira
 * sobre la esquina superior derecha (ver TearableNumber) en vez de
 * arrastrarse libremente; al soltar más allá del umbral, sigue girando
 * sobre ese mismo pivote hasta soltarse del todo y desvanecerse, dejando
 * una marca donde estaba — como si de verdad se hubiera despegado un
 * adhesivo, no arrancado un trozo de papel.
 */
function SingleBingoCard({ card, cardsCount }: SingleBingoCardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [marked, setMarked] = useState<Set<number>>(new Set(card.markedNumbers));
  const [tearing, setTearing] = useState<Map<number, TearFlight>>(new Map());
  // Números que acaban de volver (doble toque en su hueco): reciben una
  // pequeña entrada orgánica en vez de aparecer de golpe. Se quitan de
  // aquí en cuanto esa animación termina.
  const [justRestored, setJustRestored] = useState<Set<number>>(new Set());
  // Los huecos sin número también se pueden arrancar (misma pegatina, pero
  // sólo decorativa: no hay número real que guardar en el servidor, así que
  // este estado es puramente local — se pierde al recargar, y eso está
  // bien). Se identifican por posición ("fila-columna"), no por número.
  const [tornBlanks, setTornBlanks] = useState<Set<string>>(new Set());
  const [tearingBlanks, setTearingBlanks] = useState<Map<string, TearFlight>>(new Map());
  const [justRestoredBlanks, setJustRestoredBlanks] = useState<Set<string>>(new Set());

  // Un "número de cartón" de adorno, estable para esta papeleta concreta
  // (derivado de sus propios números) — no se guarda en ningún sitio, es
  // pura ambientación para que se lea como un cartón real numerado.
  const cardNumber = useMemo(() => {
    const sum = card.grid.flat().reduce((total: number, n) => total + (n ?? 0), 0);
    return String(1000 + (sum % 9000)).padStart(4, "0");
  }, [card]);

  function finalizeTear(n: number) {
    setTearing((current) => {
      if (!current.has(n)) return current;
      const next = new Map(current);
      next.delete(n);
      return next;
    });
    setMarked((current) => new Set(current).add(n));
    markBingoCardNumber(card.cardIndex, n, true).catch(() => {
      setMarked((current) => {
        const next = new Set(current);
        next.delete(n);
        return next;
      });
    });
  }

  function handleTear(n: number, fromRotate: number, direction: 1 | -1) {
    if (prefersReducedMotion) {
      finalizeTear(n);
      return;
    }
    setTearing((current) => {
      const next = new Map(current);
      next.set(n, { fromRotate, direction });
      return next;
    });
  }

  /** Doble toque en un hueco: el número vuelve a su sitio (deshace el despegado). */
  function handleRestore(n: number) {
    setMarked((current) => {
      if (!current.has(n)) return current;
      const next = new Set(current);
      next.delete(n);
      return next;
    });
    setJustRestored((current) => new Set(current).add(n));
    // Ya ha dado tiempo de sobra a que se vea el rebote de entrada (ver
    // TearableNumber): a partir de aquí es un número normal como
    // cualquier otro, no hace falta seguir marcándolo.
    setTimeout(() => clearJustRestored(n), 500);
    markBingoCardNumber(card.cardIndex, n, false).catch(() => {
      setMarked((current) => new Set(current).add(n));
    });
  }

  function clearJustRestored(n: number) {
    setJustRestored((current) => {
      if (!current.has(n)) return current;
      const next = new Set(current);
      next.delete(n);
      return next;
    });
  }

  // Igual que finalizeTear/handleTear/handleRestore, pero sin llamar al
  // servidor: un hueco vacío es puro adorno, no forma parte de la partida.
  function finalizeTearBlank(key: string) {
    setTearingBlanks((current) => {
      if (!current.has(key)) return current;
      const next = new Map(current);
      next.delete(key);
      return next;
    });
    setTornBlanks((current) => new Set(current).add(key));
  }

  function handleTearBlank(key: string, fromRotate: number, direction: 1 | -1) {
    if (prefersReducedMotion) {
      finalizeTearBlank(key);
      return;
    }
    setTearingBlanks((current) => {
      const next = new Map(current);
      next.set(key, { fromRotate, direction });
      return next;
    });
  }

  function handleRestoreBlank(key: string) {
    setTornBlanks((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
    setJustRestoredBlanks((current) => new Set(current).add(key));
    setTimeout(() => clearJustRestoredBlank(key), 500);
  }

  function clearJustRestoredBlank(key: string) {
    setJustRestoredBlanks((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }

  return (
    <div className="mb-4 rounded-md border-2 border-gray-200 bg-[#e3f8e0] p-3 shadow-[0_10px_30px_-6px_rgba(0,0,0,0.35)]">
      <div className="mb-2 flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-wider text-green-700/70">
        <span>Cartón de Bingo{cardsCount > 1 ? ` · ${card.cardIndex + 1}/${cardsCount}` : ""}</span>
        <span>Nº {cardNumber}</span>
      </div>

      <div
        className="grid grid-cols-9 divide-x divide-y divide-green-900/15 overflow-hidden rounded-sm border border-green-900/25 bg-white"
        style={{ isolation: "isolate" }}
      >
        {card.grid.flatMap((row, rowIndex) =>
          row.map((n, colIndex) => {
            const key = `${rowIndex}-${colIndex}`;
            if (n === null) {
              // Ligero vaivén de ángulo entre casillas (determinista, no
              // aleatorio) para que el marca de agua no se vea repetida de
              // forma idéntica y mecánica en cada hueco.
              const tilt = (rowIndex + colIndex) % 2 === 0 ? 16 : -13;
              // No hay número real aquí, así que el hueco se identifica por
              // posición — tanto para el estado local (torn/tearing) como
              // para elegir una forma de rasgado propia (misma idea que
              // tornClipPathFor, pero con una semilla de posición en vez de
              // un número de bingo).
              const blankKey = `blank-${key}`;
              const blankSeed = rowIndex * row.length + colIndex;
              const isBlankTorn = tornBlanks.has(blankKey);
              const blankFlight = tearingBlanks.get(blankKey);
              const watermark = (
                <Image
                  src="/logo.png"
                  alt=""
                  fill
                  className="object-contain p-1 opacity-15"
                  style={{ transform: `rotate(${tilt}deg)` }}
                />
              );

              if (isBlankTorn) {
                return (
                  <div
                    key={key}
                    onDoubleClick={() => handleRestoreBlank(blankKey)}
                    className="relative aspect-square cursor-pointer bg-[#eefbec]"
                  >
                    <div
                      className="absolute inset-0 bg-black/10 shadow-[inset_0_2px_5px_rgba(0,0,0,0.4)]"
                      style={{ clipPath: tornClipPathFor(blankSeed) }}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={key}
                  className="relative aspect-square overflow-hidden"
                  style={{ zIndex: blankFlight ? 20 : "auto" }}
                >
                  {blankFlight ? (
                    <>
                      <div
                        className="absolute inset-0 bg-black/10 shadow-[inset_0_2px_5px_rgba(0,0,0,0.4)]"
                        style={{ clipPath: tornClipPathFor(blankSeed) }}
                      />
                      <motion.div
                        initial={{ rotate: blankFlight.fromRotate, opacity: 1, y: 0, x: 0 }}
                        animate={{
                          rotate: blankFlight.direction * PEEL_EXIT_DEG,
                          opacity: 0,
                          y: -14,
                          x: blankFlight.direction * 10,
                        }}
                        transition={{ duration: TEAR_FLIGHT_SECONDS, ease: "easeIn" }}
                        onAnimationComplete={() => finalizeTearBlank(blankKey)}
                        style={{ transformOrigin: "100% 0%", clipPath: tornClipPathFor(blankSeed) }}
                        className="absolute inset-0 z-10 bg-[#eefbec] shadow-lg"
                      >
                        {watermark}
                      </motion.div>
                    </>
                  ) : prefersReducedMotion ? (
                    <motion.div
                      drag
                      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                      onDragEnd={(_event, info) => {
                        const dist = Math.hypot(info.offset.x, info.offset.y);
                        const speed = Math.hypot(info.velocity.x, info.velocity.y);
                        if (dist > TEAR_DRAG_THRESHOLD || speed > TEAR_VELOCITY_THRESHOLD) {
                          finalizeTearBlank(blankKey);
                        }
                      }}
                      className="relative aspect-square cursor-grab touch-none select-none bg-[#eefbec] active:cursor-grabbing"
                    >
                      {watermark}
                    </motion.div>
                  ) : (
                    <TearableNumber
                      onTear={(fromRotate, direction) => handleTearBlank(blankKey, fromRotate, direction)}
                      justRestored={justRestoredBlanks.has(blankKey)}
                    >
                      <div className="relative h-full w-full bg-[#eefbec]">{watermark}</div>
                    </TearableNumber>
                  )}
                </div>
              );
            }

            const isTorn = marked.has(n);
            const flight = tearing.get(n);

            if (isTorn) {
              return (
                <div
                  key={key}
                  onDoubleClick={() => handleRestore(n)}
                  className="relative aspect-square cursor-pointer bg-[#eefbec]"
                >
                  <div
                    className="absolute inset-0 bg-black/10 shadow-[inset_0_2px_5px_rgba(0,0,0,0.4)]"
                    style={{ clipPath: tornClipPathFor(n) }}
                  />
                </div>
              );
            }

            return (
              <div key={key} className="relative aspect-square" style={{ zIndex: flight ? 20 : "auto" }}>
                {flight ? (
                  <>
                    <div
                      className="absolute inset-0 bg-black/10 shadow-[inset_0_2px_5px_rgba(0,0,0,0.4)]"
                      style={{ clipPath: tornClipPathFor(n) }}
                    />
                    <motion.div
                      initial={{ rotate: flight.fromRotate, opacity: 1, y: 0, x: 0 }}
                      animate={{
                        rotate: flight.direction * PEEL_EXIT_DEG,
                        opacity: 0,
                        y: -14,
                        x: flight.direction * 10,
                      }}
                      transition={{ duration: TEAR_FLIGHT_SECONDS, ease: "easeIn" }}
                      onAnimationComplete={() => finalizeTear(n)}
                      style={{ transformOrigin: "100% 0%", clipPath: tornClipPathFor(n) }}
                      className="absolute inset-0 z-10 flex items-center justify-center bg-white text-xs font-extrabold text-green-950 shadow-lg sm:text-sm"
                    >
                      {n}
                    </motion.div>
                  </>
                ) : prefersReducedMotion ? (
                  <motion.div
                    drag
                    dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                    onDragEnd={(_event, info) => {
                      const dist = Math.hypot(info.offset.x, info.offset.y);
                      const speed = Math.hypot(info.velocity.x, info.velocity.y);
                      if (dist > TEAR_DRAG_THRESHOLD || speed > TEAR_VELOCITY_THRESHOLD) {
                        finalizeTear(n);
                      }
                    }}
                    className="flex aspect-square cursor-grab touch-none items-center justify-center bg-white text-xs font-extrabold text-green-950 select-none active:cursor-grabbing sm:text-sm"
                  >
                    {n}
                  </motion.div>
                ) : (
                  <TearableNumber
                    onTear={(fromRotate, direction) => handleTear(n, fromRotate, direction)}
                    justRestored={justRestored.has(n)}
                  >
                    <div className="flex h-full w-full items-center justify-center bg-white text-xs font-extrabold text-green-950 sm:text-sm">
                      {n}
                    </div>
                  </TearableNumber>
                )}
              </div>
            );
          }),
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-green-700/60">
        <span>Arrastra un número para despegarlo</span>
        <span className="text-right">Doble toque en un hueco para recuperarlo</span>
      </div>
    </div>
  );
}

/**
 * Pide (o genera) las papeletas del visitante — una o varias, según
 * cards_per_visitor — y las apila, cada una como una SingleBingoCard
 * independiente. Vive por encima de la cuadrícula de números de
 * BingoBoard, nunca la sustituye.
 */
export function MyBingoCard({ autoAssignCards, cardsResetAt, cardsPerVisitor }: MyBingoCardProps) {
  const [cards, setCards] = useState<BingoCard[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!autoAssignCards) return;
    let cancelled = false;
    // Limpia las papeletas anteriores de inmediato (no esperar a la
    // respuesta): si esto se dispara por un reinicio del admin, las ya
    // marcadas no deben seguir viéndose ni un instante de más — ya no
    // existen en el servidor. Diferido con setTimeout(0) (mismo patrón que
    // BingoScreen/useRealtimeBingo): el cuerpo de un efecto no debe llamar
    // a setState de forma síncrona.
    const resetTimer = setTimeout(() => {
      setCards([]);
      setLoaded(false);
    }, 0);
    getOrCreateMyBingoCards().then((result) => {
      if (cancelled) return;
      setCards(result);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
      clearTimeout(resetTimer);
    };
  }, [autoAssignCards, cardsResetAt, cardsPerVisitor]);

  if (!autoAssignCards) return null;
  if (cards.length === 0) {
    if (!loaded) {
      return (
        <div className="mb-4 flex h-24 items-center justify-center rounded-md bg-white/60 shadow-md">
          <Spinner size={20} />
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {cards.map((card) => (
        <SingleBingoCard key={card.cardIndex} card={card} cardsCount={cards.length} />
      ))}
    </>
  );
}
