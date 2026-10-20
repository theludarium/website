// Cover themes for the RPG Demo Library cards, one per demo, taken from each
// demo page's own colors, display font, and background texture, so a card
// feels like the game it opens. Keyed by the demo's folder in the library repo.
// A demo without a theme gets a plain site card, so new demos never break.
// Display fonts are self-hosted (latin subset, one weight each) in
// src/styles/rdl-fonts.css.

export type RdlTheme = {
  bg: string;
  texture?: string;
  textureSize?: string;
  fg: string;
  accent: string;
  font: string;
  weight: number;
  /** Title size multiplier, for display faces that run small. */
  scale?: number;
  upper?: boolean;
  glow?: string;
  /** Tag chip background. */
  chip: string;
};

export const RDL_THEMES: Record<string, RdlTheme> = {
  skellies: {
    bg: '#F6DE1E',
    texture:
      'linear-gradient(rgba(21,19,16,.09) 2px, transparent 2px), linear-gradient(90deg, rgba(21,19,16,.09) 2px, transparent 2px)',
    textureSize: '36px 36px',
    fg: '#151310',
    accent: '#B3261E',
    font: "'Pirata One', Georgia, serif",
    weight: 400,
    scale: 1.3,
    chip: 'rgba(21,19,16,.1)',
  },
  ironsworn: {
    bg: '#121A18',
    texture:
      'radial-gradient(ellipse at 50% -10%, #24342F 0%, transparent 60%), repeating-linear-gradient(0deg, rgba(200,168,106,.05) 0 1px, transparent 1px 22px)',
    fg: '#EEE8DA',
    accent: '#C8A86A',
    font: "'Alegreya SC', Georgia, serif",
    weight: 800,
    chip: 'rgba(200,168,106,.16)',
  },
  starforged: {
    bg: '#0A0B16',
    texture:
      'radial-gradient(1.2px 1.2px at 14% 12%, #fff9 50%, transparent 51%), radial-gradient(1px 1px at 62% 8%, #fff7 50%, transparent 51%), radial-gradient(1px 1px at 86% 22%, #fff6 50%, transparent 51%), radial-gradient(ellipse at 100% 0%, #2A2E6B 0%, transparent 60%)',
    fg: '#E9E6F2',
    accent: '#FF8A63',
    font: "'Chakra Petch', 'Arial Narrow', sans-serif",
    weight: 700,
    upper: true,
    chip: 'rgba(91,99,214,.28)',
  },
  knave: {
    bg: '#17151E',
    texture: 'radial-gradient(ellipse at 15% 0%, rgba(201,85,31,.32) 0%, transparent 55%)',
    fg: '#F5EFE3',
    accent: '#E8833A',
    font: "'Uncial Antiqua', Georgia, serif",
    weight: 400,
    chip: 'rgba(201,162,74,.16)',
  },
  'forged-dark': {
    bg: '#151311',
    texture:
      'radial-gradient(ellipse at 90% 110%, rgba(196,81,31,.35) 0%, transparent 55%), repeating-linear-gradient(90deg, rgba(239,234,225,.03) 0 1px, transparent 1px 18px)',
    fg: '#F6EFE3',
    accent: '#E2683A',
    font: "'Big Shoulders Display', Impact, sans-serif",
    weight: 900,
    upper: true,
    chip: 'rgba(201,161,90,.16)',
  },
  fate: {
    bg: '#0E1626',
    texture:
      'linear-gradient(120deg, transparent 46%, rgba(54,194,210,.12) 47%, transparent 49%), radial-gradient(ellipse at 0% 100%, rgba(176,88,42,.3) 0%, transparent 55%)',
    fg: '#F4EFE2',
    accent: '#36C2D2',
    font: "'Limelight', Georgia, serif",
    weight: 400,
    chip: 'rgba(54,194,210,.16)',
  },
  '24xx': {
    bg: '#06121D',
    texture:
      'radial-gradient(ellipse at 50% 120%, rgba(43,179,192,.3) 0%, transparent 55%), linear-gradient(rgba(127,243,230,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(127,243,230,.06) 1px, transparent 1px)',
    textureSize: 'auto, 28px 28px, 28px 28px',
    fg: '#EEF6F8',
    accent: '#F2A93B',
    font: "'Chakra Petch', 'Arial Narrow', sans-serif",
    weight: 700,
    upper: true,
    chip: 'rgba(43,179,192,.2)',
  },
  'lasers-feelings': {
    bg: '#17123A',
    texture:
      'linear-gradient(160deg, transparent 40%, rgba(43,179,192,.18) 41%, transparent 43%), linear-gradient(160deg, transparent 52%, rgba(232,84,107,.2) 53%, transparent 55%)',
    fg: '#FFF7E6',
    accent: '#E9A531',
    font: "'Chakra Petch', 'Trebuchet MS', sans-serif",
    weight: 700,
    upper: true,
    chip: 'rgba(122,111,214,.3)',
  },
  'dungeon-world': {
    bg: '#141826',
    texture: 'radial-gradient(ellipse at 50% -20%, #3B4563 0%, transparent 60%)',
    fg: '#F5F3EF',
    accent: '#E39AAA',
    font: "'Grenze', Georgia, serif",
    weight: 800,
    chip: 'rgba(201,207,221,.14)',
  },
  cypher: {
    bg: '#0E1024',
    texture:
      'radial-gradient(1.2px 1.2px at 12% 10%, #fff8 50%, transparent 51%), radial-gradient(1px 1px at 40% 6%, #fff6 50%, transparent 51%), radial-gradient(1.3px 1.3px at 72% 14%, #fff9 50%, transparent 51%), radial-gradient(ellipse at 85% -10%, #1F3B44 0%, transparent 55%)',
    fg: '#F3EAD6',
    accent: '#4FE3B0',
    font: "'Rye', Georgia, serif",
    weight: 400,
    glow: '0 0 22px rgba(79,227,176,.35)',
    chip: 'rgba(18,122,99,.3)',
  },
  pf2e: {
    bg: '#171A33',
    texture: 'radial-gradient(ellipse at 80% 0%, rgba(224,149,43,.28) 0%, transparent 55%)',
    fg: '#F6F1E7',
    accent: '#E0952B',
    font: "'Fraunces Variable', Georgia, serif",
    weight: 900,
    chip: 'rgba(201,195,230,.16)',
  },
};

/** CSS custom properties for a card's style attribute. */
export function themeVars(t: RdlTheme): string {
  return [
    `--c-bg:${t.bg}`,
    `--c-texture:${t.texture ?? 'none'}`,
    `--c-texture-size:${t.textureSize ?? 'auto'}`,
    `--c-fg:${t.fg}`,
    `--c-accent:${t.accent}`,
    `--c-font:${t.font}`,
    `--c-weight:${t.weight}`,
    `--c-scale:${t.scale ?? 1}`,
    `--c-upper:${t.upper ? 'uppercase' : 'none'}`,
    `--c-glow:${t.glow ?? 'none'}`,
    `--c-chip:${t.chip}`,
  ].join(';');
}
