# Schedule-Life

A personal day/week scheduling app — brutalist UI, a vertical day timeline with a live
"now" line, a weekly routine that auto-fills every week, drag-to-move/resize, per-task
hard-limit deadlines and links, and a theme that follows your local sunrise → sunset.

Ported from the design prototype into a real **Vite + React + TypeScript** app using
**Feature-Sliced Design**. State lives in a **Zustand** store, persisted to `localStorage`.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check (tsc -b) + production build to dist/
npm run preview  # serve the built dist/
```

## Architecture (Feature-Sliced Design)

Imports only ever point downward: `app → pages → widgets → features → entities → shared`.
Each slice exposes a public API through its `index.ts`; nothing reaches into a slice's
internals. The `@/` alias points at `src/`.

```
src/
├── app/                     # shell + global styles (tokens.css, global.css), App.tsx
├── pages/
│   └── schedule/            # composes the whole screen, owns view/date/modal state
├── widgets/
│   ├── header/              # top bar: view switch, theme, routine, backup, settings, add
│   ├── day-view/            # day timeline, drag/resize/create, now-line, stats, up-next
│   ├── week-view/           # 7-day grid, cross-day drag for tasks, now-line
│   └── task-list/           # all tasks: search + filters + sort
├── features/
│   ├── theme/               # sunrise/sunset → light/dark (useSunTheme)
│   ├── task-editor/         # create/edit a task or routine occurrence
│   ├── routine-scope/       # "this day only vs whole routine" after dragging a routine item
│   ├── routine-editor/      # the weekly routine template + term range
│   ├── settings/            # location + theme override
│   └── backup/              # export/import JSON
├── entities/
│   └── schedule/            # types, seed data, Zustand store, occurrence/layout/limit logic
└── shared/
    ├── config/              # categories, priorities, cities, layout constants
    ├── lib/                 # time/date/sun/color helpers, useNow
    └── ui/                  # Icon, Modal
```

## Features

- **Day view** — vertical timeline; drag a block to move it, drag its bottom edge to resize,
  drag an empty slot to create. Shows allocated time, the hard-limit flag (red when the
  allocation runs past the deadline), priority, category color, links, and a done toggle.
- **Now line** — a moving marker on today, updated every 30s; the day opens at the now-line
  for today and at 08:00 for other days.
- **Week view** — seven compact day columns; tasks can be dragged across days.
- **Tasks list** — search by title/notes/links, filter by status/type/priority, sort.
- **Weekly routine** — a template of classes + commute that auto-fills each week within an
  optional term range; any single occurrence can be moved, edited or cancelled for one day
  without changing the template.
- **Theme** — computed from local sunrise/sunset (NOAA algorithm, no network); white by day,
  black after sunset, with a manual override in Settings.
- **Persistence & backup** — everything is saved to `localStorage`; export/import JSON.
