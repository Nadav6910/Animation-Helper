export type SvgPathDef = {
  id: string;
  label: string;
  viewBox: string;
  d: string;
  approxLength: number;
};

export const SVG_PATHS: SvgPathDef[] = [
  {
    id: 'check',
    label: 'Check',
    viewBox: '0 0 24 24',
    d: 'M5 12.5 L10 17.5 L19 7',
    approxLength: 24,
  },
  {
    id: 'heart',
    label: 'Heart',
    viewBox: '0 0 24 24',
    d: 'M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z',
    approxLength: 60,
  },
  {
    id: 'star',
    label: 'Star',
    viewBox: '0 0 24 24',
    d: 'M12 3 L14.6 9.3 L21.5 9.9 L16.2 14.4 L17.8 21.1 L12 17.5 L6.2 21.1 L7.8 14.4 L2.5 9.9 L9.4 9.3 Z',
    approxLength: 75,
  },
  {
    id: 'wave',
    label: 'Wave',
    viewBox: '0 0 48 24',
    d: 'M2 12 Q 8 2, 14 12 T 26 12 T 38 12 T 50 12',
    approxLength: 60,
  },
  {
    id: 'arrow',
    label: 'Arrow',
    viewBox: '0 0 24 24',
    d: 'M3 12 H 19 M14 7 L 19 12 L 14 17',
    approxLength: 30,
  },
  {
    id: 'spark',
    label: 'Spark',
    viewBox: '0 0 24 24',
    d: 'M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z',
    approxLength: 60,
  },
];

export const SVG_PATH_BY_ID: Record<string, SvgPathDef> = Object.fromEntries(
  SVG_PATHS.map((p) => [p.id, p])
);
