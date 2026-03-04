# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (Vite, port 5174)
- **Build:** `npm run build` (outputs to `dist/`)
- **Preview production build:** `npm run preview`
- No test framework is configured.

## Architecture

Interactive D3.js dashboard visualizing orbital launch data (1957–2026) from a TSV file. Vanilla JS with Vite, no framework.

### Data Pipeline

```
public/launchlog.tsv
  → parser.js      (fetch TSV, split into row objects, "-" → null)
  → normalizer.js  (parse dates, classify outcomes, dedup by Launch_Tag)
  → aggregator.js  (filter + group into chart-ready structures)
```

The normalizer produces two arrays: **launches** (~7,200 unique by Launch_Tag) and **payloads** (~28,750 rows). Charts work with launch-level data; payload search filters by matching Name/PLName then maps back to Launch_Tags.

### Filter → Chart Update Cycle

`filterState.js` is a pub/sub store. When any filter changes:

1. `filterState.set({key: value})` updates state and notifies subscribers
2. `chartManager` (the main subscriber) calls `filterData()` from aggregator
3. `chartManager` calls `update(launches, payloads, filters)` on all registered charts inside `requestAnimationFrame`

All charts implement a `{ update(launches, payloads, filters) }` interface returned from their `create*()` factory function. Charts are registered in `main.js`.

### Display Name Mappings

Three mapping files (`countryNames.js`, `agencyNames.js`, `siteNames.js`) map abbreviation codes to full names. These are used in:
- Filter dropdowns: shown as `CODE (Full Name)`, also searched by full name
- Chart legends and tooltips

The pattern: pass a `displayNames` object through config, then look up with `displayNames[code] || code`.

### Key Data Fields

| UI concept | TSV column | Filter key |
|-----------|-----------|------------|
| Country | `SatState` | `country` |
| Agency | `Agency` | `agency` |
| Vehicle | `LV_Type` | `vehicle` |
| Site | `Launch_Site` | `site` |
| Pad | `Launch_Pad` | `pad` |
| Outcome | `Launch_Code` | (derived in normalizer: OS/DS→Success, OF→Failure, XS→Suborbital) |

### CSS Structure

Three CSS files imported in `main.js`: `main.css` (layout, variables, grid), `filters.css` (filter bar, dropdowns, dual-range slider, mobile overlay), `charts.css` (tooltips, legends, axes, chart-specific styles). Dark theme with CSS custom properties.

Mobile breakpoint at 768px: charts go single-column, filter bar collapses to overlay.

### Deployment

Hosted on GitHub Pages at `launchstats.info`.

- **`deploy.yml`** — Builds and deploys to Pages on every push to `main`. Also callable via `workflow_call` so other workflows can reuse it.
- **`update-data.yml`** — Daily cron (8:00 UTC) fetches the latest TSV from `planet4589.org`, commits if changed, then calls `deploy.yml` to redeploy.
- **Custom domain** — `public/CNAME` sets `launchstats.info`. Base path is `/` (no subdirectory).
