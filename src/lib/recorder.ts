import { totalDuration } from './timing';
import type { AnimationConfig } from '@/types/animation';

export type RecordFormat = 'mp4' | 'webm' | 'gif';

export type RecordOptions = {
  format: RecordFormat;
  fps: 24 | 30 | 60;
  /** Output canvas pixel size. The captured DOM element is rasterised to
   *  this resolution. Defaults to the source element's `getBoundingClientRect`. */
  width?: number;
  height?: number;
  /** Solid background colour painted under each frame. Use `null` for
   *  transparent (only valid for WebM + GIF — MP4 always gets the
   *  fallback colour because the H.264 codec doesn't carry alpha). */
  background?: string | null;
  /** How many full iterations of `totalDuration(config)` to capture.
   *  Defaults to 1; 2–5 is useful for previewing infinite loops. */
  iterations?: number;
  /** Progress callback (0..1). Receives 0 on start, fractional values
   *  during frame capture, then 1 on encode completion. */
  onProgress?: (ratio: number) => void;
  /** Aborts the recording at the next frame boundary. */
  signal?: AbortSignal;
};

export type RecordResult = {
  blob: Blob;
  filename: string;
  durationMs: number;
  frameCount: number;
};

export class RecorderAbortError extends Error {
  constructor() {
    super('Recording aborted');
    this.name = 'RecorderAbortError';
  }
}

/**
 * Capture each frame at the requested FPS by setting the Animation's
 * currentTime, waiting one paint, then rasterising the DOM element to a
 * canvas. We pause first so the WAAPI Animation doesn't drift between
 * seek and capture.
 */
async function captureFrames(
  element: HTMLElement | SVGElement,
  animation: Animation,
  c: AnimationConfig,
  opts: RecordOptions
): Promise<HTMLCanvasElement[]> {
  const { fps, signal } = opts;
  const oneCycle = totalDuration(c);
  const totalMs = oneCycle * (opts.iterations ?? 1);
  const frameInterval = 1000 / fps;
  const frameCount = Math.max(1, Math.round(totalMs / frameInterval));
  const rect = element.getBoundingClientRect();
  const targetWidth = opts.width ?? Math.round(rect.width);
  const targetHeight = opts.height ?? Math.round(rect.height);

  // html-to-image is the fattest dep we own, so import it lazily here so
  // the editor bundle never pays for it until the user actually records.
  const { toCanvas } = await import('html-to-image');

  animation.pause();
  // Snapshot via Number() — Animation.currentTime's spec type is
  // CSSNumberish | null and writing the raw value back can throw on
  // browsers exposing the new typed-OM shape (a CSSNumericValue
  // instance). Coerce to a plain number; null becomes 0 which is the
  // safe restore point if the animation hadn't played yet.
  const wasCurrentTime = Number(animation.currentTime ?? 0);

  const frames: HTMLCanvasElement[] = [];
  try {
    for (let i = 0; i < frameCount; i++) {
      if (signal?.aborted) throw new RecorderAbortError();
      const t = (i * totalMs) / frameCount;
      // Loop the Animation's time within one cycle; iterations are baked
      // into the captured frame sequence by re-traversing the cycle.
      // Coerce via Number() — Animation.currentTime's type is
      // CSSNumberish | null, and writing the raw object back would
      // throw on browsers exposing the new typed-OM shape.
      const currentTime = oneCycle > 0 ? t % oneCycle : 0;
      animation.currentTime = currentTime;
      // Yield to the browser so the new style is applied before capture.
      // Two rAFs — Safari needs the second one for filter / offset-path
      // changes to actually paint into the captured canvas; one is
      // enough on Chrome but doesn't hurt.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve())
        )
      );
      let canvas: HTMLCanvasElement;
      try {
        canvas = await toCanvas(element as HTMLElement, {
          width: targetWidth,
          height: targetHeight,
          pixelRatio: 1,
          backgroundColor:
            opts.background === undefined || opts.background === null
              ? undefined
              : opts.background,
          cacheBust: true,
        });
      } catch (err) {
        // html-to-image throws when the captured element references a
        // tainted resource (cross-origin image without CORS headers,
        // a font from an opaque origin). Surface a clear message so
        // the user knows to swap the asset rather than seeing the
        // generic toCanvas stack trace.
        const reason =
          err instanceof Error ? err.message : 'unknown rasterisation error';
        throw new Error(
          `Couldn't capture frame ${i + 1}/${frameCount}: ${reason}. Cross-origin images or fonts without CORS headers can't be rasterised — try swapping them for same-origin assets.`
        );
      }
      frames.push(canvas);
      opts.onProgress?.((i + 1) / frameCount / 2); // first half = capture
    }
  } finally {
    // Restore the animation's prior state — the user pressed Record from
    // a particular play position; don't strand them at a different time.
    animation.currentTime = wasCurrentTime;
  }
  return frames;
}

// ---- Encoders ----------------------------------------------------------

async function encodeVideo(
  frames: HTMLCanvasElement[],
  fps: number,
  format: 'mp4' | 'webm',
  signal: AbortSignal | undefined,
  onProgress: ((ratio: number) => void) | undefined
): Promise<Blob> {
  // Pick a MIME the user's browser actually supports for MediaRecorder.
  // We deliberately keep the candidate lists same-format-only — falling
  // back from MP4 to WebM silently produces a `.mp4` file that's
  // actually WebM, which players reject. The user picked MP4 explicitly;
  // if it's not available, surface a clear error so they can choose
  // WebM themselves.
  const candidates =
    format === 'mp4'
      ? ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=h264', 'video/mp4']
      : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  const mimeType =
    candidates.find((m) =>
      typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)
    ) ?? '';
  if (!mimeType) {
    throw new Error(
      format === 'mp4'
        ? "MP4 isn't supported in this browser (Firefox lacks an MP4 encoder). Try WebM or GIF."
        : "WebM isn't supported in this browser. Try MP4 or GIF."
    );
  }

  const first = frames[0];
  const canvas = document.createElement('canvas');
  canvas.width = first.width;
  canvas.height = first.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(first, 0, 0);

  // captureStream() taps the canvas at a fixed framerate. We then drive
  // the canvas ourselves (one frame per 1/fps seconds) so the MediaRecorder
  // sees a real video stream.
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const finished = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () =>
      resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
    recorder.onerror = (e: Event) =>
      reject((e as ErrorEvent).error ?? new Error('MediaRecorder failed'));
  });

  recorder.start();

  const intervalMs = 1000 / fps;
  for (let i = 0; i < frames.length; i++) {
    if (signal?.aborted) {
      recorder.stop();
      throw new RecorderAbortError();
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(frames[i], 0, 0);
    onProgress?.(0.5 + ((i + 1) / frames.length) * 0.5);
    await new Promise<void>((resolve) => window.setTimeout(resolve, intervalMs));
  }

  recorder.stop();
  return finished;
}

async function encodeGif(
  frames: HTMLCanvasElement[],
  fps: number,
  signal: AbortSignal | undefined,
  onProgress: ((ratio: number) => void) | undefined
): Promise<Blob> {
  const { default: GIF } = await import('gif.js');
  // gif.js needs a worker script URL. Vite ships the file inside its node
  // dep; route it through `?url` so the bundler emits a hashed asset.
  const { default: workerUrl } = await import('gif.js/dist/gif.worker.js?url');

  return new Promise<Blob>((resolve, reject) => {
    const first = frames[0];
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: first.width,
      height: first.height,
      workerScript: workerUrl,
    });
    const delay = 1000 / fps;

    // Memory: gif.js with `copy:true` retains every frame canvas
    // until render finishes. 60 fps × 5s × 1024² ≈ 1.2 GB peak,
    // which OOMs lower-end mobile. Pass `copy:false` (gif.js reads
    // the canvas straight) and aggressively drop our reference to
    // each frame after handing it off so the original captured
    // canvases can be GC'd as the encoder progresses.
    for (let i = 0; i < frames.length; i++) {
      if (signal?.aborted) {
        gif.abort();
        reject(new RecorderAbortError());
        return;
      }
      gif.addFrame(frames[i], { delay, copy: false });
      // Detach our reference. gif.js has already pulled the pixel
      // data internally during addFrame; the original canvas is
      // safe to release.
      frames[i] = null as unknown as HTMLCanvasElement;
    }

    gif.on('progress', (p: number) => onProgress?.(0.5 + p * 0.5));
    gif.on('finished', (blob: Blob) => resolve(blob));
    // gif.js silently swallows worker failures (CSP `worker-src 'self'`
    // blocking the blob worker, OOM, etc.) — without these handlers the
    // promise hangs forever and the modal sits at "Recording…". `abort`
    // also fires when our cancel path calls `gif.abort()`, so guard
    // against double-rejection by keeping the AbortError mapping local
    // to the `signal.aborted` check above.
    gif.on('abort', () => {
      if (!signal?.aborted) {
        reject(new Error('GIF encoder aborted unexpectedly.'));
      }
    });
    // The runtime gif.js Emitter exposes `error` even though the type
    // file we ship doesn't declare it; cast through unknown.
    (gif as unknown as { on: (e: string, h: (err: Error) => void) => void }).on(
      'error',
      (err: Error) => reject(err ?? new Error('GIF encoding failed'))
    );

    // Wrap render() too — synchronous worker construction can throw on
    // strict CSP before any 'error' event fires.
    try {
      gif.render();
    } catch (err) {
      reject(
        err instanceof Error
          ? err
          : new Error(
              'GIF worker failed to start (the host may block blob: workers via CSP).'
            )
      );
    }
  });
}

// ---- Public ------------------------------------------------------------

export async function recordPreview(
  element: HTMLElement | SVGElement,
  animation: Animation,
  config: AnimationConfig,
  opts: RecordOptions
): Promise<RecordResult> {
  if (opts.signal?.aborted) throw new RecorderAbortError();
  opts.onProgress?.(0);
  const frames = await captureFrames(element, animation, config, opts);
  const blob =
    opts.format === 'gif'
      ? await encodeGif(frames, opts.fps, opts.signal, opts.onProgress)
      : await encodeVideo(
          frames,
          opts.fps,
          opts.format,
          opts.signal,
          opts.onProgress
        );
  opts.onProgress?.(1);
  return {
    blob,
    filename: `animation.${opts.format}`,
    durationMs: totalDuration(config) * (opts.iterations ?? 1),
    frameCount: frames.length,
  };
}
