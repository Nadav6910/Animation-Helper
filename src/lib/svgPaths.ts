export type SvgPathCategory =
  | 'general'
  | 'shapes'
  | 'arrows'
  | 'ui'
  | 'effects'
  | 'nature';

export type SvgPathDef = {
  id: string;
  label: string;
  viewBox: string;
  d: string;
  category: SvgPathCategory;
};

// Simple stroked shapes that look right at preset durations. Every path
// is hand-tuned for `pathLength="100"` style stroke-draw — closed
// shapes use a single sub-path so the dash sweeps cleanly around their
// outline; open shapes (arrows, checks) draw end-to-end. Categories
// drive the picker's tab strip.
export const SVG_PATHS: SvgPathDef[] = [
  // ---------------------------- general ------------------------------
  {
    id: 'check',
    label: 'Check',
    viewBox: '0 0 24 24',
    category: 'general',
    d: 'M5 12.5 L10 17.5 L19 7',
  },
  {
    id: 'plus',
    label: 'Plus',
    viewBox: '0 0 24 24',
    category: 'general',
    d: 'M12 5 V 19 M5 12 H 19',
  },
  {
    id: 'x-mark',
    label: 'X mark',
    viewBox: '0 0 24 24',
    category: 'general',
    d: 'M6 6 L18 18 M18 6 L6 18',
  },
  {
    id: 'minus',
    label: 'Minus',
    viewBox: '0 0 24 24',
    category: 'general',
    d: 'M5 12 H 19',
  },
  {
    id: 'divide',
    label: 'Divide',
    viewBox: '0 0 24 24',
    category: 'general',
    d: 'M5 12 H 19 M12 6.5 a 1.5 1.5 0 1 1 0 3 a 1.5 1.5 0 1 1 0 -3 M12 14.5 a 1.5 1.5 0 1 1 0 3 a 1.5 1.5 0 1 1 0 -3',
  },
  {
    id: 'percent',
    label: 'Percent',
    viewBox: '0 0 24 24',
    category: 'general',
    d: 'M19 5 L5 19 M7.5 6 a 2 2 0 1 1 0 4 a 2 2 0 1 1 0 -4 M16.5 14 a 2 2 0 1 1 0 4 a 2 2 0 1 1 0 -4',
  },

  // ---------------------------- shapes -------------------------------
  {
    id: 'circle',
    label: 'Circle',
    viewBox: '0 0 24 24',
    category: 'shapes',
    d: 'M12 3 a 9 9 0 1 0 0 18 a 9 9 0 1 0 0 -18',
  },
  {
    id: 'square',
    label: 'Square',
    viewBox: '0 0 24 24',
    category: 'shapes',
    d: 'M4 4 H20 V20 H4 Z',
  },
  {
    id: 'triangle',
    label: 'Triangle',
    viewBox: '0 0 24 24',
    category: 'shapes',
    d: 'M12 3 L21 20 H3 Z',
  },
  {
    id: 'diamond',
    label: 'Diamond',
    viewBox: '0 0 24 24',
    category: 'shapes',
    d: 'M12 3 L21 12 L12 21 L3 12 Z',
  },
  {
    id: 'pentagon',
    label: 'Pentagon',
    viewBox: '0 0 24 24',
    category: 'shapes',
    d: 'M12 3 L21 10 L17.5 21 H6.5 L3 10 Z',
  },
  {
    id: 'hexagon',
    label: 'Hexagon',
    viewBox: '0 0 24 24',
    category: 'shapes',
    d: 'M12 3 L20.5 7.5 V16.5 L12 21 L3.5 16.5 V7.5 Z',
  },
  {
    id: 'octagon',
    label: 'Octagon',
    viewBox: '0 0 24 24',
    category: 'shapes',
    d: 'M9 3 H15 L21 9 V15 L15 21 H9 L3 15 V9 Z',
  },
  {
    id: 'star',
    label: 'Star',
    viewBox: '0 0 24 24',
    category: 'shapes',
    d: 'M12 3 L14.6 9.3 L21.5 9.9 L16.2 14.4 L17.8 21.1 L12 17.5 L6.2 21.1 L7.8 14.4 L2.5 9.9 L9.4 9.3 Z',
  },
  {
    id: 'heart',
    label: 'Heart',
    viewBox: '0 0 24 24',
    category: 'shapes',
    d: 'M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z',
  },
  {
    id: 'ring',
    label: 'Ring',
    viewBox: '0 0 24 24',
    category: 'shapes',
    d: 'M12 5 a 7 7 0 1 0 0 14 a 7 7 0 1 0 0 -14 M12 9 a 3 3 0 1 0 0 6 a 3 3 0 1 0 0 -6',
  },
  {
    id: 'rounded-square',
    label: 'Rounded',
    viewBox: '0 0 24 24',
    category: 'shapes',
    d: 'M8 4 H16 a 4 4 0 0 1 4 4 V16 a 4 4 0 0 1 -4 4 H8 a 4 4 0 0 1 -4 -4 V8 a 4 4 0 0 1 4 -4 Z',
  },

  // ---------------------------- arrows -------------------------------
  {
    id: 'arrow',
    label: 'Arrow',
    viewBox: '0 0 24 24',
    category: 'arrows',
    d: 'M3 12 H 19 M14 7 L 19 12 L 14 17',
  },
  {
    id: 'arrow-up',
    label: 'Up',
    viewBox: '0 0 24 24',
    category: 'arrows',
    d: 'M12 21 V5 M7 10 L12 5 L17 10',
  },
  {
    id: 'arrow-down',
    label: 'Down',
    viewBox: '0 0 24 24',
    category: 'arrows',
    d: 'M12 3 V19 M7 14 L12 19 L17 14',
  },
  {
    id: 'arrow-left',
    label: 'Left',
    viewBox: '0 0 24 24',
    category: 'arrows',
    d: 'M21 12 H 5 M10 7 L 5 12 L 10 17',
  },
  {
    id: 'double-arrow',
    label: 'Double',
    viewBox: '0 0 24 24',
    category: 'arrows',
    d: 'M3 12 H 19 M10 7 L 15 12 L 10 17 M14 7 L 19 12 L 14 17',
  },
  {
    id: 'refresh',
    label: 'Refresh',
    viewBox: '0 0 24 24',
    category: 'arrows',
    d: 'M4 12 a 8 8 0 0 1 13.5 -5.5 L20 4 V10 H14 M20 12 a 8 8 0 0 1 -13.5 5.5 L4 20 V14 H10',
  },
  {
    id: 'swap',
    label: 'Swap',
    viewBox: '0 0 24 24',
    category: 'arrows',
    d: 'M3 9 H19 L15 5 M21 15 H5 L9 19',
  },
  {
    id: 'corner',
    label: 'Corner',
    viewBox: '0 0 24 24',
    category: 'arrows',
    d: 'M5 5 V13 a 4 4 0 0 0 4 4 H20 M16 13 L20 17 L16 21',
  },
  {
    id: 'back',
    label: 'Back',
    viewBox: '0 0 24 24',
    category: 'arrows',
    d: 'M19 12 H 8 a 4 4 0 0 1 0 -8 H 12 M12 8 L 8 12 L 12 16',
  },

  // ----------------------------- ui ----------------------------------
  {
    id: 'play',
    label: 'Play',
    viewBox: '0 0 24 24',
    category: 'ui',
    d: 'M7 4 L20 12 L7 20 Z',
  },
  {
    id: 'pause',
    label: 'Pause',
    viewBox: '0 0 24 24',
    category: 'ui',
    d: 'M8 5 V19 M16 5 V19',
  },
  {
    id: 'stop',
    label: 'Stop',
    viewBox: '0 0 24 24',
    category: 'ui',
    d: 'M6 6 H18 V18 H6 Z',
  },
  {
    id: 'eye',
    label: 'Eye',
    viewBox: '0 0 24 24',
    category: 'ui',
    d: 'M2 12 C 5 6 9 4 12 4 S 19 6 22 12 C 19 18 15 20 12 20 S 5 18 2 12 Z M12 9 a 3 3 0 1 0 0 6 a 3 3 0 1 0 0 -6',
  },
  {
    id: 'search',
    label: 'Search',
    viewBox: '0 0 24 24',
    category: 'ui',
    d: 'M11 4 a 7 7 0 1 1 0 14 a 7 7 0 1 1 0 -14 M16.5 16.5 L21 21',
  },
  {
    id: 'home',
    label: 'Home',
    viewBox: '0 0 24 24',
    category: 'ui',
    d: 'M3 12 L12 3 L21 12 V20 H14 V14 H10 V20 H3 Z',
  },
  {
    id: 'user',
    label: 'User',
    viewBox: '0 0 24 24',
    category: 'ui',
    d: 'M12 4 a 4 4 0 1 0 0 8 a 4 4 0 1 0 0 -8 M4 21 a 8 8 0 0 1 16 0',
  },
  {
    id: 'menu',
    label: 'Menu',
    viewBox: '0 0 24 24',
    category: 'ui',
    d: 'M4 7 H20 M4 12 H20 M4 17 H20',
  },
  {
    id: 'gear',
    label: 'Gear',
    viewBox: '0 0 24 24',
    category: 'ui',
    d: 'M12 9 a 3 3 0 1 0 0 6 a 3 3 0 1 0 0 -6 M19.4 15 L 21 16 L 20 18 L 18.1 17.4 L 16.5 18.5 L 16 20.5 H 14 V 18.6 L 12.4 17.7 L 10.5 18.5 L 8.5 17.5 L 9 15.5 L 7.6 14 L 5.5 13.5 L 5 11.5 L 7 11 L 7.6 9 L 6.5 7.5 L 8 6 L 9.7 7 L 11 6.4 L 11.5 4 H 13.5 L 14 6 L 15.5 6.5 L 17.5 5.5 L 19 7 L 17.5 8.5 L 18 10 L 20 10.6 L 19.5 12.5 L 17.6 13 Z',
  },
  {
    id: 'lock',
    label: 'Lock',
    viewBox: '0 0 24 24',
    category: 'ui',
    d: 'M5 11 H19 V21 H5 Z M8 11 V8 a 4 4 0 0 1 8 0 V11',
  },
  {
    id: 'mail',
    label: 'Mail',
    viewBox: '0 0 24 24',
    category: 'ui',
    d: 'M3 6 H21 V18 H3 Z M3 6 L12 13 L21 6',
  },
  {
    id: 'bell',
    label: 'Bell',
    viewBox: '0 0 24 24',
    category: 'ui',
    d: 'M6 17 L4 19 H20 L18 17 V11 a 6 6 0 0 0 -12 0 Z M10 21 a 2 2 0 0 0 4 0',
  },
  {
    id: 'trash',
    label: 'Trash',
    viewBox: '0 0 24 24',
    category: 'ui',
    d: 'M5 7 H19 L17.5 20 H6.5 Z M9 4 H15 V7 M10 11 V17 M14 11 V17',
  },
  {
    id: 'pencil',
    label: 'Pencil',
    viewBox: '0 0 24 24',
    category: 'ui',
    d: 'M14 4 L20 10 L8 22 L2 22 L2 16 Z M13 5 L19 11',
  },
  {
    id: 'bookmark',
    label: 'Bookmark',
    viewBox: '0 0 24 24',
    category: 'ui',
    d: 'M6 3 H18 V21 L12 17 L6 21 Z',
  },

  // ---------------------------- effects ------------------------------
  {
    id: 'spark',
    label: 'Spark',
    viewBox: '0 0 24 24',
    category: 'effects',
    d: 'M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z',
  },
  {
    id: 'lightning',
    label: 'Bolt',
    viewBox: '0 0 24 24',
    category: 'effects',
    d: 'M13 2 L4 14 H11 L9 22 L20 10 H13 Z',
  },
  {
    id: 'wave',
    label: 'Wave',
    viewBox: '0 0 48 24',
    category: 'effects',
    d: 'M2 12 Q 8 2, 14 12 T 26 12 T 38 12 T 50 12',
  },
  {
    id: 'underline',
    label: 'Underline',
    viewBox: '0 0 48 12',
    category: 'effects',
    d: 'M2 8 Q 12 2, 24 6 T 46 8',
  },
  {
    id: 'crown',
    label: 'Crown',
    viewBox: '0 0 24 24',
    category: 'effects',
    d: 'M3 8 L7 14 L12 6 L17 14 L21 8 L19 19 H5 Z',
  },
  {
    id: 'sun',
    label: 'Sun',
    viewBox: '0 0 24 24',
    category: 'effects',
    d: 'M12 8 a 4 4 0 1 0 0 8 a 4 4 0 1 0 0 -8 M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M5 5 L7 7 M17 17 L19 19 M5 19 L7 17 M17 7 L19 5',
  },
  {
    id: 'moon',
    label: 'Moon',
    viewBox: '0 0 24 24',
    category: 'effects',
    d: 'M20 14 a 8 8 0 1 1 -10 -10 a 6.5 6.5 0 0 0 10 10',
  },
  {
    id: 'flame',
    label: 'Flame',
    viewBox: '0 0 24 24',
    category: 'effects',
    d: 'M12 3 c 0 5 -6 5 -6 11 a 6 6 0 0 0 12 0 c 0 -3 -2 -5 -3 -7 c -1 1 -2 1 -3 -4 Z',
  },
  {
    id: 'snowflake',
    label: 'Snowflake',
    viewBox: '0 0 24 24',
    category: 'effects',
    d: 'M12 3 V21 M3 12 H21 M5 5 L19 19 M5 19 L19 5 M9 5 L12 8 L15 5 M9 19 L12 16 L15 19 M5 9 L8 12 L5 15 M19 9 L16 12 L19 15',
  },
  {
    id: 'ribbon',
    label: 'Ribbon',
    viewBox: '0 0 24 24',
    category: 'effects',
    d: 'M5 4 H19 L17 12 L19 20 L12 16 L5 20 L7 12 Z',
  },
  {
    id: 'target',
    label: 'Target',
    viewBox: '0 0 24 24',
    category: 'effects',
    d: 'M12 3 a 9 9 0 1 0 0 18 a 9 9 0 1 0 0 -18 M12 7 a 5 5 0 1 0 0 10 a 5 5 0 1 0 0 -10 M12 11 a 1 1 0 1 0 0 2 a 1 1 0 1 0 0 -2',
  },

  // ---------------------------- nature -------------------------------
  {
    id: 'cloud',
    label: 'Cloud',
    viewBox: '0 0 32 24',
    category: 'nature',
    d: 'M9 19h17a5 5 0 1 0 -1.4 -9.8A8 8 0 1 0 9 19Z',
  },
  {
    id: 'leaf',
    label: 'Leaf',
    viewBox: '0 0 24 24',
    category: 'nature',
    d: 'M3 21 c 0 -10 6 -18 18 -18 c 0 12 -8 18 -18 18 Z M3 21 L13 11',
  },
  {
    id: 'drop',
    label: 'Drop',
    viewBox: '0 0 24 24',
    category: 'nature',
    d: 'M12 3 c -5 7 -7 10 -7 13 a 7 7 0 0 0 14 0 c 0 -3 -2 -6 -7 -13 Z',
  },
  {
    id: 'tree',
    label: 'Tree',
    viewBox: '0 0 24 24',
    category: 'nature',
    d: 'M12 3 L4 12 H8 L4 18 H10 V21 H14 V18 H20 L16 12 H20 Z',
  },
  {
    id: 'flower',
    label: 'Flower',
    viewBox: '0 0 24 24',
    category: 'nature',
    d: 'M12 12 a 4 4 0 1 0 0 -4 a 4 4 0 1 0 -4 4 a 4 4 0 1 0 4 4 a 4 4 0 1 0 4 -4 M12 12 a 1.5 1.5 0 1 0 0 -3 a 1.5 1.5 0 1 0 0 3',
  },
  {
    id: 'mountain',
    label: 'Mountain',
    viewBox: '0 0 24 24',
    category: 'nature',
    d: 'M3 20 L9 8 L13 14 L17 6 L21 20 Z',
  },
];

export const SVG_PATH_BY_ID: Record<string, SvgPathDef> = Object.fromEntries(
  SVG_PATHS.map((p) => [p.id, p])
);

export const SVG_PATH_CATEGORIES: { id: SvgPathCategory; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'shapes', label: 'Shapes' },
  { id: 'arrows', label: 'Arrows' },
  { id: 'ui', label: 'UI' },
  { id: 'effects', label: 'Effects' },
  { id: 'nature', label: 'Nature' },
];
