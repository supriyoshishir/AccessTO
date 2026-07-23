/* @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import SearchBar from "@/components/SearchBar";
import ResultsList from "@/components/ResultsList";
import DetailPanel from "@/components/DetailPanel";
import FilterPanel from "@/components/FilterPanel";
import type { Place } from "@/lib/types";

// Note: jest-axe/axe-core has a known limitation in jsdom — it cannot
// reliably evaluate rules that depend on real layout/rendering (notably
// color-contrast), since jsdom doesn't paint. Contrast is verified
// separately (computed WCAG ratios; see ACCESSIBILITY.md). These tests
// cover structural/semantic accessibility: labels, roles, ARIA validity.

const PLACES: Place[] = [
  {
    id: "pkg:1",
    name: "Albion",
    lat: 43.73999,
    lng: -79.5845,
    fields: { BranchCode: "AB", ServiceTier: "DL", Address: "1515 Albion Road" },
  },
  {
    id: "pkg:2",
    name: "Albert Campbell",
    lat: 43.70814,
    lng: -79.26911,
    fields: { BranchCode: "ACD", ServiceTier: "RR", Address: "496 Birchmount Road" },
  },
  {
    id: "pkg:3",
    name: "Bookmobile One",
    lat: null,
    lng: null,
    fields: { BranchCode: "BM1", ServiceTier: "OT", Address: "" },
  },
];

describe("SearchBar accessibility", () => {
  it("has no violations", async () => {
    const { container } = render(<SearchBar onSearch={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("ResultsList accessibility", () => {
  it("has no violations with results (one selected, one location-unavailable)", async () => {
    const { container } = render(
      <ResultsList
        places={PLACES}
        loading={false}
        error={null}
        selectedId="pkg:1"
        onSelect={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations in the loading state", async () => {
    const { container } = render(
      <ResultsList
        places={null}
        loading
        error={null}
        selectedId={null}
        onSelect={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations in the error state", async () => {
    const { container } = render(
      <ResultsList
        places={null}
        loading={false}
        error="Something went wrong while loading records."
        selectedId={null}
        onSelect={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations in the empty-results state", async () => {
    const { container } = render(
      <ResultsList
        places={[]}
        loading={false}
        error={null}
        selectedId={null}
        onSelect={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("DetailPanel accessibility", () => {
  it("has no violations in the idle state", async () => {
    const { container } = render(<DetailPanel place={null} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations with a populated place", async () => {
    const { container } = render(<DetailPanel place={PLACES[0]} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations for a place with location unavailable", async () => {
    const { container } = render(<DetailPanel place={PLACES[2]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("FilterPanel accessibility", () => {
  it("has no violations when a categorical field is detected", async () => {
    const { container } = render(
      <FilterPanel places={PLACES} selectedValue={null} onChange={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations when it renders nothing (no categorical field)", async () => {
    const { container } = render(
      <FilterPanel places={[]} selectedValue={null} onChange={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
