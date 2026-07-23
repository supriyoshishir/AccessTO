"use client";

import { useId, useState } from "react";

export interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const inputId = useId();
  const [value, setValue] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    onSearch(trimmed);
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search datasets"
      className="flex flex-wrap items-end gap-3"
    >
      <div className="flex min-w-64 flex-1 flex-col gap-1">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Search datasets
        </label>
        <input
          id={inputId}
          type="search"
          name="q"
          required
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="e.g. parks, libraries, EV chargers"
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
      >
        Search
      </button>
    </form>
  );
}
