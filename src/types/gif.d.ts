// gif.js ships without TypeScript types, so declare the surface we use.
// The runtime is a UMD bundle; we use the worker-driven encoder via the
// default export.
declare module 'gif.js' {
  type GifOptions = {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
    background?: string;
    transparent?: number | null;
    repeat?: number;
    debug?: boolean;
  };

  type FrameOptions = {
    delay?: number;
    copy?: boolean;
    dispose?: number;
  };

  type ProgressEvent = number;

  class GIF {
    constructor(options?: GifOptions);
    addFrame(image: HTMLCanvasElement | CanvasRenderingContext2D | ImageData, options?: FrameOptions): void;
    on(event: 'finished', callback: (blob: Blob) => void): void;
    on(event: 'progress', callback: (progress: ProgressEvent) => void): void;
    on(event: 'abort' | 'start', callback: () => void): void;
    render(): void;
    abort(): void;
  }

  export default GIF;
}

// Vite's `?url` import for the gif.js Web Worker — gives us a hashed
// asset URL we can hand to GIF's `workerScript` option.
declare module 'gif.js/dist/gif.worker.js?url' {
  const url: string;
  export default url;
}

