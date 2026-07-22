import SearchPlaceholder from "@/components/SearchPlaceholder";

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-slate-900">
        Explore Toronto&rsquo;s open data
      </h1>
      <p className="max-w-2xl text-slate-700">
        Search datasets published by the City of Toronto and browse the results as an
        accessible list, kept in sync with an interactive map.
      </p>
      <SearchPlaceholder />
    </div>
  );
}
