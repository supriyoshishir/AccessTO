export default function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <span className="text-lg font-semibold text-slate-900">AccessTO</span>
        <span className="text-sm text-slate-600">
          Accessible Toronto Open Data Explorer
        </span>
      </div>
    </header>
  );
}
