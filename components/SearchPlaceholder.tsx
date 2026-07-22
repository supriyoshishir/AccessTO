/**
 * Stand-in for the real dataset search UI, wired up in Phase 3
 * (accessible dataset search). Kept as its own component now so the
 * home page doesn't need to change shape when the real search lands.
 */
export default function SearchPlaceholder() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-slate-600">
      <p>Dataset search will appear here.</p>
    </div>
  );
}
