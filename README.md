# Movie Library starter

First implementation slice for a local-first movie manager using Electron, React, TypeScript, TypeORM and SQLite.

## Included

- Electron main/preload/renderer separation
- React renderer
- TypeORM 1.x with `better-sqlite3`
- WAL-enabled SQLite database in Electron's `userData` directory
- explicit migration-based schema (`synchronize: false`)
- normalized Movie / Tag / Category / Actor / Publisher entities
- secure typed IPC via `contextBridge`
- native video-file picker
- minimal add/list/delete UI
- automatic rebuild of `better-sqlite3` for Electron

## Requirements

Use a Node.js version supported by electron-vite 5 (Node 20.19+ or 22.12+).

## Run

```bash
npx install-electron --no
npm install
npm run dev
```

The first start creates `movie-library.sqlite` in Electron's application data directory and runs the initial migration automatically.

## Architecture

```text
React renderer
    |
    | typed window.movieLibrary API
    v
preload / contextBridge
    |
    | ipcRenderer.invoke(...)
    v
Electron main IPC handlers
    |
    v
MovieRepository
    |
    v
TypeORM
    |
    v
better-sqlite3 / SQLite
```

The renderer never gets access to Node, TypeORM, SQLite, or `ipcRenderer` directly.

## Next implementation slice

1. Movie details/editing
2. Tags, categories and actors management
3. reusable `MovieFilter` model + TypeORM QueryBuilder
4. directory scanner
5. double-click playback and queue/watchlist

# Usage

Click tag
→ exclude movies containing that tag

Shift + click tag
→ show only movies containing that tag