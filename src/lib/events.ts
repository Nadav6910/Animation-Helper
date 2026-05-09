/**
 * Stringly-typed custom-event names used by the cross-component
 * `window.dispatchEvent` hotwire pattern. Exporting them as named
 * constants keeps callers from hard-coding the literals (drift hazard)
 * and lets bundlers tree-shake unused entries — they're each tiny
 * primitive strings, so importing one from a feature chunk doesn't
 * drag in the listener's whole module graph.
 */

/** Re-opens the cinematic onboarding tour. Listened for in
 *  `OnboardingTour.tsx`, dispatched from the command palette's
 *  "Show onboarding tour" entry. */
export const SHOW_TOUR_EVENT = 'ah:show-tour';

/** Replays the preview animation. Listened for in `PreviewStage.tsx`,
 *  dispatched from the global Space-key handler in `App.tsx`. */
export const REPLAY_EVENT = 'ah:replay';

/** Triggers the CodePanel's Copy button. Listened for in
 *  `CodePanel.tsx`, dispatched from the global `c`-key handler. */
export const COPY_EVENT = 'ah:copy';

/** Nudges the timeline scrub head by a given delta. Listened for in
 *  `TimelinePanel.tsx`, dispatched from the global Arrow-key handler
 *  with `{ deltaMs: number }` in `event.detail`. */
export const SCRUB_NUDGE_EVENT = 'ah:scrub-nudge';
