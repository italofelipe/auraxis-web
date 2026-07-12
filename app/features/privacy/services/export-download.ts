/**
 * Client-side helpers to hand the LGPD export package to the user as a
 * downloadable JSON file (#1119). Pure functions — no Vue, no cache.
 */

/**
 * Builds the export filename from the package generation timestamp.
 *
 * @param generatedAt ISO timestamp from the package metadata, when present.
 * @returns Filename like `auraxis-dados-2026-07-11.json`.
 */
export const buildExportFilename = (generatedAt?: string | null): string => {
  const source = generatedAt ? new Date(generatedAt) : new Date();
  const stamp = Number.isNaN(source.getTime())
    ? new Date().toISOString().slice(0, 10)
    : source.toISOString().slice(0, 10);
  return `auraxis-dados-${stamp}.json`;
};

/**
 * Triggers a browser download of the given payload as pretty-printed JSON.
 *
 * @param payload Serialisable payload (the LGPD export package).
 * @param filename Download filename, e.g. from {@link buildExportFilename}.
 */
export const downloadJsonFile = (payload: unknown, filename: string): void => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
