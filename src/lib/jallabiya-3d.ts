/* ============================================================
   KAS THREADZ · the jallabiya in three dimensions

   The garment is cut in code rather than loaded from a model file,
   so its proportions stay in the studio's hands and match the drawn
   preview: a body that falls straight and flares a little to the
   hem, shoulders that slope in to a small round neck, and sleeves
   set in at the shoulder that hang close to the body.

   Everything is in metres, measured up from the hem. y is up, z
   points out of the front of the garment, x to its left.

   It is a ghost mannequin: the cloth holds the shape of a body
   that is not there, so the inside shows through the neck and the
   cuffs. The chosen neckline is projected onto the chest with its
   arm tips on the shoulder seams, the same rule the drawn preview
   follows.
   ============================================================ */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DecalGeometry } from "three/addons/geometries/DecalGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { luminance, shade } from "./garment";
import { NECKLINE_FIT, type NecklineFit } from "./neckline-fit";
import { STITCHES, STITCH_DURATION, STITCH_FRONT, chalkFor } from "./stitching";
import type { ThreadTones } from "./loom-preview";

const TAU = Math.PI * 2;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/* ---------------------------------------------------------------- the cut */

const CUT = {
  /** the side neck point, the highest point of the garment */
  neckY: 1.44,
  neckHalf: 0.062,
  neckDepth: 0.058,
  /** the neck sits a touch back of centre, as it does on a body */
  neckZ: -0.012,
  /** how far the front of the neck scoops below the side neck point */
  frontDrop: 0.07,
  backDrop: 0.012,
  /** where the straight walls give way to the shoulder, at the side, front and back */
  wallSide: 1.37,
  wallFront: 1.2,
  wallBack: 1.28,
  /** the shoulder slope, as a rise per unit run in from the shoulder point */
  slope: 0.18,
  /** 2 is an ellipse; higher squares the body off, the way cloth hangs from shoulders */
  squareness: 2.5,
};

/** [height, half width, half depth], hem to shoulder */
const PROFILE: Array<[number, number, number]> = [
  [0.0, 0.24, 0.152],
  [0.4, 0.222, 0.138],
  [0.8, 0.2, 0.126],
  [1.05, 0.19, 0.12],
  [1.2, 0.187, 0.118],
  [1.3, 0.19, 0.114],
  [1.45, 0.196, 0.106],
];

/** Half width and half depth of the body at a height: a smooth curve through PROFILE. */
function profile(y: number): { a: number; b: number } {
  const k = PROFILE;
  let i = 0;
  while (i < k.length - 2 && y > k[i + 1][0]) i++;
  const [y0, a0, b0] = k[i];
  const [y1, a1, b1] = k[i + 1];
  const t = Math.min(1, Math.max(0, (y - y0) / (y1 - y0)));
  const slope = (j: number, c: 1 | 2) => {
    const lo = k[Math.max(0, j - 1)];
    const hi = k[Math.min(k.length - 1, j + 1)];
    return (hi[c] - lo[c]) / (hi[0] - lo[0]);
  };
  const h = (c: 1 | 2, p0: number, p1: number) => {
    const m0 = slope(i, c) * (y1 - y0);
    const m1 = slope(i + 1, c) * (y1 - y0);
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * m1;
  };
  return { a: h(1, a0, a1), b: h(2, b0, b1) };
}

/** A point on the body's cross section: theta 0 is the centre front, a quarter turn is the left side. */
function section(theta: number, y: number): THREE.Vector3 {
  const { a, b } = profile(y);
  const e = 2 / CUT.squareness;
  const s = Math.sin(theta), c = Math.cos(theta);
  return V(a * Math.sign(s) * Math.abs(s) ** e, y, b * Math.sign(c) * Math.abs(c) ** e);
}

function neckPoint(theta: number): THREE.Vector3 {
  const c = Math.cos(theta);
  const y =
    CUT.neckY -
    CUT.frontDrop * Math.max(0, c) ** 2 -
    CUT.backDrop * Math.max(0, -c) ** 2;
  return V(CUT.neckHalf * Math.sin(theta), y, CUT.neckZ + CUT.neckDepth * c);
}

function wallTop(theta: number): number {
  const s2 = Math.sin(theta) ** 2;
  const fb = Math.cos(theta) >= 0 ? CUT.wallFront : CUT.wallBack;
  return CUT.wallSide * s2 + fb * (1 - s2);
}

/**
 * One line of the body from hem to neck, densely sampled: straight down the
 * wall, then over the shoulder in a single curve that leaves the wall
 * vertically and arrives at the neck along the shoulder slope.
 */
function column(theta: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const yw = wallTop(theta);
  const wallSteps = 90;
  for (let k = 0; k <= wallSteps; k++) pts.push(section(theta, (yw * k) / wallSteps));
  const w = section(theta, yw);
  const n = neckPoint(theta);
  const run = Math.hypot(w.x - n.x, w.z - n.z);
  const q = V(w.x, Math.max(w.y + 0.01, n.y - CUT.slope * run), w.z);
  const topSteps = 70;
  for (let k = 1; k <= topSteps; k++) {
    const t = k / topSteps, u = 1 - t;
    pts.push(
      V(
        u * u * w.x + 2 * u * t * q.x + t * t * n.x,
        u * u * w.y + 2 * u * t * q.y + t * t * n.y,
        u * u * w.z + 2 * u * t * q.z + t * t * n.z,
      ),
    );
  }
  return pts;
}

/** Arc length along a polyline, at every point. */
function lengths(pts: THREE.Vector3[]): number[] {
  const out = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + pts[i].distanceTo(pts[i - 1]));
  return out;
}

/** The point a given distance along a polyline. */
function at(pts: THREE.Vector3[], len: number[], d: number): THREE.Vector3 {
  const total = len[len.length - 1];
  const target = Math.min(total, Math.max(0, d));
  let i = 1;
  while (i < len.length - 1 && len[i] < target) i++;
  const t = (target - len[i - 1]) / (len[i] - len[i - 1] || 1);
  return pts[i - 1].clone().lerp(pts[i], t);
}

/** Make the two copies of a seam column share one normal, so no crease shows down the back. */
function weldSeam(geo: THREE.BufferGeometry, cols: number, rows: number) {
  const n = geo.attributes.normal as THREE.BufferAttribute;
  const tmp = V();
  for (let j = 0; j <= rows; j++) {
    const a = j * (cols + 1);
    const b = a + cols;
    tmp.set(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize();
    n.setXYZ(a, tmp.x, tmp.y, tmp.z);
    n.setXYZ(b, tmp.x, tmp.y, tmp.z);
  }
  n.needsUpdate = true;
}

/** A grid of points into an indexed surface, columns around and rows along. */
function surface(
  grid: THREE.Vector3[][],
  uv: (i: number, j: number) => [number, number],
  flip: boolean,
): THREE.BufferGeometry {
  const cols = grid.length - 1;
  const rows = grid[0].length - 1;
  const pos: number[] = [];
  const uvs: number[] = [];
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const p = grid[i][j];
      pos.push(p.x, p.y, p.z);
      uvs.push(...uv(i, j));
    }
  }
  const idx: number[] = [];
  const v = (i: number, j: number) => j * (cols + 1) + i;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = v(i, j), b = v(i + 1, j), c = v(i, j + 1), d = v(i + 1, j + 1);
      if (flip) idx.push(a, c, b, b, c, d);
      else idx.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  weldSeam(geo, cols, rows);
  return geo;
}

const BODY_COLS = 176;
const BODY_ROWS = 200;

type Body = {
  geometry: THREE.BufferGeometry;
  /** each column hem to neck, densely sampled, with its arc lengths */
  columns: Array<{ pts: THREE.Vector3[]; len: number[] }>;
};

function buildBody(): Body {
  const columns: Body["columns"] = [];
  const grid: THREE.Vector3[][] = [];
  const along: number[][] = [];
  for (let i = 0; i <= BODY_COLS; i++) {
    const theta = (i / BODY_COLS) * TAU;
    const pts = column(theta);
    const len = lengths(pts);
    columns.push({ pts, len });
    const total = len[len.length - 1];
    const col: THREE.Vector3[] = [];
    const vs: number[] = [];
    for (let j = 0; j <= BODY_ROWS; j++) {
      // rows a little closer together over the shoulder, where the curve is
      const f = j / BODY_ROWS;
      const d = total * (f + 0.06 * Math.sin(f * Math.PI) * f);
      col.push(at(pts, len, Math.min(total, d)));
      vs.push(Math.min(total, d));
    }
    grid.push(col);
    along.push(vs);
  }
  // counter clockwise seen from outside: across (round the body) then up
  const geometry = surface(grid, (i, j) => [(i / BODY_COLS) * 1.45, along[i][j]], false);
  return { geometry, columns };
}

/* ------------------------------------------------------------ the sleeves */

/**
 * A set-in sleeve. It starts inside the body as the armhole, a tall oval
 * standing on the side of the torso, leaves the body sideways at the shoulder
 * and turns to fall down the arm, narrowing to the cuff. Swept along that one
 * curve, the sleeve's upper line runs straight on from the shoulder the way a
 * real one does; a tube capped with a dome, as a first attempt had it, sits
 * on the shoulder like a puff.
 */
const SLEEVE = {
  /** the armhole centre, inside the body so the join never shows */
  start: { x: 0.135, y: 1.275, z: 0 },
  /** where the sleeve has finished turning from sideways to downwards */
  turn: { x: 0.228, y: 1.245, z: 0.005 },
  /** the centre of the cuff. The arm hangs a little forward, close to the body */
  cuff: { x: 0.262, y: 0.78, z: 0.028 },
  /** the armhole: half its height, and half its depth */
  armhole: { tall: 0.102, deep: 0.082 },
  /** the sleeve below the turn, and at the cuff */
  upper: { wide: 0.068, deep: 0.06 },
  wrist: { wide: 0.062, deep: 0.055 },
};
const SLEEVE_AROUND = 88;
const SLEEVE_ALONG = 150;

type Sleeve = {
  geometry: THREE.BufferGeometry;
  point: (s: number, phi: number) => THREE.Vector3;
  centre: (s: number) => THREE.Vector3;
  length: number;
};

function buildSleeve(side: 1 | -1): Sleeve {
  const p0 = V(side * SLEEVE.start.x, SLEEVE.start.y, SLEEVE.start.z);
  const p1 = V(side * SLEEVE.turn.x, SLEEVE.turn.y, SLEEVE.turn.z);
  const p2 = V(side * SLEEVE.cuff.x, SLEEVE.cuff.y, SLEEVE.cuff.z);
  const bez = (t: number) => {
    const u = 1 - t;
    return p0.clone().multiplyScalar(u * u).addScaledVector(p1, 2 * u * t).addScaledVector(p2, t * t);
  };

  // sample the path densely, then step along it evenly by length
  const dense: THREE.Vector3[] = [];
  for (let k = 0; k <= 600; k++) dense.push(bez(k / 600));
  const dlen = lengths(dense);
  const length = dlen[dlen.length - 1];
  const centres: THREE.Vector3[] = [];
  for (let k = 0; k <= SLEEVE_ALONG; k++) centres.push(at(dense, dlen, (length * k) / SLEEVE_ALONG));

  // frames carried along the path without twisting: N starts pointing up,
  // so at the armhole it spans the oval's height, and turns outward by the cuff
  const T: THREE.Vector3[] = [];
  const N: THREE.Vector3[] = [];
  const B: THREE.Vector3[] = [];
  for (let k = 0; k <= SLEEVE_ALONG; k++) {
    const a = centres[Math.max(0, k - 1)];
    const b = centres[Math.min(SLEEVE_ALONG, k + 1)];
    T.push(b.clone().sub(a).normalize());
  }
  N.push(V(0, 1, 0).sub(T[0].clone().multiplyScalar(T[0].y)).normalize());
  B.push(T[0].clone().cross(N[0]).normalize());
  for (let k = 1; k <= SLEEVE_ALONG; k++) {
    const axis = T[k - 1].clone().cross(T[k]);
    const n = N[k - 1].clone();
    const sin = axis.length();
    if (sin > 1e-6) {
      const angle = Math.asin(Math.min(1, sin));
      n.applyAxisAngle(axis.normalize(), angle);
    }
    N.push(n.normalize());
    B.push(T[k].clone().cross(n).normalize());
  }

  const smooth01 = (x: number) => x * x * (3 - 2 * x);
  const radii = (f: number) => {
    // from the tall armhole to the sleeve over the first third, then a gentle taper
    const k = smooth01(Math.min(1, f / 0.32));
    const g = Math.max(0, (f - 0.32) / 0.68);
    const wide = SLEEVE.upper.wide + (SLEEVE.wrist.wide - SLEEVE.upper.wide) * g;
    const deep = SLEEVE.upper.deep + (SLEEVE.wrist.deep - SLEEVE.upper.deep) * g;
    return {
      n: SLEEVE.armhole.tall + (wide - SLEEVE.armhole.tall) * k,
      b: SLEEVE.armhole.deep + (deep - SLEEVE.armhole.deep) * k,
    };
  };

  const index = (s: number) => Math.min(SLEEVE_ALONG, Math.max(0, (s / length) * SLEEVE_ALONG));
  const frameAt = (s: number) => {
    const x = index(s);
    const k = Math.min(SLEEVE_ALONG - 1, Math.floor(x));
    const t = x - k;
    return {
      c: centres[k].clone().lerp(centres[k + 1], t),
      n: N[k].clone().lerp(N[k + 1], t).normalize(),
      b: B[k].clone().lerp(B[k + 1], t).normalize(),
      r: radii(x / SLEEVE_ALONG),
    };
  };
  const centre = (s: number) => frameAt(s).c;
  const point = (s: number, phi: number) => {
    const f = frameAt(s);
    return f.c.addScaledVector(f.n, f.r.n * Math.cos(phi)).addScaledVector(f.b, f.r.b * Math.sin(phi));
  };

  const grid: THREE.Vector3[][] = [];
  for (let i = 0; i <= SLEEVE_AROUND; i++) {
    const phi = (i / SLEEVE_AROUND) * TAU;
    const col: THREE.Vector3[] = [];
    for (let k = 0; k <= SLEEVE_ALONG; k++) {
      const r = radii(k / SLEEVE_ALONG);
      col.push(
        centres[k].clone().addScaledVector(N[k], r.n * Math.cos(phi)).addScaledVector(B[k], r.b * Math.sin(phi)),
      );
    }
    grid.push(col);
  }
  // round the sleeve, then down it: outward when (B x T) points along N
  const outward = B[0].clone().cross(T[0]).dot(N[0]) > 0;
  const geometry = surface(
    grid,
    (i, j) => [(i / SLEEVE_AROUND) * TAU * SLEEVE.upper.wide, (length * j) / SLEEVE_ALONG],
    !outward,
  );
  return { geometry, point, centre, length };
}

/* ------------------------------------------------------- finishing details */

/** A rolled edge: a thin tube of cloth along a closed line, which gives an edge its thickness. */
function roll(points: THREE.Vector3[], radius: number): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points, true, "centripetal");
  return new THREE.TubeGeometry(curve, points.length * 2, radius, 8, true);
}

/**
 * Running stitch along a closed line, as individual stitches: never a dashed
 * stroke, which reads as a seam line rather than as thread.
 */
function stitchMatrices(
  points: THREE.Vector3[],
  normals: THREE.Vector3[],
  stitch = 0.0056,
  gap = 0.0038,
): THREE.Matrix4[] {
  const out: THREE.Matrix4[] = [];
  const closed = [...points, points[0]];
  const norms = [...normals, normals[0]];
  const len = lengths(closed);
  const total = len[len.length - 1];
  const q = new THREE.Quaternion();
  const basis = new THREE.Matrix4();
  for (let d = stitch / 2; d < total - stitch / 2; d += stitch + gap) {
    const p = at(closed, len, d);
    const tangent = at(closed, len, d + 0.001).sub(at(closed, len, d - 0.001)).normalize();
    const n = at(norms, len, d).normalize();
    const b = tangent.clone().cross(n).normalize();
    const nn = b.clone().cross(tangent).normalize();
    basis.makeBasis(tangent, nn, b);
    q.setFromRotationMatrix(basis);
    out.push(new THREE.Matrix4().compose(p.addScaledVector(nn, 0.0012), q, V(1, 1, 1)));
  }
  return out;
}

/** The outward normal of the body wall at a height, from the change round the section. */
function wallNormal(theta: number, y: number): THREE.Vector3 {
  const e = 0.002;
  const tangent = section(theta + e, y).sub(section(theta - e, y));
  return tangent.cross(V(0, 1, 0)).normalize();
}

/* ---------------------------------------------------------------- textures */

function radialShadow(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(20,14,16,0.55)");
  grad.addColorStop(0.55, "rgba(20,14,16,0.2)");
  grad.addColorStop(1, "rgba(20,14,16,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The neck slit: the opening itself, topstitched down both sides and bar tacked at the foot. */
function slitTexture(stitch: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 96;
  c.height = 640;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = "rgba(0,0,0,0.5)";
  g.fillRect(46, 0, 4, 600);
  g.fillStyle = "rgba(255,255,255,0.12)";
  g.fillRect(50, 0, 2, 598);
  g.strokeStyle = stitch;
  g.lineWidth = 3;
  g.lineCap = "round";
  g.setLineDash([13, 9]);
  for (const x of [30, 66]) {
    g.beginPath();
    g.moveTo(x, 8);
    g.lineTo(x, 612);
    g.stroke();
  }
  g.setLineDash([]);
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(26, 620);
  g.lineTo(70, 620);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ------------------------------------------------------------------ stage */

type ViewName = "front" | "side" | "back";

const NECK_FOCUS = V(0, 1.2, 0.04);
/** where it opens and returns to: the whole garment, filling the pane */
const HOME = { target: V(0, 0.72, 0), distance: 3.12 };
/** the camera sits a little above what it looks at, looking very slightly down */
const LIFT = 0.1;

/**
 * The 3D preview: renderer, light, camera and the garment, driven from the
 * Loom's configuration. It draws only when something changes, so it costs
 * nothing while it is being looked at.
 */
export class JallabiyaStage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(28, 0.62, 0.05, 30);
  private controls: OrbitControls;
  private pmrem: THREE.PMREMGenerator;
  private resize: ResizeObserver;
  private frame = 0;
  private disposables: Array<{ dispose: () => void }> = [];

  private body: Body;
  private bodyMesh: THREE.Mesh;
  private cloth: THREE.MeshPhysicalMaterial;
  private inside: THREE.MeshStandardMaterial;
  private stitches: THREE.InstancedMesh;
  private stitchMat: THREE.MeshStandardMaterial;
  private weave: Record<string, THREE.Texture> = {};
  private slit: THREE.Mesh;
  private slitMat: THREE.MeshStandardMaterial;
  private design: THREE.Mesh | null = null;
  private designToken = 0;
  private stitchColour = "#000000";

  /* sewing a newly chosen neckline in: how much of it is sewn (past 1 is all
     of it), the chalk guide under it, and the needle at the working edge */
  private reveal = { value: 2 };
  private chalkTone = { value: new THREE.Color("#6f84a3") };
  private chalk: THREE.Mesh | null = null;
  /* the thread: off keeps the design's own colours, on runs it in these tones */
  private threadOn = { value: 0 };
  private threadDark = { value: new THREE.Color() };
  private threadMid = { value: new THREE.Color() };
  private threadLight = { value: new THREE.Color() };
  private needle = new THREE.Group();
  private sewing: {
    start: number;
    track: Array<{ p: THREE.Vector3; n: THREE.Vector3 }>;
    keepalive: number;
  } | null = null;

  private tween: {
    from: { pos: THREE.Vector3; target: THREE.Vector3 };
    to: { pos: THREE.Vector3; target: THREE.Vector3 };
    start: number;
    ms: number;
  } | null = null;
  private reduced = false;

  constructor(private host: HTMLElement) {
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x000000, 0);
    const canvas = this.renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.setAttribute("aria-label", "A 3D model of the jallabiya. Drag to turn it round.");
    canvas.setAttribute("role", "img");
    host.appendChild(canvas);

    /* a soft studio room for the cloth to reflect, so silk has something to shine with */
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.scene.environment = this.pmrem.fromScene(room, 0.04).texture;
    this.scene.environmentIntensity = 0.42;
    room.dispose();

    this.light();

    /* ---- the garment ---- */
    this.cloth = new THREE.MeshPhysicalMaterial({ side: THREE.FrontSide });
    this.inside = new THREE.MeshStandardMaterial({ side: THREE.BackSide, roughness: 1 });
    this.body = buildBody();
    this.bodyMesh = this.add(new THREE.Mesh(this.body.geometry, this.cloth), true);
    this.add(new THREE.Mesh(this.body.geometry, this.inside), false);

    const sleeves = [buildSleeve(1), buildSleeve(-1)];
    for (const sl of sleeves) {
      this.add(new THREE.Mesh(sl.geometry, this.cloth), true);
      this.add(new THREE.Mesh(sl.geometry, this.inside), false);
    }

    /* the rolled edges at hem, cuffs and neck */
    const hem: THREE.Vector3[] = [];
    const neck: THREE.Vector3[] = [];
    for (let k = 0; k < 220; k++) {
      const th = (k / 220) * TAU;
      hem.push(section(th, 0.004));
      neck.push(neckPoint(th).add(V(0, -0.003, 0)));
    }
    this.add(new THREE.Mesh(roll(hem, 0.0045), this.cloth), true);
    this.add(new THREE.Mesh(roll(neck, 0.0048), this.cloth), true);
    for (const sl of sleeves) {
      const ring: THREE.Vector3[] = [];
      for (let k = 0; k < 96; k++) ring.push(sl.point(sl.length - 0.003, (k / 96) * TAU));
      this.add(new THREE.Mesh(roll(ring, 0.0042), this.cloth), true);
    }

    /* the topstitching */
    const matrices: THREE.Matrix4[] = [];
    {
      const pts: THREE.Vector3[] = [];
      const nrm: THREE.Vector3[] = [];
      for (let k = 0; k < 360; k++) {
        const th = (k / 360) * TAU;
        pts.push(section(th, 0.032));
        nrm.push(wallNormal(th, 0.032));
      }
      matrices.push(...stitchMatrices(pts, nrm));
    }
    {
      const pts: THREE.Vector3[] = [];
      const nrm: THREE.Vector3[] = [];
      for (let i = 0; i < BODY_COLS; i++) {
        const { pts: col, len } = this.body.columns[i];
        const total = len[len.length - 1];
        const p = at(col, len, total - 0.014);
        const q = at(col, len, total - 0.02);
        const r = at(col, len, total - 0.008);
        const th = (i / BODY_COLS) * TAU;
        const across = neckPoint(th + 0.01).sub(neckPoint(th - 0.01));
        pts.push(p);
        // round the neck, crossed with up the column, points out of the cloth
        nrm.push(across.cross(r.sub(q)).normalize());
      }
      matrices.push(...stitchMatrices(pts, nrm, 0.005, 0.0034));
    }
    for (const sl of sleeves) {
      for (const back of [0.012, 0.03]) {
        const pts: THREE.Vector3[] = [];
        const nrm: THREE.Vector3[] = [];
        for (let k = 0; k < 120; k++) {
          const phi = (k / 120) * TAU;
          const p = sl.point(sl.length - back, phi);
          pts.push(p);
          nrm.push(p.clone().sub(sl.centre(sl.length - back)).normalize());
        }
        matrices.push(...stitchMatrices(pts, nrm));
      }
    }
    const stitchGeo = new THREE.BoxGeometry(1, 1, 1);
    stitchGeo.scale(0.0056, 0.0011, 0.0012);
    this.stitchMat = new THREE.MeshStandardMaterial({ roughness: 0.55 });
    this.stitches = new THREE.InstancedMesh(stitchGeo, this.stitchMat, matrices.length);
    matrices.forEach((m, i) => this.stitches.setMatrixAt(i, m));
    this.stitches.instanceMatrix.needsUpdate = true;
    this.stitches.castShadow = false;
    this.scene.add(this.stitches);
    this.disposables.push(stitchGeo, this.stitchMat);

    /* the neck slit, projected onto the front */
    this.bodyMesh.updateMatrixWorld(true);
    const front = neckPoint(0);
    const slitGeo = new DecalGeometry(
      this.bodyMesh,
      V(0, front.y - 0.074, 0.13),
      new THREE.Euler(),
      V(0.028, 0.16, 0.26),
    );
    this.slitMat = new THREE.MeshStandardMaterial({
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      roughness: 0.9,
    });
    this.slit = new THREE.Mesh(slitGeo, this.slitMat);
    this.slit.receiveShadow = true;
    this.scene.add(this.slit);
    this.disposables.push(slitGeo, this.slitMat);

    /* the soft shadow the garment leaves on the floor */
    const shadowTex = radialShadow();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.75),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.004, 0.02);
    this.scene.add(floor);
    this.disposables.push(shadowTex, floor.geometry, floor.material as THREE.Material);

    /* the needle, as the house mark draws it: a steel shaft rising from its
       point, an eye near the top, and a bright point where it enters the cloth */
    const steel = new THREE.MeshStandardMaterial({ color: 0xe3e8ee, metalness: 0.9, roughness: 0.22 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0017, 0.066, 10), steel);
    shaft.position.y = 0.033;
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.0028, 0.0006, 6, 16), steel);
    eye.position.y = 0.057;
    const pointMat = new THREE.MeshBasicMaterial({ color: 0xfffaf0 });
    const point = new THREE.Mesh(new THREE.SphereGeometry(0.0032, 12, 8), pointMat);
    this.needle.add(shaft, eye, point);
    this.needle.visible = false;
    this.scene.add(this.needle);
    this.disposables.push(shaft.geometry, eye.geometry, point.geometry, steel, pointMat);

    /* ---- the camera, and turning it round ---- */
    this.camera.position.set(0, HOME.target.y + LIFT, HOME.distance);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.copy(HOME.target);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.09;
    this.controls.rotateSpeed = 0.75;
    this.controls.zoomToCursor = true;
    this.controls.minDistance = 0.42;
    this.controls.maxDistance = 4.4;
    this.controls.minPolarAngle = Math.PI * 0.18;
    this.controls.maxPolarAngle = Math.PI * 0.62;
    this.controls.screenSpacePanning = true;
    this.controls.addEventListener("change", this.request);
    this.controls.addEventListener("start", () => (this.tween = null));
    this.controls.update();

    this.resize = new ResizeObserver(() => this.fit());
    this.resize.observe(host);
    this.fit();
  }

  private add(mesh: THREE.Mesh, outer: boolean): THREE.Mesh {
    mesh.castShadow = outer;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.disposables.push(mesh.geometry);
    return mesh;
  }

  private light() {
    /* sky and floor bounce */
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xd9cfbf, 0.34));
    /* the key: high and to the front left, as a product shot is lit */
    const key = new THREE.DirectionalLight(0xfff6ea, 2.7);
    key.position.set(-1.6, 3.2, 2.6);
    key.target.position.copy(HOME.target);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -0.8;
    key.shadow.camera.right = 0.8;
    key.shadow.camera.top = 0.95;
    key.shadow.camera.bottom = -0.95;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 7;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.015;
    key.shadow.radius = 5;
    this.scene.add(key, key.target);
    /* a fill from the right so the shadow side still reads as cloth */
    const fill = new THREE.DirectionalLight(0xeef2ff, 0.38);
    fill.position.set(2.4, 1.6, 2);
    this.scene.add(fill);
    /* and a rim from behind to lift the silhouette off the paper */
    const rim = new THREE.DirectionalLight(0xffffff, 0.8);
    rim.position.set(1.2, 2.4, -3);
    this.scene.add(rim);
  }

  private weaveFor(fabric: string): THREE.Texture {
    if (!this.weave[fabric]) {
      const t = new THREE.TextureLoader().load(`/img/cloth/${fabric}.png`, () => this.request());
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      // the body's texture coordinates are in metres; one tile covers 3cm
      t.repeat.set(1 / 0.03, 1 / 0.03);
      t.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      t.colorSpace = THREE.NoColorSpace;
      this.weave[fabric] = t;
      this.disposables.push(t);
    }
    return this.weave[fabric];
  }

  /** The cloth: its colour and how it takes the light. */
  setCloth(hex: string, fabric: string) {
    const silk = fabric === "silk";
    const c = this.cloth;
    c.color.set(hex);
    c.roughness = silk ? 0.38 : 0.9;
    c.metalness = 0;
    c.specularIntensity = silk ? 0.7 : 0.18;
    c.sheen = silk ? 0.9 : 0.55;
    c.sheenRoughness = silk ? 0.32 : 0.75;
    c.sheenColor.set(shade(hex, silk ? 60 : 40));
    // satin catches the light in streaks along the warp
    c.anisotropy = silk ? 0.55 : 0;
    c.anisotropyRotation = Math.PI / 2;
    c.bumpMap = this.weaveFor(silk ? "silk" : "cotton");
    c.bumpScale = silk ? 0.35 : 0.9;
    c.needsUpdate = true;

    this.inside.color.set(shade(hex, -38));
    this.inside.bumpMap = c.bumpMap;
    this.inside.needsUpdate = true;

    this.stitchColour = luminance(hex) > 0.42 ? shade(hex, -62) : shade(hex, 52);
    this.chalkTone.value.set(chalkFor(luminance(hex)));
    this.stitchMat.color.set(this.stitchColour);

    this.slitMat.map?.dispose();
    this.slitMat.map = slitTexture(this.stitchColour);
    this.slitMat.needsUpdate = true;
    this.request();
  }

  /**
   * The neckline, projected onto the chest. Its arm tips sit just below the
   * shoulder seams, at the same share of the shoulder width as in the drawn
   * preview; a design that is mostly drop is held to a height cap and meets
   * the seams nearer the neck.
   *
   * With `sew`, it is stitched in rather than simply shown: a chalk guide of
   * the whole design first, then the design laid down in its sewing order with
   * the needle at the working edge, as the flat preview does.
   */
  setDesign(href: string | null, sew = false) {
    const token = ++this.designToken;
    this.finishSewing();
    const clear = () => {
      if (this.chalk) {
        this.scene.remove(this.chalk);
        (this.chalk.material as THREE.Material).dispose();
        this.chalk = null;
      }
      if (!this.design) return;
      this.scene.remove(this.design);
      this.design.geometry.dispose();
      const m = this.design.material as THREE.MeshStandardMaterial;
      m.map?.dispose();
      (m.userData.order as THREE.Texture | undefined)?.dispose();
      m.dispose();
      this.design = null;
    };
    const fit = href ? NECKLINE_FIT[href] : null;
    if (!href || !fit) {
      clear();
      this.request();
      return;
    }
    const loader = new THREE.TextureLoader();
    Promise.all([
      loader.loadAsync(href),
      // the sewing order; without it the design is simply shown, sewn
      loader.loadAsync(href.replace(/\.png$/, "-order.png")).catch(() => null),
    ]).then(([tex, order]) => {
      if (token !== this.designToken) {
        tex.dispose();
        order?.dispose();
        return;
      }
      clear();
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

      const shoulder = profile(CUT.wallSide).a;
      let w = (0.77 * shoulder) / fit.span;
      let h = w / fit.ratio;
      const maxH = 0.6;
      if (h > maxH) {
        h = maxH;
        w = h * fit.ratio;
      }
      const tipHalf = w * fit.span;
      const tipY = this.ridge(tipHalf) - 0.016;
      // the tips sit `tip` of the way down the image, so its centre is below them by half, less that
      const cy = tipY + fit.tip * h - h / 2;

      const geo = new DecalGeometry(this.bodyMesh, V(0, cy, 0.13), new THREE.Euler(), V(w, h, 0.26));
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.04,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        roughness: 0.52,
        // the thread stands proud of the cloth
        bumpMap: tex,
        bumpScale: 2.2,
      });
      if (order) {
        order.colorSpace = THREE.NoColorSpace;
        order.generateMipmaps = false;
        order.minFilter = THREE.LinearFilter;
        mat.userData.order = order;
      }
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uThreadOn = this.threadOn;
        shader.uniforms.uThreadDark = this.threadDark;
        shader.uniforms.uThreadMid = this.threadMid;
        shader.uniforms.uThreadLight = this.threadLight;
        // run in one thread: the design's own light and dark kept, on the thread's tones
        let after =
          "if (uThreadOn > 0.5) {\n" +
          "  float g = sqrt(dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)));\n" +
          "  diffuseColor.rgb = g < 0.5 ? mix(uThreadDark, uThreadMid, g * 2.0) : mix(uThreadMid, uThreadLight, g * 2.0 - 1.0);\n" +
          "}\n";
        let head = "uniform float uThreadOn;\nuniform vec3 uThreadDark;\nuniform vec3 uThreadMid;\nuniform vec3 uThreadLight;\n";
        if (order) {
          // the design shows only where its sewing order is below the mark sewn so far
          shader.uniforms.uOrder = { value: order };
          shader.uniforms.uReveal = this.reveal;
          head += "uniform sampler2D uOrder;\nuniform float uReveal;\n";
          after += `diffuseColor.a *= clamp((uReveal - texture2D(uOrder, vMapUv).r) * ${STITCH_FRONT.toFixed(1)}, 0.0, 1.0);\n`;
        }
        shader.fragmentShader =
          head + shader.fragmentShader.replace("#include <map_fragment>", "#include <map_fragment>\n" + after);
      };
      mat.customProgramCacheKey = () => (order ? "neckline-sewn" : "neckline");
      this.design = new THREE.Mesh(geo, mat);
      this.design.receiveShadow = true;
      // the thread is laid over the chalk: both sit on the same surface without
      // writing depth, so the order they are drawn in decides which shows
      this.design.renderOrder = 2;
      this.scene.add(this.design);

      // the chalk guide: the design's own shape, in chalk, flat on the cloth
      const chalkMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
      });
      chalkMat.onBeforeCompile = (shader) => {
        shader.uniforms.uChalk = this.chalkTone;
        shader.fragmentShader =
          "uniform vec3 uChalk;\n" +
          shader.fragmentShader.replace("#include <map_fragment>", "#include <map_fragment>\ndiffuseColor.rgb = uChalk;");
      };
      chalkMat.customProgramCacheKey = () => "neckline-chalk";
      this.chalk = new THREE.Mesh(geo, chalkMat);
      this.chalk.renderOrder = 1;
      this.chalk.visible = false;
      this.scene.add(this.chalk);

      if (sew && order && !this.reduced) this.startSewing(fit, w, h, cy);
      this.request();
    });
  }

  /**
   * Lay the needle's track onto the cloth: each point of it, taken through
   * the same front-on projection that places the design, down to the surface.
   */
  private startSewing(fit: NecklineFit, w: number, h: number, cy: number) {
    const ray = new THREE.Raycaster();
    const track: Array<{ p: THREE.Vector3; n: THREE.Vector3 }> = [];
    let last: { p: THREE.Vector3; n: THREE.Vector3 } | null = null;
    for (let k = 0; k + 1 < fit.track.length; k += 2) {
      ray.set(V((fit.track[k] - 0.5) * w, cy + (0.5 - fit.track[k + 1]) * h, 0.6), V(0, 0, -1));
      const hit = ray.intersectObject(this.bodyMesh, false)[0];
      if (hit?.face) last = { p: hit.point.clone(), n: hit.face.normal.clone() };
      if (last) track.push(last);
    }
    if (track.length < 2 || !this.chalk) return;
    this.reveal.value = 0;
    this.chalk.visible = true;
    this.needle.visible = true;
    // requestAnimationFrame stalls in a background tab; this keeps the sewing
    // clock running there, so it is finished on coming back
    const keepalive = window.setInterval(() => this.stepSewing(), 200);
    this.sewing = { start: performance.now(), track, keepalive };
  }

  /** Move the sewing on to where the clock says it is. True while still sewing. */
  private stepSewing(): boolean {
    const s = this.sewing;
    if (!s) return false;
    const stitch = Math.min(STITCHES, Math.floor(((performance.now() - s.start) / STITCH_DURATION) * STITCHES));
    if (stitch >= STITCHES) {
      this.finishSewing();
      return false;
    }
    const t = stitch / STITCHES;
    this.reveal.value = t;
    const n = s.track.length;
    const f = Math.min(n - 1, Math.max(0, t * n - 0.5));
    const i = Math.floor(f);
    const j = Math.min(n - 1, i + 1);
    const k = f - i;
    const p = s.track[i].p.clone().lerp(s.track[j].p, k);
    const normal = s.track[i].n.clone().lerp(s.track[j].n, k).normalize();
    // held at a slant, the way a needle is, and lifted out of the cloth between stitches
    const axis = normal.multiplyScalar(0.8).add(V(0.35, 0.45, 0)).normalize();
    this.needle.position.copy(p).addScaledVector(axis, stitch % 2 ? 0.006 : 0);
    this.needle.quaternion.setFromUnitVectors(V(0, 1, 0), axis);
    return true;
  }

  private finishSewing() {
    const s = this.sewing;
    if (!s) return;
    window.clearInterval(s.keepalive);
    this.sewing = null;
    this.reveal.value = 2;
    if (this.chalk) this.chalk.visible = false;
    this.needle.visible = false;
    this.request();
  }

  /** The thread the neckline is run in, or null for the design's own colours. */
  setThread(tones: ThreadTones | null) {
    this.threadOn.value = tones ? 1 : 0;
    if (tones) {
      this.threadDark.value.set(tones.dark);
      this.threadMid.value.set(tones.mid);
      this.threadLight.value.set(tones.light);
    }
    this.request();
  }

  /** The height of the shoulder seam, seen from the front, at a distance from the centre. */
  private ridge(x: number): number {
    let best = -Infinity;
    for (let i = 0; i <= BODY_COLS; i++) {
      const { pts } = this.body.columns[i];
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1], b = pts[k];
        if ((a.x - x) * (b.x - x) <= 0 && a.x !== b.x) {
          const t = (x - a.x) / (b.x - a.x);
          best = Math.max(best, a.y + (b.y - a.y) * t);
        }
      }
    }
    return best;
  }

  /* ---- the camera ---- */

  view(name: ViewName) {
    const az = name === "front" ? 0 : name === "side" ? Math.PI / 2 : Math.PI;
    const d = HOME.distance;
    this.fly(V(Math.sin(az) * d, HOME.target.y + LIFT, Math.cos(az) * d), HOME.target);
  }

  /** In towards the embroidery, or back out. */
  zoom(dir: 1 | -1) {
    const target = this.controls.target.clone();
    const dist = this.camera.position.distanceTo(target);
    const next = Math.min(this.controls.maxDistance, Math.max(this.controls.minDistance, dir > 0 ? dist / 1.45 : dist * 1.45));
    // going in heads for the neckline; coming out drifts back to the whole garment
    const k = Math.min(1, Math.max(0, (HOME.distance - next) / (HOME.distance - 1.2)));
    const nextTarget = HOME.target.clone().lerp(NECK_FOCUS, k);
    const dirVec = this.camera.position.clone().sub(target).normalize();
    this.fly(nextTarget.clone().addScaledVector(dirVec, next), nextTarget);
  }

  reset() {
    this.view("front");
  }

  get distance() {
    return this.camera.position.distanceTo(this.controls.target);
  }

  private fly(pos: THREE.Vector3, target: THREE.Vector3) {
    if (this.reduced) {
      this.camera.position.copy(pos);
      this.controls.target.copy(target);
      this.controls.update();
      this.request();
      return;
    }
    this.tween = {
      from: { pos: this.camera.position.clone(), target: this.controls.target.clone() },
      to: { pos, target: target.clone() },
      start: performance.now(),
      ms: 650,
    };
    this.request();
  }

  private stepTween(): boolean {
    const tw = this.tween;
    if (!tw) return false;
    const t = Math.min(1, (performance.now() - tw.start) / tw.ms);
    const e = 1 - (1 - t) ** 3;
    // swing round the target rather than cutting straight through the garment
    const fromOff = tw.from.pos.clone().sub(tw.from.target);
    const toOff = tw.to.pos.clone().sub(tw.to.target);
    const a = new THREE.Spherical().setFromVector3(fromOff);
    const b = new THREE.Spherical().setFromVector3(toOff);
    let dTheta = b.theta - a.theta;
    if (dTheta > Math.PI) dTheta -= TAU;
    if (dTheta < -Math.PI) dTheta += TAU;
    const s = new THREE.Spherical(
      a.radius + (b.radius - a.radius) * e,
      a.phi + (b.phi - a.phi) * e,
      a.theta + dTheta * e,
    );
    const target = tw.from.target.clone().lerp(tw.to.target, e);
    this.controls.target.copy(target);
    this.camera.position.copy(target).add(V().setFromSpherical(s));
    if (t >= 1) this.tween = null;
    return t < 1;
  }

  /* ---- drawing ---- */

  private request = () => {
    if (!this.frame) this.frame = requestAnimationFrame(this.tick);
  };

  private tick = () => {
    this.frame = 0;
    const tweening = this.stepTween();
    const sewing = this.stepSewing();
    const moving = this.controls.update();
    this.renderer.render(this.scene, this.camera);
    if (tweening || moving || sewing) this.request();
  };

  private fit() {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.request();
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    if (this.sewing) window.clearInterval(this.sewing.keepalive);
    if (this.chalk) (this.chalk.material as THREE.Material).dispose();
    this.resize.disconnect();
    this.controls.dispose();
    for (const d of this.disposables) d.dispose();
    this.cloth.dispose();
    this.inside.dispose();
    this.slitMat.map?.dispose();
    if (this.design) {
      this.design.geometry.dispose();
      const m = this.design.material as THREE.MeshStandardMaterial;
      m.map?.dispose();
      (m.userData.order as THREE.Texture | undefined)?.dispose();
      m.dispose();
    }
    this.scene.environment?.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

/** Whether this browser can draw the 3D preview at all. */
export function canRender3D(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
