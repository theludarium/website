// The day Cube: how a day on the events calendar opens and closes, and how the
// day card and the event card turn into each other. Geometry and motion only.
// It knows nothing about events, requests, or the page address; it is handed
// the dialog's elements and a few callbacks by src/scripts/calendar.ts.
//
// One function, render(p), draws any moment of the opening: p = 0 is the day
// square in the grid and p = 1 is the flat open panel. Every measurement
// happens once, before the first frame. After that a frame only writes
// transform and opacity, so the motion stays on the compositor. At p = 1 the
// 3D stage is hidden and the panel is plain DOM with no transform.
// Ported from the reference prototype named in docs/calendar/DAY-CUBE.md.

const OPEN_MS = 1200;
const CLOSE_MS = 420;
const TURN_MS = 520;
const FADE_MS = 150;
/** For this long after an opening starts, the dimmed page and the cards ignore clicks: the second click of a double click. */
const FRESH_MS = 400;
/** If frames stop coming (a slow phone, a tab sent to the background), a timer lands the motion this long after it was due. */
const LATE_MS = 400;
/** Time is eased on top of render(p): a quick lift and an unhurried settle. */
const EASE = 1.5;
/** The first rows drop in as mini-Cubes. From the ninth on, a row fades in with its words. */
const DROP_ROWS = 8;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ioSine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
const ioCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const RAD = Math.PI / 180;
const n3 = (v: number) => v.toFixed(3);
const n5 = (v: number) => v.toFixed(5);
/** Toward the light: above and in front. */
const LIGHT = [0, -0.8, 0.6] as const;
/** A fall with one tiny bounce: -1 (up) to 0 (resting). */
const dropY = (t: number) => (t < 0.62 ? -(1 - (t / 0.62) * (t / 0.62)) : -0.15 * Math.sin((Math.PI * (t - 0.62)) / 0.38));

export type CardName = 'list' | 'detail';
export type CubePhase = 'closed' | 'opening' | 'open' | 'closing' | 'frozen';

/** Where a flight starts and ends, and what the Cube wears on the way. */
export type Flight = {
  /** The day square in the month grid. */
  button: HTMLElement;
  /** HTML for the face that turns toward the visitor: weekday, date, and the day's mini-Cubes. */
  face: string;
};

export type CubeElements = {
  /** The fixed layer that holds the panel. It must already be in the document. */
  dlg: HTMLElement;
  /** The dialog itself. It holds the two cards in one place. */
  panel: HTMLElement;
  list: HTMLElement;
  detail: HTMLElement;
};

export type CubeHooks = {
  /** The panel is open and at rest: flat, plain DOM. */
  onOpened(): void;
  /** Everything is hidden again. */
  onClosed(): void;
  /** The visitor pressed the dimmed page around the panel. */
  onScrim(): void;
  /** True when the visitor asked for reduced motion. Asked every time, so a change takes hold at once. */
  reduced(): boolean;
  /** Play on a timer instead of animation frames, so a headless browser on virtual time can show the motion. */
  timerClock: boolean;
};

export type DayCube = {
  /** The decorative layer (scrim, shadow, Cube) this module adds to the page. */
  readonly stage: HTMLElement;
  readonly phase: CubePhase;
  /** The card that is showing, or on its way in. */
  readonly card: CardName;
  /**
   * Shows the dialog. With `from`, the day square lifts out as a Cube, rolls
   * toward the visitor, and unfolds into the panel; without it (or with
   * reduced motion) the panel fades in. `freeze` holds the opening at one
   * moment (0 to 1), for stills.
   */
  open(o: { card: CardName; from: Flight | null; freeze?: number | null }): void;
  /** Hides the dialog. With `from` the panel folds up and flies home; without it, it fades. An opening in flight simply runs backward. */
  close(from: Flight | null): void;
  /** Brings the other card round with a quarter turn, like the next face of a Cube. `holdAt` (0 to 1) shows one moment of the turn and stops there. */
  turn(to: CardName, o: { animate: boolean; holdAt?: number | null }, done: () => void): void;
  /** Jumps to the end of whatever is moving. */
  settle(): void;
};

type Face = { el: HTMLElement; sh: HTMLElement; hl: HTMLElement; ed: HTMLElement };
type FaceKey = 'k' | 'b' | 'l' | 'r' | 't' | 'n';
/** A part of the finished panel and where it sits, measured from the panel's center. */
type Spot = { el: HTMLElement; x: number; y: number };
type Row = { at: Spot; fade: HTMLElement[]; lift: HTMLElement | null; shadow: HTMLElement | null };
type Parts = { bg: HTMLElement; inner: HTMLElement; head: Spot | null; foot: Spot | null; rows: Row[] };
type Geometry = {
  side: number; rows: number; cross: boolean; k0: number; g: number; persp: number;
  /** The day square's box in the window, as measured. */
  x0: number; y0: number; w0: number; h0: number; cx0: number; cy0: number; W0: number; D0: number;
  pw: number; ph: number; pcx: number; pcy: number;
};

const SHADES = '<i class="sh"></i><i class="hl"></i><i class="ed"></i>';
// The stage, back to front: the well the day square leaves in the grid (under the scrim, so it dims with
// the page), the scrim, a soft shadow, the Cube (six faces, hinged to the edges of the front face n; the
// back k hangs off the bottom flap), and the copy of the day square that rides the Cube's first face.
const STAGE_HTML = `<div class="cal-well"></div><div class="cal-scrim"></div><div class="cal-cshadow"></div><div class="cal-cube"><div class="cal-face" data-f="k">${SHADES}</div><div class="cal-face" data-f="b">${SHADES}</div><div class="cal-face" data-f="l">${SHADES}</div><div class="cal-face" data-f="r">${SHADES}</div><div class="cal-face" data-f="t">${SHADES}</div><div class="cal-face" data-f="n"><div class="cal-cube__date"></div>${SHADES}</div></div><div class="cal-ghost"></div>`;

export function createDayCube(els: CubeElements, hooks: CubeHooks): DayCube {
  const stage = document.createElement('div');
  stage.className = 'cal-stage';
  stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = STAGE_HTML;
  els.dlg.before(stage);

  const part = (root: ParentNode, selector: string) => root.querySelector<HTMLElement>(selector)!;
  const scrim = part(stage, '.cal-scrim');
  const cshadow = part(stage, '.cal-cshadow');
  const cube = part(stage, '.cal-cube');
  const ghost = part(stage, '.cal-ghost');
  const well = part(stage, '.cal-well');
  const dateface = part(stage, '.cal-cube__date');
  const F = {} as Record<FaceKey, Face>;
  const faces: [FaceKey, Face][] = [];
  for (const el of stage.querySelectorAll<HTMLElement>('.cal-face')) {
    const face = { el, sh: part(el, '.sh'), hl: part(el, '.hl'), ed: part(el, '.ed') };
    F[el.dataset.f as FaceKey] = face;
    faces.push([el.dataset.f as FaceKey, face]);
  }
  const cards: Record<CardName, HTMLElement> = { list: els.list, detail: els.detail };
  const shadeOf = (card: HTMLElement) => part(card, '.cal-card__shade');

  // Frames come from requestAnimationFrame, or from a timer when asked (see CubeHooks.timerClock).
  const nextFrame = hooks.timerClock
    ? (fn: (now: number) => void) => window.setTimeout(() => fn(performance.now()), 16)
    : (fn: (now: number) => void) => requestAnimationFrame(fn);
  const cancelFrame = (id: number) => (hooks.timerClock ? window.clearTimeout(id) : cancelAnimationFrame(id));

  const S = {
    phase: 'closed' as CubePhase,
    card: 'list' as CardName,
    p: 0,
    raf: 0,
    last: 0,
    /** The timer that ends a fade out. */
    fade: 0,
    /** The timer that lands a flight whose frames have stopped coming. */
    guard: 0,
    /** The timer that ends the first moments of an opening, when clicks are ignored. */
    fresh: 0,
    openedAt: 0,
    /** The day square that is out of the grid as a Cube. */
    well: null as HTMLElement | null,
    turning: null as { raf: number; guard: number; finish: () => void } | null,
  };
  /** Geometry of this flight. Null when the dialog came in by a fade. */
  let G: Geometry | null = null;
  /** The parts of the panel that render(p) touches. */
  let R: Parts | null = null;

  // ---------- Measuring: once, before the first frame ----------

  function measure(button: HTMLElement) {
    const r = button.getBoundingClientRect();
    const c = cards[S.card].getBoundingClientRect();
    // A tall panel gets the classic six-square cross (the back face folds out last).
    // A squarer panel gets the five-square plus (the back face stays tucked away).
    const cross = c.height / c.width >= 1.25;
    const rows = cross ? 4 : 3;
    let side = Math.min(c.width / 3.15, (window.innerHeight - 32) / (rows + 0.06));
    if (!cross) side = Math.min(side, c.height / 2.6);
    side = Math.max(64, Math.round(side));
    const k0 = Math.min(r.width, r.height) / side;
    G = {
      side, rows, cross, k0, g: cross ? side / 2 : 0, persp: side * 7,
      x0: r.left, y0: r.top, w0: r.width, h0: r.height, cx0: r.left + r.width / 2, cy0: r.top + r.height / 2,
      W0: r.width / k0, D0: r.height / k0,
      pw: c.width, ph: c.height, pcx: c.left + c.width / 2, pcy: c.top + c.height / 2,
    };
    cube.style.setProperty('--S', `${side}px`);
  }

  /**
   * Lays a copy of the day square exactly over the square, with the well it will leave under it, and
   * prints the date on the face that turns toward the visitor. The copy is drawn at its natural size in
   * the square's own box, so the browser snaps it to the screen's pixels just as it snaps the square, and
   * the first frame matches the closed calendar. (These few layout writes happen once, before the first
   * frame.)
   */
  function dress(flight: Flight, g: Geometry) {
    for (const el of [ghost, well]) {
      el.style.left = `${g.x0}px`;
      el.style.top = `${g.y0}px`;
      el.style.width = `${g.w0}px`;
      el.style.height = `${g.h0}px`;
    }
    const copy = document.createElement('div');
    copy.className = flight.button.className;
    copy.classList.remove('is-out', 'is-aloft');
    copy.innerHTML = flight.button.innerHTML;
    ghost.replaceChildren(copy);
    dateface.innerHTML = flight.face;
  }

  /** Where a part sits in the finished panel. While the net is still settling, each part rides the paper from a scaled copy of this spot. */
  function spot(el: HTMLElement, g: Geometry): Spot {
    const b = el.getBoundingClientRect();
    return { el, x: b.left + b.width / 2 - g.pcx, y: b.top + b.height / 2 - g.pcy };
  }

  function collect(g: Geometry) {
    const card = cards[S.card];
    R = { bg: part(card, '.cal-card__bg'), inner: part(card, '[data-card-in]'), head: null, foot: null, rows: [] };
    if (S.card === 'detail') return;
    const head = card.querySelector<HTMLElement>('[data-cube="head"]');
    const foot = card.querySelector<HTMLElement>('[data-cube="foot"]');
    if (head) R.head = spot(head, g);
    if (foot) R.foot = spot(foot, g);
    // Rows below the fold of a long day are not on screen during the opening, so they are left alone.
    const fold = g.pcy + g.ph / 2;
    for (const el of card.querySelectorAll<HTMLElement>('[data-cube="row"]')) {
      if (el.getBoundingClientRect().top >= fold) break;
      R.rows.push({
        at: spot(el, g),
        fade: [...el.querySelectorAll<HTMLElement>('[data-cube="fade"]')],
        lift: el.querySelector<HTMLElement>('[data-cube="lift"]'),
        shadow: el.querySelector<HTMLElement>('[data-cube="shadow"]'),
      });
    }
  }

  function clearParts() {
    if (!R) return;
    for (const el of [R.bg, R.inner, R.head?.el, R.foot?.el]) {
      if (!el) continue;
      el.style.opacity = '';
      el.style.transform = '';
    }
    for (const r of R.rows) {
      r.at.el.style.transform = '';
      for (const el of r.fade) el.style.opacity = '';
      for (const el of [r.lift, r.shadow]) {
        if (!el) continue;
        el.style.opacity = '';
        el.style.transform = '';
      }
    }
  }

  // ---------- The opening, as one function of progress ----------

  /**
   * render(p): p = 0 is the day square in the grid, p = 1 is the flat open panel.
   * Only transform and opacity change. The beats overlap:
   *   0.00 to 0.20  the square thickens into a slab, then a Cube
   *   0.03 to 0.62  the Cube rolls a quarter turn toward the visitor, with a little yaw
   *   0.10 to 0.54  it travels to the center and grows
   *   0.52 to 0.85  the faces hinge open flat around the front face
   *   0.76 to 0.95  the flat net fills its corners and settles into the panel shape
   *   0.79 to 1.00  the mini-Cubes drop in one by one, each followed by its words
   */
  function render(p: number) {
    if (!G || !R) return;
    const side = G.side;
    const g = G.g;
    const thick = ioSine(seg(p, 0, 0.2));
    const square = ioSine(seg(p, 0.18, 0.48));
    const rollT = seg(p, 0.03, 0.62);
    const roll = 0.7 * ioSine(rollT) + 0.3 * (1 - (1 - rollT) * (1 - rollT)); // starts turning at once, lands softly
    const yaw = ioSine(seg(p, 0.04, 0.32)) * (1 - ioSine(seg(p, 0.4, 0.72)));
    const trav = ioCubic(seg(p, 0.1, 0.54));
    const uT = ioSine(seg(p, 0.52, 0.74));
    const uS = ioSine(seg(p, 0.56, 0.8));
    const uB = ioSine(seg(p, 0.62, 0.84));
    const uK = G.cross ? ioSine(seg(p, 0.64, 0.85)) : 0;
    const wT = ioSine(seg(p, 0.76, 0.84));
    // The bottom flap starts to widen as it lands, a little sooner than in the prototype, so the net is
    // not left with a wide top over a narrow bottom for long.
    const wB = ioSine(seg(p, 0.82, 0.89));
    const wK = wB;
    const merge = ioSine(seg(p, 0.84, 0.95));

    // The solid: W wide, H tall, D deep in Cube units. It starts as the day square lying face up (H is its thickness).
    const W = lerp(G.W0, side, square);
    const D = lerp(G.D0, side, square);
    const H = Math.max(0.6, side * thick);
    const k = lerp(G.k0 * (1 + 0.1 * thick), 1, trav);
    const X = lerp(G.cx0, G.pcx, trav);
    const Y = lerp(G.cy0, G.pcy - g, trav);
    const rx = 90 * (1 - roll);
    const ry = -26 * yaw;
    const zc = -lerp(H / 2, D / 2, roll);
    const sx = lerp(1, G.pw / (3 * side), merge);
    const sy = lerp(1, G.ph / (G.rows * side), merge);

    cube.style.transform =
      `translate3d(${n3(X)}px,${n3(Y)}px,0) perspective(${G.persp}px) ` +
      `translate3d(0,${n3(g * k)}px,0) scale3d(${n5(k * sx)},${n5(k * sy)},${n5(k)}) translate3d(0,${n3(-g)}px,0) ` +
      `translateZ(${n3(zc)}px) rotateY(${n3(ry)}deg) rotateX(${n3(rx)}deg) translateZ(${n3(D / 2)}px)`;

    // Faces: each one is hinged to an edge of the front face (n).
    const bleed = (side + 1) / side;
    const fW = (W / side) * bleed;
    const fH = (H / side) * bleed;
    const fD = (D / side) * bleed;
    const aT = 90 * (1 - uT);
    const aS = 90 * (1 - uS);
    const aB = 90 * (1 - uB);
    const aK = 90 * (1 - uK);
    const hingeB = `translateY(${n3(H / 2)}px) rotateX(${n3(-aB)}deg) `;
    F.n.el.style.transform = `scale(${n5(fW)},${n5(fH)})`;
    F.t.el.style.transform = `translateY(${n3(-H / 2)}px) rotateX(${n3(aT)}deg) translateY(${n3(-D / 2)}px) scale(${n5(fW * (1 + 2 * wT))},${n5(fD)})`;
    F.b.el.style.transform = `${hingeB}translateY(${n3(D / 2)}px) scale(${n5(fW * (1 + 2 * wB))},${n5(fD)})`;
    F.l.el.style.transform = `translateX(${n3(-W / 2)}px) rotateY(${n3(-aS)}deg) translateX(${n3(-D / 2)}px) scale(${n5(fD)},${n5(fH)})`;
    F.r.el.style.transform = `translateX(${n3(W / 2)}px) rotateY(${n3(aS)}deg) translateX(${n3(D / 2)}px) scale(${n5(fD)},${n5(fH)})`;
    F.k.el.style.transform = `${hingeB}translateY(${n3(D)}px) rotateX(${n3(-aK)}deg) translateY(${n3(H / 2)}px) scale(${n5(fW * (1 + 2 * wK))},${n5(fH)})`;
    // Undo the face's stretch, so the date never distorts.
    dateface.style.transform = `scale(${n5(1 / fW)},${n5(1 / fH)})`;

    // Paper shading from each face's direction: no tint when it faces the visitor.
    const cr = Math.cos(rx * RAD);
    const sr = Math.sin(rx * RAD);
    const cw = Math.cos(ry * RAD);
    const sw = Math.sin(ry * RAD);
    const tone = (f: Face, nx: number, ny: number, nz: number) => {
      const y1 = ny * cr - nz * sr;
      const z1 = ny * sr + nz * cr;
      const x2 = nx * cw + z1 * sw;
      const z2 = -nx * sw + z1 * cw;
      const d = x2 * LIGHT[0] + y1 * LIGHT[1] + z2 * LIGHT[2] - LIGHT[2];
      f.sh.style.opacity = n3(clamp(-d * 0.2, 0, 0.24));
      f.hl.style.opacity = n3(clamp(d * 0.45, 0, 0.16));
    };
    tone(F.n, 0, 0, 1);
    tone(F.t, 0, -Math.sin(aT * RAD), Math.cos(aT * RAD));
    tone(F.b, 0, Math.sin(aB * RAD), Math.cos(aB * RAD));
    tone(F.l, -Math.sin(aS * RAD), 0, Math.cos(aS * RAD));
    tone(F.r, Math.sin(aS * RAD), 0, Math.cos(aS * RAD));
    tone(F.k, 0, Math.sin((aB + aK) * RAD), Math.cos((aB + aK) * RAD));

    const edge = n3(1 - seg(p, 0.78, 0.88));
    const body = seg(p, 0, 0.05) * (1 - seg(p, 0.975, 1)); // arrives under the day square, leaves under the flat card
    for (const [key, face] of faces) {
      face.ed.style.opacity = edge;
      face.el.style.opacity = n3(key === 'k' && !G.cross ? body * (1 - seg(p, 0.5, 0.6)) : body);
    }
    // The copy of the day square lies on the bottom flap, which starts toward the visitor. It is its own
    // layer at its natural size, so it follows the same path as that flap with every length scaled by k0.
    // At p = 0 the whole chain is the identity, so it is left out: the copy is then painted like any other
    // element, exactly where the square was.
    well.style.opacity = n3(seg(p, 0, 0.06));
    if (p < 0.25) {
      const k0 = G.k0;
      ghost.style.opacity = n3(1 - seg(p, 0.14, 0.24));
      ghost.style.transform =
        p <= 0
          ? 'none'
          : `translate3d(${n3(X - G.cx0)}px,${n3(Y - G.cy0)}px,0) perspective(${G.persp}px) ` +
            `translate3d(0,${n3(g * k)}px,0) scale3d(${n5((k * sx) / k0)},${n5((k * sy) / k0)},${n5(k / k0)}) translate3d(0,${n3(-g * k0)}px,0) ` +
            `translateZ(${n3(zc * k0)}px) rotateY(${n3(ry)}deg) rotateX(${n3(rx)}deg) translateZ(${n3((D * k0) / 2)}px) ` +
            `translateY(${n3((H * k0) / 2)}px) rotateX(${n3(-aB)}deg) translateY(${n3((D * k0) / 2)}px)`;
    } else {
      ghost.style.opacity = '0';
    }
    dateface.style.opacity = n3(seg(p, 0.2, 0.3) * (1 - seg(p, 0.77, 0.85)));

    // The scrim, and the soft shadow under the Cube, then under the net.
    const net = ioSine(seg(p, 0.56, 0.88));
    const cs = k * side;
    const shw = lerp(cs * 1.7, G.pw * 1.16, net);
    const shh = lerp(cs * 1.7, Math.max(G.ph, G.rows * side) * 1.1, net);
    cshadow.style.transform = `translate3d(${n3(lerp(X, G.pcx, net))}px,${n3(lerp(Y + cs * 0.3, G.pcy + 18, net))}px,0) scale(${n5(shw / 100)},${n5(shh / 100)})`;
    cshadow.style.opacity = n3(seg(p, 0.02, 0.16) * lerp(0.6, 0.42, net) * (1 - seg(p, 0.9, 0.97)));
    scrim.style.opacity = n3(ioSine(seg(p, 0, 0.42)));

    // The flat panel takes over: paper first, then the words, then the mini-Cubes drop in.
    R.bg.style.opacity = n3(seg(p, 0.9, 0.97));
    if (S.card === 'detail') {
      R.inner.style.opacity = n3(seg(p, 0.87, 0.97));
      return;
    }
    // Both reach 0 as the net becomes the panel.
    const rideX = sx / (G.pw / (3 * side)) - 1;
    const rideY = sy / (G.ph / (G.rows * side)) - 1;
    const ride = (at: Spot) => {
      at.el.style.transform = `translate3d(${n3(at.x * rideX)}px,${n3(at.y * rideY)}px,0)`;
    };
    if (R.head) {
      R.head.el.style.opacity = n3(seg(p, 0.83, 0.92));
      ride(R.head);
    }
    // Each mini-Cube drops as soon as there is paper under it; its words follow it in.
    const count = R.rows.length;
    const step = count > 1 ? Math.min(0.035, 0.105 / (count - 1)) : 0;
    for (let i = 0; i < count; i += 1) {
      const r = R.rows[i];
      const s = 0.79 + i * step;
      const t = seg(p, s, s + 0.1);
      const show = n3(seg(p, s + 0.05, s + 0.1));
      ride(r.at);
      for (const el of r.fade) el.style.opacity = show;
      if (!r.lift || !r.shadow) continue;
      if (i >= DROP_ROWS) {
        r.lift.style.opacity = show;
        r.shadow.style.opacity = show;
        continue;
      }
      r.lift.style.opacity = n3(seg(t, 0, 0.22));
      r.lift.style.transform = `translate3d(0,${n3(dropY(t) * 44)}px,0) scale(${n3(1 + 0.22 * (1 - seg(t, 0, 0.62)))})`;
      r.shadow.style.opacity = n3(seg(t, 0.3, 0.62));
      r.shadow.style.transform = `scale(${n3(lerp(0.45, 1, seg(t, 0.2, 0.62)))})`;
    }
    if (R.foot) {
      R.foot.el.style.opacity = n3(count ? seg(p, 0.93, 1) : seg(p, 0.86, 0.96));
      ride(R.foot);
    }
  }

  // ---------- Open and close ----------

  function showFlight(on: boolean) {
    cube.style.visibility = on ? 'visible' : 'hidden';
    cshadow.style.visibility = on ? 'visible' : 'hidden';
    ghost.style.visibility = on ? 'visible' : 'hidden';
    well.style.visibility = on ? 'visible' : 'hidden';
    // The stylesheet takes the sticky bars' paper backing away in flight, when the paper is the net itself.
    els.dlg.classList.toggle('is-flying', on);
  }

  /** Gets a flight ready: measure, dress the Cube, note the panel's parts, and leave the well in the grid. */
  function prepare(flight: Flight) {
    // A panel that faded in may still carry the fade's transition. In flight, every frame sets opacity itself.
    scrim.classList.remove('cal-fade');
    els.panel.classList.remove('cal-fade');
    els.panel.style.opacity = '';
    // The square steps out of the grid first. That also drops its hover lift at once, so the Cube is
    // measured from the square's resting place and not from two pixels above it. While the Cube is aloft
    // the stage draws both the well and the copy of the square, so the square itself is not drawn at all.
    S.well?.classList.remove('is-out', 'is-aloft');
    S.well = flight.button;
    flight.button.classList.add('is-out', 'is-aloft');
    measure(flight.button);
    if (!G) return;
    dress(flight, G);
    collect(G);
    showFlight(true);
  }

  /**
   * Opening: p = 1 - (1 - t)^EASE (quick lift, unhurried settle). Closing: p = t^EASE (quick fold, soft landing).
   * Switching direction mid-flight keeps p and only reads the clock again, so an interrupted opening never jumps.
   */
  function run(dir: 1 | -1) {
    cancelFrame(S.raf);
    S.last = performance.now();
    let t = dir > 0 ? 1 - Math.pow(1 - S.p, 1 / EASE) : Math.pow(S.p, 1 / EASE);
    // The safety net: if frames stall, the flight still lands on its end state a little after it was due.
    window.clearTimeout(S.guard);
    S.guard = window.setTimeout(() => (dir > 0 ? land() : finishClose()), (dir > 0 ? (1 - t) * OPEN_MS : t * CLOSE_MS) + LATE_MS);
    const tick = (now: number) => {
      const dt = Math.min(48, Math.max(0, now - S.last));
      S.last = now;
      t = clamp(t + (dir * dt) / (dir > 0 ? OPEN_MS : CLOSE_MS), 0, 1);
      S.p = dir > 0 ? 1 - Math.pow(1 - t, EASE) : Math.pow(t, EASE);
      render(S.p);
      if (dir > 0 && S.p >= 1) return finishOpen();
      if (dir < 0 && S.p <= 0) return finishClose();
      S.raf = nextFrame(tick);
    };
    S.raf = nextFrame(tick);
  }

  /** The scrim and the panel fade together, for the times there is no flight. */
  function fade(to: 0 | 1) {
    if (to === 1) {
      // Start from nothing with the transition off, or the browser would fade out toward it first.
      scrim.classList.remove('cal-fade');
      els.panel.classList.remove('cal-fade');
      scrim.style.opacity = '0';
      els.panel.style.opacity = '0';
      // One forced layout, so the transition has a starting point. Not per frame.
      void els.panel.offsetWidth;
    }
    scrim.classList.add('cal-fade');
    els.panel.classList.add('cal-fade');
    scrim.style.opacity = String(to);
    els.panel.style.opacity = String(to);
  }

  /** Jumps an opening to its end. */
  function land() {
    S.p = 1;
    render(1);
    finishOpen();
  }

  function finishOpen() {
    cancelFrame(S.raf);
    window.clearTimeout(S.guard);
    S.phase = 'open';
    S.p = 1;
    showFlight(false);
    S.well?.classList.remove('is-aloft'); // the square in the grid is the well from here on
    scrim.style.opacity = '1';
    clearParts(); // hand off: the panel is plain flat DOM from here on
    hooks.onOpened();
  }

  function finishClose() {
    cancelFrame(S.raf);
    window.clearTimeout(S.fade);
    window.clearTimeout(S.guard);
    window.clearTimeout(S.fresh);
    stage.classList.remove('is-on');
    els.dlg.classList.remove('is-on', 'is-fresh');
    clearParts();
    // Hide the stage and empty it, so no copy of the day square is ever left floating over the page.
    showFlight(false);
    ghost.replaceChildren();
    dateface.replaceChildren();
    scrim.classList.remove('cal-fade');
    els.panel.classList.remove('cal-fade');
    scrim.style.opacity = '';
    els.panel.style.opacity = '';
    S.well?.classList.remove('is-out', 'is-aloft');
    S.well = null;
    G = null;
    R = null;
    S.phase = 'closed';
    S.p = 0;
    hooks.onClosed();
  }

  function open(o: { card: CardName; from: Flight | null; freeze?: number | null }) {
    if (S.phase !== 'closed') return;
    S.card = o.card;
    els.list.hidden = o.card !== 'list';
    els.detail.hidden = o.card !== 'detail';
    els.dlg.classList.add('is-on', 'is-fresh');
    stage.classList.add('is-on');
    S.openedAt = performance.now();
    window.clearTimeout(S.fresh);
    S.fresh = window.setTimeout(() => els.dlg.classList.remove('is-fresh'), FRESH_MS);
    const flight = hooks.reduced() ? null : o.from;
    if (flight) prepare(flight);
    if (!flight || !G) {
      // No travel: the panel simply fades in.
      showFlight(false);
      fade(1);
      S.phase = 'open';
      S.p = 1;
      hooks.onOpened();
      return;
    }
    if (o.freeze !== null && o.freeze !== undefined) {
      S.phase = 'frozen';
      S.p = clamp(o.freeze, 0, 1);
      render(S.p);
      if (S.p >= 1) finishOpen();
      return;
    }
    S.p = 0;
    render(0);
    S.phase = 'opening';
    run(1);
  }

  function close(from: Flight | null) {
    if (S.phase === 'closed' || S.phase === 'closing') return;
    endTurn();
    if (S.phase === 'open') {
      const flight = hooks.reduced() ? null : from;
      // Measure again: the visible card may be the event card, and the window may have changed.
      if (flight) prepare(flight);
      if (!flight || !G) {
        S.phase = 'closing';
        fade(0);
        S.fade = window.setTimeout(finishClose, FADE_MS + 10);
        return;
      }
      render(1);
    }
    S.phase = 'closing';
    run(-1);
  }

  // ---------- Day card and event card: a quarter turn, like two faces of one Cube ----------

  function turn(to: CardName, o: { animate: boolean; holdAt?: number | null }, done: () => void) {
    endTurn();
    if (to === S.card) return done();
    const from = cards[S.card];
    const into = cards[to];
    const dir = to === 'detail' ? 1 : -1;
    S.card = to;
    into.hidden = false;
    const turning = { raf: 0, guard: 0, finish: () => {} };
    const finish = () => {
      window.clearTimeout(turning.guard);
      from.hidden = true;
      for (const card of [from, into]) {
        card.style.transform = '';
        card.classList.remove('is-turning');
        shadeOf(card).style.opacity = '';
      }
      S.turning = null;
      done();
    };
    turning.finish = finish;
    if (!o.animate || hooks.reduced() || S.phase !== 'open') return finish();

    // The two cards are neighboring faces of a box. Each face sits half the other's width in front of
    // the axis the box turns on, and the axis eases back a little mid-turn. Measured once.
    const wFrom = from.getBoundingClientRect().width;
    const wInto = into.getBoundingClientRect().width;
    const dFrom = wInto / 2;
    const dInto = wFrom / 2;
    const wide = Math.max(wFrom, wInto);
    const persp = Math.max(1200, wide * 3.2);
    const shadeFrom = shadeOf(from);
    const shadeInto = shadeOf(into);
    /** One frame of the turn: e = 0 shows `from`, e = 1 shows `into`. */
    const draw = (e: number) => {
      const a = 90 * e;
      const pre = `perspective(${n3(persp)}px) translateZ(${n3(-lerp(dFrom, dInto, e) - 0.34 * wide * Math.sin(Math.PI * e))}px) rotateY(`;
      from.style.transform = `${pre}${n3(-dir * a)}deg) translateZ(${n3(dFrom)}px)`;
      into.style.transform = `${pre}${n3(dir * (90 - a))}deg) translateZ(${n3(dInto)}px)`;
      shadeFrom.style.opacity = n3(0.42 * e);
      shadeInto.style.opacity = n3(0.42 * (1 - e));
    };
    from.classList.add('is-turning');
    into.classList.add('is-turning');
    S.turning = turning;
    if (o.holdAt !== null && o.holdAt !== undefined) return draw(clamp(o.holdAt, 0, 1));
    // The same safety net as a flight has: the turn ends on time even if frames stop coming.
    turning.guard = window.setTimeout(() => {
      if (S.turning !== turning) return;
      cancelFrame(turning.raf);
      finish();
    }, TURN_MS + LATE_MS);
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = clamp((now - t0) / TURN_MS, 0, 1);
      draw(ioCubic(t));
      if (t < 1) turning.raf = nextFrame(frame);
      else finish();
    };
    draw(0);
    turning.raf = nextFrame(frame);
  }

  function endTurn() {
    if (!S.turning) return;
    cancelFrame(S.turning.raf);
    S.turning.finish();
  }

  function settle() {
    endTurn();
    if (S.phase === 'opening' || S.phase === 'frozen') land();
    else if (S.phase === 'closing') finishClose();
  }

  // The dimmed page closes the dialog, but not by accident: not while something is moving (the cards let
  // clicks through as they turn), and not in the first moments of an opening, when a double click on a day
  // would otherwise open it and close it again.
  scrim.addEventListener('click', () => {
    if (S.turning || S.phase === 'opening' || S.phase === 'closing' || performance.now() - S.openedAt < FRESH_MS) return;
    hooks.onScrim();
  });
  showFlight(false);

  return {
    stage,
    get phase() {
      return S.phase;
    },
    get card() {
      return S.card;
    },
    open,
    close,
    turn,
    settle,
  };
}
