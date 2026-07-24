import Matter from "matter-js";

/**
 * Mundo físico (Matter.js) de la escena de la cena patronal: cacerola, tapa,
 * plato, vaso y dos hielos, todos cuerpos reales con masa/fricción/rebote en
 * vez de curvas de easing inventadas a mano. Esto es lo que hace que la tapa
 * SIEMPRE encaje con la cacerola (choca de verdad contra ella, no se coloca
 * por coordenadas adivinadas) y que su giro se frene por fricción angular
 * real, no por un keyframe con números fijos.
 *
 * Unidades: las mismas que el viewBox del SVG (`CenaPatronal.tsx`), no
 * píxeles. Por eso `GRAVITY_Y` está muy por debajo del valor por defecto de
 * Matter (pensado para escenas de cientos/miles de píxeles) — se calibró con
 * una simulación headless (sin renderizar nada) para que una caída de ~55
 * unidades tarde medio segundo, ver notas junto a cada constante.
 *
 * Nota sobre el "rebote": en pruebas headless, un cuerpo ancho y plano
 * (cacerola/plato/vaso) cayendo sobre un suelo igual de plano casi no rebota
 * visualmente aunque `restitution` sea alto — es un caso límite conocido de
 * los solvers 2D iterativos (el contacto simultáneo en ambas esquinas
 * absorbe el impulso de restitución). Por eso el "golpe" visible de esas
 * piezas al aterrizar no sale de `restitution` sino de un pequeño efecto de
 * aplastamiento disparado por el evento de colisión (ver
 * `useCenaPatronalPhysics`) — la FÍSICA real sigue gobernando cuándo y cómo
 * de rápido cae cada pieza y, sobre todo, cómo gira y se frena la tapa.
 */

export type PieceId = "pot" | "lid" | "plate" | "cup" | "ice1" | "ice2";

export interface CenaPatronalWorld {
  engine: Matter.Engine;
  bodies: Record<PieceId, Matter.Body>;
  floor: Matter.Body;
  /**
   * El vaso en sí es un rectángulo sólido (para que caiga/se pare como un
   * bloque, igual que la cacerola o el plato) — por eso los hielos NO
   * colisionan contra `bodies.cup` (ver `collisionFilter` más abajo), sino
   * contra este hueco/suelo interior, que no forma parte del cuerpo del vaso
   * y hay que ir "pegándolo" a su posición cada frame (ver
   * `useCenaPatronalPhysics`). La alternativa — un único cuerpo compuesto
   * vaso+hueco — desplaza el centroide real del cuerpo por debajo del centro
   * geométrico del dibujo (el hueco pesa menos que la base), lo que habría
   * obligado a corregir a mano el desfase en cada coordenada del SVG; con
   * cuerpos separados cada uno tiene su propio centro trivial.
   */
  cupPocket: { floor: Matter.Body; wallLeft: Matter.Body; wallRight: Matter.Body };
}

// ---- Geometría de la escena (mismas unidades que el viewBox del SVG) ----
export const SCENE_LEFT = -20;
export const SCENE_RIGHT = 135;
const SCENE_WIDTH = SCENE_RIGHT - SCENE_LEFT;
const FLOOR_TOP_Y = 6.5;
const FLOOR_THICKNESS = 6;

export const POT_X = 24;
export const PLATE_X = 66;
export const CUP_X = 97;

const POT_WIDTH = 32;
const POT_HEIGHT = 13;
const LID_WIDTH = 32;
const LID_HEIGHT = 6;
const PLATE_WIDTH = 30;
const PLATE_HEIGHT = 6;
export const CUP_WIDTH = 11;
export const CUP_HEIGHT = 22;
export const ICE_SIZE = 5;
// Profundidad (desde el borde superior) del hueco por el que caen los
// hielos, y grosor de sus paredes — el dibujo del vaso (CenaPatronal.tsx)
// usa estas mismas constantes para pintar la bebida a la altura correcta.
export const CUP_POCKET_DEPTH = 7;
export const CUP_WALL_THICKNESS = 1.4;

// Categorías de colisión: el vaso es un bloque sólido (para caer y pararse
// igual que la cacerola/el plato), así que los hielos NO pueden chocar contra
// él directamente — si lo hicieran, rebotarían en su cara superior en vez de
// caer dentro. En su lugar, los hielos sólo ven las paredes/suelo del hueco
// (`cupPocket`, ver más abajo), que siguen al vaso pero no son el vaso.
const CATEGORY_FLOOR_WALLS = 0x0001;
const CATEGORY_SOLIDS = 0x0002; // cacerola, tapa, plato, vaso
const CATEGORY_ICE = 0x0004;
const CATEGORY_CUP_POCKET = 0x0008;

// Calibrado con una simulación headless (ver historial): con este valor una
// caída de ~55 unidades tarda ~330ms y una de ~40 (los hielos) ~250ms — un
// ritmo parecido al que tenía la versión anterior con springs a mano. Si la
// caída se ve demasiado lenta/brusca una vez montado, este es el primer
// número a tocar.
const GRAVITY_Y = 0.9;

// Todas las piezas caen desde esta misma altura relativa a su punto de
// reposo, para que el tiempo de caída sea consistente entre ellas.
const DROP_HEIGHT_MAIN = 55;
const DROP_HEIGHT_ICE = 40;

function restingCenterYOnFloor(height: number): number {
  return FLOOR_TOP_Y - height / 2;
}

export const POT_REST_Y = restingCenterYOnFloor(POT_HEIGHT);
export const PLATE_REST_Y = restingCenterYOnFloor(PLATE_HEIGHT);
export const CUP_REST_Y = restingCenterYOnFloor(CUP_HEIGHT);
// Altura aproximada de la superficie superior de la cacerola/vaso, para
// posicionar la tapa y los hielos por encima antes de soltarlos.
const POT_TOP_Y = POT_REST_Y - POT_HEIGHT / 2;
const CUP_TOP_Y = CUP_REST_Y - CUP_HEIGHT / 2;

function lockRotation(body: Matter.Body) {
  // Cacerola/plato/vaso no deben volcar de lado al caer (un rectángulo alto
  // cayendo en un simulador 2D puede bascular de forma poco creíble) — sólo
  // la tapa y los hielos necesitan rotación real.
  Matter.Body.setInertia(body, Infinity);
}

/** Crea el motor y todos los cuerpos, listos para añadirse al mundo según el calendario de sueltas (ver useCenaPatronalPhysics). */
export function createCenaPatronalWorld(): CenaPatronalWorld {
  const engine = Matter.Engine.create();
  engine.gravity.y = GRAVITY_Y;

  const floor = Matter.Bodies.rectangle(
    (SCENE_LEFT + SCENE_RIGHT) / 2,
    FLOOR_TOP_Y + FLOOR_THICKNESS / 2,
    SCENE_WIDTH,
    FLOOR_THICKNESS,
    { isStatic: true, label: "floor", friction: 0.5, collisionFilter: { category: CATEGORY_FLOOR_WALLS, mask: 0xffffffff } },
  );
  const leftWall = Matter.Bodies.rectangle(SCENE_LEFT - 5, -40, 10, 260, {
    isStatic: true,
    label: "wall",
    collisionFilter: { category: CATEGORY_FLOOR_WALLS, mask: 0xffffffff },
  });
  const rightWall = Matter.Bodies.rectangle(SCENE_RIGHT + 5, -40, 10, 260, {
    isStatic: true,
    label: "wall",
    collisionFilter: { category: CATEGORY_FLOOR_WALLS, mask: 0xffffffff },
  });

  const solidsFilter = { category: CATEGORY_SOLIDS, mask: CATEGORY_FLOOR_WALLS | CATEGORY_SOLIDS };

  const pot = Matter.Bodies.rectangle(POT_X, POT_REST_Y - DROP_HEIGHT_MAIN, POT_WIDTH, POT_HEIGHT, {
    restitution: 0.3,
    friction: 0.5,
    frictionAir: 0.01,
    label: "pot",
    collisionFilter: solidsFilter,
  });
  lockRotation(pot);

  // La tapa parte ya torcida y con un empujón lateral + giro, como si se
  // hubiera dejado caer de cualquier manera — a partir de ahí, la física
  // decide cómo rebota sobre la cacerola y cuánto tarda en pararse de girar.
  const lid = Matter.Bodies.rectangle(POT_X + 3, POT_TOP_Y - DROP_HEIGHT_MAIN, LID_WIDTH, LID_HEIGHT, {
    restitution: 0.4,
    friction: 0.5,
    frictionAir: 0.02,
    label: "lid",
    collisionFilter: solidsFilter,
  });
  Matter.Body.setAngle(lid, -0.45);
  Matter.Body.setAngularVelocity(lid, 0.32);
  Matter.Body.setVelocity(lid, { x: 0.4, y: 0 });

  const plate = Matter.Bodies.rectangle(PLATE_X, PLATE_REST_Y - DROP_HEIGHT_MAIN, PLATE_WIDTH, PLATE_HEIGHT, {
    restitution: 0.28,
    friction: 0.5,
    frictionAir: 0.01,
    label: "plate",
    collisionFilter: solidsFilter,
  });
  lockRotation(plate);

  // El vaso es un bloque sólido (cae y se para como cualquier otra pieza) —
  // sólo colisiona con el suelo y otros sólidos, NUNCA con los hielos (ver
  // `cupPocket` más abajo, que es lo que de verdad "atrapa" a los hielos).
  const cup = Matter.Bodies.rectangle(CUP_X, CUP_REST_Y - DROP_HEIGHT_MAIN, CUP_WIDTH, CUP_HEIGHT, {
    restitution: 0.25,
    friction: 0.5,
    frictionAir: 0.01,
    label: "cup",
    collisionFilter: solidsFilter,
  });
  lockRotation(cup);

  const iceFilter = { category: CATEGORY_ICE, mask: CATEGORY_FLOOR_WALLS | CATEGORY_ICE | CATEGORY_CUP_POCKET };

  // Los dos hielos caen uno ligeramente antes que el otro y con giros
  // opuestos, para que no parezcan una copia el uno del otro al caer.
  const ice1 = Matter.Bodies.rectangle(CUP_X - 3, CUP_TOP_Y - DROP_HEIGHT_ICE, ICE_SIZE, ICE_SIZE, {
    restitution: 0.35,
    friction: 0.35,
    frictionAir: 0.015,
    label: "ice1",
    collisionFilter: iceFilter,
  });
  Matter.Body.setAngularVelocity(ice1, 0.22);

  const ice2 = Matter.Bodies.rectangle(CUP_X + 3.2, CUP_TOP_Y - DROP_HEIGHT_ICE - 8, ICE_SIZE - 0.5, ICE_SIZE - 0.5, {
    restitution: 0.35,
    friction: 0.35,
    frictionAir: 0.015,
    label: "ice2",
    collisionFilter: iceFilter,
  });
  Matter.Body.setAngularVelocity(ice2, -0.26);

  // Hueco del vaso por el que caen los hielos: NO forma parte del cuerpo del
  // vaso (ver el comentario de `CenaPatronalWorld.cupPocket`) — se crea aquí
  // con una posición cualquiera porque, en cuanto el vaso empiece a caer, se
  // reposiciona pegado a él en cada frame (ver `useCenaPatronalPhysics`).
  const pocketFilter = { category: CATEGORY_CUP_POCKET, mask: CATEGORY_ICE };
  const cupPocketFloor = Matter.Bodies.rectangle(CUP_X, 0, CUP_WIDTH - 2 * CUP_WALL_THICKNESS, 2, {
    isStatic: true,
    label: "cupFloor",
    friction: 0.4,
    collisionFilter: pocketFilter,
  });
  const cupPocketWallLeft = Matter.Bodies.rectangle(CUP_X - (CUP_WIDTH / 2 - CUP_WALL_THICKNESS / 2), 0, CUP_WALL_THICKNESS, CUP_POCKET_DEPTH, {
    isStatic: true,
    label: "cupWall",
    collisionFilter: pocketFilter,
  });
  const cupPocketWallRight = Matter.Bodies.rectangle(CUP_X + (CUP_WIDTH / 2 - CUP_WALL_THICKNESS / 2), 0, CUP_WALL_THICKNESS, CUP_POCKET_DEPTH, {
    isStatic: true,
    label: "cupWall",
    collisionFilter: pocketFilter,
  });

  Matter.World.add(engine.world, [floor, leftWall, rightWall]);

  return {
    engine,
    floor,
    bodies: { pot, lid, plate, cup, ice1, ice2 },
    cupPocket: { floor: cupPocketFloor, wallLeft: cupPocketWallLeft, wallRight: cupPocketWallRight },
  };
}

// Milisegundos, desde que arranca la escena, en los que se SUELTA (se añade
// al mundo y empieza a caer) cada pieza — mismo ritmo de stagger que tenía la
// versión anterior basada en Framer Motion, para no perder la coreografía ya
// ajustada: cacerola, tapa, plato, vaso, hielo 1, hielo 2.
export const RELEASE_AT_MS: Record<PieceId, number> = {
  pot: 0,
  lid: 350,
  plate: 700,
  cup: 1050,
  ice1: 1400,
  ice2: 1650,
};
