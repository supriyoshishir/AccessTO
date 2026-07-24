/**
 * Turns a raw datastore field key (e.g. "BranchName", "NBHDNo") into a
 * readable label ("Branch Name", "NBHD No"). Shared by DetailPanel (field
 * labels) and FilterPanel (the detected filter field's label).
 */
export function prettifyLabel(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
