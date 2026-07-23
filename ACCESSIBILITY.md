# Accessibility statement

## Standard targeted

AccessTO targets **WCAG 2.1 Level AA**, aligned with the **Accessibility for Ontarians
with Disabilities Act (AODA)** / Ontario Regulation 191/11, which references WCAG 2.1 AA
as its conformance standard.

## Key decision: the list is the primary path

The app renders every geographic record two ways at once — an interactive Google Map and
a keyboard/screen-reader-accessible list — but **the list is the guaranteed way to reach
every record**; the map is a progressive enhancement layered on top, not a requirement.

**Rationale:** Google Maps' JavaScript widget is a large, third-party interactive surface
whose internal keyboard behaviour (marker focus order, drag hints, zoom controls) isn't
something this app authors or fully controls. Rather than promise a fully keyboard-operable
map — a promise a third-party widget update could silently break — every capability the map
offers (browsing records, seeing their location, selecting one) is guaranteed through the
list and detail panel instead, which are built from plain, native HTML this app fully
controls. If `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is missing or invalid, the app degrades to
list-only with an inline notice and every feature still works (Phase 6, FR-6.5/FR-6.6).

## How this was tested

### Automated: jest-axe (component-level)

`__tests__/a11y.test.tsx` renders `SearchBar`, `ResultsList`, `DetailPanel`, and
`FilterPanel` — each across multiple representative states (loading, error, empty,
populated, a record with no coordinates, a selected item) — and asserts zero axe
violations via `jest-axe`. 10 tests, 0 violations. Run as part of `npm test` (22 tests
total across the suite; see `lib/normalizeRecords.test.ts` for the other 12).

**Known limitation of this layer:** `axe-core` cannot reliably evaluate rules that depend
on real layout/paint — notably `color-contrast` — inside `jsdom`, since `jsdom` doesn't
render. These tests catch structural/semantic issues (missing labels, invalid ARIA, role
misuse); contrast was verified separately (below).

### Automated: axe-core against the live, running app

Component tests exercise components in isolation with synthetic props; they don't cover
the composed page, real CKAN data, the embedded map, or live-region interplay between
components. To close that gap, `@axe-core/playwright` was run against the production
build (`next build && next start`) across six real application states reachable through
normal use:

| State                                                  | Violations |
| ------------------------------------------------------ | ---------- |
| Idle (page load)                                       | 0          |
| Search results shown                                   | 0          |
| Dataset selected (records + map + filter panel loaded) | 0          |
| A record selected (detail panel populated)             | 0          |
| Filter applied                                         | 0          |
| Dark theme                                             | 0          |

**Total: 0 violations (critical, serious, or otherwise) across all six states.**

### Manual: keyboard-only walkthrough

Performed as a real, scripted keyboard-only pass (via Playwright, dispatching genuine
`Tab`/`Enter`/`Space`/`ArrowDown` key events — not mouse/pointer input) against the
production build, following the search → select → filter → theme path FR-8.3 asks for:

1. **Tab** from page load → skip link receives focus first (visible focus ring), confirmed
   as the very first focusable element (Phase 1).
2. Focus the search input, type "library", press **Enter** → results load; the `aria-live`
   region announces "10 datasets found."
3. **Tab** to the "Library Branch General Information" dataset button, press **Enter** →
   `aria-current="true"` is set on it; records load; the live region announces "100 records
   found."
4. **Tab** to the "Albion" record button, press **Space** (not just Enter, to confirm both
   activate it per FR-5.3) → focus moves to the `DetailPanel` heading (`#detail-panel-heading`,
   confirmed via `document.activeElement`), which now shows Albion's fields as a `<dl>`.
5. **Tab** to the filter `<select>`, press **ArrowDown** + **Enter** to choose a value →
   the live region announces the narrowed count ("63 records found.").
6. **Tab** to the theme toggle, press **Enter** → `data-theme` flips to `dark`,
   `aria-pressed` flips to `true`.

Every step succeeded end to end: every control was Tab-reachable, every activation worked
with both Enter and Space where applicable, and every state change was either announced via
the live region or moved focus predictably (DetailPanel), matching FR-5.3/FR-5.5/FR-7.2.

**Known limitation:** the raw sequential Tab order also passes through the embedded map
(a `region` labelled "Map", plus in-map controls like "Keyboard shortcuts" and each marker,
which the underlying map library separately exposes as `role="button"` elements with their
own accessible names). This is expected given the list-as-primary-path design above — the
map's own tab stops are additional, not required, and don't block reaching or operating any
of the app's own controls.

### Manual: screen-reader pass — accessibility-tree proxy

This environment does not have a screen reader (NVDA/JAWS/VoiceOver/Narrator) available to
run interactively with audio verification, so **this is not a literal screen-reader
session** — it should be read as a proxy, not a substitute for one.

What was actually done: Playwright's `ariaSnapshot()` was used to capture the real
browser accessibility tree — the same structure an OS accessibility API (and therefore a
screen reader) queries — for the fully-loaded page (search performed, dataset selected,
record selected). Spot checks against that tree:

- Exactly one `heading` at `level=1` ("Explore Toronto's open data").
- The search form exposes an accessible `search` landmark named "Search datasets", with a
  `searchbox` of the same accessible name — not a placeholder-only input.
- Dataset and record results are exposed as a `list` of `listitem` → `button`, each
  button's accessible name being its full visible text (title, description, or record
  name) — nothing depends on visual-only cues.
- The filter control is exposed as a `combobox` named "Filter by {field}", with each
  option's value present as accessible text.
- The map region's accessible name is the same visible text as the summary above it
  ("Map showing N locations; full list below"), so it isn't announced as a bare,
  unlabelled "Map".

This confirms the accessible-name/role/structure computation a screen reader relies on is
correct, but it cannot confirm what a specific screen reader actually _speaks_ (wording,
verbosity settings, or product-specific quirks). **Recommendation: run a real NVDA (Windows)
or VoiceOver (macOS) pass before citing a screen-reader-verified claim externally** (e.g. in
an interview) — this document does not claim one was performed.

### Manual: zoom and reflow (FR-8.5)

Checked at 320px width (the WCAG 1.4.10 reflow reference width) and at ~700px width (an
approximation of 200% browser zoom on a standard viewport, since headless automation has no
direct "browser zoom" control). Both were checked against the fully-loaded page (dataset
selected, records + map shown).

**Found and fixed:** at 320px, the page had horizontal overflow (`scrollWidth: 342` vs.
`clientWidth: 320`). The cause was internal Google Maps marker elements
(`gmp-advanced-marker`, `gmp-pin`) rendered at their geographic pixel positions, which can
extend past the map's own clipped container at narrow widths — third-party rendering, not
something this app can adjust internally. Fixed with a page-level `overflow-x: hidden`
guard in `app/globals.css`, which doesn't affect any of the app's own content (nothing in
this app is intentionally wider than its container) but stops any stray internal element
from ever making the page itself horizontally scrollable. Re-verified after the fix: no
overflow at either width, and attempting to scroll horizontally does nothing.

## Known limitations

- **Screen-reader testing is an accessibility-tree proxy**, not a literal NVDA/VoiceOver
  session — see above.
- **The embedded map's internal keyboard/focus behaviour is third-party** and not fully
  controlled by this app; by design, it's never required to reach or operate any feature
  (see "the list is the primary path" above).
- **`jest-axe` cannot evaluate colour contrast inside `jsdom`.** Contrast was instead
  verified by computing WCAG relative-luminance ratios directly for every foreground/
  background pair used in the UI (Phase 7):

  | Pair                                                      | Ratio   | Requirement |
  | --------------------------------------------------------- | ------- | ----------- |
  | Light: body text (slate-900) on white                     | 17.85:1 | 4.5:1       |
  | Light: secondary text (slate-600) on white                | 7.58:1  | 4.5:1       |
  | Light: secondary text (slate-700) on white                | 10.35:1 | 4.5:1       |
  | Light: button text (white) on blue-700                    | 6.70:1  | 4.5:1       |
  | Light: error text (red-900) on red-50                     | 9.16:1  | 4.5:1       |
  | Light: error button text (red-800) on white               | 8.31:1  | 4.5:1       |
  | Light: amber notice text (amber-900) on amber-50          | 8.75:1  | 4.5:1       |
  | Light: focus ring (blue-700) on white                     | 6.70:1  | 3:1         |
  | Dark: body text (slate-100) on slate-900                  | 16.30:1 | 4.5:1       |
  | Dark: secondary text (slate-400) on slate-900             | 6.96:1  | 4.5:1       |
  | Dark: primary text (slate-100) on card (slate-800)        | 13.35:1 | 4.5:1       |
  | Dark: secondary text (slate-400) on card (slate-800)      | 5.71:1  | 4.5:1       |
  | Dark: button text (white) on blue-600                     | 5.17:1  | 4.5:1       |
  | Dark: selected-item border (blue-400) on card (slate-800) | 5.75:1  | 3:1         |
  | Dark: error text (red-200) on red-950                     | 11.16:1 | 4.5:1       |
  | Dark: error button text (red-300) on card (slate-800)     | 7.71:1  | 4.5:1       |
  | Dark: amber notice text (amber-200) on amber-950          | 12.03:1 | 4.5:1       |
  | Dark: focus ring (blue-400) on slate-900                  | 7.02:1  | 3:1         |
  | Dark: focus ring (blue-400) on card (slate-800)           | 5.75:1  | 3:1         |

  All pairs pass with margin. Note the fixed focus-ring colour used everywhere else in the
  app (blue-700) _fails_ 3:1 against the dark backgrounds (~2.2–2.7:1, measured) — this is
  why dark mode uses a different focus-ring colour (blue-400) instead of reusing light
  mode's.

- **Map tile dark styling depends on WebGL/vector rendering.** The `Map` component is
  given a `colorScheme` matching the current theme, but Google Maps falls back from Vector
  to Raster tiles in environments without WebGL support (observed in headless testing —
  "Attempted to load a Vector Map, but failed. Falling back to Raster."), and Raster tiles
  don't support this dynamic dark styling. Real users' browsers typically support WebGL, so
  this mainly affects constrained/headless environments; the surrounding UI (markers,
  panels, list) remains correctly themed regardless.
- **CKAN upstream is occasionally flaky.** The City of Toronto's CKAN host has been
  observed intermittently resetting the first connection attempt (`ECONNRESET`); the API
  client retries automatically (`lib/ckanClient.ts`), but a sustained outage still surfaces
  as the app's error state with a retry action — this is expected, tested behaviour, not a
  bug.

## Result summary

- `npm test`: 22 tests passed, including the `jest-axe` suite (0 violations).
- Live `axe-core` audit across 6 real application states: 0 violations.
- Keyboard-only walkthrough (search → select → filter → theme): fully succeeded.
- 320px and ~200%-zoom reflow: no horizontal scroll or clipping (one real issue found and
  fixed during this audit).
