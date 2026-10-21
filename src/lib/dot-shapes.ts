// Shapes for the dotted hero (ParticleMark). Each one draws a bold silhouette on
// a 64 x 64 grid; the hero samples it into dots. Cutouts use 'destination-out'.
// Generic game pieces only: no publisher art, logos, or recognizable components.
import { MARK_PATH } from '@/lib/brand';

// `shaded` shapes may paint parts at partial opacity; the hero then thins the
// dots there in an even pattern (more transparent, fewer dots), which reads as
// a darker face. Other shapes keep the plain inside-or-outside test.
export type DotShape = { name: string; shaded?: boolean; draw: (ctx: CanvasRenderingContext2D) => void };

const cut = (ctx: CanvasRenderingContext2D, fn: () => void) => {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  fn();
  ctx.restore();
};

const line = (ctx: CanvasRenderingContext2D, pts: [number, number][]) => {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
  ctx.stroke();
};

const mark: DotShape = {
  name: 'The Ludarium tile mark',
  draw(ctx) {
    ctx.fill(new Path2D(MARK_PATH), 'evenodd');
  },
};

// A twenty-sided die, seen face on: a hexagon with its facet lines cut in.
const d20: DotShape = {
  name: 'a twenty-sided die',
  draw(ctx) {
    const hex: [number, number][] = [
      [32, 2],
      [58, 17],
      [58, 47],
      [32, 62],
      [6, 47],
      [6, 17],
    ];
    ctx.beginPath();
    hex.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    const top: [number, number] = [32, 17];
    const right: [number, number] = [46, 41];
    const left: [number, number] = [18, 41];
    cut(ctx, () => {
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      line(ctx, [top, right, left, top]);
      for (const [from, to] of [
        [top, hex[0]],
        [top, hex[1]],
        [top, hex[5]],
        [right, hex[1]],
        [right, hex[2]],
        [right, hex[3]],
        [left, hex[3]],
        [left, hex[4]],
        [left, hex[5]],
      ] as [number, number][][]) {
        line(ctx, [from, to]);
      }
    });
  },
};

// A cube in three-quarter view: three faces split by narrow gaps, like the d20's
// facets. The top catches the light, the left side is in half shade, and the
// right side is darker, drawn with fewer dots.
const cube: DotShape = {
  name: 'a cube',
  shaded: true,
  draw(ctx) {
    const top: [number, number] = [32, 5];
    const upRight: [number, number] = [56, 18.5];
    const lowRight: [number, number] = [56, 45.5];
    const bottom: [number, number] = [32, 59];
    const lowLeft: [number, number] = [8, 45.5];
    const upLeft: [number, number] = [8, 18.5];
    const center: [number, number] = [32, 32];
    const face = (pts: [number, number][], alpha: number) => {
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
    };
    face([top, upRight, center, upLeft], 1);
    face([upLeft, center, bottom, lowLeft], 0.6);
    face([center, upRight, lowRight, bottom], 0.32);
    ctx.globalAlpha = 1;
    cut(ctx, () => {
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      line(ctx, [upLeft, center, upRight]);
      line(ctx, [center, bottom]);
    });
  },
};

// A meeple: the little wooden person of board games.
const meeple: DotShape = {
  name: 'a meeple',
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(32, 13, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fill(
      new Path2D(
        'M24 22C15 22 4 25 4 31.5C4 36 10 37 18 37.5L12.5 57.5C11.8 60.5 13 62 16 62L27 62L32 52L37 62L48 62C51 62 52.2 60.5 51.5 57.5L46 37.5C54 37 60 36 60 31.5C60 25 49 22 40 22Z',
      ),
    );
  },
};

// A chess knight, facing left.
const knight: DotShape = {
  name: 'a chess knight',
  draw(ctx) {
    ctx.fill(
      new Path2D(
        'M19 47L23.5 35.5L12.5 35C8.5 34.5 6.5 31 8.5 27.5L19.5 12L24 3L29 9.5C41 10.5 50.5 20 49.5 34C49 40 47.5 44 46.5 47Z',
      ),
    );
    ctx.beginPath();
    ctx.roundRect(14, 47, 36, 6.5, 2);
    ctx.roundRect(10, 55, 44, 7, 2.5);
    ctx.fill();
    cut(ctx, () => {
      ctx.beginPath();
      ctx.arc(22.5, 18.5, 2.6, 0, Math.PI * 2);
      ctx.fill();
    });
  },
};

// A hand of three cards, fanned, with a diamond on the front card.
const cards: DotShape = {
  name: 'a fanned hand of cards',
  draw(ctx) {
    for (const deg of [-24, 24, 0]) {
      ctx.save();
      ctx.translate(32, 61);
      ctx.rotate((deg * Math.PI) / 180);
      cut(ctx, () => {
        ctx.beginPath();
        ctx.roundRect(-13.5, -50.5, 27, 39, 4.5);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.roundRect(-11.5, -48.5, 23, 35, 3.5);
      ctx.fill();
      ctx.restore();
    }
    cut(ctx, () => {
      ctx.beginPath();
      ctx.moveTo(32, 21);
      ctx.lineTo(38.5, 30.5);
      ctx.lineTo(32, 40);
      ctx.lineTo(25.5, 30.5);
      ctx.closePath();
      ctx.fill();
    });
  },
};

// A mahjong tile: the three of circles, inside a border.
const mahjong: DotShape = {
  name: 'a mahjong tile',
  draw(ctx) {
    ctx.beginPath();
    ctx.roundRect(13, 3, 38, 58, 6);
    ctx.fill();
    cut(ctx, () => {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(17.5, 7.5, 29, 49, 3);
      ctx.stroke();
      for (const [x, y] of [
        [24.5, 17.5],
        [32, 32],
        [39.5, 46.5],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, 6.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    for (const [x, y] of [
      [24.5, 17.5],
      [32, 32],
      [39.5, 46.5],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      cut(ctx, () => {
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  },
};

// The cycle starts and ends on the mark.
export const DOT_SHAPES: DotShape[] = [mark, d20, meeple, knight, cube, cards, mahjong];
