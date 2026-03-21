# CLAUDE.md

## Commands

- **Before committing:** always run `npm test` and confirm all tests pass first

## Architecture

Interactive D3.js dashboard visualizing orbital launch data (1957–2026) from a TSV file. Vanilla JS with Vite, no framework.

### Key Data Fields

TSV column names don't match their UI concepts:

| UI concept | TSV column |
|-----------|-----------|
| Country | `LVState` |
| Vehicle | `LV_Type` |
| Outcome | `Launch_Code` (OS/DS→Success, OF→Failure, XS→Suborbital) |

### Data Model

The normalizer produces two arrays: **launches** (~7,200 unique by Launch_Tag) and **payloads** (~28,750 rows). Charts work with launch-level data; payload search filters by matching Name/PLName then maps back to Launch_Tags.

### Monthly Drill-Down

Drilling into a year updates ALL page filters (not just the chart) via `filterState.set({ yearMin: year, yearMax: year })`. Auto-exit: if the user changes the year range while drilled in, drill mode exits automatically — the chart's `update()` detects the mismatch.

`dualRangeSlider.js` exposes `setValues(min, max)` for programmatic updates without triggering `onChange`.
