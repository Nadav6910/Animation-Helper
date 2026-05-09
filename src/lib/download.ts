/**
 * Trigger a Blob download from the browser. Shared by CodePanel
 * (text-format exports) and ExportModal (binary recorder output) so
 * the deferred-revoke choreography lives in one place.
 *
 * The deferred URL.revokeObjectURL is the load-bearing detail:
 * `a.click()` schedules the download asynchronously in Firefox /
 * Safari, and revoking the object URL on the same tick can abort the
 * download mid-flight. setTimeout(0) hands the revoke off to the
 * next task, by which point the browser has committed to the file.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/**
 * String-content overload — wraps a string in a Blob with the given
 * MIME and forwards. Convenience for text-format exports that
 * already have the content as a JS string.
 */
export function downloadText(
  filename: string,
  contents: string,
  mime: string
): void {
  downloadBlob(new Blob([contents], { type: mime }), filename);
}
