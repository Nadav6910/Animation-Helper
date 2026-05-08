export type SvgPathDef = {
  id: string;
  label: string;
  viewBox: string;
  d: string;
};

export const SVG_PATHS: SvgPathDef[] = [
  {
    id: 'check',
    label: 'Check',
    viewBox: '0 0 24 24',
    d: 'M5 12.5 L10 17.5 L19 7',
  },
  {
    id: 'heart',
    label: 'Heart',
    viewBox: '0 0 24 24',
    d: 'M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z',
  },
  {
    id: 'star',
    label: 'Star',
    viewBox: '0 0 24 24',
    d: 'M12 3 L14.6 9.3 L21.5 9.9 L16.2 14.4 L17.8 21.1 L12 17.5 L6.2 21.1 L7.8 14.4 L2.5 9.9 L9.4 9.3 Z',
  },
  {
    id: 'wave',
    label: 'Wave',
    viewBox: '0 0 48 24',
    d: 'M2 12 Q 8 2, 14 12 T 26 12 T 38 12 T 50 12',
  },
  {
    id: 'arrow',
    label: 'Arrow',
    viewBox: '0 0 24 24',
    d: 'M3 12 H 19 M14 7 L 19 12 L 14 17',
  },
  {
    id: 'spark',
    label: 'Spark',
    viewBox: '0 0 24 24',
    d: 'M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z',
  },
  {
    id: 'lightning',
    label: 'Lightning',
    viewBox: '0 0 24 24',
    d: 'M13 2 L4 14 H11 L9 22 L20 10 H13 Z',
  },
  {
    id: 'cloud',
    label: 'Cloud',
    viewBox: '0 0 32 24',
    d: 'M9 19h17a5 5 0 1 0 -1.4 -9.8A8 8 0 1 0 9 19Z',
  },
  {
    id: 'plus',
    label: 'Plus',
    viewBox: '0 0 24 24',
    d: 'M12 5 V 19 M5 12 H 19',
  },
  {
    id: 'circle',
    label: 'Circle',
    viewBox: '0 0 24 24',
    d: 'M12 3 a 9 9 0 1 0 0 18 a 9 9 0 1 0 0 -18',
  },
  {
    id: 'underline',
    label: 'Underline',
    viewBox: '0 0 48 12',
    d: 'M2 8 Q 12 2, 24 6 T 46 8',
  },
  {
    id: 'crown',
    label: 'Crown',
    viewBox: '0 0 24 24',
    d: 'M3 8 L7 14 L12 6 L17 14 L21 8 L19 19 H5 Z',
  },
  {
    id: 'play',
    label: 'Play',
    viewBox: '0 0 24 24',
    d: 'M7 4 L20 12 L7 20 Z',
  },
];

export const SVG_PATH_BY_ID: Record<string, SvgPathDef> = Object.fromEntries(
  SVG_PATHS.map((p) => [p.id, p])
);
